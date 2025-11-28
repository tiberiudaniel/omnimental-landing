"use client";

const LEVELS = [
  { level: 1, minXp: 0, nextThreshold: 100 },
  { level: 2, minXp: 100, nextThreshold: 250 },
  { level: 3, minXp: 250, nextThreshold: 500 },
  { level: 4, minXp: 500, nextThreshold: null },
] as const;

const LESSON_BASE_XP = 12;
const DIFFICULTY_BONUS: Record<"easy" | "medium" | "hard", number> = { easy: 0, medium: 2, hard: 4 };

const QUIZ_THRESHOLDS: Array<{ minScore: number; xp: number }> = [
  { minScore: 90, xp: 20 },
  { minScore: 70, xp: 16 },
  { minScore: 50, xp: 12 },
  { minScore: 0, xp: 8 },
];

export type KunoLevelInfo = {
  level: number;
  currentThreshold: number;
  nextThreshold: number | null;
};

export function getKunoLevel(totalXp: number | null | undefined): KunoLevelInfo {
  const xp = Number.isFinite(totalXp) && totalXp != null ? Math.max(0, Math.floor(totalXp)) : 0;
  for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
    const config = LEVELS[i];
    if (xp >= config.minXp) {
      return { level: config.level, currentThreshold: config.minXp, nextThreshold: config.nextThreshold };
    }
  }
  return { level: 1, currentThreshold: 0, nextThreshold: LEVELS[0]?.nextThreshold ?? null };
}

export function projectNextLevelProgress(totalXp: number): { level: number; pct: number } {
  const info = getKunoLevel(totalXp);
  if (info.nextThreshold == null) {
    return { level: info.level, pct: 100 };
  }
  const span = info.nextThreshold - info.currentThreshold;
  if (span <= 0) {
    return { level: info.level, pct: 0 };
  }
  const pct = Math.min(100, Math.max(0, ((totalXp - info.currentThreshold) / span) * 100));
  return { level: info.level, pct };
}

type LessonXpParams = {
  difficulty?: "easy" | "medium" | "hard";
  type?: "lesson" | "quiz";
};

export function getLessonXp(params?: LessonXpParams): number {
  const difficulty = params?.difficulty ?? "medium";
  const base = LESSON_BASE_XP;
  return base + (DIFFICULTY_BONUS[difficulty] ?? 0);
}

export function getQuizXp(scorePct: number): number {
  const entry = QUIZ_THRESHOLDS.find((threshold) => scorePct >= threshold.minScore);
  return entry?.xp ?? QUIZ_THRESHOLDS[QUIZ_THRESHOLDS.length - 1].xp;
}

type KunoXpEventDetail = {
  moduleId: string;
  xpDelta: number;
};

export function applyKunoXp(moduleId: string, xpDelta: number) {
  if (!xpDelta || typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<KunoXpEventDetail>("kuno:xp-awarded", { detail: { moduleId, xpDelta } }));
}
