import { ExpenseCategory } from "@/models/ExpenseCategory";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/expenses/defaults";

/** Inserts the shop's starter categories only when none exist yet. */
export async function ensureDefaultExpenseCategories() {
  const existing = await ExpenseCategory.countDocuments();
  if (existing > 0) return;
  await ExpenseCategory.insertMany(
    DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
      ...category,
      keywords: [...category.keywords],
      isActive: true,
    })),
  );
}
