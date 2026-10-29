"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  Clock,
  Hammer,
  PackageCheck,
  Plus,
  Truck,
  Wrench,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { statusLabels, statusPillClass } from "@/lib/repairs/status-style";
import type { RepairStatus } from "@/lib/repairs/transitions";
import { formatLkr } from "@/lib/money/format";
import { cn } from "@/lib/utils";

type Ticket = {
  _id: string;
  ticketId: string;
  customerName: string;
  watchBrand: string;
  watchModel: string;
  estimatedCostCents: number;
  status: RepairStatus;
};

const columns: RepairStatus[] = ["pending", "in_progress", "ready"];

const columnMeta: Record<
  RepairStatus,
  { icon: typeof Clock; accent: string; header: string; columnTint: string }
> = {
  pending: {
    icon: Clock,
    accent: "from-amber-400 to-orange-400",
    header: "border-amber-200/80 bg-amber-50/50",
    columnTint: "ring-amber-500/10",
  },
  in_progress: {
    icon: Hammer,
    accent: "from-violet-500 to-indigo-500",
    header: "border-violet-200/80 bg-violet-50/40",
    columnTint: "ring-violet-500/10",
  },
  ready: {
    icon: PackageCheck,
    accent: "from-emerald-400 to-teal-500",
    header: "border-emerald-200/80 bg-emerald-50/40",
    columnTint: "ring-emerald-500/10",
  },
  delivered: {
    icon: Truck,
    accent: "from-slate-400 to-slate-500",
    header: "border-border bg-muted/30",
    columnTint: "ring-border",
  },
};

export function RepairsBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [delivered, setDelivered] = useState<Ticket[]>([]);
  const [searchHits, setSearchHits] = useState<Ticket[] | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;

  useEffect(() => {
    fetch("/api/repairs?board=true")
      .then((r) => r.json())
      .then((j) => setTickets(j.data ?? []))
      .finally(() => setLoading(false));
    fetch("/api/repairs?status=delivered&limit=12")
      .then((r) => r.json())
      .then((j) => setDelivered(j.data ?? []));
  }, []);

  function runSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "20");
    fetch(`/api/repairs?${params}`)
      .then((r) => r.json())
      .then((j) => setSearchHits(j.data ?? []));
  }

  const openCount = useMemo(
    () => tickets.filter((t) => t.status !== "delivered").length,
    [tickets],
  );

  const pipelineValue = useMemo(
    () =>
      tickets
        .filter((t) => t.status !== "delivered")
        .reduce((sum, t) => sum + t.estimatedCostCents, 0),
    [tickets],
  );

  return (
    <div className="space-y-6">
      <motion.header
        initial={instant ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pos-surface flex flex-wrap items-center justify-between gap-4 px-5 py-5"
      >
        <div>
          <p className="mb-1 text-xs font-medium text-primary">Repair bench</p>
          <h1 className="text-4xl md:text-5xl">Repairs</h1>
          <p className="text-sm text-muted-foreground">Track every watch from intake to pickup.</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0">
          <div className="rounded-2xl bg-primary/10 px-4 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-primary">Open</p>
            <p className="text-lg font-bold text-foreground">{openCount}</p>
          </div>
          <div className="rounded-2xl bg-muted px-4 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Pipeline
            </p>
            <p className="text-lg font-bold">{formatLkr(pipelineValue)}</p>
          </div>
          <Link
            href="/repairs/new"
            className={cn(
              buttonVariants(),
              "h-10 rounded-xl",
            )}
          >
            <Plus className="mr-1.5 size-4" aria-hidden />
            New ticket
          </Link>
        </div>
      </motion.header>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {columns.map((status) => (
            <div
              key={status}
              className="h-64 animate-pulse rounded-[1.35rem] bg-white/60 shadow-sm"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {columns.map((status, colIndex) => {
            const meta = columnMeta[status];
            const Icon = meta.icon;
            const colTickets = tickets.filter((t) => t.status === status);
            return (
              <motion.section
                key={status}
                initial={instant ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: instant ? 0 : colIndex * 0.06, duration: 0.4 }}
                className={cn(
                  "flex flex-col overflow-hidden rounded-[1.35rem] border border-border/80 bg-card shadow-[0_12px_32px_rgb(120_140_180/0.1)] ring-1",
                  meta.columnTint,
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 border-b px-4 py-3",
                    meta.header,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                        meta.accent,
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <h3 className="text-sm font-semibold">{statusLabels[status]}</h3>
                  </div>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-muted-foreground shadow-sm">
                    {colTickets.length}
                  </span>
                </div>
                <div className="flex min-h-[12rem] flex-1 flex-col gap-2 p-3">
                  {colTickets.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 px-3 py-8 text-center text-xs text-muted-foreground">
                      No tickets here
                    </p>
                  ) : (
                    colTickets.map((t, i) => (
                      <TicketCard
                        key={t._id}
                        ticket={t}
                        index={i}
                        instant={instant}
                        accent={meta.accent}
                      />
                    ))
                  )}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      <form onSubmit={runSearch} className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ticket, customer, phone, brand, or model"
          className="min-h-11 flex-1 rounded-xl border border-border bg-white px-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="ready">Ready for Collection</option>
          <option value="delivered">Delivered</option>
        </select>
        <button type="submit" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
          Search
        </button>
      </form>
      {searchHits && (
        <RepairList title="Search results" tickets={searchHits} empty="No tickets match that search." />
      )}
      <RepairList title="Recently delivered" tickets={delivered} empty="No delivered repairs yet." />
    </div>
  );
}

function RepairList({
  title,
  tickets,
  empty,
}: {
  title: string;
  tickets: Ticket[];
  empty: string;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {tickets.map((ticket) => (
            <li key={ticket._id}>
              <Link href={`/repairs/${ticket._id}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{ticket.ticketId}</span>
                  <span className="ml-2 text-muted-foreground">
                    {ticket.customerName} · {ticket.watchBrand} {ticket.watchModel}
                  </span>
                </span>
                <span className={statusPillClass(ticket.status)}>{statusLabels[ticket.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TicketCard({
  ticket,
  index,
  instant,
  accent,
}: {
  ticket: Ticket;
  index: number;
  instant: boolean;
  accent: string;
}) {
  return (
    <motion.div
      initial={instant ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: instant ? 0 : index * 0.05, duration: 0.3 }}
      whileHover={instant ? undefined : { y: -2, scale: 1.01 }}
    >
      <Link
        href={`/repairs/${ticket._id}`}
        className="group relative block overflow-hidden rounded-xl border border-border/60 bg-white p-3 shadow-sm transition-shadow hover:border-primary/25 hover:shadow-md"
      >
        <span
          className={cn("absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b", accent)}
          aria-hidden
        />
        <div className="pl-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm tracking-tight">{ticket.ticketId}</p>
            <span className={statusPillClass(ticket.status)}>{statusLabels[ticket.status]}</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Wrench className="size-3 shrink-0 opacity-60" aria-hidden />
            {ticket.watchBrand} {ticket.watchModel}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{ticket.customerName}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-primary">{formatLkr(ticket.estimatedCostCents)}</p>
            <span
              className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
              aria-hidden
            >
              <ChevronRight className="size-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
