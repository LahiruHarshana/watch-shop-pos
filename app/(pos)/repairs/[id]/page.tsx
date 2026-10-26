import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db/mongoose";
import { RepairTicket } from "@/models/RepairTicket";
import { RepairDetail } from "@/components/pos/repair-detail";

export const instant = false;

export default async function RepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDb();
  const ticket = await RepairTicket.findById(id).lean();
  if (!ticket) notFound();
  return <RepairDetail ticket={JSON.parse(JSON.stringify(ticket))} />;
}
