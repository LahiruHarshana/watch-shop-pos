import { connectDb } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/api/auth-guard";
import { jsonOk } from "@/lib/api/response";
import { Product } from "@/models/Product";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;
  await connectDb();
  const brands = await Product.distinct("attributes.brand", {
    isActive: true,
    "attributes.brand": { $nin: [null, ""] },
  });
  const cleaned = brands
    .map((b) => String(b).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return jsonOk({ brands: cleaned });
}
