import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { ExpensesBoard } from "@/components/pos/expenses-board";
import { businessTodayKey } from "@/lib/time/business-day";

export const instant = false;

export default async function ExpensesPage() {
  const session = await auth();
  return (
    <Suspense fallback={null}>
      <ExpensesBoard initialDate={businessTodayKey()} canDelete={session?.user?.role === "admin"} />
    </Suspense>
  );
}
