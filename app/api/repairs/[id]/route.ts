import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { canTransition } from "@/lib/repairs/transitions";
import { RepairTicket, type RepairStatus } from "@/models/RepairTicket";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const ticket = await RepairTicket.findById(id).populate("createdBy", "name").lean();
  if (!ticket) return jsonError("NOT_FOUND", "Ticket not found", 404);
  return jsonOk(ticket);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const body = await request.json();
  const ticket = await RepairTicket.findById(id);
  if (!ticket) return jsonError("NOT_FOUND", "Ticket not found", 404);

  if (body.status) {
    const to = body.status as RepairStatus;
    const hasPayment = Boolean(body.payment?.method && body.payment?.amountCents != null);
    if (
      !canTransition(
        ticket.status as RepairStatus,
        to,
        user!.role,
        to === "delivered" ? hasPayment : true,
      )
    ) {
      return jsonError("INVALID_TRANSITION", "This status change isn't allowed.", 400);
    }
    ticket.status = to;
    ticket.statusHistory.push({
      status: to,
      changedBy: new mongoose.Types.ObjectId(user!.id),
      changedAt: new Date(),
      note: body.note,
    });
    if (to === "delivered" && body.payment) {
      ticket.payment = {
        method: body.payment.method,
        amountCents: body.payment.amountCents,
        paidAt: new Date(),
        receivedBy: new mongoose.Types.ObjectId(user!.id),
      };
    }
    await ticket.save();
    return jsonOk(ticket);
  }

  if (user!.role === "admin") {
    const fields = [
      "customerName",
      "customerPhone",
      "watchBrand",
      "watchModel",
      "issueDescription",
      "estimatedCostCents",
    ];
    for (const f of fields) {
      if (f in body) ticket.set(f, body[f]);
    }
    await ticket.save();
  }

  return jsonOk(ticket);
}
