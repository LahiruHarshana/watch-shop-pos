"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  History,
  Layers,
  Minus,
  Package,
  PackagePlus,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { readResponseJson } from "@/lib/api/read-response-json";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/lib/api/pagination";
import { DataPagination } from "@/components/ui/data-pagination";

type Product = { _id: string; name: string; sku: string; quantity: number };

type AdjustmentRow = {
  _id: string;
  delta: number;
  reason: string;
  note?: string;
  createdAt: string;
  productId?: { name: string; sku: string } | null;
  performedBy?: { name: string } | null;
};

const reasonOptions = [
  { value: "purchase", label: "Restock", sub: "Purchase delivery", icon: TrendingUp, tone: "text-emerald-600" },
  { value: "damage", label: "Damage", sub: "Write-off", icon: TrendingDown, tone: "text-red-600" },
  { value: "correction", label: "Correction", sub: "Count fix", icon: Layers, tone: "text-primary" },
  { value: "other", label: "Other", sub: "Misc.", icon: Package, tone: "text-muted-foreground" },
] as const;

const inputClass =
  "min-h-11 rounded-xl border border-border bg-white shadow-sm placeholder:text-muted-foreground/70";

const quickDeltas = [
  { label: "+10", value: 10 },
  { label: "+24", value: 24 },
  { label: "−1", value: -1 },
  { label: "−5", value: -5 },
] as const;

function reasonLabel(value: string) {
  return reasonOptions.find((r) => r.value === value)?.label ?? value;
}

