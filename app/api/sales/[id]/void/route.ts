import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireRole(["admin"]);
  if (response) return response;
  const { id } = await params;
  const body = await request.json();
  if (!body.voidReason) {
    return jsonError("VALIDATION", "Void reason required", 400);
  }
  await connectDb();
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const sale = await Sale.findById(id).session(session);
    if (!sale) {
      await session.abortTransaction();
      return jsonError("NOT_FOUND", "Sale not found", 404);
    }
    if (sale.status === "voided") {
      await session.abortTransaction();
      return jsonError("VALIDATION", "Sale already voided", 400);
    }
    for (const line of sale.lineItems) {
      const product = await Product.findById(line.productId).session(session);
      if (product?.trackInventory) {
        product.quantity += line.quantity;
        await product.save({ session });
      }
    }
    sale.status = "voided";
    sale.voidReason = body.voidReason;
    sale.voidedBy = new mongoose.Types.ObjectId(user!.id);
    sale.voidedAt = new Date();
    await sale.save({ session });
    await session.commitTransaction();
    return jsonOk(sale);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
