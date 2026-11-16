const MAX = 500;

export function issueDescriptionError(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return "Describe the issue.";
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > MAX) return `Keep the issue to ${MAX} characters.`;
  if (!/\p{L}/u.test(text)) {
    return "Describe the issue using words. Numbers or symbols alone are not allowed.";
  }
  return null;
}

export function normalizeIssueDescription(value: unknown): string | null {
  if (issueDescriptionError(value)) return null;
  return (value as string).trim().replace(/\s+/g, " ");
}
