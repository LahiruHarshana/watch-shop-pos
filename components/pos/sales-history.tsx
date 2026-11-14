"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataPagination } from "@/components/ui/data-pagination";
import type { PaginationMeta } from "@/lib/api/pagination";
import { formatLkr } from "@/lib/money/format";

type Sale = {
  _id: string;
  invoiceNumber: string;
  createdAt: string;
  status: "completed" | "voided";
  totalCents: number;
  payments: { method: string; amountCents: number }[];
  soldBy?: { name?: string } | null;
};

export function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (date) params.set("date", date);
    if (method) params.set("method", method);
    if (status) params.set("status", status);
    params.set("page", String(page));
    const timer = setTimeout(() => {
      fetch(`/api/sales?${params}`)
        .then((r) => r.json())
        .then((json) => {
          setSales(json.data ?? []);
          setPagination(json.pagination ?? null);
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [q, date, method, status, page]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Ledger</p>
          <h1 className="text-4xl md:text-5xl">Sales</h1>
          <p className="text-sm text-muted-foreground">Find an invoice to reprint, download, or void.</p>
        </div>
      </header>
      <div className="pos-surface grid gap-2 p-3 sm:grid-cols-4">
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Invoice, SKU, item, or cashier"
          className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setPage(1);
            setDate(e.target.value);
          }}
          className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm"
        />
        <select
          value={method}
          onChange={(e) => {
            setPage(1);
            setMethod(e.target.value);
          }}
          className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm"
        >
          <option value="">All payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank transfer</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
        </select>
      </div>
      <div className="pos-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Cashier</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id} className="border-t border-border transition-colors hover:bg-surface-muted">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/sales/${sale._id}`} className="text-brand hover:underline">
                    {sale.invoiceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(sale.createdAt).toLocaleString("en-LK")}</td>
                <td className="px-4 py-3">{sale.soldBy?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs capitalize">
                    {sale.payments[0]?.method.replace("_", " ") ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={sale.status === "voided" ? "status-pill bg-red-50 text-danger" : "status-pill status-pill-ready"}>
                    {sale.status}
                  </span>
                </td>
                <td className="metric px-4 py-3 text-right font-semibold">{formatLkr(sale.totalCents)}</td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No sales match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DataPagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
