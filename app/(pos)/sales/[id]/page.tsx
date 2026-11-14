import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db/mongoose";
import { Sale } from "@/models/Sale";
import { ShopSettings } from "@/models/ShopSettings";
import { ReceiptView } from "@/components/pos/receipt-view";
import { PageHeader } from "@/components/pos/page-header";

export const instant = false;

export default async function SaleReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDb();
  const sale = await Sale.findById(id).populate("discountAppliedBy", "name").lean();
  if (!sale) notFound();
  const settings = await ShopSettings.findById("shop").lean();

  return (
    <div>
      <PageHeader title="Receipt" description="Print or save for the customer" />
      <div className="pos-surface max-w-md p-4">
      <ReceiptView
        sale={JSON.parse(JSON.stringify(sale))}
        settings={JSON.parse(JSON.stringify(settings ?? {}))}
      />
      </div>
    </div>
  );
}
