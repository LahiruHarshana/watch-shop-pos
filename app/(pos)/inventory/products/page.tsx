import { Suspense } from "react";
import { ProductsAdmin } from "@/components/pos/products-admin";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading inventory…</p>
      }
    >
      <ProductsAdmin />
    </Suspense>
  );
}
