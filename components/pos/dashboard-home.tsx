"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Link2,
  TrendingUp,
  Watch,
  Wrench,
} from "lucide-react";
import { formatLkr } from "@/lib/money/format";
import { statusLabels, statusPillClass } from "@/lib/repairs/status-style";
import type { RepairStatus } from "@/models/RepairTicket";
import { cn } from "@/lib/utils";

export type DashboardHomeProps = {
  firstName: string;
  todayCents: number;
  weekTotalCents: number;
  buckets: { label: string; cents: number; key: string; isToday: boolean }[];
  maxCents: number;
  openRepairs: {
    id: string;
    ticketId: string;
    status: RepairStatus;
    watchBrand: string;
    watchModel: string;
    customerName: string;
  }[];
  shortcuts: { href: string; title: string; tone: string }[];
  lowStock?: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    lowStockThreshold: number;
  }[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const shortcutIcons = [Watch, Link2, Wrench] as const;

const statusAccent: Record<RepairStatus, string> = {
  pending: "from-amber-400 to-orange-400",
  in_progress: "from-violet-500 to-indigo-500",
  ready: "from-emerald-400 to-teal-500",
  delivered: "from-slate-300 to-slate-400",
};

function formatTodayLabel() {
  return new Intl.DateTimeFormat("en-LK", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

export function DashboardHome({
  firstName,
  todayCents,
  weekTotalCents,
  buckets,
  maxCents,
  openRepairs,
  shortcuts,
  lowStock = [],
}: DashboardHomeProps) {
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;

  return (
    <motion.div
      className="space-y-10"
      initial={instant ? false : "hidden"}
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: instant ? 0 : 0.08, delayChildren: instant ? 0 : 0.05 },
        },
      }}
    >
      <motion.header
        variants={fadeUp}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/70 px-5 py-6 shadow-[0_20px_50px_rgb(120_140_180/0.12)] backdrop-blur-md md:px-7 dashboard-mesh"
      >
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {formatTodayLabel()}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening at the counter today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatChip
              label="Today's sales"
              value={formatLkr(todayCents)}
              icon={TrendingUp}
              accent="primary"
              index={0}
              instant={instant}
            />
            <StatChip
              label="Open repairs"
              value={String(openRepairs.length)}
              icon={Wrench}
              accent="violet"
              index={1}
              instant={instant}
            />
          </div>
        </div>
      </motion.header>

      <motion.section variants={sectionReveal}>
        <SectionHeading
          icon={BarChart3}
          title="My activity"
          subtitle={`${formatLkr(weekTotalCents)} this week`}
          href="/reports/daily"
        />
        <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-card p-5 shadow-[0_16px_40px_rgb(120_140_180/0.1)] dashboard-mesh">
          <div
            className="pointer-events-none absolute inset-x-6 bottom-14 top-16 border-b border-dashed border-border/70"
            aria-hidden
          />
          <div className="relative flex h-52 items-end gap-1.5 sm:gap-2.5">
            {buckets.map((b, i) => {
              const max = Math.max(maxCents, 1);
              const targetH = b.cents > 0
                ? Math.max(20, Math.round((b.cents / max) * 128))
                : 18;
              return (
                <ActivityBar
                  key={b.key}
                  label={b.label}
                  cents={b.cents}
                  targetHeight={targetH}
                  isToday={b.isToday}
                  index={i}
                  instant={instant}
                />
              );
            })}
          </div>
        </div>
      </motion.section>

      {lowStock.length > 0 && (
        <motion.section variants={sectionReveal}>
          <SectionHeading
            icon={AlertTriangle}
            title="Low stock"
            subtitle="Items at or below their alert level"
            href="/inventory/products?stock=low"
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {lowStock.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/inventory/products/${item.id}`}
                  className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium text-amber-950">
                      Alert: {item.name} below {item.lowStockThreshold} units
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-amber-800/80">{item.sku}</span>
                  </span>
                  <span className="font-bold text-amber-900">{item.quantity}</span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      <motion.section variants={sectionReveal}>
        <SectionHeading icon={Wrench} title="Open repairs" href="/repairs" />
        {openRepairs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No watches in the shop.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {openRepairs.map((t, i) => (
              <RepairCard key={t.id} ticket={t} index={i} instant={instant} />
            ))}
          </div>
        )}
      </motion.section>

      <motion.section variants={sectionReveal}>
        <SectionHeading title="Shortcuts" subtitle="Jump to common tasks" />
        <div className="grid gap-4 sm:grid-cols-3">
          {shortcuts.map((s, i) => (
            <ShortcutTile
              key={s.href}
              shortcut={s}
              icon={shortcutIcons[i] ?? Watch}
              index={i}
              instant={instant}
            />
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

function SectionHeading({
  title,
  subtitle,
  href,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: typeof BarChart3;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          See all
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  icon: Icon,
  accent,
  index,
  instant,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  accent: "primary" | "violet";
  index: number;
  instant: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "min-w-[140px] rounded-2xl border border-white/80 bg-white/90 px-4 py-3.5 shadow-[0_10px_30px_rgb(120_140_180/0.12)] backdrop-blur-sm",
        accent === "primary" ? "ring-1 ring-primary/10" : "ring-1 ring-violet-500/10",
      )}
      initial={instant ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: instant ? 0 : 0.12 + index * 0.08,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={instant ? undefined : { y: -2, scale: 1.02 }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            accent === "primary" ? "bg-primary/15 text-primary" : "bg-violet-500/15 text-violet-600",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <p className="text-lg font-bold tracking-tight text-foreground">{value}</p>
    </motion.div>
  );
}

function ActivityBar({
  label,
  cents,
  targetHeight,
  isToday,
  index,
  instant,
}: {
  label: string;
  cents: number;
  targetHeight: number;
  isToday: boolean;
  index: number;
  instant: boolean;
}) {
  const hasSales = cents > 0;

  return (
    <div className="group flex flex-1 flex-col items-center gap-2">
      <motion.span
        className={cn(
          "min-h-[14px] text-[10px] font-semibold sm:text-[11px]",
          isToday && "text-primary",
          !isToday && hasSales && "text-foreground/70",
          !isToday && !hasSales && "text-transparent group-hover:text-muted-foreground",
        )}
        initial={instant ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: isToday || hasSales ? 1 : 0 }}
      >
        {hasSales ? formatLkr(cents) : "—"}
      </motion.span>
      <div className="flex h-[128px] w-full max-w-10 items-end justify-center">
        <motion.div
          className={cn(
            "w-full max-w-9 rounded-full border border-indigo-200/60",
            isToday
              ? "border-transparent bg-gradient-to-t from-primary to-violet-400 dashboard-bar-glow"
              : hasSales
                ? "bg-gradient-to-t from-indigo-400/70 to-indigo-200 group-hover:from-primary/80 group-hover:to-violet-300"
                : "bg-indigo-100/90 group-hover:bg-indigo-200/90",
          )}
          initial={instant ? { height: targetHeight } : { height: 0 }}
          animate={{ height: targetHeight }}
          transition={
            instant
              ? { duration: 0 }
              : {
                  type: "spring",
                  stiffness: 300,
                  damping: 26,
                  delay: 0.12 + index * 0.065,
                }
          }
          whileHover={instant ? undefined : { y: -6, scale: 1.04 }}
        />
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] text-muted-foreground",
          isToday && "bg-primary/10 font-semibold text-primary",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function RepairCard({
  ticket,
  index,
  instant,
}: {
  ticket: DashboardHomeProps["openRepairs"][number];
  index: number;
  instant: boolean;
}) {
  return (
    <motion.div
      initial={instant ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: instant ? 0 : index * 0.07,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={instant ? undefined : { y: -5 }}
    >
      <Link
        href={`/repairs/${ticket.id}`}
        className="group relative flex overflow-hidden rounded-[1.35rem] border border-border/80 bg-card p-4 shadow-[0_10px_28px_rgb(120_140_180/0.1)] transition-shadow hover:shadow-[0_20px_40px_rgb(120_140_180/0.16)]"
      >
        <span
          className={cn(
            "absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b",
            statusAccent[ticket.status],
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 pl-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold tracking-tight">{ticket.ticketId}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.watchBrand} {ticket.watchModel}
              </p>
            </div>
            <span className={statusPillClass(ticket.status)}>{statusLabels[ticket.status]}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">{ticket.customerName}</p>
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
              aria-hidden
            >
              <ChevronRight className="size-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ShortcutTile({
  shortcut,
  icon: Icon,
  index,
  instant,
}: {
  shortcut: DashboardHomeProps["shortcuts"][number];
  icon: typeof Watch;
  index: number;
  instant: boolean;
}) {
  return (
    <motion.div
      initial={instant ? false : { opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        delay: instant ? 0 : index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={instant ? undefined : { scale: 1.02, y: -4 }}
      whileTap={instant ? undefined : { scale: 0.99 }}
    >
      <Link
        href={shortcut.href}
        className={cn(
          "group relative block overflow-hidden rounded-[1.5rem] p-5 shadow-sm transition-shadow hover:shadow-xl",
          shortcut.tone,
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/40 blur-2xl" />
        <div className="relative mb-6 flex items-start justify-between">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/70 text-foreground shadow-sm ring-1 ring-white/80 backdrop-blur-sm">
            <Icon className="size-6" aria-hidden />
          </span>
          <ArrowRight
            className="size-5 text-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary"
            aria-hidden
          />
        </div>
        <p className="relative font-semibold text-foreground">{shortcut.title}</p>
        <p className="relative mt-1 text-xs text-muted-foreground">Open →</p>
      </Link>
    </motion.div>
  );
}
