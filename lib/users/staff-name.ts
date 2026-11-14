const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u;

export function staffNameError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Enter a full name.";
  const name = value.trim().replace(/\s+/g, " ");
  if (!NAME_PATTERN.test(name) || name.length < 2) {
    return "Enter a full name using letters. Numbers or symbols alone are not allowed.";
  }
  return null;
}

export function normalizeStaffName(value: unknown): string | null {
  if (staffNameError(value)) return null;
  return (value as string).trim().replace(/\s+/g, " ");
}
