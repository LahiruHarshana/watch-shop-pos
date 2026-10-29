"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Package } from "lucide-react";
import { formatLkr, parseLkrInput } from "@/lib/money/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductForm, type ProductFormValues } from "@/components/pos/product-form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type Category = { _id: string; name: string };
type Product = {
  _id: string;
  name: string;
  sku: string;
  priceCents: number;
  quantity: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  attributes?: { brand?: string; batterySize?: string };
  categoryId: { _id: string; name: string; slug?: string } | string;
};

function categoryLabel(p: Product) {
  if (typeof p.categoryId === "object" && p.categoryId?.name) return p.categoryId.name;
  return "—";
}

function categoryIdValue(p: Product) {
  if (typeof p.categoryId === "object" && p.categoryId?._id) return String(p.categoryId._id);
  return typeof p.categoryId === "string" ? p.categoryId : "";
}

export function ProductDetailClient({
  product: initial,
  startEditing = false,
}: {
  product: Product;
  startEditing?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [product, setProduct] = useState(initial);
  const [editingOverride, setEditingOverride] = useState<boolean | null>(null);
  const editing = editingOverride ?? Boolean(startEditing && isAdmin);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormValues>({
    name: initial.name,
    sku: initial.sku,
    categoryId: categoryIdValue(initial),
    price: String(initial.priceCents / 100),
    quantity: String(initial.quantity),
    lowStockThreshold: String(initial.lowStockThreshold ?? 10),
    brand: initial.attributes?.brand ?? "",
    batterySize: initial.attributes?.batterySize ?? "",
    isActive: initial.isActive !== false,
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((j) => setCategories(j.data ?? []));
  }, []);

  const low =
    product.quantity <= (product.lowStockThreshold ?? 10);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/products/${product._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId,
        priceCents: parseLkrInput(form.price),
        lowStockThreshold: Number(form.lowStockThreshold),
        isActive: form.isActive,
        attributes: {
          brand: form.brand.trim() || undefined,
          batterySize: form.batterySize.trim() || undefined,
        },
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Save failed");
      return;
    }
    setProduct(json.data);
    setEditingOverride(false);
    toast.success("Product updated");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/inventory/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to inventory
        </Link>
        {isAdmin && !editing && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditingOverride(true)}
            >
              <Pencil className="mr-1.5 size-4" aria-hidden />
              Edit product
            </Button>
            {product.isActive !== false && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-destructive"
                onClick={async () => {
                  if (!window.confirm("Remove this product from the catalog? Past sales stay intact.")) return;
                  const res = await fetch(`/api/products/${product._id}`, { method: "DELETE" });
                  const json = await res.json();
                  if (!res.ok) {
                    toast.error(json.error?.message ?? "Could not remove product");
                    return;
                  }
                  toast.success("Product removed from catalog");
                  router.push("/inventory/products");
                }}
              >
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
            <h1 className="text-lg font-bold">Edit product</h1>
            <p className="text-xs text-muted-foreground">Update catalog details below.</p>
          </div>
          <div className="p-5">
            <ProductForm
              categories={categories}
              values={form}
              onChange={setForm}
              onSubmit={save}
              submitLabel={saving ? "Saving…" : "Save changes"}
              disabled={saving}
              lockQuantity
              onCancel={() => setEditingOverride(false)}
            />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="border-b border-border/60 px-4 py-4 sm:px-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Package className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{product.name}</h1>
                <p className="mt-0.5 font-mono text-sm text-muted-foreground">{product.sku}</p>
              </div>
              <Badge
                variant={low ? "destructive" : "secondary"}
                className={cn("rounded-full", !low && "bg-muted")}
              >
                {product.quantity} in stock
              </Badge>
            </div>
          </div>
          <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2 sm:p-5">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</dt>
              <dd className="mt-1 font-medium">{categoryLabel(product)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price</dt>
              <dd className="mt-1 text-lg font-bold text-primary">{formatLkr(product.priceCents)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Low stock at</dt>
              <dd className="mt-1 font-medium">{product.lowStockThreshold ?? 10} units</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium">{product.isActive !== false ? "Active" : "Inactive"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Brand</dt>
              <dd className="mt-1 font-medium">{product.attributes?.brand || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Battery size</dt>
              <dd className="mt-1 font-medium">{product.attributes?.batterySize || "—"}</dd>
            </div>
          </dl>
          <div className="border-t border-border/60 bg-muted/30 px-4 py-3 sm:px-5">
            <p className="text-xs text-muted-foreground">
              To change stock from purchases or write-offs, use{" "}
              <Link href="/inventory/adjustments" className="font-medium text-primary hover:underline">
                Stock adjustments
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
