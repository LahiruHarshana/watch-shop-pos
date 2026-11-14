/** A quoted repair estimate has to be a positive amount. Zero is not a quote, and a minus sign must not be dropped. */
export function estimatedCostInputError(value: string): string | null {
  const trimmed = value.trim().replace(/,/g, "");
  if (trimmed.includes("-")) return "Estimated cost cannot be negative.";
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return "Enter an estimated cost greater than 0.";
  if (Number(trimmed) <= 0) return "Enter an estimated cost greater than 0.";
  return null;
}

export function estimatedCostCentsError(cents: unknown): string | null {
  if (typeof cents !== "number" || !Number.isInteger(cents)) {
    return "Enter an estimated cost greater than 0.";
  }
  if (cents < 0) return "Estimated cost cannot be negative.";
  if (cents === 0) return "Enter an estimated cost greater than 0.";
  return null;
}
