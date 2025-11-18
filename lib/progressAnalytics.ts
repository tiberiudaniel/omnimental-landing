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

// Note: week/month helpers removed when switching to rolling windows

function daysInMonth(ms: number): number {
  // Local month length
  const d = new Date(ms || Date.now());
  const y = d.getFullYear();
  const m = d.getMonth();
  return new Date(y, m + 1, 0).getDate();
}

export function extractSessions(facts: ProgressFact | null | undefined): PracticeSessionLite[] {
  return Array.isArray(facts?.practiceSessions) ? (facts!.practiceSessions as PracticeSessionLite[]) : [];
}

export function computeWeeklyBuckets(
  sessions: PracticeSessionLite[],
  referenceMs: number,
  lang?: string,
): { day: number; totalMin: number; label: string }[] {
  // Last 7 consecutive days ending today (not calendar week)
  const start = startOfDay(referenceMs - 6 * DAY_MS);
  const isEN = lang ? /^en/i.test(lang) : (typeof navigator !== "undefined" ? /^en/i.test(navigator.language || "") : false);
  const weekday = (ms: number) => {
    const d = new Date(ms).getDay();
    const ro = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"]; // 0..6
    const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return isEN ? en[d] : ro[d];
  };
  const buckets = new Array(7).fill(0).map((_, i) => {
    const day = start + i * DAY_MS;
    return { day, totalMin: 0, label: weekday(day) };
  });
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > start + 7 * DAY_MS - 1) return;
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
  lang?: string,
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
  const isEN = lang ? /^en/i.test(lang) : false;
  const label = isEN ? "Today" : "Azi";
  return [{ day: start, totalMin: total, label }];
}

export function computeWeeklyCounts(
  sessions: PracticeSessionLite[],
  referenceMs: number,
  lang?: string,
): { day: number; totalMin: number; label: string }[] {
  const start = startOfDay(referenceMs - 6 * DAY_MS);
  const isEN = lang ? /^en/i.test(lang) : (typeof navigator !== "undefined" ? /^en/i.test(navigator.language || "") : false);
  const weekday = (ms: number) => {
    const d = new Date(ms).getDay();
    const ro = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"]; // 0..6
    const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return isEN ? en[d] : ro[d];
  };
  const buckets = new Array(7).fill(0).map((_, i) => {
    const day = start + i * DAY_MS;
    return { day, totalMin: 0, label: weekday(day) };
  });
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > start + 7 * DAY_MS - 1) return;
    const idx = Math.floor((startOfDay(ms) - start) / DAY_MS);
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].totalMin += 1; // reuse totalMin to carry count
    }
  });
  return buckets;
}

export function computeMonthlyDailyMinutes(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { day: number; totalMin: number; label: string }[] {
  // Rolling window: last N days ending today, where N = days in current month
  const todaySod = startOfDay(referenceMs);
  const n = daysInMonth(referenceMs);
  const start = todaySod - (n - 1) * DAY_MS;
  const arr = new Array(n).fill(0).map((_, i) => {
    const day = start + i * DAY_MS;
    const dateObj = new Date(day);
    const label = String(dateObj.getDate());
    return { day, totalMin: 0, label };
  });
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > todaySod + DAY_MS - 1) return;
    const idx = Math.floor((startOfDay(ms) - start) / DAY_MS);
    if (idx >= 0 && idx < arr.length) arr[idx].totalMin += Math.max(0, Math.round((s.durationSec ?? 0) / 60));
  });
  return arr;
}

export function computeMonthlyDailyCounts(
  sessions: PracticeSessionLite[],
  referenceMs: number,
): { day: number; totalMin: number; label: string }[] {
  // Rolling window: last N days ending today, where N = days in current month
  const todaySod = startOfDay(referenceMs);
  const n = daysInMonth(referenceMs);
  const start = todaySod - (n - 1) * DAY_MS;
  const arr = new Array(n).fill(0).map((_, i) => {
    const day = start + i * DAY_MS;
    const dateObj = new Date(day);
    const label = String(dateObj.getDate());
    return { day, totalMin: 0, label };
  });
  sessions.forEach((s) => {
    const ms = toMs(s.startedAt);
    if (!ms) return;
    if (ms < start || ms > todaySod + DAY_MS - 1) return;
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

// --------------------
// Action trend (scored 0–100 per day) per spec in DOCS/DOCS/grafic-trendul-actiunilor.md
// --------------------
export type ActivityCategory = "knowledge" | "practice" | "reflection";
export type ActivityEvent = {
  startedAt: Date | string | number;
  durationMin?: number;
  units?: number;
  source: "omnikuno" | "omniabil" | "breathing" | "journal" | "drill" | "slider" | "other";
  category: ActivityCategory;
  focusTag?: string;
};

const DEFAULT_MIN_PER_UNIT: Record<ActivityCategory, number> = {
  knowledge: 6,
  practice: 8,
  reflection: 4,
};
const CATEGORY_WEIGHTS: Record<ActivityCategory, number> = {
  knowledge: 0.8,
  practice: 1.5,
  reflection: 1.1,
};
const FOCUS_MATCH_WEIGHT = 1.0;
const FOCUS_MISMATCH_WEIGHT = 0.5;
function focusWeight(ev: ActivityEvent, currentFocusTag?: string) {
  if (!currentFocusTag || !ev.focusTag) return 1.0;
  return ev.focusTag === currentFocusTag ? FOCUS_MATCH_WEIGHT : FOCUS_MISMATCH_WEIGHT;
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const DAILY_TARGET = 30; // 30 weighted minutes ≈ 100
const toActionScore = (mins: number) => Math.round(clamp01(mins / DAILY_TARGET) * 100);

export function computeActionTrend(
  events: ActivityEvent[],
  refMs: number,
  lang: string,
  days: number,
  currentFocusTag?: string,
): { day: number; totalMin: number; label: string }[] {
  const DAY = 24 * 60 * 60 * 1000;
  const start = startOfDay(refMs - (days - 1) * DAY);
  const arr: { day: number; totalMin: number; label: string }[] = [];
  for (let i = 0; i < days; i += 1) {
    const dayStart = start + i * DAY;
    const dayEnd = dayStart + DAY;
    const list = events.filter((ev) => {
      const ms = toMs(ev.startedAt);
      return ms >= dayStart && ms < dayEnd;
    });
    let weighted = 0;
    for (const ev of list) {
      const base = typeof ev.durationMin === 'number' && Number.isFinite(ev.durationMin)
        ? Math.max(0, ev.durationMin)
        : Math.max(0, (ev.units || 1) * DEFAULT_MIN_PER_UNIT[ev.category]);
      const wCat = CATEGORY_WEIGHTS[ev.category];
      const wF = focusWeight(ev, currentFocusTag);
      weighted += base * wCat * wF;
    }
    const score = toActionScore(weighted);
    const d = new Date(dayStart);
    const label = String(d.getDate());
    arr.push({ day: dayStart, totalMin: score, label });
  }
  return arr;
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
  lang?: string,
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
  const isEN = lang ? /^en/i.test(lang) : false;
  const label = isEN ? "Today" : "Azi";
  return [{ day: start, totalMin: total, label }];
}
