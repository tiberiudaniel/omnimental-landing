"use client";

type Props = {
  reflectionMin: number;
  breathingMin: number;
  drillMin: number;
  labelReflection?: string;
  labelBreathing?: string;
  labelDrill?: string;
};

export default function ActivitiesDonut({ reflectionMin, breathingMin, drillMin, labelReflection = "Reflection", labelBreathing = "Breathing", labelDrill = "Drill" }: Props) {
  const total = Math.max(0, reflectionMin + breathingMin + drillMin);
  const size = 120;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const pRef = pct(reflectionMin);
  const pBre = pct(breathingMin);
  const pDrl = Math.max(0, 100 - pRef - pBre);
  const bg = total > 0
    ? `conic-gradient(var(--omni-muted) 0 ${pRef}%, #4D3F36 ${pRef}% ${pRef + pBre}%, #CDB7A9 ${pRef + pBre}% 100%)`
    : `conic-gradient(#EDE3D9 0 100%)`;
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid place-items-center rounded-full"
        style={{ width: size, height: size, background: bg }}
        aria-label="Activities distribution"
        role="img"
        title={`Reflection ${pRef}% • Breathing ${pBre}% • Drill ${pDrl}%`}
      >
        <div className="absolute h-[64px] w-[64px] rounded-full bg-[var(--omni-surface-card)]" />
        <div className="text-[18px] font-semibold text-[var(--omni-ink)]">{total}</div>
        <div className="text-[11px] uppercase tracking-wider text-[var(--omni-muted)]">min</div>
      </div>
      <div className="space-y-1 text-[12px] text-[var(--omni-ink)]">
        <div className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: 'var(--omni-muted)' }} />{labelReflection}: <strong>{pRef}%</strong></div>
        <div className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#4D3F36' }} />{labelBreathing}: <strong>{pBre}%</strong></div>
        <div className="inline-flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#CDB7A9' }} />{labelDrill}: <strong>{pDrl}%</strong></div>
      </div>
    </div>
  );
}
