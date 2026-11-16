"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Phone,
  Printer,
  User,
  Watch,
  Wrench,
} from "lucide-react";
import { statusLabels, statusPillClass } from "@/lib/repairs/status-style";
import type { RepairStatus } from "@/lib/repairs/transitions";
import { formatLkr } from "@/lib/money/format";
import { customerNameError } from "@/lib/repairs/customer-name";
import { estimatedCostInputError } from "@/lib/repairs/estimated-cost";
import { issueDescriptionError } from "@/lib/repairs/issue-description";
import { phoneError } from "@/lib/repairs/phone";
import { watchTextError } from "@/lib/repairs/watch-text";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type Ticket = {
  _id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  watchBrand: string;
  watchModel: string;
  issueDescription: string;
  estimatedCostCents: number;
  status: RepairStatus;
};

const nextStatus: Partial<Record<RepairStatus, RepairStatus>> = {
  pending: "in_progress",
  in_progress: "ready",
  ready: "delivered",
};

const statusAccent: Record<RepairStatus, string> = {
  pending: "from-amber-400 to-orange-400",
  in_progress: "from-violet-500 to-indigo-500",
  ready: "from-emerald-400 to-teal-500",
  delivered: "from-slate-300 to-slate-400",
};

export function RepairDetail({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  const [loading, setLoading] = useState(false);
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const canEdit = ticket.status !== "delivered" || isAdmin;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    customerName: ticket.customerName,
    customerPhone: ticket.customerPhone,
    watchBrand: ticket.watchBrand,
    watchModel: ticket.watchModel,
    issueDescription: ticket.issueDescription,
    estimatedCost: String(ticket.estimatedCostCents / 100),
  });
  const next = nextStatus[ticket.status];
  const nextLabel = next ? statusLabels[next] : null;

  async function advance() {
    const to = nextStatus[ticket.status];
    if (!to) return;
    setLoading(true);
    const body: Record<string, unknown> = { status: to };
    if (to === "delivered") {
      body.payment = { method: paymentMethod, amountCents: ticket.estimatedCostCents };
    }
    const res = await fetch(`/api/repairs/${ticket._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Update failed");
      return;
    }
    toast.success("Ticket updated");
    router.refresh();
  }

  async function saveIntake(event: React.FormEvent) {
    event.preventDefault();
    const invalidName = customerNameError(draft.customerName);
    if (invalidName) {
      toast.error(invalidName);
      return;
    }
    const invalidBrand = watchTextError(draft.watchBrand, "watch brand");
    if (invalidBrand) {
      toast.error(invalidBrand);
      return;
    }
    const invalidModel = watchTextError(draft.watchModel, "model");
    if (invalidModel) {
      toast.error(invalidModel);
      return;
    }
    const invalidIssue = issueDescriptionError(draft.issueDescription);
    if (invalidIssue) {
      toast.error(invalidIssue);
      return;
    }
    const invalidPhone = phoneError(draft.customerPhone);
    if (invalidPhone) {
      toast.error(invalidPhone);
      return;
    }
    const invalidCost = estimatedCostInputError(draft.estimatedCost);
    if (invalidCost) {
      toast.error(invalidCost);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/repairs/${ticket._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: draft.customerName,
        customerPhone: draft.customerPhone,
        watchBrand: draft.watchBrand,
        watchModel: draft.watchModel,
        issueDescription: draft.issueDescription,
        estimatedCostCents: Math.round(Number(draft.estimatedCost) * 100),
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Could not save ticket");
      return;
    }
    toast.success("Ticket details saved");
    setEditing(false);
    router.refresh();
  }

  return (
    <motion.div
      initial={instant ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/repairs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Repairs board
        </Link>
        <span className={statusPillClass(ticket.status)}>{statusLabels[ticket.status]}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_32px_rgb(120_140_180/0.1)]">
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1 bg-gradient-to-b",
            statusAccent[ticket.status],
          )}
          aria-hidden
        />
        <div className="border-b border-border/60 px-4 py-3 sm:px-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ticket</p>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{ticket.ticketId}</h1>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <InfoBlock icon={User} label="Customer">
            <p className="font-medium">{ticket.customerName}</p>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="size-3.5 shrink-0" aria-hidden />
              {ticket.customerPhone}
            </p>
          </InfoBlock>
          <InfoBlock icon={Watch} label="Watch">
            <p className="font-medium">{ticket.watchBrand}</p>
            <p className="text-sm text-muted-foreground">{ticket.watchModel}</p>
          </InfoBlock>
          <InfoBlock icon={Wrench} label="Issue" className="sm:col-span-2">
            <p className="text-sm leading-relaxed text-foreground/90">{ticket.issueDescription}</p>
          </InfoBlock>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs text-muted-foreground">Estimated total</p>
            <p className="text-lg font-bold text-primary">{formatLkr(ticket.estimatedCostCents)}</p>
          </div>
          <Link
            href={`/repairs/${ticket._id}/token`}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
          >
            <Printer className="size-4 text-muted-foreground" aria-hidden />
            Claim token
          </Link>
        </div>
      </div>

      {canEdit && (
        <div className="rounded-2xl border border-border/80 bg-card p-4">
          <button type="button" className="text-sm font-medium text-primary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close editor" : "Edit intake details"}
          </button>
          {editing && (
            <form onSubmit={saveIntake} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input className="min-h-10 rounded-xl border px-3" value={draft.customerName} onChange={(e) => setDraft({ ...draft, customerName: e.target.value })} required />
              <input className="min-h-10 rounded-xl border px-3" value={draft.customerPhone} onChange={(e) => setDraft({ ...draft, customerPhone: e.target.value })} required />
              <input className="min-h-10 rounded-xl border px-3" value={draft.watchBrand} onChange={(e) => setDraft({ ...draft, watchBrand: e.target.value })} required />
              <input className="min-h-10 rounded-xl border px-3" value={draft.watchModel} onChange={(e) => setDraft({ ...draft, watchModel: e.target.value })} required />
              <textarea className="min-h-20 rounded-xl border px-3 py-2 sm:col-span-2" value={draft.issueDescription} onChange={(e) => setDraft({ ...draft, issueDescription: e.target.value })} required />
              <input className="min-h-10 rounded-xl border px-3" inputMode="decimal" value={draft.estimatedCost} onChange={(e) => setDraft({ ...draft, estimatedCost: e.target.value })} required />
              <Button type="submit" disabled={loading} className="rounded-xl">Save details</Button>
            </form>
          )}
        </div>
      )}

      {next && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
          <p className="mb-3 text-sm font-medium">Workflow</p>
          {ticket.status === "ready" && (
            <div className="mb-3 max-w-xs">
              <p className="mb-1.5 text-xs text-muted-foreground">Payment on collection</p>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
              >
                <SelectTrigger className="h-9 rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={advance}
            disabled={loading}
            className="h-10 w-full rounded-xl text-sm font-semibold sm:w-auto sm:px-6"
          >
            {ticket.status === "ready" ? (
              "Mark delivered & record payment"
            ) : (
              <>
                Advance to {nextLabel}
                <ChevronRight className="ml-1 size-4" aria-hidden />
              </>
            )}
          </Button>
        </div>
      )}

      {ticket.status === "delivered" && (
        <p className="text-center text-sm text-muted-foreground">This ticket is closed.</p>
      )}
    </motion.div>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/50 bg-white/60 p-3", className)}>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      {children}
    </div>
  );
}
