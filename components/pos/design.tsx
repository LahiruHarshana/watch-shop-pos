"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, pageTransition } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

export function PageMotion({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={pageTransition.initial} animate={pageTransition.animate} transition={pageTransition.transition}>
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      variants={fadeUp}
      initial={reduce ? false : "hidden"}
      animate="visible"
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "pos-surface px-4 py-3.5",
        emphasis && "border-brand/20 bg-brand-soft",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("metric mt-2 text-2xl font-semibold text-foreground", emphasis && "text-brand")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </motion.article>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
