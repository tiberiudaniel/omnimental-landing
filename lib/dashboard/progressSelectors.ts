"use client";

import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { resolveModuleId } from "@/config/omniKunoModules";
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

const FOCUS_MAP: Record<string, OmniKunoModuleId> = {
  relatii: "relationships_communication",
  relatie: "relationships_communication",
  calm: "emotional_balance",
  stres: "emotional_balance",
  claritate: "focus_clarity",
  identitate: "self_trust",
  focus: "focus_clarity",
  energie: "energy_body",
  energy: "energy_body",
  performanta: "decision_discernment",
  decizie: "decision_discernment",
  sanatate: "energy_body",
  health: "energy_body",
  obiceiuri: "energy_body",
  sens: "self_trust",
  general: "focus_clarity",
};

export function getCurrentFocusTag(facts: ProgressFact | null | undefined): OmniKunoModuleId | undefined {
  try {
    const cats =
      (facts as { intent?: { categories?: Array<{ category: string; count: number }> } } | undefined)
        ?.intent?.categories || [];
    if (!cats.length) return undefined;
    const [top] = [...cats]
      .filter((entry) => entry && typeof entry.category === "string")
      .sort((a, b) => (b.count || 0) - (a.count || 0));
    if (!top?.category) return undefined;
    const normalized = resolveModuleId(top.category);
    if (normalized) return normalized;
    const lower = top.category.toLowerCase();
    const matchKey = Object.keys(FOCUS_MAP).find((key) => lower.includes(key));
    return matchKey ? FOCUS_MAP[matchKey] : undefined;
  } catch {
    return undefined;
  }
}
