import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { RepairTicket } from "@/models/RepairTicket";
import { Sale } from "@/models/Sale";

function dayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end };
}

export async function GET(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const { start, end } = dayRange(date);

  const sales = await Sale.find({
    status: "completed",
    createdAt: { $gte: start, $lte: end },
  }).lean();

  let retailCents = 0;
  const byMethod: Record<string, number> = { cash: 0, card: 0, bank_transfer: 0 };
  for (const sale of sales) {
    retailCents += sale.totalCents;
    for (const p of sale.payments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amountCents;
    }
  }

  const repairs = await RepairTicket.find({
    status: "delivered",
    "payment.paidAt": { $gte: start, $lte: end },
  }).lean();

  let repairCents = 0;
  for (const t of repairs) {
    if (t.payment?.amountCents) {
      repairCents += t.payment.amountCents;
      const m = t.payment.method ?? "cash";
      byMethod[m] = (byMethod[m] ?? 0) + t.payment.amountCents;
    }
  }

  return jsonOk({
    date,
    retailCents,
    repairCents,
    totalCents: retailCents + repairCents,
    paymentBreakdown: byMethod,
    saleCount: sales.length,
    repairCount: repairs.length,
  });
}
