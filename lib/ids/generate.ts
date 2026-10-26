import { nextSequence } from "@/models/Counter";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const dateKey = todayKey();
  const seq = await nextSequence(`invoice-${dateKey}`, dateKey);
  return `INV-${dateKey}-${String(seq).padStart(4, "0")}`;
}

export async function generateRepairTicketId(): Promise<string> {
  const dateKey = todayKey();
  const seq = await nextSequence(`repair-${dateKey}`, dateKey);
  return `R-${dateKey}-${String(seq).padStart(4, "0")}`;
}
