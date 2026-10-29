import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { Category } from "@/models/Category";

async function parentCreatesCycle(id: string, parentId: string | null): Promise<boolean> {
  let current = parentId;
  const seen = new Set<string>([id]);
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    const parent = await Category.findById(current).select("parentId").lean();
    current = parent?.parentId ? String(parent.parentId) : null;
  }
  return false;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const body = await request.json();
  const category = await Category.findById(id);
  if (!category) return jsonError("NOT_FOUND", "Category not found", 404);
  if ("name" in body) category.name = String(body.name).trim();
  if ("slug" in body) category.slug = String(body.slug).trim().toLowerCase();
  if ("sortOrder" in body) category.sortOrder = Number(body.sortOrder) || 0;
  if ("isActive" in body) category.isActive = Boolean(body.isActive);
  if ("parentId" in body) {
    const parentId = body.parentId ? String(body.parentId) : null;
    if (parentId && !mongoose.isValidObjectId(parentId)) {
      return jsonError("VALIDATION", "Invalid parent category", 400);
    }
    if (parentId && (await parentCreatesCycle(id, parentId))) {
      return jsonError("VALIDATION", "A category cannot be its own parent", 400);
    }
    category.parentId = parentId ? new mongoose.Types.ObjectId(parentId) : null;
  }
  await category.save();
  return jsonOk(category);
}
