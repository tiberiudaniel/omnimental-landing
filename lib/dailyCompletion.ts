import { getWowDayIndex } from "@/config/dailyPaths/wow";
import { recordFoundationCycleComplete } from "@/lib/progressFacts/recorders";
import { getTodayKey as getCanaryTodayKey } from "@/lib/time/todayKey";

const COMPLETION_PREFIX = "OMNI_DAILY_COMPLETED_";
const LAST_COMPLETION_KEY = "OMNI_DAILY_LAST_COMPLETION";
const TRIED_EXTRA_PREFIX = "OMNI_DAILY_TRIED_EXTRA_";
const FOUNDATION_DONE_KEY = "OMNI_FOUNDATION_DONE";
const FOUNDATION_SYNCED_KEY = "OMNI_FOUNDATION_SYNCED";

export type DailyCompletionRecord = {
  completedAt: string;
  moduleKey: string | null;
};

export const getTodayKey = getCanaryTodayKey;

export function markDailyCompletion(moduleKey: string | null = null, date: Date = new Date()): void {
  if (typeof window === "undefined") return;
  const record: DailyCompletionRecord = {
    completedAt: date.toISOString(),
    moduleKey,
  };
  try {
    window.localStorage.setItem(`${COMPLETION_PREFIX}${getTodayKey(date)}`, JSON.stringify(record));
    window.localStorage.setItem(LAST_COMPLETION_KEY, JSON.stringify(record));
    if (moduleKey && getWowDayIndex(moduleKey) === 15) {
      window.localStorage.setItem(FOUNDATION_DONE_KEY, "1");
      syncFoundationCompletionFlag();
    }
  } catch (error) {
    console.warn("Failed to persist local daily completion", error);
  }
}

export function hasCompletedToday(date: Date = new Date()): boolean {
  if (typeof window === "undefined") return false;
  const payload = window.localStorage.getItem(`${COMPLETION_PREFIX}${getTodayKey(date)}`);
  return Boolean(payload);
}

export function readLastCompletion(): DailyCompletionRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const payload = window.localStorage.getItem(LAST_COMPLETION_KEY);
    return payload ? (JSON.parse(payload) as DailyCompletionRecord) : null;
  } catch {
    return null;
  }
}

export function getTodayModuleKey(date: Date = new Date()): string | null {
  if (typeof window === "undefined") return null;
  try {
    const payload = window.localStorage.getItem(`${COMPLETION_PREFIX}${getTodayKey(date)}`);
    if (!payload) return null;
    const record = JSON.parse(payload) as DailyCompletionRecord;
    return record?.moduleKey ?? null;
  } catch {
    return null;
  }
}

export function clearDailyCompletion(date: Date = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${COMPLETION_PREFIX}${getTodayKey(date)}`);
  } catch {
    // ignore
  }
}

export function getTriedExtraToday(date: Date = new Date()): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(`${TRIED_EXTRA_PREFIX}${getTodayKey(date)}`));
}

export function setTriedExtraToday(value: boolean, date: Date = new Date()): void {
  if (typeof window === "undefined") return;
  const key = `${TRIED_EXTRA_PREFIX}${getTodayKey(date)}`;
  try {
    if (value) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("Failed to persist tried extra flag", error);
  }
}

export function hasFoundationCycleCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(FOUNDATION_DONE_KEY) === "1";
}

export function syncFoundationCompletionFlag() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(FOUNDATION_DONE_KEY) !== "1") return;
  if (window.localStorage.getItem(FOUNDATION_SYNCED_KEY) === "1") return;
  void recordFoundationCycleComplete().then(
    () => {
      try {
        window.localStorage.setItem(FOUNDATION_SYNCED_KEY, "1");
      } catch {
        // ignore
      }
    },
    (error) => {
      console.warn("Failed to sync foundation completion", error);
    },
  );
}

export function getLocalCompletionStreak(maxDays = 30, referenceDate: Date = new Date()): number {
  let streak = 0;
  let cursor = new Date(referenceDate.getTime());
  for (let i = 0; i < maxDays; i += 1) {
    if (!hasCompletedToday(cursor)) break;
    streak += 1;
    cursor = new Date(cursor.getTime());
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
