import mongoose from "mongoose";
import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { calculateExpectedCashCents } from "@/lib/shifts/cash";
import { Shift } from "@/models/Shift";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  const { id } = await params;
  await connectDb();
  const body = await request.json();
  const countedCashCents = Number(body.countedCashCents);
  if (Number.isNaN(countedCashCents) || countedCashCents < 0) {
    return jsonError("VALIDATION", "Invalid counted cash", 400);
  }
  const shift = await Shift.findById(id);
  if (!shift || shift.status !== "open") {
    return jsonError("NOT_FOUND", "Open shift not found", 404);
  }
  const closedAt = new Date();
  const expectedCashCents = await calculateExpectedCashCents(
    shift._id,
    shift.openingFloatCents,
    shift.openedAt,
    closedAt,
  );
  shift.status = "closed";
  shift.closedAt = closedAt;
  shift.closedBy = new mongoose.Types.ObjectId(user!.id);
  shift.expectedCashCents = expectedCashCents;
  shift.countedCashCents = countedCashCents;
  shift.varianceCents = countedCashCents - expectedCashCents;
  shift.notes = body.notes;
  await shift.save();
  return jsonOk(shift);
}
