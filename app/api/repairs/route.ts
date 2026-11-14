import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk, jsonPaginated } from "@/lib/api/response";
import { buildPaginationMeta, parsePagination } from "@/lib/api/pagination";
import { generateRepairTicketId } from "@/lib/ids/generate";
import { RepairTicket } from "@/models/RepairTicket";
import { businessDayRange } from "@/lib/time/business-day";
import { customerNameError, normalizeCustomerName } from "@/lib/repairs/customer-name";
import { estimatedCostCentsError } from "@/lib/repairs/estimated-cost";
import { normalizeSriLankaPhone, phoneError } from "@/lib/repairs/phone";
import { normalizeWatchText, watchTextError } from "@/lib/repairs/watch-text";

export async function GET(request: Request) {
  const { response } = await requireRole(["admin", "cashier"]);
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const board = searchParams.get("board") === "true";
  const filter: Record<string, unknown> = {};
  const status = searchParams.get("status");
  if (board) filter.status = { $ne: "delivered" };
  else if (status === "pending" || status === "in_progress" || status === "ready" || status === "delivered") {
    filter.status = status;
  }
  const q = searchParams.get("q")?.trim();
  if (q) {
    const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: pattern, $options: "i" };
    filter.$or = [
      { ticketId: regex },
      { customerName: regex },
      { customerPhone: regex },
      { watchBrand: regex },
      { watchModel: regex },
    ];
  }
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.$gte = businessDayRange(from).start;
    if (to) createdAt.$lte = businessDayRange(to).end;
    filter.createdAt = createdAt;
  }
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
  const nameError = customerNameError(body.customerName);
  if (nameError) return jsonError("VALIDATION", nameError, 400);
  const costError = estimatedCostCentsError(body.estimatedCostCents);
  if (costError) return jsonError("VALIDATION", costError, 400);
  const invalidPhone = phoneError(body.customerPhone);
  if (invalidPhone) return jsonError("VALIDATION", invalidPhone, 400);
  const brandError = watchTextError(body.watchBrand, "watch brand");
  if (brandError) return jsonError("VALIDATION", brandError, 400);
  const modelError = watchTextError(body.watchModel, "model");
  if (modelError) return jsonError("VALIDATION", modelError, 400);
  const ticketId = await generateRepairTicketId();
  const ticket = await RepairTicket.create({
    ticketId,
    customerName: normalizeCustomerName(body.customerName),
    customerPhone: normalizeSriLankaPhone(body.customerPhone),
    watchBrand: normalizeWatchText(body.watchBrand, "watch brand"),
    watchModel: normalizeWatchText(body.watchModel, "model"),
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
