const MAX = 40;
const PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .'&/-]*$/u;

export function watchTextError(value: unknown, label: "watch brand" | "model"): string | null {
  if (typeof value !== "string" || !value.trim()) return `Enter the ${label}.`;
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > MAX) return `Keep the ${label} to ${MAX} characters.`;
  if (!/\p{L}/u.test(text) || !PATTERN.test(text)) {
    return `Enter a ${label} with letters. Numbers or symbols alone are not allowed.`;
  }
  return null;
}

export function normalizeWatchText(value: unknown, label: "watch brand" | "model"): string | null {
  if (watchTextError(value, label)) return null;
  return (value as string).trim().replace(/\s+/g, " ");
}
