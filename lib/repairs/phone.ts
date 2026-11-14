/** Local 0XX prefixes for Sri Lankan mobiles and landlines. */
const PREFIXES = new Set([
  "070",
  "071",
  "072",
  "074",
  "075",
  "076",
  "077",
  "078",
  "011",
  "021",
  "023",
  "024",
  "025",
  "026",
  "027",
  "031",
  "032",
  "033",
  "034",
  "035",
  "036",
  "037",
  "038",
  "041",
  "045",
  "047",
  "051",
  "052",
  "054",
  "055",
  "057",
  "063",
  "065",
  "066",
  "067",
  "081",
  "091",
]);

const EMPTY = "Enter a phone number.";
const LETTERS = "Use digits only. Letters and symbols are not allowed.";
const LENGTH = "Enter a 10-digit Sri Lankan number, like 0771234567.";
const PREFIX = "That is not a Sri Lankan mobile or landline prefix.";

function localNumber(value: string): { error: string } | { local: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: EMPTY };
  if (/[a-z]/i.test(trimmed) || /[^0-9+\s().-]/.test(trimmed)) return { error: LETTERS };

  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0094")) digits = digits.slice(2);
  if (digits.startsWith("94") && digits.length === 11) digits = `0${digits.slice(2)}`;
  if (!digits.startsWith("0") || digits.length !== 10) return { error: LENGTH };
  if (!PREFIXES.has(digits.slice(0, 3))) return { error: PREFIX };
  return { local: digits };
}

export function phoneError(value: unknown): string | null {
  if (typeof value !== "string") return EMPTY;
  const parsed = localNumber(value);
  return "error" in parsed ? parsed.error : null;
}

/** `0771234567`, `077 123 4567`, and `+94 77 123 4567` all become `+94 77 123 4567`. */
export function normalizeSriLankaPhone(value: unknown): string | null {
  if (typeof value !== "string" || phoneError(value)) return null;
  const parsed = localNumber(value);
  if ("error" in parsed) return null;
  const digits = parsed.local;
  return `+94 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
