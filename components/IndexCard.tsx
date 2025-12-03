"use client";

type Props = {
  title: string;
  value: number;
  unit?: string;
  spark?: number[]; // 7 points
  accent?: string; // hex color
};

export default function IndexCard({ title, value, unit, spark = [], accent = "var(--omni-muted)" }: Props) {
  const w = 120;
  const h = 28;
  const max = Math.max(1, ...spark);
  const pts = spark.map((v, i) => {
    const x = (i / Math.max(1, spark.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });
  const path = pts.length ? `M ${pts[0]} L ${pts.slice(1).join(" ")}` : "";
  return (
    <div className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-4 shadow flex flex-col justify-between min-h-[120px]">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-[var(--omni-ink)]">{title}</h4>
        <div className="text-[28px] font-semibold text-[var(--omni-ink)]">
          {Math.round(value)}{unit ? <span className="ml-1 text-[13px] align-middle text-[var(--omni-muted)]">{unit}</span> : null}
        </div>
      </div>
      <div className="mt-2">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
          <polyline fill="none" stroke="#F0E6DB" strokeWidth="2" points={`0,${h} ${w},${h}`} />
          {path ? <path d={path} stroke={accent} strokeWidth={2} fill="none" /> : null}
        </svg>
        <div className="mt-3 h-[3px] w-full rounded bg-[#F0E6DB]">
          <div className="h-[3px] rounded" style={{ width: `${Math.max(0, Math.min(100, Math.round(value)))}%`, backgroundColor: accent }} />
        </div>
      </div>
    </div>
  );
}
