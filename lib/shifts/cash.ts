import { Sale } from "@/models/Sale";
import type { Types } from "mongoose";

export async function calculateExpectedCashCents(
  shiftId: Types.ObjectId,
  openingFloatCents: number,
  openedAt: Date,
  closedAt?: Date,
) {
  const end = closedAt ?? new Date();
  const sales = await Sale.find({
    shiftId,
    status: "completed",
    createdAt: { $gte: openedAt, $lte: end },
  }).lean();

  let cashIn = 0;
  for (const sale of sales) {
    for (const p of sale.payments) {
      if (p.method === "cash") cashIn += p.amountCents;
    }
  }

  const voided = await Sale.find({
    shiftId,
    status: "voided",
    voidedAt: { $gte: openedAt, $lte: end },
  }).lean();

  let cashOut = 0;
  for (const sale of voided) {
    for (const p of sale.payments) {
      if (p.method === "cash") cashOut += p.amountCents;
    }
  }

  return openingFloatCents + cashIn - cashOut;
}
