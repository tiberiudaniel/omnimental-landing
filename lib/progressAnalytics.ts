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

function startOfWeekMonday(ms: number): number {
  const sod = startOfDay(ms);
  const d = new Date(sod);
  const dow = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
  // days since Monday (Mon=0, Sun=6)
  const sinceMon = (dow + 6) % 7;
  return sod - sinceMon * DAY_MS;
}

function startOfMonth(ms: number): number {
  const d = new Date(ms || Date.now());
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function daysInMonth(ms: number): number {
  const d = new Date(ms || Date.now());
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

export function extractSessions(facts: ProgressFact | null | undefined): PracticeSessionLite[] {
  return Array.isArray(facts?.practiceSessions) ? (facts!.practiceSessions as PracticeSessionLite[]) : [];
}

export function computeWeeklyBuckets(
  sessions: PracticeSessionLite[],
  referenceMs: number,
  lang?: string,
): { day: number; totalMin: number; label: string }[] {
  // Build buckets for calendar week starting Monday → Sunday
  const weekStart = startOfWeekMonday(referenceMs);
  const isEN = lang ? /^en/i.test(lang) : (typeof navigator !== "undefined" ? /^en/i.test(navigator.language || "") : false);
  const labels = isEN
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
  const buckets = new Array(7).fill(0).map((_, i) => ({
    day: weekStart + i * DAY_MS,
    totalMin: 0,
    label: labels[i] ?? "",
  }));
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < weekStart || ms > weekStart + 7 * DAY_MS - 1) return;
    const idx = Math.floor((startOfDay(ms) - weekStart) / DAY_MS);
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
  lang?: string,
): { day: number; totalMin: number; label: string }[] {
  const weekStart = startOfWeekMonday(referenceMs);
  const isEN = lang ? /^en/i.test(lang) : (typeof navigator !== "undefined" ? /^en/i.test(navigator.language || "") : false);
  const labels = isEN
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
  const buckets = new Array(7)
    .fill(0)
    .map((_, i) => ({ day: weekStart + i * DAY_MS, totalMin: 0, label: labels[i] ?? "" }));
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < weekStart || ms > weekStart + 7 * DAY_MS - 1) return;
    const idx = Math.floor((startOfDay(ms) - weekStart) / DAY_MS);
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].totalMin += 1; // reuse totalMin field to carry count (sessions) to charts
    }
  });
  return buckets;
}

export function computeMonthlyDailyMinutes(
  sessions: PracticeSessionLite[],
  referenceMs: number,
  lang?: string,
): { day: number; totalMin: number; label: string }[] {
  const start = startOfMonth(referenceMs);
  const totalDays = daysInMonth(referenceMs);
  const weekLabel = (n: number) => (lang && /^ro/i.test(lang) ? `Săptămâna ${n}` : `Week ${n}`);
  const arr = new Array(totalDays).fill(0).map((_, i) => {
    const day = start + i * DAY_MS;
    const dow = new Date(day).getDay();
    // Monday is start of week; if day is the first of the month, consider week 1
    const dayIndex = i; // 0-based
    // week number within month counting Mondays; compute by counting Mondays up to i
    const dateObj = new Date(day);
    const dateOfMonth = dateObj.getUTCDate();
    // compute Monday-based week number: 1 + number of Mondays passed so far
    let weekNo = 1;
    {
      const first = new Date(start);
      const len = dateOfMonth;
      for (let k = 1; k <= len; k += 1) {
        const dt = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), k));
        if (dt.getUTCDay() === 1 && k <= dateOfMonth) weekNo += 1;
      }
      // The loop sets weekNo to 1 + number of Mondays up to and including current date; subtract 1 to get correct
      weekNo = Math.max(1, weekNo - 1);
    }
    const label = (dow === 1 || dayIndex === 0) ? weekLabel(weekNo) : "";
    return { day, totalMin: 0, label };
  });
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start) return;
    const idx = Math.floor((startOfDay(ms) - start) / DAY_MS);
    if (idx >= 0 && idx < arr.length) arr[idx].totalMin += Math.max(0, Math.round((s.durationSec ?? 0) / 60));
  });
  return arr;
}

export function computeMonthlyDailyCounts(
  sessions: PracticeSessionLite[],
  referenceMs: number,
  lang?: string,
): { day: number; totalMin: number; label: string }[] {
  const start = startOfMonth(referenceMs);
  const totalDays = daysInMonth(referenceMs);
  const weekLabel = (n: number) => (lang && /^ro/i.test(lang) ? `Săptămâna ${n}` : `Week ${n}`);
  const arr = new Array(totalDays).fill(0).map((_, i) => {
    const day = start + i * DAY_MS;
    const dow = new Date(day).getDay();
    const dateObj = new Date(day);
    const dateOfMonth = dateObj.getUTCDate();
    let weekNo = 1;
    {
      const first = new Date(start);
      const len = dateOfMonth;
      for (let k = 1; k <= len; k += 1) {
        const dt = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), k));
        if (dt.getUTCDay() === 1 && k <= dateOfMonth) weekNo += 1;
      }
      weekNo = Math.max(1, weekNo - 1);
    }
    const label = (dow === 1 || i === 0) ? weekLabel(weekNo) : "";
    return { day, totalMin: 0, label };
  });
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start) return;
    const idx = Math.floor((startOfDay(ms) - start) / DAY_MS);
    if (idx >= 0 && idx < arr.length) arr[idx].totalMin += 1;
  });
  return arr;
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
