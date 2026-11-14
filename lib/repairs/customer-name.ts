const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u;

export function customerNameError(value: unknown): string | null {
  if (typeof value !== "string") return "Enter a customer name using letters.";
  const name = value.trim().replace(/\s+/g, " ");
  if (!NAME_PATTERN.test(name) || name.length < 2) {
    return "Enter a customer name using letters. Numbers and symbols are not allowed.";
  }
  return null;
}

export function normalizeCustomerName(value: unknown): string | null {
  if (customerNameError(value)) return null;
  return (value as string).trim().replace(/\s+/g, " ");
}
