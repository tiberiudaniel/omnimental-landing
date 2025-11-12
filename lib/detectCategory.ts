import db from "@/data/expressions_db.ro.json" assert { type: "json" };

/**
 * Detectează categoria unei expresii inițiale pe baza bazei JSON (RO).
 * Returnează una dintre: "claritate" | "relatii" | "stres" | "incredere" | "echilibru" sau null.
 */
export function detectCategory(expression: string): string | null {
  if (!expression) return null;
  const normalized = expression.trim().toLowerCase();
  for (const [category, expressions] of Object.entries(db as Record<string, string[]>)) {
    if (expressions.some((e) => e.toLowerCase() === normalized)) {
      return category;
    }
  }
  return null;
}

