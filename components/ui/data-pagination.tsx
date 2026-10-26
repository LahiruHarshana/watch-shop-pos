"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/lib/api/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function DataPagination({
  pagination,
  onPageChange,
  onLimitChange,
  disabled,
  limitOptions = [10, 20, 50],
}: {
  pagination: PaginationMeta | null;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  disabled?: boolean;
  limitOptions?: number[];
}) {
  if (!pagination || pagination.total === 0) return null;

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.total, pagination.page * pagination.limit);
  const pages = pageWindow(pagination.page, pagination.totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{start}</span>–
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{pagination.total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onLimitChange && (
          <Select
            value={String(pagination.limit)}
            onValueChange={(v) => v && onLimitChange(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 w-[110px] rounded-xl bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={disabled || !pagination.hasPrevPage}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              type="button"
              size="sm"
              variant={p === pagination.page ? "default" : "outline"}
              className={cn("min-w-9 rounded-xl", p === pagination.page && "pointer-events-none")}
              disabled={disabled}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={disabled || !pagination.hasNextPage}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function pageWindow(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}
