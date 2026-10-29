import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk, jsonPaginated } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { calculateSaleTotals, type CartLineInput } from "@/lib/money/calculate-sale";
import { generateInvoiceNumber } from "@/lib/ids/generate";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import { Shift } from "@/models/Shift";
import { User } from "@/models/User";
import { businessDayRange } from "@/lib/time/business-day";

export async function GET(request: Request) {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20, maxLimit: 50 });
  const filter: Record<string, unknown> = {};
  const status = searchParams.get("status");
  if (status === "completed" || status === "voided") filter.status = status;
  const method = searchParams.get("method");
  if (method === "cash" || method === "card" || method === "bank_transfer") {
    filter["payments.method"] = method;
  }
  const date = searchParams.get("date");
  try {
    if (date) {
      const { start, end } = businessDayRange(date);
      filter.createdAt = { $gte: start, $lte: end };
    }
  } catch {
    return jsonError("VALIDATION", "Date must be YYYY-MM-DD", 400);
  }
  const q = searchParams.get("q")?.trim();
  if (q) {
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: pattern, $options: "i" };
    const cashiers = await User.find({ name: regex }).select("_id").lean();
    filter.$or = [
      { invoiceNumber: regex },
      { "lineItems.sku": regex },
      { "lineItems.name": regex },
      { soldBy: { $in: cashiers.map((user) => user._id) } },
    ];
  }
  const [total, sales] = await Promise.all([
    Sale.countDocuments(filter),
    Sale.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("soldBy", "name")
      .lean(),
  ]);
  return jsonPaginated(sales, buildPaginationMeta(page, limit, total));
}

export async function POST(request: Request) {
  const { user, response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  const { lineItems, cartDiscount, payments } = body;
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return jsonError("VALIDATION", "At least one line item required", 400);
  }

  const openShift = await Shift.findOne({ status: "open" });
  if (!openShift) {
    return jsonError("SHIFT_REQUIRED", "Open a shift before making a sale.", 400);
  }

  const cartLines: CartLineInput[] = lineItems.map((l: CartLineInput) => ({
    unitPriceCents: l.unitPriceCents,
    quantity: l.quantity,
    lineDiscount: l.lineDiscount,
  }));
  const totals = calculateSaleTotals(cartLines, cartDiscount);

  const paymentSum = (payments ?? []).reduce(
    (s: number, p: { amountCents: number }) => s + p.amountCents,
    0,
  );
  if (paymentSum !== totals.totalCents) {
    return jsonError("PAYMENT_MISMATCH", "Payment total must match sale total.", 400);
  }

  for (const p of payments ?? []) {
    if (p.method === "cash") {
      if (!p.tenderedCents || p.tenderedCents < p.amountCents) {
        return jsonError("VALIDATION", "Insufficient cash tendered", 400);
      }
      p.changeCents = p.tenderedCents - p.amountCents;
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const enrichedLines = [];
    for (const line of lineItems) {
      const product = await Product.findById(line.productId).session(session);
      if (!product) {
        await session.abortTransaction();
        return jsonError("NOT_FOUND", `Product not found`, 404);
      }
      if (product.trackInventory && product.quantity < line.quantity) {
        await session.abortTransaction();
        return jsonError(
          "STOCK_INSUFFICIENT",
          `Not enough stock for ${product.name}. Available: ${product.quantity}.`,
          400,
        );
      }
      const lineTotal = calculateSaleTotals(
        [{ unitPriceCents: line.unitPriceCents, quantity: line.quantity, lineDiscount: line.lineDiscount }],
      ).totalCents;
      if (product.trackInventory) {
        product.quantity -= line.quantity;
        await product.save({ session });
      }
      enrichedLines.push({
        productId: product._id,
        name: product.name,
        sku: product.sku,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineDiscount: line.lineDiscount
          ? {
              ...line.lineDiscount,
              amountCents:
                line.unitPriceCents * line.quantity - lineTotal,
            }
          : undefined,
        lineTotalCents: lineTotal,
      });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const cartDiscountDoc = cartDiscount
      ? {
          type: cartDiscount.type,
          value: cartDiscount.value,
          amountCents: totals.cartDiscountCents,
        }
      : undefined;

    const sale = await Sale.create(
      [
        {
          invoiceNumber,
          lineItems: enrichedLines,
          cartDiscount: cartDiscountDoc,
          subtotalCents: totals.subtotalCents,
          discountTotalCents: totals.discountTotalCents,
          totalCents: totals.totalCents,
          payments,
          soldBy: user!.id,
          discountAppliedBy: totals.discountTotalCents > 0 ? user!.id : undefined,
          shiftId: openShift._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return jsonOk(sale[0], 201);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
