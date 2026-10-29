"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Package,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateLineTotal, calculateSaleTotals, type DiscountType } from "@/lib/money/calculate-sale";
import type { PaginationMeta } from "@/lib/api/pagination";
import { DataPagination } from "@/components/ui/data-pagination";
import { formatLkr, parseLkrInput } from "@/lib/money/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Category = { _id: string; name: string; slug: string };
type Product = {
  _id: string;
  name: string;
  sku: string;
  priceCents: number;
  quantity: number;
  categoryId: { _id: string; name: string } | string;
};

type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  lineDiscount?: { type: DiscountType; value: number };
};

export function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState(urlQuery);
  const [trackedQuery, setTrackedQuery] = useState(urlQuery);
  if (trackedQuery !== urlQuery) {
    setTrackedQuery(urlQuery);
    setDraftQ(urlQuery);
    setPage(1);
  }
  const q = draftQ;
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartDiscount, setCartDiscount] = useState<{ type: DiscountType; value: string } | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  const [tendered, setTendered] = useState("");
  const [loading, setLoading] = useState(false);
  const [productsReady, setProductsReady] = useState(false);

  const loadProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    params.set("page", String(page));
    params.set("limit", "12");
    const res = await fetch(`/api/products?${params}`);
    const json = await res.json();
    setProducts(json.data ?? []);
    setPagination(json.pagination ?? null);
    setProductsReady(true);
  }, [q, categoryId, page]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((j) => setCategories(j.data ?? []));
  }, []);

  useEffect(() => {
    const t = setTimeout(loadProducts, 200);
    return () => clearTimeout(t);
  }, [loadProducts]);

  const totals = useMemo(() => {
    const cartDisc = cartDiscount
      ? {
          type: cartDiscount.type,
          value:
            cartDiscount.type === "flat"
              ? parseLkrInput(cartDiscount.value)
              : Number(cartDiscount.value),
        }
      : undefined;
    return calculateSaleTotals(
      cart.map((c) => ({
        unitPriceCents: c.unitPriceCents,
        quantity: c.quantity,
        lineDiscount: c.lineDiscount,
      })),
      cartDisc,
    );
  }, [cart, cartDiscount]);

  const changeCents =
    paymentMethod === "cash" && tendered
      ? Math.max(0, parseLkrInput(tendered) - totals.totalCents)
      : 0;

  const cartCount = cart.reduce((n, l) => n + l.quantity, 0);

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p._id);
      if (existing) {
        return prev.map((l) =>
          l.productId === p._id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: p._id,
          name: p.name,
          sku: p.sku,
          unitPriceCents: p.priceCents,
          quantity: 1,
        },
      ];
    });
  }

  async function completeSale() {
    if (cart.length === 0) return;
    setLoading(true);
    const cartDisc = cartDiscount
      ? {
          type: cartDiscount.type,
          value:
            cartDiscount.type === "flat"
              ? parseLkrInput(cartDiscount.value)
              : Number(cartDiscount.value),
          amountCents: totals.cartDiscountCents,
        }
      : undefined;

    const payments = [
      {
        method: paymentMethod,
        amountCents: totals.totalCents,
        ...(paymentMethod === "cash"
          ? {
              tenderedCents: parseLkrInput(tendered || String(totals.totalCents / 100)),
              changeCents,
            }
          : {}),
      },
    ];

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineItems: cart,
        cartDiscount: cartDisc,
        payments,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Sale failed");
      return;
    }
    toast.success(`Sale completed — ${json.data.invoiceNumber}`);
    router.push(`/sales/${json.data._id}`);
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={instant ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Counter</p>
          <h1 className="text-4xl md:text-5xl">Checkout</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tap a piece to add it. The ticket stays on the right.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-2xl border border-border bg-white px-4 py-2 text-sm">
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </span>
          <span className="font-display metric rounded-2xl bg-[#141218] px-4 py-2 text-lg text-[#f6f1ea]">
            {formatLkr(totals.totalCents)}
          </span>
        </div>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="min-h-12 rounded-2xl border-border bg-white pl-11 shadow-[var(--shadow-surface)]"
              placeholder="Search name or SKU…"
              value={q}
              onChange={(e) => {
                setDraftQ(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryPill
              active={categoryId === null}
              onClick={() => {
                setCategoryId(null);
                setPage(1);
              }}
              label="All"
            />
            {categories.map((c) => (
              <CategoryPill
                key={c._id}
                active={categoryId === c._id}
                onClick={() => {
                  setCategoryId(c._id);
                  setPage(1);
                }}
                label={c.name}
              />
            ))}
          </div>

          <motion.div
            key={categoryId ?? "all"}
            initial={instant ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {products.length === 0 ? (
              <p className="col-span-full rounded-2xl border border-dashed border-border bg-surface-muted px-4 py-10 text-center text-sm text-muted-foreground">
                {productsReady ? "No products match your search." : "Loading products…"}
              </p>
            ) : (
              products.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  index={i}
                  instant={instant}
                  inCart={cart.some((l) => l.productId === p._id)}
                  onAdd={() => addToCart(p)}
                />
              ))
            )}
          </motion.div>
          {pagination && pagination.total > pagination.limit && (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
              <DataPagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>

        <motion.aside
          initial={instant ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="pos-ink sticky top-24 overflow-hidden">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#f6f1ea] text-[#141218]">
                  <ShoppingBag className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-2xl text-[#f6f1ea]">Ticket</h2>
                  <p className="text-xs text-white/50">
                    {cart.length === 0 ? "Add products to start" : `${cart.length} line items`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center">
                  <Package className="mx-auto mb-2 size-8 text-white/40" aria-hidden />
                  <p className="text-sm text-white/55">Your cart is empty.</p>
                </div>
              ) : (
                <ul className="max-h-[min(40vh,320px)] space-y-3 overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {cart.map((line) => (
                      <CartLineItem
                        key={line.productId}
                        line={line}
                        onRemove={() =>
                          setCart((c) => c.filter((l) => l.productId !== line.productId))
                        }
                        onDecrement={() =>
                          setCart((c) =>
                            c.map((l) =>
                              l.productId === line.productId && l.quantity > 1
                                ? { ...l, quantity: l.quantity - 1 }
                                : l,
                            ),
                          )
                        }
                        onIncrement={() =>
                          setCart((c) =>
                            c.map((l) =>
                              l.productId === line.productId
                                ? { ...l, quantity: l.quantity + 1 }
                                : l,
                            ),
                          )
                        }
                        onDiscount={(lineDiscount) =>
                          setCart((c) =>
                            c.map((l) =>
                              l.productId === line.productId ? { ...l, lineDiscount } : l,
                            ),
                          )
                        }
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}

              <div className="space-y-2 rounded-2xl bg-white/6 p-4 text-sm">
                <div className="flex justify-between text-white/55">
                  <span>Subtotal</span>
                  <span>{formatLkr(totals.subtotalCents)}</span>
                </div>
                {totals.discountTotalCents > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Discount</span>
                    <span>-{formatLkr(totals.discountTotalCents)}</span>
                  </div>
                )}
                <div
                  className="flex items-end justify-between border-t border-white/10 pt-3"
                  aria-live="polite"
                >
                  <span className="text-sm text-white/55">Total</span>
                  <span className="font-display metric text-4xl text-[#f6f1ea]">{formatLkr(totals.totalCents)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={cartDiscount?.type ?? "none"}
                  onValueChange={(v) =>
                    setCartDiscount(v === "none" ? null : { type: v as DiscountType, value: "0" })
                  }
                >
                  <SelectTrigger className="min-h-10 rounded-xl border-white/15 bg-white/8 text-[#f6f1ea]">
                    <SelectValue placeholder="Cart discount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No cart discount</SelectItem>
                    <SelectItem value="flat">Flat LKR</SelectItem>
                    <SelectItem value="percent">Percent %</SelectItem>
                  </SelectContent>
                </Select>
                {cartDiscount && (
                  <Input
                    className="rounded-xl border-white/15 bg-white/8 text-[#f6f1ea]"
                    placeholder={cartDiscount.type === "flat" ? "LKR" : "%"}
                    value={cartDiscount.value}
                    onChange={(e) => setCartDiscount({ ...cartDiscount, value: e.target.value })}
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Payment method">
                {(
                  [
                    ["cash", "Cash"],
                    ["card", "Card"],
                    ["bank_transfer", "Bank"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={paymentMethod === value}
                    onClick={() => setPaymentMethod(value)}
                    className={cn(
                      "h-11 rounded-xl border text-sm font-medium transition",
                      paymentMethod === value
                        ? "border-[#f6f1ea] bg-[#f6f1ea] text-[#141218]"
                        : "border-white/15 bg-transparent text-white/60 hover:text-white",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-1">
                  <Input
                    placeholder="Amount tendered (LKR)"
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value)}
                    className="min-h-11 rounded-xl border-white/15 bg-white/8 text-[#f6f1ea] placeholder:text-white/40"
                  />
                  <p className="text-sm text-white/55" aria-live="polite">
                    Change: <strong className="text-[#f6f1ea]">{formatLkr(changeCents)}</strong>
                  </p>
                </div>
              )}

              <Button
                className="h-12 w-full rounded-xl bg-[#f6f1ea] text-base font-semibold text-[#141218] hover:bg-white"
                disabled={cart.length === 0 || loading}
                onClick={completeSale}
              >
                <CreditCard className="mr-2 size-4" aria-hidden />
                {loading ? "Processing…" : "Complete sale"}
              </Button>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "text-primary-foreground" : "bg-white/80 text-muted-foreground hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="checkout-category-pill"
          className="absolute inset-0 rounded-full bg-primary shadow-md"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function ProductCard({
  product,
  index,
  instant,
  inCart,
  onAdd,
}: {
  product: Product;
  index: number;
  instant: boolean;
  inCart: boolean;
  onAdd: () => void;
}) {
  const low = product.quantity < 5;
  return (
    <motion.button
      type="button"
      onClick={onAdd}
      initial={instant ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: instant ? 0 : Math.min(index * 0.04, 0.35), duration: 0.35 }}
      whileHover={instant ? undefined : { y: -4, scale: 1.01 }}
      whileTap={instant ? undefined : { scale: 0.98 }}
        className={cn(
          "group relative rounded-2xl border bg-card p-4 text-left shadow-[var(--shadow-surface)] transition-colors",
          inCart ? "border-[#141218]" : "border-border hover:border-[#141218]/30",
          low && "bg-[#fff6ea]",
        )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{product.sku}</p>
      <p className="mt-2 font-medium leading-snug tracking-tight">{product.name}</p>
      {typeof product.categoryId === "object" && (
        <p className="mt-0.5 text-xs text-muted-foreground">{product.categoryId.name}</p>
      )}
      <div className="mt-4 flex items-end justify-between gap-2">
        <span className="font-display text-xl text-foreground">{formatLkr(product.priceCents)}</span>
        <Badge
          variant={low ? "destructive" : "secondary"}
          className={cn("rounded-full", !low && "bg-muted text-muted-foreground")}
        >
          {product.quantity} in stock
        </Badge>
      </div>
      {inCart && (
        <span className="absolute right-3 top-3 size-2 rounded-full bg-brand" />
      )}
    </motion.button>
  );
}

function CartLineItem({
  line,
  onRemove,
  onDecrement,
  onIncrement,
  onDiscount,
}: {
  line: CartLine;
  onRemove: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  onDiscount: (discount?: { type: DiscountType; value: number }) => void;
}) {
  const lineTotal = calculateLineTotal({
    unitPriceCents: line.unitPriceCents,
    quantity: line.quantity,
    lineDiscount: line.lineDiscount,
  });
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-2xl border border-border/60 bg-white p-3 shadow-sm"
    >
      <div className="flex justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{line.name}</p>
          <p className="text-xs text-muted-foreground">{line.sku}</p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 rounded-xl" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="size-9 rounded-xl"
          onClick={onDecrement}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center font-semibold">{line.quantity}</span>
        <Button
          size="icon"
          variant="outline"
          className="size-9 rounded-xl"
          onClick={onIncrement}
        >
          <Plus className="size-4" />
        </Button>
        <span className="ml-auto text-sm font-bold">{formatLkr(lineTotal)}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Select
          value={line.lineDiscount?.type ?? "none"}
          onValueChange={(v) => {
            if (!v || v === "none") onDiscount(undefined);
            else onDiscount({ type: v as DiscountType, value: line.lineDiscount?.value ?? 0 });
          }}
        >
          <SelectTrigger className="h-8 rounded-lg bg-white text-xs">
            <SelectValue placeholder="Line discount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No line discount</SelectItem>
            <SelectItem value="flat">Flat LKR</SelectItem>
            <SelectItem value="percent">Percent %</SelectItem>
          </SelectContent>
        </Select>
        {line.lineDiscount && (
          <Input
            className="h-8 rounded-lg bg-white text-xs"
            placeholder={line.lineDiscount.type === "flat" ? "LKR" : "%"}
            value={
              line.lineDiscount.type === "flat"
                ? line.lineDiscount.value
                  ? String(line.lineDiscount.value / 100)
                  : ""
                : line.lineDiscount.value
                  ? String(line.lineDiscount.value)
                  : ""
            }
            onChange={(e) => {
              const raw = e.target.value;
              const value =
                line.lineDiscount?.type === "flat" ? parseLkrInput(raw) : Number(raw || 0);
              onDiscount({ type: line.lineDiscount!.type, value });
            }}
          />
        )}
      </div>
    </motion.li>
  );
}
