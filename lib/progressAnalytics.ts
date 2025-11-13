import type { ProgressFact } from "@/lib/progressFacts";

export type PracticeSessionLite = {
  type: "reflection" | "breathing" | "drill";
  startedAt?: unknown;
  endedAt?: unknown;
  durationSec?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isTimestamp(v: unknown): v is { toDate: () => Date } {
  return Boolean(v) && typeof (v as { toDate?: () => Date }).toDate === "function";
}

function toMs(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  if (isTimestamp(ts)) return ts.toDate().getTime();
  return 0;
}

function startOfDay(ms: number): number {
  const d = new Date(ms || Date.now());
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function extractSessions(facts: ProgressFact | null | undefined): PracticeSessionLite[] {
  return Array.isArray(facts?.practiceSessions) ? (facts!.practiceSessions as PracticeSessionLite[]) : [];
}

export function computeWeeklyBuckets(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { day: number; totalMin: number; label: string }[] {
  const end = startOfDay(referenceMs);
  const start = end - 6 * DAY_MS;
  const isEN = typeof navigator !== "undefined" ? /^en/i.test(navigator.language || "") : false;
  const labels = isEN
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  const buckets = new Array(7).fill(0).map((_, i) => {
    const day = start + i * DAY_MS;
    const dow = new Date(day).getDay();
    const label = labels[dow] ?? "";
    return { day, totalMin: 0, label };
  });
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > end + DAY_MS - 1) return;
    const idx = Math.floor((startOfDay(ms) - start) / DAY_MS);
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].totalMin += Math.max(0, Math.round((s.durationSec ?? 0) / 60));
    }
  });
  return buckets;
}

export function computeTodayBucket(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { day: number; totalMin: number; label: string }[] {
  const start = startOfDay(referenceMs);
  const end = start + DAY_MS - 1;
  let total = 0;
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > end) return;
    total += Math.max(0, Math.round((s.durationSec ?? 0) / 60));
  });
  const isEN = typeof navigator !== "undefined" ? /^en/i.test(navigator.language || "") : false;
  const label = isEN ? "Today" : "Azi";
  return [{ day: start, totalMin: total, label }];
}

export function computeWeeklyCounts(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { day: number; totalMin: number }[] {
  const end = startOfDay(referenceMs);
  const start = end - 6 * DAY_MS;
  const buckets = new Array(7).fill(0).map((_, i) => ({ day: start + i * DAY_MS, totalMin: 0 }));
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > end + DAY_MS - 1) return;
    const idx = Math.floor((startOfDay(ms) - start) / DAY_MS);
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].totalMin += 1; // reuse totalMin field to carry count to charts
    }
  });
  return buckets;
}

export function filterSessionsByType(
  sessions: PracticeSessionLite[],
  type: "reflection" | "breathing" | "drill",
): PracticeSessionLite[] {
  return sessions.filter((s) => s.type === type);
}

export function computeDistribution(sessions: PracticeSessionLite[]): {
  reflection: number; breathing: number; drill: number; total: number;
} {
  let r = 0, b = 0, d = 0;
  sessions.forEach((s) => {
    const m = Math.max(0, Math.round((s.durationSec ?? 0) / 60));
    if (s.type === "reflection") r += m;
    else if (s.type === "breathing") b += m;
    else if (s.type === "drill") d += m;
  });
  const total = r + b + d;
  return { reflection: r, breathing: b, drill: d, total };
}

export function computeStreak(
  sessions: PracticeSessionLite[],
  referenceMs: number,
  minPerDay = 3,
  lookbackDays = 30,
): { current: number; best: number } {
  const end = startOfDay(referenceMs);
  const start = end - (lookbackDays - 1) * DAY_MS;
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
  for (let i = 0; i < lookbackDays; i += 1) {
    const day = start + i * DAY_MS;
    const ok = (map[day] || 0) >= minPerDay;
    if (ok) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  // current streak = how many days up to end
  let current = 0;
  for (let i = 0; i < lookbackDays; i += 1) {
    const day = end - i * DAY_MS;
    if ((map[day] || 0) >= minPerDay) current += 1;
    else break;
  }
  return { current, best };
}

export function computeTodayCounts(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { day: number; totalMin: number; label: string }[] {
  const start = startOfDay(referenceMs);
  const end = start + DAY_MS - 1;
  let total = 0;
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > end) return;
    total += 1; // count sessions
  });
  const isEN = typeof navigator !== "undefined" ? /^en/i.test(navigator.language || "") : false;
  const label = isEN ? "Today" : "Azi";
  return [{ day: start, totalMin: total, label }];
}
