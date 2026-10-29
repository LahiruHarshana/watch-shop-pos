import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { Category } from "@/models/Category";

export async function GET(request: Request) {
  const { user, response } = await requireSession();
  if (response) return response;
  await connectDb();
  const includeInactive = user?.role === "admin" && new URL(request.url).searchParams.get("all") === "true";
  const filter = includeInactive ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  return jsonOk(categories);
}

export async function POST(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  if (!body.name || !body.slug) {
    return jsonError("VALIDATION", "Name and slug required", 400);
  }
  const category = await Category.create(body);
  return jsonOk(category, 201);
}
