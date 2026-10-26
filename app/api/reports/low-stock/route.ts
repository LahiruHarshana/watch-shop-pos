import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonOk } from "@/lib/api/response";
import { Product } from "@/models/Product";

export async function GET() {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const products = await Product.find({
    isActive: true,
    trackInventory: true,
    $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
  })
    .sort({ quantity: 1 })
    .lean();
  return jsonOk(products);
}
