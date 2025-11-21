"use client";

import type { ProgressFact } from "./progressFacts";
import { normalizeKunoFacts } from "./kunoFacts";

export type UnlockState = {
  scopeUnlocked: boolean;
  kunoUnlocked: boolean;
  senseiUnlocked: boolean;
  abilUnlocked: boolean;
  intelUnlocked: boolean;
};

export function getUnlockState(progress?: ProgressFact | null): UnlockState {
  const hasScope = Boolean(progress?.intent);
  const tagsCount = Number(progress?.intent?.tags?.length ?? 0);
  const scopeMin = tagsCount >= 5; // proxy pentru minCharsMet

  const kunoFacts = normalizeKunoFacts(progress?.omni?.kuno);
  const kunoCompleted =
    (kunoFacts.completedLessonsCount ?? 0) > 0 ||
    Number(kunoFacts.legacyScores.completedTests ?? 0) >= 1;
  const senseiCompleted = Number(progress?.omni?.sensei?.completedQuestsCount ?? 0) >= 1;
  const abilUnlocked = Boolean(progress?.omni?.abil?.unlocked) || senseiCompleted;
  const evalCount = Number(progress?.omni?.intel?.evaluationsCount ?? 0);

  const scopeUnlocked = true;
  const kunoUnlocked = hasScope;
  const senseiUnlocked = scopeMin && (kunoCompleted || hasScope);
  const intelUnlocked = evalCount >= 2 || Boolean(progress?.evaluation);

  return { scopeUnlocked, kunoUnlocked, senseiUnlocked, abilUnlocked, intelUnlocked };
}

