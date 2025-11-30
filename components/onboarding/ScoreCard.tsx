"use client";

export default function ScoreCard({ raw, max, title = 'Scor Mini‑Cuno' }: { raw: number; max: number; title?: string }) {
  const pct = max ? Math.round((raw / max) * 100) : 0;
  return (
    <div className="rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 text-center shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">{title}</p>
      <p className="mt-2 text-4xl font-bold text-[var(--omni-energy-soft)]">{pct}%</p>
      <p className="mt-1 text-sm text-[var(--omni-ink-soft)]">{raw} / {max} răspunsuri corecte</p>
    </div>
  );
}
