export type DiscountType = "flat" | "percent";

export interface LineDiscountInput {
  type: DiscountType;
  value: number;
}

export interface CartLineInput {
  unitPriceCents: number;
  quantity: number;
  lineDiscount?: LineDiscountInput;
}

export interface CartDiscountInput {
  type: DiscountType;
  value: number;
}

function applyDiscount(amountCents: number, discount?: LineDiscountInput): number {
  if (!discount || amountCents <= 0) return amountCents;
  if (discount.type === "flat") {
    const flat = Math.round(discount.value);
    return Math.max(0, amountCents - flat);
  }
  const pct = Math.min(100, Math.max(0, discount.value));
  return Math.round(amountCents * (100 - pct) / 100);
}

export function calculateLineTotal(line: CartLineInput): number {
  const base = line.unitPriceCents * line.quantity;
  return applyDiscount(base, line.lineDiscount);
}

export function calculateSaleTotals(
  lines: CartLineInput[],
  cartDiscount?: CartDiscountInput,
) {
  const lineTotals = lines.map((line) => calculateLineTotal(line));
  const subtotalCents = lineTotals.reduce((a, b) => a + b, 0);
  const discountTotalCents = lines.reduce((acc, line, i) => {
    const base = line.unitPriceCents * line.quantity;
    return acc + (base - lineTotals[i]);
  }, 0);

  let afterLines = subtotalCents;
  let cartDiscountCents = 0;
  if (cartDiscount) {
    const before = afterLines;
    afterLines = applyDiscount(afterLines, cartDiscount);
    cartDiscountCents = before - afterLines;
  }

  return {
    subtotalCents,
    lineDiscountCents: discountTotalCents,
    cartDiscountCents,
    discountTotalCents: discountTotalCents + cartDiscountCents,
    totalCents: afterLines,
  };
}
