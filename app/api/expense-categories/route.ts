import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ExpenseCategory } from "@/models/ExpenseCategory";
import { ensureDefaultExpenseCategories } from "@/lib/expenses/ensure";
import {
  categoryNameError,
  categorySlugError,
  normalizeCategoryName,
  slugFromName,
  sortOrderError,
} from "@/lib/categories/validate";

export async function GET(request: Request) {
  const { user, response } = await requireSession();
  if (response) return response;
  await connectDb();
  await ensureDefaultExpenseCategories();
  const includeInactive = user?.role === "admin" && new URL(request.url).searchParams.get("all") === "true";
  const filter = includeInactive ? {} : { isActive: true };
  const categories = await ExpenseCategory.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  return jsonOk(categories);
}

export async function POST(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  const nameError = categoryNameError(body.name);
  if (nameError) return jsonError("VALIDATION", nameError, 400);
  const name = normalizeCategoryName(body.name)!;
  const slugSource = typeof body.slug === "string" && body.slug.trim() ? body.slug : slugFromName(name);
  const slugError = categorySlugError(slugSource);
  if (slugError) return jsonError("VALIDATION", slugError, 400);
  const orderError = sortOrderError(body.sortOrder);
  if (orderError) return jsonError("VALIDATION", orderError, 400);
  const slug = slugSource.trim().toLowerCase();
  if (await ExpenseCategory.exists({ slug })) {
    return jsonError("CONFLICT", "An expense category with this name already exists.", 409);
  }
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.map((word: unknown) => String(word).trim().toLowerCase()).filter(Boolean)
    : [];
  const category = await ExpenseCategory.create({
    name,
    slug,
    keywords,
    sortOrder: body.sortOrder == null || body.sortOrder === "" ? 0 : Number(body.sortOrder),
  });
  return jsonOk(category, 201);
}
