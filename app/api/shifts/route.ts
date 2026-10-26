import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { calculateExpectedCashCents } from "@/lib/shifts/cash";
import { Shift } from "@/models/Shift";

export async function GET() {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  const open = await Shift.findOne({ status: "open" }).populate("openedBy", "name").lean();
  if (!open) return jsonOk({ open: null, expectedCashCents: 0 });
  const expectedCashCents = await calculateExpectedCashCents(
    open._id,
    open.openingFloatCents,
    open.openedAt,
  );
  return jsonOk({ open, expectedCashCents });
}

export async function POST(request: Request) {
  const { user, response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  const existing = await Shift.findOne({ status: "open" });
  if (existing) {
    return jsonError("CONFLICT", "A shift is already open", 409);
  }
  const body = await request.json();
  const openingFloatCents = Number(body.openingFloatCents ?? 0);
  if (openingFloatCents < 0) {
    return jsonError("VALIDATION", "Invalid opening float", 400);
  }
  const shift = await Shift.create({
    openedBy: user!.id,
    openingFloatCents,
    status: "open",
  });
  return jsonOk(shift, 201);
}
