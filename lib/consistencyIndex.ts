export function computeConsistencyIndexFromDates(dates: Date[]): number {
  if (!dates?.length) return 0;
  const now = Date.now();
  const start = now - 14 * 24 * 60 * 60 * 1000;
  const days = new Set<string>();
  for (const raw of dates) {
    const d = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    if (d.getTime() < start) continue;
    days.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`);
  }
  const ratio = Math.max(0, Math.min(1, days.size / 14));
  return Math.round(ratio * 100);
}
