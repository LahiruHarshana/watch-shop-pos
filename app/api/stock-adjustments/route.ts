import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk, jsonPaginated } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { Product } from "@/models/Product";
import { StockAdjustment } from "@/models/StockAdjustment";

export async function GET(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 10 });
  const [total, items] = await Promise.all([
    StockAdjustment.countDocuments(),
    StockAdjustment.find()
      .populate("productId", "name sku")
      .populate("performedBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);
  return jsonPaginated(items, buildPaginationMeta(page, limit, total));
}

export async function POST(request: Request) {
  const { user, response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  const { productId, delta, reason, note } = body;
  if (!productId || !delta || !reason) {
    return jsonError("VALIDATION", "productId, delta, and reason required", 400);
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      return jsonError("NOT_FOUND", "Product not found", 404);
    }
    const newQty = product.quantity + Number(delta);
    if (newQty < 0) {
      await session.abortTransaction();
      return jsonError("VALIDATION", "Quantity cannot go negative", 400);
    }
    product.quantity = newQty;
    await product.save({ session });
    const adj = await StockAdjustment.create(
      [{ productId, delta: Number(delta), reason, note, performedBy: user!.id }],
      { session },
    );
    await session.commitTransaction();
    return jsonOk(adj[0], 201);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
