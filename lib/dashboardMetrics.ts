import { computeConsistencyIndexFromDates } from "./omniIntel";
import { computeDistribution, type PracticeSessionLite } from "./progressAnalytics";

export type KunoAggregate = {
  lastPercent: number;
  runsCount: number;
  mean: number;
  ewma: number; // alpha-weighted (latest-weighted)
};

export function computeKunoAggregate(percs: number[], alpha = 0.4): KunoAggregate {
  const filtered = percs.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 0);
  const runsCount = filtered.length;
  const lastPercent = runsCount ? filtered[filtered.length - 1] : 0;
  const mean = runsCount ? Math.round(filtered.reduce((a, b) => a + b, 0) / runsCount) : 0;
  let ewma = 0;
  if (runsCount) {
    let agg = filtered[0];
    for (let i = 1; i < filtered.length; i += 1) {
      agg = alpha * filtered[i] + (1 - alpha) * agg;
    }
    ewma = Math.round(agg);
  }
  return { lastPercent, runsCount, mean, ewma };
}

export function computeAbilityIndex(
  assessments: Array<{
    total?: number;
    probes?: Record<string, { raw?: number; scaled?: number; maxRaw?: number }>;
  }>,
  exercisesCompletedCount: number,
): { runsCount: number; assessMean: number; practiceIndex: number } {
  const points: number[] = [];
  assessments.forEach((a) => {
    // Prefer averaged scaled percent per probe; else derive from raw/maxRaw
    const probes = a?.probes || {};
    const keys = Object.keys(probes);
    if (keys.length) {
      const percs = keys.map((k) => {
        const p = probes[k] || {};
        if (typeof p.scaled === "number") return Math.max(0, Math.min(100, Math.round(p.scaled)));
        const raw = Number(p.raw);
        const maxRaw = Number(p.maxRaw);
        if (Number.isFinite(raw) && Number.isFinite(maxRaw) && maxRaw > 0) {
          return Math.max(0, Math.min(100, Math.round((raw / maxRaw) * 100)));
        }
        return 0;
      });
      const mean = percs.length ? Math.round(percs.reduce((a, b) => a + b, 0) / percs.length) : 0;
      points.push(mean);
    } else if (typeof a?.total === "number" && Number.isFinite(a.total)) {
      // If only a total numeric is provided, clamp 0..100
      points.push(Math.max(0, Math.min(100, Math.round(a.total))));
    }
  });
  const runsCount = points.length;
  const assessMean = runsCount ? Math.round(points.reduce((a, b) => a + b, 0) / runsCount) : 0;
  const practiceBoost = Math.min(100, Math.max(0, exercisesCompletedCount * 3));
  const practiceIndex = Math.round(0.7 * assessMean + 0.3 * practiceBoost);
  return { runsCount, assessMean, practiceIndex };
}

export function computeMotivationIndexEnhanced(input: {
  urgency?: number;
  determination?: number;
  hoursPerWeek?: number;
  learnFromOthers?: number;
  scheduleFit?: number;
  budgetLevel?: string;
}): number {
  const urg = clamp01((input.urgency ?? 0) / 10);
  const det = clamp01((input.determination ?? 0) / 5);
  const hrs = clamp01((input.hoursPerWeek ?? 0) / 8);
  let base = 0.5 * urg + 0.3 * det + 0.2 * hrs; // 0..1
  const learn = clamp01((input.learnFromOthers ?? 0) / 10);
  const fit = clamp01((input.scheduleFit ?? 0) / 10);
  base = base * (1 + 0.05 * learn + 0.05 * fit);
  if ((input.budgetLevel ?? "").toLowerCase() === "low" && (input.hoursPerWeek ?? 0) <= 1) {
    base = Math.max(0, base - 0.05);
  }
  return Math.round(Math.max(0, Math.min(1, base)) * 100);
}

export function computeFlowIndex(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { flowIndex: number; streakCurrent: number; streakBest: number } {
  const dates: Date[] = [];
  const minutes: number[] = [];
  sessions.forEach((s) => {
    const started = toDate(s.startedAt);
    if (started) dates.push(started);
    minutes.push(Math.max(0, Math.round((s.durationSec ?? 0) / 60)));
  });
  const consistency14 = computeConsistencyIndexFromDates(dates);
  const streak = computeStreakCompat(sessions, referenceMs);
  const dist = computeDistribution(sessions);
  const shares = dist.total > 0 ? [dist.reflection, dist.breathing, dist.drill].map((v) => v / dist.total) : [1, 0, 0];
  const entropy = -shares.reduce((acc, p) => (p > 0 ? acc + p * Math.log2(p) : acc), 0); // 0..log2(3)
  const balance = Math.round((entropy / Math.log2(3)) * 100);
  const recency = computeRecencyScore(dates);
  const flow = 0.4 * consistency14 + 0.3 * streak.current * (100 / 14) + 0.2 * recency + 0.1 * balance;
  return { flowIndex: Math.round(Math.max(0, Math.min(100, flow))), streakCurrent: streak.current, streakBest: streak.best };
}

function computeStreakCompat(sessions: PracticeSessionLite[], referenceMs: number): { current: number; best: number } {
  // lightweight inline variant: import computeStreak if needed, but avoid circular deps
  const DAY = 24 * 60 * 60 * 1000;
  const end = startOfDay(referenceMs);
  const start = end - (30 - 1) * DAY;
  const map: Record<number, number> = {};
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    const day = startOfDay(ms);
    if (day < start || day > end) return;
    map[day] = (map[day] || 0) + Math.max(0, Math.round((s.durationSec ?? 0) / 60));
  });
  let best = 0;
  let cur = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = start + i * DAY;
    const ok = (map[day] || 0) >= 3;
    if (ok) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  let current = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = end - i * DAY;
    if ((map[day] || 0) >= 3) current += 1;
    else break;
  }
  return { current, best };
}

function computeRecencyScore(dates: Date[]): number {
  if (!dates.length) return 0;
  const now = Date.now();
  const last = Math.max(...dates.map((d) => d.getTime()));
  const diff = now - last;
  const dayMs = 24 * 60 * 60 * 1000;
  if (diff <= dayMs) return 100;
  if (diff <= 3 * dayMs) return 80;
  if (diff <= 7 * dayMs) return 60;
  return 30;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  const maybe = v as { toDate?: () => Date };
  if (maybe && typeof maybe.toDate === "function") return maybe.toDate();
  return null;
}

function toMs(v: unknown): number {
  const d = toDate(v);
  return d ? d.getTime() : 0;
}

function startOfDay(ms: number): number {
  const d = new Date(ms || Date.now());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
