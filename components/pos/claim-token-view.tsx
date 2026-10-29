"use client";

import { formatLkr } from "@/lib/money/format";
import { Button } from "@/components/ui/button";

export function ClaimTokenView({
  ticket,
  settings,
}: {
  ticket: {
    ticketId: string;
    customerName: string;
    customerPhone?: string;
    watchBrand: string;
    watchModel: string;
    issueDescription?: string;
    estimatedCostCents: number;
    createdAt?: string;
  };
  settings: {
    shopName?: string;
    address?: string;
    phone?: string;
    repairTermsAndConditions?: string;
    receiptPaperWidth?: "58mm" | "80mm";
  };
}) {
  const width = settings.receiptPaperWidth ?? "80mm";

  return (
    <div className="space-y-4">
      <Button className="print:hidden" onClick={() => window.print()}>Reprint claim token</Button>
      <p className="max-w-xl text-xs text-muted-foreground print:hidden">
        Print from the browser dialog at {width}. Use no margins and no headers. Cancelling print does nothing else.
      </p>
      <article
        id="claim-token"
        className="mx-auto overflow-hidden bg-white p-3 text-[11px] leading-snug text-black"
        style={{ maxWidth: width }}
      >
        <h2 className="break-words text-center text-sm font-bold">{settings.shopName ?? "Watch Shop"}</h2>
        {settings.address && <p className="break-words text-center text-[10px]">{settings.address}</p>}
        {settings.phone && <p className="text-center text-[10px]">{settings.phone}</p>}
        <h3 className="mt-3 text-center text-xs font-semibold uppercase tracking-wide">Repair claim token</h3>
        <p className="mt-2 break-all text-center font-mono text-lg font-bold tracking-wider">{ticket.ticketId}</p>
        <hr className="my-2 border-dashed border-black/30" />
        <p><strong>Customer:</strong> {ticket.customerName}</p>
        {ticket.customerPhone && <p><strong>Phone:</strong> {ticket.customerPhone}</p>}
        <p><strong>Brand:</strong> {ticket.watchBrand}</p>
        <p><strong>Model:</strong> {ticket.watchModel}</p>
        {ticket.issueDescription && <p className="break-words"><strong>Issue:</strong> {ticket.issueDescription}</p>}
        <p><strong>Estimated cost:</strong> {formatLkr(ticket.estimatedCostCents)}</p>
        {ticket.createdAt && (
          <p><strong>Received:</strong> {new Date(ticket.createdAt).toLocaleString("en-LK")}</p>
        )}
        <hr className="my-2 border-dashed border-black/30" />
        <p className="whitespace-pre-wrap text-[10px]">{settings.repairTermsAndConditions}</p>
        <p className="mt-3 text-center text-[10px]">Present this token when collecting the watch.</p>
      </article>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #claim-token, #claim-token * { visibility: visible; }
          #claim-token { position: absolute; left: 0; top: 0; width: ${width}; max-width: ${width}; }
          @page { margin: 4mm; size: ${width} auto; }
        }
      `}</style>
    </div>
  );
}
