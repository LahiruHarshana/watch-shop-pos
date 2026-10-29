import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError } from "@/lib/api/response";
import { buildDailyReport } from "@/lib/reports/daily-summary";
import { businessTodayKey } from "@/lib/time/business-day";
import { formatLkr } from "@/lib/money/format";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
});

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
  const lines: [string, string][] = [
    ["Retail", formatLkr(report.retailCents)],
    ["Repairs", formatLkr(report.repairCents)],
    ["Total", formatLkr(report.totalCents)],
    ["Discounts", formatLkr(report.discountCents)],
    ["Cash", formatLkr(report.paymentBreakdown.cash ?? 0)],
    ["Card", formatLkr(report.paymentBreakdown.card ?? 0)],
    ["Bank transfer", formatLkr(report.paymentBreakdown.bank_transfer ?? 0)],
    ["Sales", String(report.saleCount)],
    ["Paid repairs", String(report.repairCount)],
    ["Voids", `${report.voidCount} (${formatLkr(report.voidCents)})`],
    ["Drawer variance", report.drawerVarianceCents == null ? "No closed shift" : formatLkr(report.drawerVarianceCents)],
  ];
  const buffer = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Daily report {report.date}</Text>
        <Text style={{ marginBottom: 12 }}>Asia/Colombo</Text>
        {lines.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text>{label}</Text>
            <Text>{value}</Text>
          </View>
        ))}
      </Page>
    </Document>,
  );
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="daily-report-${date}.pdf"`,
    },
  });
}
