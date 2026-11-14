import { Sale } from "@/models/Sale";
import { RepairTicket } from "@/models/RepairTicket";
import { expectedCashFromEvents } from "@/lib/shifts/expected-cash";
import type { Types } from "mongoose";

export async function calculateExpectedCashCents(
  shiftId: Types.ObjectId,
  openingFloatCents: number,
  openedAt: Date,
  closedAt?: Date,
) {
  const end = closedAt ?? new Date();
  const window = { $gte: openedAt, $lte: end };
  const [completedSales, voidedSales, repairs] = await Promise.all([
    Sale.find({ shiftId, status: "completed", createdAt: window }).select("payments").lean(),
    Sale.find({ shiftId, status: "voided", voidedAt: window }).select("payments").lean(),
    RepairTicket.find({
      status: "delivered",
      "payment.method": "cash",
      "payment.paidAt": window,
    })
      .select("payment")
      .lean(),
  ]);

  return expectedCashFromEvents({
    openingFloatCents,
    completedSales,
    voidedSales,
    repairPayments: repairs.map((ticket) => ({
      method: ticket.payment?.method ?? undefined,
      amountCents: ticket.payment?.amountCents ?? undefined,
    })),
  });
}
