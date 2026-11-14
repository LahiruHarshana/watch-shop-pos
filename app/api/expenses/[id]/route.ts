import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { Expense } from "@/models/Expense";
import { ExpenseCategory } from "@/models/ExpenseCategory";
import {
  expenseAmountError,
  expenseDescriptionError,
  expenseNoteError,
  normalizeExpenseDescription,
  spentOnError,
} from "@/lib/expenses/validate";
import mongoose from "mongoose";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError("NOT_FOUND", "Expense not found", 404);
  await connectDb();
  const expense = await Expense.findById(id);
  if (!expense) return jsonError("NOT_FOUND", "Expense not found", 404);
  const body = await request.json();

  if ("amountCents" in body) {
    const amountError = expenseAmountError(body.amountCents);
    if (amountError) return jsonError("VALIDATION", amountError, 400);
    expense.amountCents = Number(body.amountCents);
  }
  if ("description" in body) {
    const descriptionError = expenseDescriptionError(body.description);
    if (descriptionError) return jsonError("VALIDATION", descriptionError, 400);
    expense.description = normalizeExpenseDescription(body.description)!;
  }
  if ("spentOn" in body) {
    const dateError = spentOnError(body.spentOn);
    if (dateError) return jsonError("VALIDATION", dateError, 400);
    expense.spentOn = String(body.spentOn);
  }
  if ("categoryId" in body) {
    const categoryId = String(body.categoryId ?? "");
    if (!mongoose.isValidObjectId(categoryId)) return jsonError("VALIDATION", "Choose an expense category.", 400);
    const keepingCurrent = String(expense.categoryId) === categoryId;
    if (!keepingCurrent) {
      const category = await ExpenseCategory.findById(categoryId).select("isActive").lean();
      if (!category || !category.isActive) return jsonError("VALIDATION", "Choose an active expense category.", 400);
    }
    expense.categoryId = new mongoose.Types.ObjectId(categoryId);
  }
  if ("note" in body) {
    const noteError = expenseNoteError(body.note);
    if (noteError) return jsonError("VALIDATION", noteError, 400);
    expense.note = typeof body.note === "string" ? body.note.trim() : "";
  }

  await expense.save();
  return jsonOk(expense);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return jsonError("NOT_FOUND", "Expense not found", 404);
  await connectDb();
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) return jsonError("NOT_FOUND", "Expense not found", 404);
  return jsonOk({ id });
}
