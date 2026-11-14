import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { Sale } from "@/models/Sale";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const sale = await Sale.findById(id).populate("soldBy", "name").lean();
  if (!sale) return jsonError("NOT_FOUND", "Sale not found", 404);
  return jsonOk(sale);
}
