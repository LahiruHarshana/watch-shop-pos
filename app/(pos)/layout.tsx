import { Suspense } from "react";
import { PosShell } from "@/components/pos/pos-shell";

export const instant = false;

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <PosShell>{children}</PosShell>
    </Suspense>
  );
}
