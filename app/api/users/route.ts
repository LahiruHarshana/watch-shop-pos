import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk, jsonPaginated } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { User } from "@/models/User";

export async function GET(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20 });
  const [total, users, adminCount, cashierCount] = await Promise.all([
    User.countDocuments(),
    User.find().select("-passwordHash").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "cashier" }),
  ]);
  return jsonPaginated(users, buildPaginationMeta(page, limit, total), {
    summary: { adminCount, cashierCount },
  });
}

export async function POST(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  const { email, name, password, role } = body;
  if (!email || !name || !password || !role) {
    return jsonError("VALIDATION", "Missing required fields", 400);
  }
  if (!["admin", "cashier"].includes(role)) {
    return jsonError("VALIDATION", "Invalid role", 400);
  }
  if (String(password).length < 8) {
    return jsonError("VALIDATION", "Password must be at least 8 characters", 400);
  }
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return jsonError("CONFLICT", "Email already in use", 409);
  const passwordHash = await bcrypt.hash(String(password), 12);
  const user = await User.create({
    email: String(email).toLowerCase(),
    name,
    passwordHash,
    role,
    isActive: true,
  });
  const { passwordHash: _, ...safe } = user.toObject();
  return jsonOk(safe, 201);
}
