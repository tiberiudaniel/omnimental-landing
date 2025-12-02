import type { ProgressFact } from "@/lib/progressFacts";
import { normalizeKunoFacts } from "@/lib/kunoFacts";
import { OMNIKUNO_MODULES } from "@/config/omniKunoLessons";

type PillarScore = {
  percent: number;
  completion: number;
  mastery: number;
};

type PillarProgress = {
  scope: PillarScore;
  kuno: PillarScore;
  abil: PillarScore;
  flex: PillarScore;
  metadata: {
    kunoByModule: Record<string, PillarScore>;
  };
};

const COMPLETION_WEIGHT = 0.7;
const MASTERY_WEIGHT = 0.3;
const ABIL_COMPLETION_TARGET = 40;
const FLEX_STREAK_TARGET = 21;

const totalLessons = Object.values(OMNIKUNO_MODULES).reduce((sum, module) => sum + module.lessons.length, 0);

const clamp01 = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const buildScore = (completion: number, mastery: number): PillarScore => {
  const percent = Math.round((clamp01(completion) * COMPLETION_WEIGHT + clamp01(mastery) * MASTERY_WEIGHT) * 100);
  return {
    percent: Math.max(0, Math.min(100, percent)),
    completion: clamp01(completion),
    mastery: clamp01(mastery),
  };
};

export function computePillarProgress(facts: ProgressFact | null | undefined): PillarProgress {
  const omni = facts?.omni ?? null;
  const scopeIndex = clamp01((omni?.scope?.directionMotivationIndex ?? 0) / 100);

  const kuno = normalizeKunoFacts(omni?.kuno);
  const lessonsCompleted = Object.values(kuno.modules).reduce((sum, snapshot) => sum + (snapshot.completedIds?.length ?? 0), 0);
  const overallCompletion = totalLessons ? clamp01(lessonsCompleted / totalLessons) : 0;
  const overallMastery = clamp01((kuno.primaryScore ?? 0) / 100);

  const kunoByModule: Record<string, PillarScore> = {};
  Object.values(OMNIKUNO_MODULES).forEach((module) => {
    const snapshot = kuno.modules[module.moduleId];
    const completed = snapshot?.completedIds?.length ?? 0;
    const total = module.lessons.length || 1;
    const completion = clamp01(completed / total);
    const perfScores = snapshot?.performance?.recentScores;
    const perfAvg = perfScores && perfScores.length ? perfScores.reduce((a, b) => a + b, 0) / perfScores.length : undefined;
    const mastery = clamp01((perfAvg ?? kuno.primaryScore ?? 0) / 100);
    kunoByModule[module.moduleId] = buildScore(completion, mastery);
  });

  const abilCompleted = omni?.abil?.exercisesCompletedCount ?? 0;
  const abilCompletion = ABIL_COMPLETION_TARGET ? clamp01(abilCompleted / ABIL_COMPLETION_TARGET) : 0;
  const abilMastery = clamp01((omni?.abil?.skillsIndex ?? 0) / 100);

  const streak = omni?.daily?.streakDays ?? 0;
  const flexCompletion = FLEX_STREAK_TARGET ? clamp01(streak / FLEX_STREAK_TARGET) : 0;
  const flexMastery = clamp01(((omni?.flow?.flowIndex ?? omni?.intel?.consistencyIndex) ?? 0) / 100);

  return {
    scope: buildScore(scopeIndex, scopeIndex),
    kuno: buildScore(overallCompletion, overallMastery),
    abil: buildScore(abilCompletion, abilMastery),
    flex: buildScore(flexCompletion, flexMastery),
    metadata: { kunoByModule },
  };
}
