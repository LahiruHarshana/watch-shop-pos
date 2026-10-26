import type { RepairStatus } from "@/models/RepairTicket";

export const statusLabels: Record<RepairStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  ready: "Ready for Collection",
  delivered: "Delivered",
};

export function statusPillClass(status: RepairStatus): string {
  switch (status) {
    case "pending":
      return "status-pill status-pill-pending";
    case "in_progress":
      return "status-pill status-pill-progress";
    case "ready":
      return "status-pill status-pill-ready";
    default:
      return "status-pill bg-white/10 text-muted-foreground";
  }
}
