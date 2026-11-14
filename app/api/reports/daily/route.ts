import { connectDb } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/api/auth-guard";
import { jsonError, jsonOk } from "@/lib/api/response";
import { buildDailyReport } from "@/lib/reports/daily-summary";
import { businessTodayKey } from "@/lib/time/business-day";

export async function GET(request: Request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;
  await connectDb();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? businessTodayKey();
  try {
    return jsonOk(await buildDailyReport(date));
  } catch {
    return jsonError("VALIDATION", "Date must be YYYY-MM-DD", 400);
  }
}
