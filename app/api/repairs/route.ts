import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk, jsonPaginated } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { generateRepairTicketId } from "@/lib/ids/generate";
import { RepairTicket } from "@/models/RepairTicket";

export async function GET(request: Request) {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const board = searchParams.get("board") === "true";
  const filter = board ? { status: { $ne: "delivered" as const } } : {};
  if (board) {
    const tickets = await RepairTicket.find(filter)
      .sort({ updatedAt: -1 })
      .populate("createdBy", "name")
      .lean();
    return jsonOk(tickets);
  }
  const { page, limit, skip } = parsePagination(searchParams);
  const [total, tickets] = await Promise.all([
    RepairTicket.countDocuments(filter),
    RepairTicket.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
  ]);
  return jsonPaginated(tickets, buildPaginationMeta(page, limit, total));
}

export async function POST(request: Request) {
  const { user, response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  const body = await request.json();
  const required = [
    "customerName",
    "customerPhone",
    "watchBrand",
    "watchModel",
    "issueDescription",
    "estimatedCostCents",
  ];
  for (const f of required) {
    if (body[f] == null || body[f] === "") {
      return jsonError("VALIDATION", `Missing field: ${f}`, 400);
    }
  }
  const ticketId = await generateRepairTicketId();
  const ticket = await RepairTicket.create({
    ticketId,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    watchBrand: body.watchBrand,
    watchModel: body.watchModel,
    issueDescription: body.issueDescription,
    estimatedCostCents: body.estimatedCostCents,
    intakePhotoUrl: body.intakePhotoUrl,
    createdBy: user!.id,
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        changedBy: user!.id,
        changedAt: new Date(),
        note: "Ticket created",
      },
    ],
  });
  return jsonOk(ticket, 201);
}