export function StockAdjustmentsForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<AdjustmentRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState<PaginationMeta | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [productId, setProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("purchase");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(() => {
    fetch("/api/products?picker=true&limit=200&page=1")
      .then((r) => r.json())
      .then((j) => setProducts(j.data ?? []));
  }, []);

  const loadHistory = useCallback(() => {
    fetch(`/api/stock-adjustments?page=${historyPage}&limit=8`)
      .then((r) => r.json())
      .then((j) => {
        setHistory(j.data ?? []);
        setHistoryPagination(j.pagination ?? null);
      })
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [historyPage]);

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, [loadProducts, loadHistory]);

  const selected = useMemo(
    () => products.find((p) => p._id === productId),
    [products, productId],
  );
  const visibleProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query),
    );
  }, [products, productQuery]);

  const deltaNum = Number(delta);
  const projected =
    selected && delta !== "" && !Number.isNaN(deltaNum)
      ? selected.quantity + deltaNum
      : null;

  const deltaValid = delta !== "" && !Number.isNaN(deltaNum) && deltaNum !== 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!deltaValid) {
      toast.error("Enter a non-zero quantity change");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/stock-adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        delta: deltaNum,
        reason,
        note: note.trim() || undefined,
      }),
    });
    const json = await readResponseJson(res);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Failed");
      return;
    }
    toast.success("Stock updated");
    setDelta("");
    setNote("");
    loadProducts();
    loadHistory();
  }

  function bumpDelta(n: number) {
    const current = delta === "" || Number.isNaN(Number(delta)) ? 0 : Number(delta);
    setDelta(String(current + n));
  }

  function setQuickDelta(n: number) {
    setDelta(String(n));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <Link
        href="/inventory/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to inventory
      </Link>

      <header>
        <h1 className="text-4xl md:text-5xl">Stock adjustments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add or remove units. Use a positive number to restock, negative to write off.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-5">
        <form onSubmit={submit} className="lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_32px_rgb(120_140_180/0.08)]">
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-primary/8 to-transparent px-5 py-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <PackagePlus className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold">New adjustment</h2>
                <p className="text-xs text-muted-foreground">Applies immediately to on-hand stock</p>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <FormSection title="Which product?" description="Pick the SKU you are adjusting.">
                <Field label="Product" hint="Type a name to narrow the list. Each row shows the SKU.">
                  <Input
                    className={cn(inputClass, "mb-2")}
                    value={productQuery}
                    placeholder="Search by name…"
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  <Select
                    value={productId || null}
                    items={visibleProducts.map((p) => ({
                      value: p._id,
                      label: `${p.name} — ${p.sku}`,
                    }))}
                    onValueChange={(v) => setProductId(v ?? "")}
                  >
                    <SelectTrigger multiline className={inputClass}>
                      <SelectValue placeholder="Choose product…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {visibleProducts.map((p) => (
                        <SelectItem key={p._id} value={p._id} multiline>
                          <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                            <span className="whitespace-normal font-medium leading-snug">{p.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productQuery.trim() && visibleProducts.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No product matches that name.</p>
                  ) : null}
                </Field>

                {selected && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium">{selected.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{selected.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">On hand</p>
                      <p className="text-lg font-bold">{selected.quantity}</p>
                      {projected !== null && deltaValid && (
                        <p className="text-xs" aria-live="polite">
                          →{" "}
                          <span
                            className={cn(
                              "font-semibold",
                              projected < 0 ? "text-destructive" : "text-primary",
                            )}
                          >
                            {projected} after
                          </span>
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/inventory/products/${selected._id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View product
                    </Link>
                  </div>
                )}
              </FormSection>

              <FormSection title="How many?" description="Positive adds stock; negative removes.">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-xl border-border"
                    onClick={() => bumpDelta(-1)}
                    aria-label="Decrease by 1"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    className={cn(inputClass, "text-center text-lg font-semibold tabular-nums")}
                    inputMode="numeric"
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    placeholder="10 or −2"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-xl border-border"
                    onClick={() => bumpDelta(1)}
                    aria-label="Increase by 1"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickDeltas.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => setQuickDelta(q.value)}
                      className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      {q.label}
                    </button>
                  ))}
                  <span className="self-center text-[11px] text-muted-foreground">Quick set</span>
                </div>
              </FormSection>

              <FormSection title="Why?" description="Used on the adjustment history.">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {reasonOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = reason === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReason(opt.value)}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                            : "border-border bg-white hover:border-primary/30",
                        )}
                      >
                        <Icon className={cn("size-4", opt.tone)} aria-hidden />
                        <span className="text-sm font-semibold leading-tight">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <Field label="Note (optional)" hint="Invoice #, supplier, or damage notes.">
                <Textarea
                  className={cn(inputClass, "min-h-[80px] resize-none py-2.5")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Delivery note #4521"
                />
              </Field>

              <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-xl"
                  onClick={() => {
                    setDelta("");
                    setNote("");
                    setProductId("");
                  }}
                >
                  Clear form
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !productId || !deltaValid}
                  className="h-10 rounded-xl font-semibold sm:min-w-[200px]"
                >
                  {submitting ? "Applying…" : "Apply adjustment"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        <aside className="lg:col-span-2">
          <div className="sticky top-28 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <History className="size-4 text-muted-foreground" aria-hidden />
              <div>
                <h2 className="text-sm font-semibold">Recent activity</h2>
                <p className="text-[11px] text-muted-foreground">Paged history</p>
              </div>
            </div>
            <div className="max-h-[min(70vh,480px)] overflow-y-auto p-3">
              {loadingHistory ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/60" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No adjustments yet.</p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {history.map((row) => (
                      <HistoryItem key={row._id} row={row} />
                    ))}
                  </ul>
                  <DataPagination pagination={historyPagination} onPageChange={setHistoryPage} />
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/50 bg-muted/15 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function HistoryItem({ row }: { row: AdjustmentRow }) {
  const up = row.delta > 0;
  const name = row.productId?.name ?? "Product";
  const sku = row.productId?.sku ?? "";
  const when = new Date(row.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="rounded-lg border border-border/60 bg-white px-3 py-2.5 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{sku}</p>
        </div>
        <Badge
          className={cn(
            "shrink-0 rounded-full font-bold tabular-nums",
            up ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-red-100 text-red-800 hover:bg-red-100",
          )}
        >
          {up ? <ArrowUpRight className="mr-0.5 size-3" /> : <ArrowDownRight className="mr-0.5 size-3" />}
          {up ? "+" : ""}
          {row.delta}
        </Badge>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {reasonLabel(row.reason)} · {when}
        {row.performedBy?.name ? ` · ${row.performedBy.name}` : ""}
      </p>
    </li>
  );
}
