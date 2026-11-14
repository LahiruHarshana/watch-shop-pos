export type CashPayment = { method: string; amountCents: number };

function cashTotal(payments: CashPayment[] | undefined): number {
  return (payments ?? [])
    .filter((p) => p.method === "cash")
    .reduce((sum, p) => sum + p.amountCents, 0);
}

/**
 * Opening float + retail cash + repair cash − voided retail cash.
 * Card and bank transfer never move the drawer.
 */
export function expectedCashFromEvents(input: {
  openingFloatCents: number;
  completedSales: { payments: CashPayment[] }[];
  voidedSales: { payments: CashPayment[] }[];
  repairPayments: { method?: string; amountCents?: number }[];
}): number {
  const retailIn = input.completedSales.reduce((sum, sale) => sum + cashTotal(sale.payments), 0);
  const retailOut = input.voidedSales.reduce((sum, sale) => sum + cashTotal(sale.payments), 0);
  const repairIn = input.repairPayments.reduce((sum, payment) => {
    if (payment.method !== "cash" || payment.amountCents == null) return sum;
    return sum + payment.amountCents;
  }, 0);
  return input.openingFloatCents + retailIn + repairIn - retailOut;
}
