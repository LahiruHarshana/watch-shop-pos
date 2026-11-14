import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import {
  abortTransactionIfActive,
  withOptionalTransaction,
} from "@/lib/db/with-optional-transaction";
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
  try {
    return await withOptionalTransaction(async (session) => {
      const saleQuery = Sale.findById(id);
      const sale = session ? await saleQuery.session(session) : await saleQuery;
      if (!sale) {
        await abortTransactionIfActive(session);
        return jsonError("NOT_FOUND", "Sale not found", 404);
      }
      if (sale.status === "voided") {
        await abortTransactionIfActive(session);
        return jsonError("VALIDATION", "Sale already voided", 400);
      }
      for (const line of sale.lineItems) {
        const productQuery = Product.findById(line.productId);
        const product = session ? await productQuery.session(session) : await productQuery;
        if (product?.trackInventory) {
          product.quantity += line.quantity;
          await product.save(session ? { session } : undefined);
        }
      }
      sale.status = "voided";
      sale.voidReason = body.voidReason;
      sale.voidedBy = new mongoose.Types.ObjectId(user!.id);
      sale.voidedAt = new Date();
      await sale.save(session ? { session } : undefined);
      return jsonOk(sale);
    });
  } catch (error) {
    console.error("POST /api/sales/[id]/void failed:", error);
    const message = error instanceof Error ? error.message : "Sale could not be voided";
    return jsonError("SERVER_ERROR", message, 500);
  }
}
