"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PackagePlus } from "lucide-react";
import { formatLkr, parseLkrInput } from "@/lib/money/format";
import { priceInputError } from "@/lib/products/price";
import { ProductForm, type ProductFormValues } from "@/components/pos/product-form";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type Category = { _id: string; name: string };

export function ProductNewClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormValues>({
    name: "",
    sku: "",
    categoryId: "",
    price: "",
    quantity: "0",
    lowStockThreshold: "10",
    brand: "",
    batterySize: "",
    isActive: true,
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((j) => setCategories(j.data ?? []));
  }, []);

  const previewPrice = useMemo(() => {
    if (!form.price.trim()) return "—";
    try {
      return formatLkr(parseLkrInput(form.price));
    } catch {
      return "—";
    }
  }, [form.price]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const invalidPrice = priceInputError(form.price);
    if (invalidPrice) {
      setPriceError(invalidPrice);
      toast.error(invalidPrice);
      return;
    }
    setPriceError(null);
    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId,
        priceCents: parseLkrInput(form.price),
        quantity: Number(form.quantity),
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
      toast.error(json.error?.message ?? "Failed to create product");
      return;
    }
    toast.success("Product created");
    router.push(`/inventory/products/${json.data._id}`);
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Only admins can add products.{" "}
        <Link href="/inventory/products" className="font-medium text-primary hover:underline">
          Back to inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <Link
        href="/inventory/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to inventory
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_12px_32px_rgb(120_140_180/0.1)]">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/8 to-violet-500/5 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <PackagePlus className="size-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Add product</h1>
              <p className="text-sm text-muted-foreground">
                New catalog item — you can edit details anytime from inventory.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_200px]">
          <div className="p-5 sm:p-6">
            <ProductForm
              categories={categories}
              values={form}
              priceError={priceError}
              onChange={(next) => {
                setForm(next);
                if (priceError && next.price !== form.price) setPriceError(priceInputError(next.price));
              }}
              onSubmit={submit}
              submitLabel={saving ? "Creating…" : "Create product"}
              disabled={saving}
              onCancel={() => router.push("/inventory/products")}
            />
          </div>

          <aside className="border-t border-border/60 bg-muted/25 p-5 lg:border-l lg:border-t-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <div className="rounded-xl border border-border/60 bg-white p-4 text-sm shadow-sm">
              <p className="font-semibold leading-snug">
                {form.name.trim() || "Product name"}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {(form.sku || "SKU").toUpperCase()}
              </p>
              <p className="mt-3 text-lg font-bold text-primary">{previewPrice}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Stock: <strong>{form.quantity || "0"}</strong> units
              </p>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              After saving, use <strong>Stock adjustments</strong> for restocks and write-offs.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
