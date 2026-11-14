export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Salaries", slug: "salaries", sortOrder: 1, keywords: ["salary", "wage", "payroll", "staff pay"] },
  { name: "Transportation", slug: "transportation", sortOrder: 2, keywords: ["bus", "fuel", "taxi", "uber", "transport", "petrol"] },
  { name: "Food", slug: "food", sortOrder: 3, keywords: ["food", "lunch", "tea", "meal", "snack"] },
  { name: "Maintenance", slug: "maintenance", sortOrder: 4, keywords: ["maintenance", "service", "plumber", "electrician"] },
  { name: "Utilities", slug: "utilities", sortOrder: 5, keywords: ["electric", "electricity", "water", "internet", "utility"] },
  { name: "Marketing", slug: "marketing", sortOrder: 6, keywords: ["marketing", "advert", "poster", "facebook", "instagram"] },
  { name: "Supplies", slug: "supplies", sortOrder: 7, keywords: ["supply", "supplies", "stationery", "packaging"] },
  { name: "Rent", slug: "rent", sortOrder: 8, keywords: ["rent", "lease"] },
] as const;
