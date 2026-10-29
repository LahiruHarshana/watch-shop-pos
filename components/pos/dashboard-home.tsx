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
  Watch,
  Wrench,
} from "lucide-react";
import { EmptyState } from "@/components/pos/design";
import { formatLkr } from "@/lib/money/format";
import { statusLabels, statusPillClass } from "@/lib/repairs/status-style";
import type { RepairStatus } from "@/models/RepairTicket";
import { cn } from "@/lib/utils";

export type DashboardHomeProps = {
  firstName: string;
  todayCents: number;
  repairCents: number;
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
    estimatedCostCents: number;
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
  repairCents,
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
      <motion.section variants={fadeUp} className="pos-ink relative overflow-hidden px-6 py-7 md:px-8 md:py-8">
        <div className="pointer-events-none absolute -right-10 -bottom-16 size-56 rounded-full border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute right-6 -bottom-6 size-36 rounded-full border border-white/10" aria-hidden />
        <div className="relative max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">{formatTodayLabel()}</p>
          <h1 className="mt-3 text-4xl text-[#f6f1ea] md:text-5xl">Good day, {firstName}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            Counter activity for today, in Colombo time. Retail and repair collections sit together here.
          </p>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">Today</p>
              <p className="font-display metric mt-1 text-4xl text-[#f6f1ea] sm:text-5xl">{formatLkr(todayCents + repairCents)}</p>
              <p className="mt-1 text-xs text-white/50">Retail and repairs</p>
            </div>
            <Link href="/checkout" className="inline-flex h-11 items-center rounded-2xl bg-[#f6f1ea] px-4 text-sm font-medium text-[#141218] hover:bg-white">
              New sale
            </Link>
          </div>
        </div>
        <dl className="relative mt-8 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
          <div className="bg-white/5 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">Retail</dt>
            <dd className="metric mt-1 text-lg text-[#f6f1ea]">{formatLkr(todayCents)}</dd>
          </div>
          <div className="bg-white/5 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">Repairs</dt>
            <dd className="metric mt-1 text-lg text-[#f6f1ea]">{formatLkr(repairCents)}</dd>
          </div>
          <div className="bg-white/5 px-4 py-3">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-white/45">Open jobs</dt>
            <dd className="metric mt-1 text-lg text-[#f6f1ea]">
              {openRepairs.length}
              <span className="ml-2 text-xs font-sans text-white/45">
                {lowStock.length ? `${lowStock.length} low stock` : "stock healthy"}
              </span>
            </dd>
          </div>
        </dl>
      </motion.section>

      <motion.section variants={sectionReveal}>
        <SectionHeading
          icon={BarChart3}
          title="My activity"
          subtitle={`${formatLkr(weekTotalCents)} this week`}
          href="/reports/daily"
        />
        <div className="pos-surface relative overflow-hidden p-5 md:p-6">
          <div
            className="pointer-events-none absolute inset-x-6 bottom-14 top-16 border-b border-dashed border-border/70"
            aria-hidden
          />
          <div className="relative flex h-52 min-w-0 items-end gap-1 sm:gap-2">
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
          <ul className="pos-surface divide-y divide-border overflow-hidden">
            {lowStock.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/inventory/products/${item.id}`}
                  className="flex items-center justify-between gap-3 border-l-2 border-[#b08968] px-4 py-3 text-sm hover:bg-surface-muted"
                >
                  <span>
                    <span className="font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {item.sku} · alert below {item.lowStockThreshold}
                    </span>
                  </span>
                  <span className="metric text-lg font-semibold text-[#9a6700]">{item.quantity}</span>
                </Link>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      <motion.section variants={sectionReveal}>
        <SectionHeading icon={Wrench} title="Open repairs" href="/repairs" />
        {openRepairs.length === 0 ? (
          <EmptyState title="No watches in the shop" description="New repair tickets will show up here." />
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
    <div className="group flex min-w-0 flex-1 flex-col items-center gap-2">
      <motion.span
        className={cn(
          "w-full min-h-[14px] truncate text-center text-[10px] font-semibold sm:text-[11px]",
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
            "w-full max-w-8 rounded-t-md",
            isToday
              ? "bg-brand dashboard-bar-glow"
              : hasSales
                ? "bg-[#2a2633] group-hover:bg-brand"
                : "bg-[#e4ddd2] group-hover:bg-[#d4cdc2]",
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
        className="group relative flex overflow-hidden rounded-[1.25rem] border border-border bg-card p-4 shadow-[var(--shadow-surface)] transition-shadow hover:shadow-[var(--shadow-raised)]"
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
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{ticket.customerName}</p>
              <p className="metric text-sm font-semibold">{formatLkr(ticket.estimatedCostCents)}</p>
            </div>
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
        className="group relative block overflow-hidden rounded-[1.25rem] border border-border bg-card p-5 shadow-[var(--shadow-surface)] transition-shadow hover:shadow-[var(--shadow-raised)]"
      >
        <div className="relative mb-6 flex items-start justify-between">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#141218] text-[#f6f1ea]">
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
