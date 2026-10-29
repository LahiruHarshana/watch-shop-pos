"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Eye, Pencil, Plus } from "lucide-react";
import { formatLkr, parseLkrInput } from "@/lib/money/format";
import type { PaginationMeta } from "@/lib/api/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataPagination } from "@/components/ui/data-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { InventoryFilters, type InventoryFilterState } from "@/components/pos/inventory-filters";

type Category = { _id: string; name: string; slug: string };
type Product = {
  _id: string;
  name: string;
  sku: string;
  priceCents: number;
  quantity: number;
  lowStockThreshold?: number;
  categoryId: { name: string; slug?: string } | string;
};
type Summary = { totalProducts: number; totalUnits: number; lowStockCount: number };

function categoryName(p: Product) {
  if (typeof p.categoryId === "object" && p.categoryId?.name) return p.categoryId.name;
  return "—";
}

function isLowStock(p: Product) {
  return p.quantity <= (p.lowStockThreshold ?? 10);
}

function readFilters(sp: URLSearchParams): InventoryFilterState & { page: number; limit: number } {
  const priceMin = sp.get("priceMin");
  const priceMax = sp.get("priceMax");
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    stock: sp.get("stock") ?? "all",
    brand: sp.get("brand") ?? "",
    priceMinLkr: priceMin ? String(Number(priceMin) / 100) : "",
    priceMaxLkr: priceMax ? String(Number(priceMax) / 100) : "",
    trackInventory: sp.get("trackInventory") ?? "",
    includeInactive: sp.get("includeInactive") === "true",
    sort: sp.get("sort") ?? "name_asc",
    page: Math.max(1, Number(sp.get("page") ?? 1) || 1),
    limit: Math.max(1, Number(sp.get("limit") ?? 20) || 20),
  };
}

export function ProductsAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const filters = readFilters(new URLSearchParams(searchParams.toString()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(
    Boolean(filters.stock !== "all" || filters.brand || filters.priceMinLkr || filters.priceMaxLkr || filters.trackInventory || filters.includeInactive),
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []));
    fetch("/api/products/facets")
      .then((r) => r.json())
      .then((j) => setBrands(j.data?.brands ?? []));
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.get("limit")) params.set("limit", "20");
      setLoading(true);
      fetch(`/api/products?${params}`)
        .then((r) => r.json())
        .then((json) => {
          setProducts(json.data ?? []);
          setPagination(json.pagination ?? null);
          setSummary(json.summary ?? null);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [searchParams]);

  function write(next: InventoryFilterState & { page: number; limit: number }, resetPage: boolean) {
    const params = new URLSearchParams();
    if (next.q.trim()) params.set("q", next.q.trim());
    if (next.category) params.set("category", next.category);
    if (next.stock && next.stock !== "all") params.set("stock", next.stock);
    if (next.brand) params.set("brand", next.brand);
    if (next.priceMinLkr.trim()) params.set("priceMin", String(parseLkrInput(next.priceMinLkr)));
    if (next.priceMaxLkr.trim()) params.set("priceMax", String(parseLkrInput(next.priceMaxLkr)));
    if (next.trackInventory) params.set("trackInventory", next.trackInventory);
    if (next.includeInactive) params.set("includeInactive", "true");
    if (next.sort && next.sort !== "name_asc") params.set("sort", next.sort);
    const page = resetPage ? 1 : next.page;
    if (page > 1) params.set("page", String(page));
    if (next.limit !== 20) params.set("limit", String(next.limit));
    const qs = params.toString();
    router.replace(qs ? `/inventory/products?${qs}` : "/inventory/products");
  }

  function patchFilters(patch: Partial<InventoryFilterState>) {
    write({ ...filters, ...patch }, true);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            View products, open a row to see details, or edit as admin.
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/inventory/products/new"
            className={cn(buttonVariants(), "inline-flex min-h-10 rounded-xl")}
          >
            <Plus className="mr-1.5 size-4" aria-hidden />
            Add product
          </Link>
        )}
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-xl bg-muted px-3 py-1.5">
          <strong>{summary?.totalProducts ?? 0}</strong> products
        </span>
        <span className="rounded-xl bg-muted px-3 py-1.5">
          <strong>{summary?.totalUnits ?? 0}</strong> units
        </span>
        {(summary?.lowStockCount ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => patchFilters({ stock: filters.stock === "low" ? "all" : "low" })}
            className="rounded-xl bg-amber-500/15 px-3 py-1.5 text-amber-900"
          >
            <strong>{summary?.lowStockCount}</strong> low stock
          </button>
        )}
      </div>

      <InventoryFilters
        value={filters}
        categories={categories}
        brands={brands}
        isAdmin={isAdmin}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        onChange={patchFilters}
        onClear={() =>
          write(
            {
              q: "",
              category: "",
              stock: "all",
              brand: "",
              priceMinLkr: "",
              priceMaxLkr: "",
              trackInventory: "",
              includeInactive: false,
              sort: "name_asc",
              page: 1,
              limit: filters.limit,
            },
            true,
          )
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">SKU</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No products match your filters.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const low = isLowStock(p);
                return (
                  <TableRow key={p._id} className="group">
                    <TableCell>
                      <Link
                        href={`/inventory/products/${p._id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                      {p.sku}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {categoryName(p)}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatLkr(p.priceCents)}</TableCell>
                    <TableCell className="text-right">
                      {low ? (
                        <Badge variant="destructive" className="gap-1 rounded-full">
                          <AlertTriangle className="size-3" aria-hidden />
                          {p.quantity}
                        </Badge>
                      ) : (
                        <span>{p.quantity}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/inventory/products/${p._id}`}
                          title="View"
                          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
                        >
                          <Eye className="size-4" />
                        </Link>
                        {isAdmin && (
                          <Link
                            href={`/inventory/products/${p._id}?edit=1`}
                            title="Edit"
                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8")}
                          >
                            <Pencil className="size-4" />
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <DataPagination
          pagination={pagination}
          disabled={loading}
          onPageChange={(page) => write({ ...filters, page }, false)}
          onLimitChange={(limit) => write({ ...filters, limit, page: 1 }, true)}
        />
      </div>
    </div>
  );
}
