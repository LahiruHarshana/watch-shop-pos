export type SuggestableCategory = {
  _id: string;
  keywords: string[];
  isActive?: boolean;
};

function keywordHits(text: string, keyword: string): boolean {
  const escaped = keyword.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return false;
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i").test(text);
}

/** First active category whose keyword appears as a whole word in the description. */
export function suggestCategoryMatch(
  description: string,
  categories: SuggestableCategory[],
): { categoryId: string; keyword: string } | null {
  const text = description.toLowerCase();
  if (!text.trim()) return null;
  for (const category of categories) {
    if (category.isActive === false) continue;
    const keywords = [...category.keywords].sort((a, b) => b.length - a.length);
    const keyword = keywords.find((word) => keywordHits(text, word));
    if (keyword) return { categoryId: category._id, keyword };
  }
  return null;
}

export function suggestCategoryId(
  description: string,
  categories: SuggestableCategory[],
): string | null {
  return suggestCategoryMatch(description, categories)?.categoryId ?? null;
}
