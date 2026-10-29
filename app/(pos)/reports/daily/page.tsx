import { connection } from "next/server";
import { DailyReport } from "@/components/pos/daily-report";
import { businessTodayKey } from "@/lib/time/business-day";

export default async function DailyReportPage() {
  await connection();
  return <DailyReport initialDate={businessTodayKey()} />;
}
