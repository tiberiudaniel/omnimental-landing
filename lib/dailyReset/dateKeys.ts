import { getTodayKey } from "@/lib/time/todayKey";

const toDateKey = (date: Date) => getTodayKey(date);

const getPreviousDateKey = (dateKey: string | null | undefined) => {
  if (!dateKey) return null;
  const parts = dateKey.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((segment) => Number(segment));
  if ([year, month, day].some((unit) => Number.isNaN(unit))) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return toDateKey(date);
};

export function getDailyResetPreviousDateKey(dateKey: string | null | undefined) {
  return getPreviousDateKey(dateKey);
}

export function resolveDailyResetKeys(now: Date = new Date()) {
  const todayKey = toDateKey(now);
  const yesterdayKey = getPreviousDateKey(todayKey);
  return { todayKey, yesterdayKey };
}
