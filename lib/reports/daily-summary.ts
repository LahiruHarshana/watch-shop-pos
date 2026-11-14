import { businessDayRange } from "@/lib/time/business-day";
import { RepairTicket } from "@/models/RepairTicket";
import { Sale } from "@/models/Sale";
import { Shift } from "@/models/Shift";

export type DailyReport = {
  date: string;
  timezone: "Asia/Colombo";
  retailCents: number;
  repairCents: number;
  totalCents: number;
  discountCents: number;
  voidCount: number;
  voidCents: number;
  saleCount: number;
  repairCount: number;
  paymentBreakdown: Record<string, number>;
  drawerVarianceCents: number | null;
};

export async function buildDailyReport(date: string): Promise<DailyReport> {
  const { start, end } = businessDayRange(date);
  const window = { $gte: start, $lte: end };

  const [sales, voids, repairs, shifts] = await Promise.all([
    Sale.find({ status: "completed", createdAt: window }).lean(),
    Sale.find({ status: "voided", voidedAt: window }).select("totalCents").lean(),
    RepairTicket.find({ status: "delivered", "payment.paidAt": window }).lean(),
    Shift.find({ status: "closed", closedAt: window }).select("varianceCents").lean(),
  ]);

  let retailCents = 0;
  let discountCents = 0;
  const paymentBreakdown: Record<string, number> = { cash: 0, card: 0, bank_transfer: 0 };
  for (const sale of sales) {
    retailCents += sale.totalCents;
    discountCents += sale.discountTotalCents ?? 0;
    for (const payment of sale.payments) {
      paymentBreakdown[payment.method] = (paymentBreakdown[payment.method] ?? 0) + payment.amountCents;
    }
  }

  let repairCents = 0;
  for (const ticket of repairs) {
    if (!ticket.payment?.amountCents) continue;
    repairCents += ticket.payment.amountCents;
    const method = ticket.payment.method ?? "cash";
    paymentBreakdown[method] = (paymentBreakdown[method] ?? 0) + ticket.payment.amountCents;
  }

  const drawerVarianceCents = shifts.length
    ? shifts.reduce((sum, shift) => sum + (shift.varianceCents ?? 0), 0)
    : null;

  return {
    date,
    timezone: "Asia/Colombo",
    retailCents,
    repairCents,
    totalCents: retailCents + repairCents,
    discountCents,
    voidCount: voids.length,
    voidCents: voids.reduce((sum, sale) => sum + sale.totalCents, 0),
    saleCount: sales.length,
    repairCount: repairs.filter((ticket) => ticket.payment?.amountCents).length,
    paymentBreakdown,
    drawerVarianceCents,
  };
}
