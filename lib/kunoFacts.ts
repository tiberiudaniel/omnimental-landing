"use client";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null;

const toNumberArray = (value: unknown): number[] =>
  Array.isArray(value) ? value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry)) : [];

export type KunoModuleSnapshot = {
  completedIds: string[];
  performance: {
    recentScores?: number[];
    recentTimeSpent?: number[];
    difficultyBias?: number;
  } | null;
  xp?: number;
  lastUpdated?: unknown;
};

export type NormalizedKunoFacts = {
  modules: Record<string, KunoModuleSnapshot>;
  gamification: UnknownRecord | null;
  recommendedModuleId?: string | null;
  recommendedArea?: string | null;
  exam: { score?: number; lastTakenAt?: number; breakdown?: Record<string, number> } | null;
  global: { totalXp?: number; completedLessons?: number; currentDifficulty?: "easy" | "medium" | "hard" } | null;
  masteryByCategory: Record<string, number> | null;
  legacyScores: {
    knowledgeIndex: number | null;
    averagePercent: number | null;
    completedTests: number | null;
    totalTestsAvailable: number | null;
  };
  signals: Record<string, string> | null;
  primaryScore: number | null;
  completedLessonsCount: number;
};

const normalizeModuleEntry = (value: unknown): KunoModuleSnapshot => {
  const entry = isRecord(value) ? value : {};
  const xp = typeof entry.xp === "number" ? entry.xp : undefined;
  const performance = isRecord(entry.performance)
    ? {
        recentScores: toNumberArray(entry.performance.recentScores),
        recentTimeSpent: toNumberArray(entry.performance.recentTimeSpent),
        difficultyBias:
          typeof entry.performance.difficultyBias === "number" ? entry.performance.difficultyBias : undefined,
      }
    : null;
  return {
    completedIds: Array.isArray(entry.completedIds)
      ? entry.completedIds.filter((id): id is string => typeof id === "string")
      : [],
    performance,
    xp,
    lastUpdated: entry.lastUpdated,
  };
};

const normalizeMap = (value: unknown) => (isRecord(value) ? (value as Record<string, UnknownRecord>) : null);

export function normalizeKunoFacts(raw: unknown): NormalizedKunoFacts {
  const block = isRecord(raw) ? (raw as UnknownRecord) : {};
  const modules: Record<string, KunoModuleSnapshot> = {};
  const modulesRaw = normalizeMap(block.modules);
  if (modulesRaw) {
    Object.entries(modulesRaw).forEach(([key, entry]) => {
      modules[key] = normalizeModuleEntry(entry);
    });
  }
  const lessonsRaw = normalizeMap(block.lessons);
  if (lessonsRaw) {
    Object.entries(lessonsRaw).forEach(([key, entry]) => {
      if (!modules[key]) {
        modules[key] = normalizeModuleEntry(entry);
      }
    });
  }
  const gamification = isRecord(block.gamification) ? (block.gamification as UnknownRecord) : null;
  const recommendedModuleId = typeof block.recommendedModuleId === "string" ? block.recommendedModuleId : null;
  const recommendedArea = typeof block.recommendedArea === "string" ? block.recommendedArea : null;
  const rawExam = isRecord(block.exam) ? (block.exam as UnknownRecord) : null;
  const exam = rawExam
    ? {
        score: typeof rawExam.score === "number" ? rawExam.score : undefined,
        lastTakenAt: typeof rawExam.lastTakenAt === "number" ? rawExam.lastTakenAt : undefined,
        breakdown: isRecord(rawExam.breakdown)
          ? Object.entries(rawExam.breakdown as Record<string, unknown>).reduce<Record<string, number>>(
              (acc, [key, value]) => {
                if (typeof value === "number" && Number.isFinite(value)) {
                  acc[key] = value;
                }
                return acc;
              },
              {},
            )
          : undefined,
      }
    : null;
  const rawGlobal = isRecord(block.global) ? (block.global as UnknownRecord) : null;
  const global = rawGlobal
    ? {
        totalXp: typeof rawGlobal.totalXp === "number" ? rawGlobal.totalXp : undefined,
        completedLessons: typeof rawGlobal.completedLessons === "number" ? rawGlobal.completedLessons : undefined,
        currentDifficulty:
          rawGlobal.currentDifficulty === "easy" ||
          rawGlobal.currentDifficulty === "medium" ||
          rawGlobal.currentDifficulty === "hard"
            ? (rawGlobal.currentDifficulty as "easy" | "medium" | "hard")
            : undefined,
      }
    : null;
  const masteryByCategory = isRecord(block.masteryByCategory)
    ? Object.entries(block.masteryByCategory as Record<string, unknown>).reduce<Record<string, number>>(
        (acc, [key, value]) => {
          const num = Number(value);
          if (Number.isFinite(num)) acc[key] = num;
          return acc;
        },
        {},
      )
    : null;
  const signals = isRecord(block.signals)
    ? Object.entries(block.signals as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value === "string") acc[key] = value;
        return acc;
      }, {})
    : null;
  const legacyScores = {
    knowledgeIndex: typeof block.knowledgeIndex === "number" ? block.knowledgeIndex : null,
    averagePercent: typeof block.averagePercent === "number" ? block.averagePercent : null,
    completedTests: typeof block.completedTests === "number" ? block.completedTests : null,
    totalTestsAvailable: typeof block.totalTestsAvailable === "number" ? block.totalTestsAvailable : null,
  };
  const moduleCompletion = Object.values(modules).reduce((acc, entry) => acc + entry.completedIds.length, 0);
  const completedLessonsCount =
    typeof global?.completedLessons === "number" ? global.completedLessons : moduleCompletion;
  const primaryScore =
    (typeof exam?.score === "number" && Number.isFinite(exam.score)
      ? exam.score
      : legacyScores.knowledgeIndex ?? legacyScores.averagePercent) ?? null;
  return {
    modules,
    gamification,
    recommendedModuleId,
    recommendedArea,
    exam,
    global,
    masteryByCategory,
    legacyScores,
    signals,
    primaryScore,
    completedLessonsCount,
  };
}

export function getKunoModuleSnapshot(kuno: NormalizedKunoFacts, moduleId: string): KunoModuleSnapshot {
  return kuno.modules[moduleId] ?? { completedIds: [], performance: null };
}
