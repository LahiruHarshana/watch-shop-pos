export function lkrToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToLkr(cents: number): number {
  return cents / 100;
}

export function formatLkr(cents: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(centsToLkr(cents));
}

export function parseLkrInput(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return 0;
  return lkrToCents(num);
}
