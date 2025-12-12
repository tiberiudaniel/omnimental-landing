import type { FieldValue, Timestamp } from "firebase/firestore";
import type { DailyPracticeDoc } from "@/types/dailyPractice";

type DayKeyInput =
  | string
  | number
  | Date
  | Timestamp
  | FieldValue
  | { toDate?: () => Date }
  | null
  | undefined;

const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatUtcDay(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toUtcDayKey(value: DayKeyInput): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    if (DAY_KEY_REGEX.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : formatUtcDay(parsed);
  }
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    date = new Date(value);
  } else if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    date = (value as { toDate: () => Date }).toDate();
  }
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }
  return formatUtcDay(date);
}

export function daysBetween(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  return Math.round((fromDate.getTime() - toDate.getTime()) / 86400000);
}

function timestampToMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
  return 0;
}

function pickPreferredEntry(
  current: DailyPracticeDoc | undefined,
  candidate: DailyPracticeDoc,
): DailyPracticeDoc {
  if (!current) return candidate;
  if (current.completed !== candidate.completed) {
    return candidate.completed ? candidate : current;
  }
  if (candidate.completed && current.completed) {
    const currentCompletedMs = timestampToMs(current.completedAt) || timestampToMs(current.startedAt);
    const candidateCompletedMs = timestampToMs(candidate.completedAt) || timestampToMs(candidate.startedAt);
    if (candidateCompletedMs >= currentCompletedMs) {
      return candidate;
    }
    return current;
  }
  const currentStartedMs = timestampToMs(current.startedAt);
  const candidateStartedMs = timestampToMs(candidate.startedAt);
  return candidateStartedMs >= currentStartedMs ? candidate : current;
}

export function normalizeDailyEntries(entries: DailyPracticeDoc[]): Array<{
  dayKey: string;
  entry: DailyPracticeDoc;
}> {
  const byDay = new Map<string, DailyPracticeDoc>();
  entries.forEach((entry) => {
    const dayKey = toUtcDayKey(entry.date) ?? toUtcDayKey(entry.startedAt);
    if (!dayKey) return;
    const existing = byDay.get(dayKey);
    const preferred = pickPreferredEntry(existing, entry);
    byDay.set(dayKey, preferred);
  });
  return Array.from(byDay.keys())
    .sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
    .map((dayKey) => ({ dayKey, entry: byDay.get(dayKey)! }));
}

export function sortEntriesByDayDesc(entries: DailyPracticeDoc[]): DailyPracticeDoc[] {
  const withDayKeys = entries
    .map((entry) => ({
      dayKey: toUtcDayKey(entry.date) ?? toUtcDayKey(entry.startedAt),
      entry,
    }))
    .filter((pair): pair is { dayKey: string; entry: DailyPracticeDoc } => Boolean(pair.dayKey));
  return withDayKeys
    .sort((a, b) => (a.dayKey > b.dayKey ? -1 : a.dayKey < b.dayKey ? 1 : 0))
    .map((pair) => pair.entry);
}

/**
 * Computes the number of consecutive completed days, applying the following contract:
 * - A day counts only if its preferred entry is completed === true.
 * - Days are compared using canonical UTC keys (YYYY-MM-DD).
 * - Duplicate rows for the same day use a deterministic tie-breaker:
 *   prefer completed entries, otherwise prefer the entry with the latest completedAt,
 *   otherwise the latest startedAt.
 * - The streak breaks when there is a gap of at least one missing calendar day between
 *   consecutive completed entries.
 */
export function countConsecutiveDaysOnCluster(entries: DailyPracticeDoc[]): number {
  const normalized = normalizeDailyEntries(entries);
  let streak = 0;
  let previousDay: string | null = null;
  for (const { dayKey, entry } of normalized) {
    if (!entry.completed) {
      if (streak > 0) break;
      continue;
    }
    if (streak === 0) {
      streak = 1;
      previousDay = dayKey;
      continue;
    }
    if (!previousDay) {
      previousDay = dayKey;
      continue;
    }
    const diff = Math.abs(daysBetween(previousDay, dayKey));
    if (diff === 1) {
      streak += 1;
      previousDay = dayKey;
    } else {
      break;
    }
  }
  return streak;
}
