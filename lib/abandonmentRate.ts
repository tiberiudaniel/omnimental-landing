import type { DailyPathMode } from "@/types/dailyPath";

export interface AbandonmentEntry {
  dayKey: string;
  completed: boolean;
  mode?: DailyPathMode;
}

export interface AbandonmentFilter {
  mode?: DailyPathMode;
  lastNDays?: number;
}

function sanitizeEntries(entries: AbandonmentEntry[]): AbandonmentEntry[] {
  return entries.filter((entry) => Boolean(entry?.dayKey));
}

export function computeAbandonRate(
  entries: AbandonmentEntry[],
  filter?: AbandonmentFilter,
): number | null {
  if (!entries?.length) return null;
  let working = sanitizeEntries(entries);
  if (!working.length) return null;

  working = [...working].sort((a, b) => b.dayKey.localeCompare(a.dayKey));

  if (filter?.mode) {
    working = working.filter((entry) => entry.mode === filter.mode);
  }

  if (filter?.lastNDays && Number.isFinite(filter.lastNDays) && filter.lastNDays > 0) {
    working = working.slice(0, Math.floor(filter.lastNDays));
  }

  if (!working.length) return null;

  let completedDays = 0;
  let abandonedDays = 0;
  working.forEach((entry) => {
    if (entry.completed) completedDays += 1;
    else abandonedDays += 1;
  });
  const total = completedDays + abandonedDays;
  if (total === 0) return null;
  return abandonedDays / total;
}
