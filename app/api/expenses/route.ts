import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonOk, jsonPaginated } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { Expense } from "@/models/Expense";
import { ExpenseCategory } from "@/models/ExpenseCategory";
import { ensureDefaultExpenseCategories } from "@/lib/expenses/ensure";
import {
  expenseAmountError,
  expenseDescriptionError,
  expenseNoteError,
  normalizeExpenseDescription,
  spentOnError,
} from "@/lib/expenses/validate";

type ExpenseBody = {
  amountCents?: unknown;
  categoryId?: unknown;
  description?: unknown;
  spentOn?: unknown;
  note?: unknown;
};

async function readExpenseInput(body: ExpenseBody, partial: boolean) {
  const patch: {
    amountCents?: number;
    categoryId?: string;
    description?: string;
    spentOn?: string;
    note?: string;
  } = {};

  if (!partial || "amountCents" in body) {
    const amountError = expenseAmountError(body.amountCents);
    if (amountError) return { error: amountError };
    patch.amountCents = Number(body.amountCents);
  }
  if (!partial || "description" in body) {
    const descriptionError = expenseDescriptionError(body.description);
    if (descriptionError) return { error: descriptionError };
    patch.description = normalizeExpenseDescription(body.description)!;
  }
  if (!partial || "spentOn" in body) {
    const dateError = spentOnError(body.spentOn);
    if (dateError) return { error: dateError };
    patch.spentOn = String(body.spentOn);
  }
  if (!partial || "categoryId" in body) {
    const categoryId = String(body.categoryId ?? "");
    if (!mongoose.isValidObjectId(categoryId)) return { error: "Choose an expense category." };
    const category = await ExpenseCategory.findById(categoryId).select("isActive").lean();
    if (!category || !category.isActive) return { error: "Choose an active expense category." };
    patch.categoryId = categoryId;
  }
  if ("note" in body || !partial) {
    const noteError = expenseNoteError(body.note);
    if (noteError) return { error: noteError };
    patch.note = typeof body.note === "string" ? body.note.trim() : "";
  }
  return { patch };
}

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 50 });
  const filter: Record<string, unknown> = {};
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (date) {
    if (spentOnError(date)) return jsonError("VALIDATION", "Date must be YYYY-MM-DD", 400);
    filter.spentOn = date;
  } else if (from || to) {
    if ((from && spentOnError(from)) || (to && spentOnError(to))) {
      return jsonError("VALIDATION", "Date must be YYYY-MM-DD", 400);
    }
    filter.spentOn = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }
  const categoryId = searchParams.get("categoryId");
  if (categoryId) {
    if (!mongoose.isValidObjectId(categoryId)) return jsonError("VALIDATION", "Choose an expense category.", 400);
    filter.categoryId = categoryId;
  }

  const [total, expenses, categories] = await Promise.all([
    Expense.countDocuments(filter),
    Expense.find(filter).sort({ spentOn: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ExpenseCategory.find().select("name").lean(),
  ]);
  const names = new Map(categories.map((category) => [String(category._id), category.name]));
  const data = expenses.map((expense) => ({
    id: String(expense._id),
    amountCents: expense.amountCents,
    categoryId: String(expense.categoryId),
    categoryName: names.get(String(expense.categoryId)) ?? "Uncategorized",
    description: expense.description,
    spentOn: expense.spentOn,
    note: expense.note ?? "",
    createdBy: String(expense.createdBy),
  }));
  return jsonPaginated(data, buildPaginationMeta(page, limit, total));
}

export async function POST(request: Request) {
  const { user, response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  await ensureDefaultExpenseCategories();
  const body = (await request.json()) as ExpenseBody;
  const parsed = await readExpenseInput(body, false);
  if (parsed.error || !parsed.patch) return jsonError("VALIDATION", parsed.error ?? "Invalid expense", 400);
  const expense = await Expense.create({
    amountCents: parsed.patch.amountCents,
    categoryId: parsed.patch.categoryId,
    description: parsed.patch.description,
    spentOn: parsed.patch.spentOn,
    note: parsed.patch.note,
    createdBy: user!.id,
  });
  return jsonOk(expense, 201);
}
