import { addBusinessDays } from "@/lib/time/business-day";
import { Expense } from "@/models/Expense";
import { ExpenseCategory } from "@/models/ExpenseCategory";
import { summarizeExpenseDays, type DaySummary, type ExpenseLine } from "@/lib/expenses/summary";

export async function loadExpenseWindow(
  endDate: string,
  dayCount: number,
): Promise<{ today: DaySummary; days: DaySummary[] }> {
  const count = Math.min(Math.max(Math.floor(dayCount), 1), 31);
  const dates = Array.from({ length: count }, (_, index) => addBusinessDays(endDate, index - (count - 1)));
  const rows = await Expense.find({
    spentOn: { $gte: dates[0], $lte: dates[dates.length - 1] },
  })
    .select("amountCents categoryId spentOn")
    .lean();

  const categoryIds = [...new Set(rows.map((row) => String(row.categoryId)))];
  const categories = categoryIds.length
    ? await ExpenseCategory.find({ _id: { $in: categoryIds } }).select("name").lean()
    : [];
  const names = new Map(categories.map((category) => [String(category._id), category.name]));

  const lines: ExpenseLine[] = rows.map((row) => ({
    amountCents: row.amountCents,
    spentOn: row.spentOn,
    categoryId: String(row.categoryId),
    categoryName: names.get(String(row.categoryId)) ?? "Uncategorized",
  }));

  const days = summarizeExpenseDays(dates, lines);
  return { today: days[days.length - 1]!, days };
}
