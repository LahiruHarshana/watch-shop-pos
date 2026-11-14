const DESCRIPTION_MAX = 120;
const NOTE_MAX = 300;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function expenseAmountError(value: unknown): string | null {
  const cents = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(cents) || cents < 1) {
    return "Enter an expense amount greater than zero.";
  }
  return null;
}

export function expenseDescriptionError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Describe what the money was spent on.";
  if (value.trim().length > DESCRIPTION_MAX) return "Keep the description to 120 characters.";
  return null;
}

export function normalizeExpenseDescription(value: unknown): string | null {
  if (expenseDescriptionError(value)) return null;
  return (value as string).trim().replace(/\s+/g, " ");
}

export function spentOnError(value: unknown): string | null {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return "Choose a valid date.";
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return "Choose a valid date.";
  }
  return null;
}

export function expenseNoteError(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return "Note must be text.";
  if (value.trim().length > NOTE_MAX) return "Keep the note to 300 characters.";
  return null;
}
