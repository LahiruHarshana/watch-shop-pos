import { renderToBuffer } from "@react-pdf/renderer";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError } from "@/lib/api/response";
import { SaleReceiptDocument } from "@/lib/receipts/sale-pdf";
import { Sale } from "@/models/Sale";
import { ShopSettings } from "@/models/ShopSettings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const sale = await Sale.findById(id).populate("discountAppliedBy", "name").lean();
  if (!sale) return jsonError("NOT_FOUND", "Sale not found", 404);
  const settings = await ShopSettings.findById("shop").lean();

  const buffer = await renderToBuffer(
    <SaleReceiptDocument
      sale={JSON.parse(JSON.stringify(sale))}
      settings={JSON.parse(JSON.stringify(settings ?? {}))}
    />,
  );

  const filename = `${sale.invoiceNumber}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
