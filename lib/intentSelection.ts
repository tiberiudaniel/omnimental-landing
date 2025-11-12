// Central source of truth for intent cloud selection and category aggregation

export const INTENT_MIN_SELECTION = 5;
export const INTENT_MAX_SELECTION = 7;

export type IntentSelectionWord = {
  id: string;
  label: string;
  category: string;
};

export type IntentCategoryCount = { category: string; count: number };

export function computeCategoryCounts(
  words: IntentSelectionWord[] | Record<string, IntentSelectionWord>,
  selectionIds: string[],
): { categories: IntentCategoryCount[]; total: number } {
  const dict: Record<string, IntentSelectionWord> = Array.isArray(words)
    ? Object.fromEntries(words.map((w) => [w.id, w]))
    : (words as Record<string, IntentSelectionWord>);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const id of selectionIds) {
    const w = dict[id];
    const cat = (w?.category || "").trim();
    if (!cat) continue;
    counts[cat] = (counts[cat] ?? 0) + 1;
    total += 1;
  }
  const categories = Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  return { categories, total };
}

