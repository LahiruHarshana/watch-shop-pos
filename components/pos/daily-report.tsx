"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Landmark,
  ShoppingBag,
  Wrench,
  TrendingUp,
} from "lucide-react";
import { formatLkr } from "@/lib/money/format";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Report = {
  date: string;
  retailCents: number;
  repairCents: number;
  totalCents: number;
  saleCount: number;
  repairCount: number;
  paymentBreakdown?: Record<string, number>;
};

const paymentMeta: Record<string, { label: string; icon: typeof Banknote; color: string }> = {
  cash: { label: "Cash", icon: Banknote, color: "bg-emerald-500" },
  card: { label: "Card", icon: CreditCard, color: "bg-primary" },
  bank_transfer: { label: "Bank transfer", icon: Landmark, color: "bg-violet-500" },
};

function formatDisplayDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DailyReport() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/daily?date=${date}`)
      .then((r) => r.json())
      .then((j) => setReport(j.data))
      .finally(() => setLoading(false));
  }, [date]);

  const retailShare = useMemo(() => {
    if (!report || report.totalCents === 0) return 0;
    return Math.round((report.retailCents / report.totalCents) * 100);
  }, [report]);

  const repairShare = useMemo(() => {
    if (!report || report.totalCents === 0) return 0;
    return 100 - retailShare;
  }, [report, retailShare]);

  const payments = useMemo(() => {
    if (!report?.paymentBreakdown) return [];
    return Object.entries(report.paymentBreakdown).filter(([, cents]) => cents > 0);
  }, [report]);

  const paymentTotal = useMemo(
    () => payments.reduce((s, [, c]) => s + c, 0),
    [payments],
  );

  return (
    <div className="space-y-6">
      <motion.header
        initial={instant ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/75 px-5 py-5 shadow-[0_16px_40px_rgb(120_140_180/0.1)] backdrop-blur-md dashboard-mesh md:flex md:items-end md:justify-between md:gap-6"
      >
        <div>
          <p className="mb-1 text-xs font-medium text-primary">End of day</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Daily sales</h1>
          <p className="text-sm text-muted-foreground">Retail and repair revenue for the selected date.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <LabelledDate value={date} onChange={setDate} />
        </div>
      </motion.header>

      {report && !loading && (
        <p className="text-sm font-medium text-muted-foreground">{formatDisplayDate(report.date)}</p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[1.35rem] bg-white/70" />
          ))}
        </div>
      ) : report ? (
        <>
          <motion.div
            initial={instant ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden rounded-[1.35rem] border border-border/80 bg-card p-5 shadow-[0_16px_40px_rgb(120_140_180/0.1)]"
          >
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">Revenue mix</span>
              <span className="text-muted-foreground">
                {formatLkr(report.totalCents)} total
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="bg-gradient-to-r from-primary to-violet-400"
                initial={instant ? { width: `${retailShare}%` } : { width: 0 }}
                animate={{ width: `${retailShare}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="bg-gradient-to-r from-teal-400 to-emerald-500"
                initial={instant ? { width: `${repairShare}%` } : { width: 0 }}
                animate={{ width: `${repairShare}%` }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Retail {retailShare}%</span>
              <span>Repairs {repairShare}%</span>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            <MetricCard
              title="Retail"
              value={formatLkr(report.retailCents)}
              sub={`${report.saleCount} sales`}
              icon={ShoppingBag}
              accent="from-primary/15 to-violet-500/10"
              iconClass="text-primary"
              index={0}
              instant={instant}
            />
            <MetricCard
              title="Repairs"
              value={formatLkr(report.repairCents)}
              sub={`${report.repairCount} jobs`}
              icon={Wrench}
              accent="from-emerald-500/15 to-teal-500/10"
              iconClass="text-emerald-600"
              index={1}
              instant={instant}
            />
            <MetricCard
              title="Total"
              value={formatLkr(report.totalCents)}
              sub="Combined revenue"
              icon={TrendingUp}
              accent="from-primary/20 via-violet-500/10 to-transparent"
              iconClass="text-primary"
              highlight
              index={2}
              instant={instant}
            />
          </div>

          {payments.length > 0 && (
            <motion.section
              initial={instant ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="overflow-hidden rounded-[1.35rem] border border-border/80 bg-card shadow-[0_16px_40px_rgb(120_140_180/0.1)]"
            >
              <div className="border-b border-border/60 px-6 py-4">
                <h2 className="font-semibold tracking-tight">Payments by method</h2>
                <p className="text-xs text-muted-foreground">Cash, card, and transfers for this day</p>
              </div>
              <ul className="divide-y divide-border/60 p-4">
                {payments.map(([method, cents], i) => {
                  const meta = paymentMeta[method] ?? {
                    label: method,
                    icon: Banknote,
                    color: "bg-muted-foreground",
                  };
                  const Icon = meta.icon;
                  const pct = paymentTotal > 0 ? Math.round((cents / paymentTotal) * 100) : 0;
                  return (
                    <li key={method} className="flex flex-wrap items-center gap-4 py-3">
                      <span
                        className="flex size-10 items-center justify-center rounded-xl bg-muted"
                        aria-hidden
                      >
                        <Icon className="size-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-[120px] flex-1">
                        <p className="text-sm font-medium">{meta.label}</p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className={cn("h-full rounded-full", meta.color)}
                            initial={instant ? { width: `${pct}%` } : { width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: instant ? 0 : 0.2 + i * 0.08, duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatLkr(cents)}</p>
                        <p className="text-xs text-muted-foreground">{pct}%</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          )}
        </>
      ) : null}
    </div>
  );
}

function LabelledDate({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex min-w-[200px] items-center gap-2 rounded-2xl border border-border/60 bg-white/90 px-3 py-2 shadow-sm">
      <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
      />
    </label>
  );
}

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  iconClass,
  highlight,
  index,
  instant,
}: {
  title: string;
  value: string;
  sub: string;
  icon: typeof ShoppingBag;
  accent: string;
  iconClass: string;
  highlight?: boolean;
  index: number;
  instant: boolean;
}) {
  return (
    <motion.div
      initial={instant ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: instant ? 0 : index * 0.08, duration: 0.4 }}
      whileHover={instant ? undefined : { y: -4 }}
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border p-5 shadow-[0_12px_32px_rgb(120_140_180/0.1)]",
        highlight ? "border-primary/25 bg-gradient-to-br from-primary/5 to-card ring-1 ring-primary/10" : "border-border/80 bg-card",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80", accent)} aria-hidden />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className={cn("flex size-9 items-center justify-center rounded-xl bg-white/80 shadow-sm", iconClass)}>
            <Icon className="size-4" aria-hidden />
          </span>
        </div>
        <p
          className={cn(
            "text-2xl font-bold tracking-tight",
            highlight && "bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent",
          )}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </div>
    </motion.div>
  );
}
