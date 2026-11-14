export type ExpenseLine = {
  amountCents: number;
  spentOn: string;
  categoryId: string;
  categoryName: string;
};

export type CategoryTotal = {
  categoryId: string;
  name: string;
  amountCents: number;
  count: number;
};

export type DaySummary = {
  date: string;
  totalCents: number;
  count: number;
  categories: CategoryTotal[];
  topCategory: CategoryTotal | null;
};

export function summarizeExpenses(
  date: string,
  lines: Pick<ExpenseLine, "amountCents" | "categoryId" | "categoryName">[],
): DaySummary {
  const totals = new Map<string, CategoryTotal>();
  let totalCents = 0;
  for (const line of lines) {
    totalCents += line.amountCents;
    const existing = totals.get(line.categoryId);
    if (existing) {
      existing.amountCents += line.amountCents;
      existing.count += 1;
    } else {
      totals.set(line.categoryId, {
        categoryId: line.categoryId,
        name: line.categoryName,
        amountCents: line.amountCents,
        count: 1,
      });
    }
  }
  const categories = [...totals.values()].sort(
    (a, b) => b.amountCents - a.amountCents || a.name.localeCompare(b.name),
  );
  return {
    date,
    totalCents,
    count: lines.length,
    categories,
    topCategory: categories[0] ?? null,
  };
}

export function summarizeExpenseDays(dates: string[], lines: ExpenseLine[]): DaySummary[] {
  return dates.map((date) =>
    summarizeExpenses(
      date,
      lines.filter((line) => line.spentOn === date),
    ),
  );
}
