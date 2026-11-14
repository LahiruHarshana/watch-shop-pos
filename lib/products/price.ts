/** A shelf price has to be a positive amount. Letters must not be stripped into 0. */
export function priceInputError(value: string): string | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed || /[a-z]/i.test(trimmed)) return "Enter a price greater than 0. Letters are not allowed.";
  if (trimmed.includes("-")) return "Price cannot be negative.";
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed) || Number(trimmed) <= 0) {
    return "Enter a price greater than 0.";
  }
  return null;
}

export function priceCentsError(cents: unknown): string | null {
  if (typeof cents !== "number" || !Number.isInteger(cents) || cents === 0) {
    return "Enter a price greater than 0.";
  }
  if (cents < 0) return "Price cannot be negative.";
  return null;
}
