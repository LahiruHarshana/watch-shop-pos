/** Shop business timezone. Sri Lanka has no daylight-saving time (UTC+5:30). */
export const BUSINESS_TIME_ZONE = "Asia/Colombo";
const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function businessDateKey(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function businessTodayKey(now = new Date()): string {
  return businessDateKey(now);
}

/** Inclusive start and exclusive-minus-1ms end of a Colombo calendar day. */
export function businessDayRange(dateStr: string): { start: Date; end: Date } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error("Date must be YYYY-MM-DD");
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - COLOMBO_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

export function addBusinessDays(dateStr: string, delta: number): string {
  const { start } = businessDayRange(dateStr);
  return businessDateKey(new Date(start.getTime() + delta * 24 * 60 * 60 * 1000));
}

export function businessWeekdayLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "short",
  }).format(businessDayRange(dateStr).start);
}
