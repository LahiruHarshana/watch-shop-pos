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
    watchBrand: string;
    watchModel: string;
    estimatedCostCents: number;
  };
  settings: {
    shopName?: string;
    phone?: string;
    repairTermsAndConditions?: string;
  };
}) {
  return (
    <div className="space-y-4">
      <Button className="print:hidden" onClick={() => window.print()}>Print claim token</Button>
      <article id="claim-token" className="mx-auto max-w-md rounded-xl border bg-white p-6 text-black print:border-0">
        <h2 className="text-center font-bold">{settings.shopName ?? "Watch Shop"}</h2>
        <p className="text-center text-xs">{settings.phone}</p>
        <h3 className="mt-4 text-center text-lg font-semibold">Repair claim token</h3>
        <p className="mt-2 text-center text-2xl font-mono tracking-wider">{ticket.ticketId}</p>
        <hr className="my-4 border-dashed" />
        <p className="text-sm"><strong>Customer:</strong> {ticket.customerName}</p>
        <p className="text-sm"><strong>Watch:</strong> {ticket.watchBrand} {ticket.watchModel}</p>
        <p className="text-sm"><strong>Estimated cost:</strong> {formatLkr(ticket.estimatedCostCents)}</p>
        <hr className="my-4 border-dashed" />
        <p className="text-xs whitespace-pre-wrap">{settings.repairTermsAndConditions}</p>
        <p className="mt-4 text-center text-xs">Present this token when collecting your watch.</p>
      </article>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #claim-token, #claim-token * { visibility: visible; }
          #claim-token { position: absolute; left: 0; top: 0; width: 80mm; }
        }
      `}</style>
    </div>
  );
}
