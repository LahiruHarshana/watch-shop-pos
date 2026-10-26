import type { RepairStatus } from "@/models/RepairTicket";

export type { RepairStatus };
import type { UserRole } from "@/types/next-auth";

const forward: Record<RepairStatus, RepairStatus[]> = {
  pending: ["in_progress"],
  in_progress: ["ready"],
  ready: ["delivered"],
  delivered: [],
};

const adminBack: Partial<Record<RepairStatus, RepairStatus>> = {
  in_progress: "pending",
  ready: "in_progress",
};

export function canTransition(
  from: RepairStatus,
  to: RepairStatus,
  role: UserRole,
  hasPayment: boolean,
): boolean {
  if (from === "delivered") return false;
  if (to === "delivered" && !hasPayment) return false;
  if (forward[from]?.includes(to)) return true;
  if (role === "admin" && adminBack[from] === to) return true;
  return false;
}

export { statusLabels, statusPillClass } from "@/lib/repairs/status-style";
