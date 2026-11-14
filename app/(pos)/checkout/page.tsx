import { CheckoutClient } from "@/components/pos/checkout-client";
import { Suspense } from "react";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading checkout…</p>}>
      <CheckoutClient />
    </Suspense>
  );
}
