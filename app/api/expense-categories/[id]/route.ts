import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ExpenseCategory } from "@/models/ExpenseCategory";
import {
  categoryNameError,
  categorySlugError,
  normalizeCategoryName,
  sortOrderError,
} from "@/lib/categories/validate";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const category = await ExpenseCategory.findById(id);
  if (!category) return jsonError("NOT_FOUND", "Expense category not found", 404);
  const body = await request.json();

  if ("name" in body) {
    const nameError = categoryNameError(body.name);
    if (nameError) return jsonError("VALIDATION", nameError, 400);
    category.name = normalizeCategoryName(body.name)!;
  }
  if ("slug" in body) {
    const slugError = categorySlugError(body.slug);
    if (slugError) return jsonError("VALIDATION", slugError, 400);
    const slug = String(body.slug).trim().toLowerCase();
    const taken = await ExpenseCategory.exists({ slug, _id: { $ne: category._id } });
    if (taken) return jsonError("CONFLICT", "An expense category with this name already exists.", 409);
    category.slug = slug;
  }
  if ("sortOrder" in body) {
    const orderError = sortOrderError(body.sortOrder);
    if (orderError) return jsonError("VALIDATION", orderError, 400);
    category.sortOrder = body.sortOrder == null || body.sortOrder === "" ? 0 : Number(body.sortOrder);
  }
  if ("isActive" in body) {
    category.isActive = Boolean(body.isActive);
  }
  if ("keywords" in body) {
    if (!Array.isArray(body.keywords)) return jsonError("VALIDATION", "Keywords must be a list.", 400);
    category.keywords = body.keywords.map((word: unknown) => String(word).trim().toLowerCase()).filter(Boolean);
  }

  await category.save();
  return jsonOk(category);
}
