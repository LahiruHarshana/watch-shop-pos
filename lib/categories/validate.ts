const NAME_MAX = 40;
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} &'/-]*$/u;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function categoryNameError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Enter a category name.";
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length > NAME_MAX) return "Keep the category name to 40 characters.";
  if (!/\p{L}/u.test(name) || !NAME_PATTERN.test(name)) {
    return "Enter a category name with letters. Numbers or symbols alone are not allowed.";
  }
  return null;
}

export function normalizeCategoryName(value: unknown): string | null {
  if (categoryNameError(value)) return null;
  return (value as string).trim().replace(/\s+/g, " ");
}

export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categorySlugError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Enter a category name with letters.";
  if (!SLUG_PATTERN.test(value.trim().toLowerCase())) {
    return "Use a slug made of lowercase letters, numbers, and hyphens.";
  }
  return null;
}

export function sortOrderError(value: unknown): string | null {
  if (value == null || value === "") return null;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return "Sort order must be a whole number, 0 or higher.";
  return null;
}
