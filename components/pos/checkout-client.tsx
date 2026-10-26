"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const reduceMotion = useReducedMotion();
  const instant = reduceMotion === true;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartDiscount, setCartDiscount] = useState<{ type: DiscountType; value: string } | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer">("cash");
  const [tendered, setTendered] = useState("");
  const [loading, setLoading] = useState(false);

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
        className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/75 px-5 py-4 shadow-[0_16px_40px_rgb(120_140_180/0.1)] backdrop-blur-md dashboard-mesh md:flex md:items-center md:justify-between md:gap-4"
      >
        <div>
          <p className="mb-1 text-xs font-medium text-primary">Counter sale</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Checkout</h1>
          <p className="text-sm text-muted-foreground">Tap products to add — pay when ready.</p>
        </div>
        <div className="mt-3 flex items-center gap-2 md:mt-0">
          <span className="rounded-2xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </span>
          <span className="rounded-2xl bg-muted px-4 py-2 text-sm font-bold">
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
              className="min-h-12 rounded-2xl border-border/60 bg-white/90 pl-11 shadow-[0_8px_24px_rgb(120_140_180/0.08)] backdrop-blur-sm"
              placeholder="Search name or SKU…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
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
              <p className="col-span-full rounded-2xl border border-dashed border-border bg-white/50 px-4 py-10 text-center text-sm text-muted-foreground">
                No products match your search.
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
          <div className="sticky top-28 overflow-hidden rounded-[1.5rem] border border-border/80 bg-card shadow-[0_20px_50px_rgb(120_140_180/0.14)]">
            <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                  <ShoppingBag className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Cart</h2>
                  <p className="text-xs text-muted-foreground">
                    {cart.length === 0 ? "Add products to start" : `${cart.length} line items`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center">
                  <Package className="mx-auto mb-2 size-8 text-muted-foreground/60" aria-hidden />
                  <p className="text-sm text-muted-foreground">Your cart is empty.</p>
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

              <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatLkr(totals.subtotalCents)}</span>
                </div>
                {totals.discountTotalCents > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{formatLkr(totals.discountTotalCents)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between border-t border-border/60 pt-2 text-xl font-bold"
                  aria-live="polite"
                >
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                    {formatLkr(totals.totalCents)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={cartDiscount?.type ?? "none"}
                  onValueChange={(v) =>
                    setCartDiscount(v === "none" ? null : { type: v as DiscountType, value: "0" })
                  }
                >
                  <SelectTrigger className="min-h-10 rounded-xl bg-white">
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
                    className="rounded-xl bg-white"
                    placeholder={cartDiscount.type === "flat" ? "LKR" : "%"}
                    value={cartDiscount.value}
                    onChange={(e) => setCartDiscount({ ...cartDiscount, value: e.target.value })}
                  />
                )}
              </div>

              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
              >
                <SelectTrigger className="min-h-11 rounded-xl bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit / Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>

              {paymentMethod === "cash" && (
                <div className="space-y-1">
                  <Input
                    placeholder="Amount tendered (LKR)"
                    value={tendered}
                    onChange={(e) => setTendered(e.target.value)}
                    className="min-h-11 rounded-xl bg-white"
                  />
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    Change: <strong className="text-foreground">{formatLkr(changeCents)}</strong>
                  </p>
                </div>
              )}

              <Button
                className="w-full min-h-12 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-base font-semibold shadow-[0_12px_28px_rgb(91_92_246/0.35)] hover:brightness-110"
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
        "group relative overflow-hidden rounded-[1.25rem] border bg-card p-4 text-left shadow-[0_8px_24px_rgb(120_140_180/0.08)] transition-shadow hover:shadow-[0_16px_36px_rgb(120_140_180/0.14)]",
        inCart ? "border-primary/40 ring-2 ring-primary/15" : "border-border/70",
      )}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
        <Package className="size-5" aria-hidden />
      </div>
      <p className="font-semibold leading-snug tracking-tight">{product.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{product.sku}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-base font-bold text-foreground">{formatLkr(product.priceCents)}</span>
        <Badge
          variant={low ? "destructive" : "secondary"}
          className={cn("rounded-full", !low && "bg-muted text-muted-foreground")}
        >
          {product.quantity} in stock
        </Badge>
      </div>
      {inCart && (
        <span className="absolute right-3 top-3 size-2.5 rounded-full bg-primary shadow-[0_0_8px_rgb(91_92_246/0.8)]" />
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
