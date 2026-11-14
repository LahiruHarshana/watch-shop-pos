import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { User } from "@/models/User";
import { normalizeStaffName, staffNameError } from "@/lib/users/staff-name";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const body = await request.json();
  const update: Record<string, unknown> = {};
  if ("name" in body) {
    const nameError = staffNameError(body.name);
    if (nameError) return jsonError("VALIDATION", nameError, 400);
    update.name = normalizeStaffName(body.name);
  }
  if ("role" in body) {
    if (!["admin", "cashier"].includes(body.role)) {
      return jsonError("VALIDATION", "Invalid role", 400);
    }
    update.role = body.role;
  }
  if ("isActive" in body) update.isActive = Boolean(body.isActive);
  if (body.password) {
    if (String(body.password).length < 8) {
      return jsonError("VALIDATION", "Password must be at least 8 characters", 400);
    }
    update.passwordHash = await bcrypt.hash(String(body.password), 12);
  }
  const user = await User.findByIdAndUpdate(id, update, { new: true })
    .select("-passwordHash")
    .lean();
  if (!user) return jsonError("NOT_FOUND", "User not found", 404);
  return jsonOk(user);
}
