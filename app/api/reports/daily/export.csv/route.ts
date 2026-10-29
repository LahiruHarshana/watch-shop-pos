import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError } from "@/lib/api/response";
import { buildDailyReport } from "@/lib/reports/daily-summary";
import { businessTodayKey } from "@/lib/time/business-day";
import { formatLkr } from "@/lib/money/format";

function csvEscape(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export async function GET(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const date = new URL(request.url).searchParams.get("date") ?? businessTodayKey();
  let report;
  try {
    report = await buildDailyReport(date);
  } catch {
    return jsonError("VALIDATION", "Date must be YYYY-MM-DD", 400);
  }
  const rows = [
    ["Date", report.date],
    ["Timezone", report.timezone],
    ["Retail revenue", formatLkr(report.retailCents)],
    ["Repair revenue", formatLkr(report.repairCents)],
    ["Total revenue", formatLkr(report.totalCents)],
    ["Discounts", formatLkr(report.discountCents)],
    ["Cash", formatLkr(report.paymentBreakdown.cash ?? 0)],
    ["Card", formatLkr(report.paymentBreakdown.card ?? 0)],
    ["Bank transfer", formatLkr(report.paymentBreakdown.bank_transfer ?? 0)],
    ["Completed sales", report.saleCount],
    ["Paid repairs", report.repairCount],
    ["Voided sales", report.voidCount],
    ["Voided amount", formatLkr(report.voidCents)],
    ["Drawer variance", report.drawerVarianceCents == null ? "" : formatLkr(report.drawerVarianceCents)],
  ];
  const body = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daily-report-${date}.csv"`,
    },
  });
}
