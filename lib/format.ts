export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Deterministic UTC short format to avoid hydration mismatches
export function formatUtcShort(ms: number | Date | undefined | null): string {
  if (!ms) return "—";
  const t = ms instanceof Date ? ms.getTime() : Number(ms);
  if (!Number.isFinite(t)) return "—";
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());
  return `${y}-${m}-${day} ${hh}:${mm} UTC`;
}

