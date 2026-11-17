import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatLkr } from "@/lib/money/format";
import { SHOP_NAME } from "@/lib/settings/shop-profile";

const styles = StyleSheet.create({
  page: { padding: 16, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  center: { textAlign: "center", marginBottom: 2 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 12, textAlign: "center", marginBottom: 4 },
  rule: { borderBottomWidth: 1, borderBottomColor: "#999", borderStyle: "dashed", marginVertical: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: "#444", fontSize: 8 },
  thanks: { textAlign: "center", marginTop: 10 },
});

type Line = {
  name: string;
  sku: string;
  quantity: number;
  lineTotalCents: number;
  lineDiscount?: { type: string; value: number; amountCents: number };
};

export function SaleReceiptDocument({
  sale,
  settings,
}: {
  sale: {
    invoiceNumber: string;
    createdAt: string;
    status?: string;
    lineItems: Line[];
    subtotalCents: number;
    discountTotalCents: number;
    totalCents: number;
    payments: Array<{ method: string; changeCents?: number }>;
    discountAppliedBy?: { name?: string } | null;
  };
  settings: {
    shopName?: string;
    address?: string;
    phone?: string;
    receiptThankYouNote?: string;
    receiptPaperWidth?: "58mm" | "80mm";
  };
}) {
  const width = settings.receiptPaperWidth === "58mm" ? 164 : 227;

  return (
    <Document>
      <Page size={[width, 720]} style={styles.page}>
        <Text style={styles.title}>{settings.shopName ?? SHOP_NAME}</Text>
        {settings.address ? <Text style={styles.center}>{settings.address}</Text> : null}
        {settings.phone ? <Text style={styles.center}>{settings.phone}</Text> : null}
        <View style={styles.rule} />
        <Text>Invoice: {sale.invoiceNumber}</Text>
        <Text>{new Date(sale.createdAt).toLocaleString()}</Text>
        {sale.status === "voided" ? <Text style={styles.bold}>VOIDED</Text> : null}
        <View style={styles.rule} />
        {sale.lineItems.map((line, i) => (
          <View key={i} style={{ marginBottom: 4 }}>
            <View style={styles.row}>
              <Text>{line.name} x{line.quantity}</Text>
              <Text>{formatLkr(line.lineTotalCents)}</Text>
            </View>
            <Text style={styles.muted}>{line.sku}</Text>
            {line.lineDiscount ? (
              <Text style={styles.muted}>
                Line discount{" "}
                {line.lineDiscount.type === "percent"
                  ? `${line.lineDiscount.value}%`
                  : formatLkr(line.lineDiscount.amountCents)}
              </Text>
            ) : null}
          </View>
        ))}
        <View style={styles.rule} />
        <View style={styles.row}>
          <Text>Subtotal</Text>
          <Text>{formatLkr(sale.subtotalCents)}</Text>
        </View>
        {sale.discountTotalCents > 0 ? (
          <View style={styles.row}>
            <Text>Discount</Text>
            <Text>-{formatLkr(sale.discountTotalCents)}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.bold}>Total</Text>
          <Text style={styles.bold}>{formatLkr(sale.totalCents)}</Text>
        </View>
        {sale.payments[0]?.method === "cash" && sale.payments[0].changeCents != null ? (
          <View style={styles.row}>
            <Text>Change</Text>
            <Text>{formatLkr(sale.payments[0].changeCents)}</Text>
          </View>
        ) : null}
        {sale.discountAppliedBy?.name ? (
          <Text style={styles.muted}>Discount applied by {sale.discountAppliedBy.name}</Text>
        ) : null}
        <Text style={styles.thanks}>{settings.receiptThankYouNote ?? "Thank you"}</Text>
      </Page>
    </Document>
  );
}
