"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatLkr } from "@/lib/money/format";
import { SHOP_NAME } from "@/lib/settings/shop-profile";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Sale = {
  _id: string;
  invoiceNumber: string;
  createdAt: string;
  status?: string;
  voidReason?: string;
  lineItems: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    lineDiscount?: { type: string; value: number; amountCents: number };
  }>;
  subtotalCents: number;
  discountTotalCents: number;
  totalCents: number;
  payments: Array<{
    method: string;
    amountCents: number;
    tenderedCents?: number;
    changeCents?: number;
  }>;
  discountAppliedBy?: { name?: string } | null;
};

type Settings = {
  shopName?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  receiptThankYouNote?: string;
  receiptPaperWidth?: "58mm" | "80mm";
};

export function ReceiptView({ sale, settings }: { sale: Sale; settings: Settings }) {
  const width = settings.receiptPaperWidth ?? "80mm";
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  function printReceipt() {
    window.print();
  }

  async function shareReceipt() {
    const pdfUrl = `${window.location.origin}/api/sales/${sale._id}/pdf`;
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("pdf");
      const file = new File([await response.blob()], `${sale.invoiceNumber}.pdf`, {
        type: "application/pdf",
      });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: sale.invoiceNumber, files: [file] });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Receipt link copied. Use Download PDF if sharing files is unavailable.");
    } catch {
      toast.message("Use Download PDF to share this receipt.");
    }
  }

  async function voidSale() {
    if (!voidReason.trim()) {
      toast.error("Enter a reason to void this invoice");
      return;
    }
    setVoiding(true);
    const res = await fetch(`/api/sales/${sale._id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voidReason: voidReason.trim() }),
    });
    const json = await res.json();
    setVoiding(false);
    if (!res.ok) {
      toast.error(json.error?.message ?? "Void failed");
      return;
    }
    toast.success("Invoice voided and stock restored");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button onClick={printReceipt}>Print receipt</Button>
        <Button variant="outline" onClick={shareReceipt}>Share</Button>
        <a href={`/api/sales/${sale._id}/pdf`} className={cn(buttonVariants({ variant: "outline" }))}>
          Download PDF
        </a>
      </div>
      <p className="max-w-xl text-xs text-muted-foreground print:hidden">
        Choose the shop paper width in Settings (58mm or 80mm), then use the browser print dialog.
        Set margins to None and turn off headers and footers. Cancelling the dialog leaves this page unchanged.
      </p>
      {isAdmin && sale.status !== "voided" && (
        <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 print:hidden">
          <p className="text-sm font-medium">Void invoice</p>
          <p className="text-xs text-muted-foreground">Restores stock. Cashiers cannot void.</p>
          <Input
            placeholder="Reason"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
          <Button variant="destructive" disabled={voiding} onClick={voidSale}>
            {voiding ? "Voiding…" : "Void sale"}
          </Button>
        </div>
      )}
      <article
        id="receipt"
        className="receipt mx-auto overflow-hidden bg-white p-3 text-[11px] leading-snug text-black print:shadow-none"
        style={{ maxWidth: width }}
      >
        {settings.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="" className="mx-auto mb-2 h-12 object-contain" />
        )}
        <h2 className="text-center text-sm font-bold">{settings.shopName ?? SHOP_NAME}</h2>
        <p className="text-center text-xs">{settings.address}</p>
        <p className="text-center text-xs">{settings.phone}</p>
        <hr className="my-2 border-dashed border-black/30" />
        <p className="text-xs">Invoice: {sale.invoiceNumber}</p>
        <p className="text-xs">{new Date(sale.createdAt).toLocaleString()}</p>
        {sale.status === "voided" && (
          <p className="mt-1 text-center text-xs font-bold">VOIDED{sale.voidReason ? ` — ${sale.voidReason}` : ""}</p>
        )}
        <hr className="my-2 border-dashed border-black/30" />
        <ul className="space-y-1 text-xs">
          {sale.lineItems.map((line, i) => (
            <li key={i}>
              <div className="flex justify-between gap-2">
                <span className="min-w-0 break-words">{line.name} ×{line.quantity}</span>
                <span className="shrink-0">{formatLkr(line.lineTotalCents)}</span>
              </div>
              <p className="text-[10px] text-black/60">
                {line.sku} · {formatLkr(line.unitPriceCents)} each
              </p>
              {line.lineDiscount && (
                <p className="text-[10px]">
                  Line discount{" "}
                  {line.lineDiscount.type === "percent"
                    ? `${line.lineDiscount.value}%`
                    : formatLkr(line.lineDiscount.amountCents)}
                </p>
              )}
            </li>
          ))}
        </ul>
        <hr className="my-2 border-dashed border-black/30" />
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatLkr(sale.subtotalCents)}</span>
          </div>
          {sale.discountTotalCents > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatLkr(sale.discountTotalCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatLkr(sale.totalCents)}</span>
          </div>
          {sale.payments[0] && (
            <>
              <div className="flex justify-between">
                <span>Payment</span>
                <span className="capitalize">{sale.payments[0].method.replace("_", " ")}</span>
              </div>
              {sale.payments[0].tenderedCents != null && (
                <div className="flex justify-between">
                  <span>Tendered</span>
                  <span>{formatLkr(sale.payments[0].tenderedCents)}</span>
                </div>
              )}
            </>
          )}
          {sale.payments[0]?.method === "cash" && sale.payments[0].changeCents != null && (
            <div className="flex justify-between">
              <span>Change</span>
              <span>{formatLkr(sale.payments[0].changeCents)}</span>
            </div>
          )}
        </div>
        {sale.discountAppliedBy?.name && (
          <p className="mt-2 text-center text-[10px]">Discount applied by {sale.discountAppliedBy.name}</p>
        )}
        <p className="mt-4 text-center text-xs">{settings.receiptThankYouNote}</p>
      </article>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt,
          #receipt * {
            visibility: visible;
          }
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: ${width};
            max-width: ${width};
          }
          @page { margin: 4mm; size: ${width} auto; }
        }
      `}</style>
    </div>
  );
}
