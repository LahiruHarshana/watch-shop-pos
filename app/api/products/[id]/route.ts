import { connectDb } from "@/lib/db/mongoose";
import { requireRole, requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { Product } from "@/models/Product";
import { priceCentsError } from "@/lib/products/price";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireSession();
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const product = await Product.findById(id).populate("categoryId", "name slug").lean();
  if (!product) return jsonError("NOT_FOUND", "Product not found", 404);
  return jsonOk(product);
}

const PATCH_FIELDS = [
  "name",
  "sku",
  "categoryId",
  "priceCents",
  "costCents",
  "lowStockThreshold",
  "trackInventory",
  "isActive",
] as const;

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
  for (const key of PATCH_FIELDS) {
    if (key in body) update[key] = body[key];
  }
  if (update.sku) update.sku = String(update.sku).toUpperCase();
  if ("priceCents" in update) {
    const invalidPrice = priceCentsError(update.priceCents);
    if (invalidPrice) return jsonError("VALIDATION", invalidPrice, 400);
  }
  if (body.attributes && typeof body.attributes === "object") {
    update.attributes = {
      brand: body.attributes.brand ? String(body.attributes.brand).trim() : undefined,
      batterySize: body.attributes.batterySize
        ? String(body.attributes.batterySize).trim()
        : undefined,
    };
  }
  const product = await Product.findByIdAndUpdate(id, update, { new: true })
    .populate("categoryId", "name slug")
    .lean();
  if (!product) return jsonError("NOT_FOUND", "Product not found", 404);
  return jsonOk(product);
}

/** Soft-delete: hide the product from checkout and the default inventory list. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  if (!product) return jsonError("NOT_FOUND", "Product not found", 404);
  return jsonOk(product);
}
