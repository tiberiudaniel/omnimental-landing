"use client";

import type { ProgressFact } from "../progressFacts";

export function toMsLocal(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof (ts as { toDate?: () => Date })?.toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

const FOCUS_MAP: Record<string, string> = {
  relatii: "relationships",
  relatie: "relationships",
  calm: "calm",
  stres: "calm",
  claritate: "clarity",
  identitate: "clarity",
  focus: "clarity",
  energie: "energy",
  energy: "energy",
  performanta: "performance",
  sanatate: "health",
  health: "health",
  obiceiuri: "general",
  sens: "general",
  general: "general",
};

export function getCurrentFocusTag(facts: ProgressFact | null | undefined): string | undefined {
  try {
    const cats =
      (facts as { intent?: { categories?: Array<{ category: string; count: number }> } } | undefined)
        ?.intent?.categories || [];
    if (!cats.length) return undefined;
    const [top] = [...cats]
      .filter((entry) => entry && typeof entry.category === "string")
      .sort((a, b) => (b.count || 0) - (a.count || 0));
    if (!top?.category) return undefined;
    const lower = top.category.toLowerCase();
    const matchKey = Object.keys(FOCUS_MAP).find((key) => lower.includes(key));
    return matchKey ? FOCUS_MAP[matchKey] : undefined;
  } catch {
    return undefined;
  }
}
