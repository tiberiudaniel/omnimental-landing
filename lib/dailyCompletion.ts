const COMPLETION_PREFIX = "OMNI_DAILY_COMPLETED_";
const LAST_COMPLETION_KEY = "OMNI_DAILY_LAST_COMPLETION";
const TRIED_EXTRA_PREFIX = "OMNI_DAILY_TRIED_EXTRA_";

export type DailyCompletionRecord = {
  completedAt: string;
  moduleKey: string | null;
};

export function getTodayKey(date: Date = new Date()): string {
  try {
    return date.toLocaleDateString("en-CA");
  } catch {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

export function markDailyCompletion(moduleKey: string | null = null, date: Date = new Date()): void {
  if (typeof window === "undefined") return;
  const record: DailyCompletionRecord = {
    completedAt: date.toISOString(),
    moduleKey,
  };
  try {
    window.localStorage.setItem(`${COMPLETION_PREFIX}${getTodayKey(date)}`, JSON.stringify(record));
    window.localStorage.setItem(LAST_COMPLETION_KEY, JSON.stringify(record));
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
