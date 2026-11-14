import { connectDb } from "@/lib/db/mongoose";
import { requireSession } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { loadExpenseWindow } from "@/lib/expenses/load";
import { spentOnError } from "@/lib/expenses/validate";
import { businessTodayKey } from "@/lib/time/business-day";

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? businessTodayKey();
  if (spentOnError(date)) return jsonError("VALIDATION", "Date must be YYYY-MM-DD", 400);
  const rawDays = Number(searchParams.get("days") ?? 1);
  const days = Number.isFinite(rawDays) ? rawDays : 1;
  try {
    const window = await loadExpenseWindow(date, days);
    return jsonOk({
      ...window.today,
      days: window.days,
    });
  } catch {
    return jsonError("VALIDATION", "Date must be YYYY-MM-DD", 400);
  }
}
