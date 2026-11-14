import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db/mongoose";
import { RepairTicket } from "@/models/RepairTicket";
import { ShopSettings } from "@/models/ShopSettings";
import { ClaimTokenView } from "@/components/pos/claim-token-view";

export const instant = false;

export default async function ClaimTokenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDb();
  const ticket = await RepairTicket.findById(id).lean();
  if (!ticket) notFound();
  const settings = await ShopSettings.findById("shop").lean();
  return (
    <ClaimTokenView
      ticket={JSON.parse(JSON.stringify(ticket))}
      settings={settings ?? {}}
    />
  );
}
