import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { Category } from "@/models/Category";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  await connectDb();
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
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
