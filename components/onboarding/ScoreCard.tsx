"use client";

export default function ScoreCard({ raw, max, title = 'Scor Mini‑Cuno' }: { raw: number; max: number; title?: string }) {
  const pct = max ? Math.round((raw / max) * 100) : 0;
  return (
    <div className="rounded-[14px] border border-[#E4DAD1] bg-[#FFFBF7] p-6 text-center shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{title}</p>
      <p className="mt-2 text-4xl font-bold text-[#C24B17]">{pct}%</p>
      <p className="mt-1 text-sm text-[#4A3A30]">{raw} / {max} răspunsuri corecte</p>
    </div>
  );
}
