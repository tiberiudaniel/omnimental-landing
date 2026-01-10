const CANARY_TIME_ZONE = "Atlantic/Canary";

const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CANARY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getTodayKey(date: Date = new Date()): string {
  return formatter.format(date);
}
