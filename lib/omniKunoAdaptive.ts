export type KunoPerformanceSnapshot = {
  recentScores: number[];
  recentTimeSpent: number[];
  difficultyBias: number;
};

export type KunoPerformanceUpdate = {
  score?: number;
  timeSpentSec?: number;
};

const HISTORY_LIMIT = 10;

export function createDefaultPerformanceSnapshot(): KunoPerformanceSnapshot {
  return { recentScores: [], recentTimeSpent: [], difficultyBias: 0 };
}

export function normalizePerformance(
  performance?: Partial<KunoPerformanceSnapshot> | null,
): KunoPerformanceSnapshot {
  if (!performance) return createDefaultPerformanceSnapshot();
  return {
    recentScores: Array.isArray(performance.recentScores)
      ? performance.recentScores
          .map((v) => Number(v) || 0)
          .filter((v) => Number.isFinite(v))
          .slice(-HISTORY_LIMIT)
      : [],
    recentTimeSpent: Array.isArray(performance.recentTimeSpent)
      ? performance.recentTimeSpent
          .map((v) => Number(v) || 0)
          .filter((v) => Number.isFinite(v))
          .slice(-HISTORY_LIMIT)
      : [],
    difficultyBias:
      typeof performance.difficultyBias === "number"
        ? Math.max(-1, Math.min(1, Math.round(performance.difficultyBias)))
        : 0,
  };
}

export function computeLearningComfortIndex(perf: KunoPerformanceSnapshot): number {
  const avgScore =
    perf.recentScores.length > 0
      ? perf.recentScores.reduce((sum, value) => sum + clamp(value, 0, 100), 0) / perf.recentScores.length
      : 50;
  const avgScoreNorm = clamp(avgScore / 100, 0, 1);

  const avgTime =
    perf.recentTimeSpent.length > 0
      ? perf.recentTimeSpent.reduce((sum, value) => sum + Math.max(0, value), 0) / perf.recentTimeSpent.length
      : 180;
  const avgTimeNorm = clamp(avgTime / 300, 0, 1);

  return clamp(avgScoreNorm - avgTimeNorm + (perf.difficultyBias || 0) * 0.1, -1, 1);
}

export function getPreferredDifficulty(lci: number): "easy" | "medium" | "hard" {
  if (lci < -0.3) return "easy";
  if (lci > 0.3) return "hard";
  return "medium";
}

export function getNextAdaptiveLesson(
  lessons: Array<{ id: string; order: number; difficulty?: "easy" | "medium" | "hard" }>,
  completedIds: readonly string[],
  perf: KunoPerformanceSnapshot,
): { id: string } | null {
  const completed = new Set(completedIds);
  const pending = lessons
    .filter((lesson) => !completed.has(lesson.id))
    .sort((a, b) => a.order - b.order);
  if (!pending.length) return null;

  const preferredDifficulty = getPreferredDifficulty(computeLearningComfortIndex(perf));
  const match = pending.find((lesson) => (lesson.difficulty ?? "medium") === preferredDifficulty);
  return match ?? pending[0] ?? null;
}

export function updatePerformanceSnapshot(
  base: KunoPerformanceSnapshot,
  update: KunoPerformanceUpdate,
): KunoPerformanceSnapshot {
  const normalized = normalizePerformance(base);
  const nextScores =
    typeof update.score === "number"
      ? clampHistory([...normalized.recentScores, clamp(Math.round(update.score), 0, 100)])
      : normalized.recentScores.slice();
  const nextTime =
    typeof update.timeSpentSec === "number"
      ? clampHistory([...normalized.recentTimeSpent, Math.max(0, Math.round(update.timeSpentSec))])
      : normalized.recentTimeSpent.slice();

  return {
    recentScores: nextScores,
    recentTimeSpent: nextTime,
    difficultyBias: determineBias(nextScores, nextTime),
  };
}

function determineBias(scores: number[], times: number[]): number {
  if (scores.length >= 5) {
    const lastScores = scores.slice(-5);
    const avgScore = lastScores.reduce((sum, value) => sum + value, 0) / lastScores.length;
    const lastTimes = times.slice(-5);
    const avgTime = lastTimes.length ? lastTimes.reduce((sum, value) => sum + value, 0) / lastTimes.length : 180;

    if (avgScore >= 80 && avgTime <= 150) return 1;
    if (avgScore <= 50 && avgTime >= 240) return -1;
  }
  return 0;
}

function clampHistory(values: number[]): number[] {
  if (values.length <= HISTORY_LIMIT) return values;
  return values.slice(values.length - HISTORY_LIMIT);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
