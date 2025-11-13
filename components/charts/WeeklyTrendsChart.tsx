"use client";

type Point = { day: number; totalMin: number; label?: string };

export default function WeeklyTrendsChart({ data, accent = "#7A6455" }: { data: Point[]; accent?: string }) {
  const w = 280;
  const h = 120;
  const padding = 12;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;
  const max = Math.max(1, ...data.map((d) => d.totalMin));
  const bars = data.map((d, i) => {
    const bw = innerW / data.length - 6;
    const x = padding + i * (innerW / data.length) + 3;
    const bh = Math.round((d.totalMin / max) * innerH);
    const y = padding + (innerH - bh);
    return { x, y, bw, bh };
  });
  const points = data.map((d, i) => {
    const x = padding + i * (innerW / (data.length - 1 || 1));
    const y = padding + (innerH - (d.totalMin / max) * innerH);
    return `${x},${y}`;
  });
  const path = points.length ? `M ${points[0]} L ${points.slice(1).join(" ")}` : "";
  return (
    <svg width={w} height={h} className="block">
      {bars.map((b, i) => (
        <rect key={`b-${i}`} x={b.x} y={b.y} width={b.bw} height={b.bh} fill="#F0E6DB" rx={2} />
      ))}
      {path ? <path d={path} stroke={accent} strokeWidth={2} fill="none" /> : null}
      {data.map((d, i) => (
        <text
          key={`t-${i}`}
          x={bars[i]?.x + (bars[i]?.bw || 0) / 2}
          y={h - 2}
          textAnchor="middle"
          fontSize={10}
          fill="#7B6B60"
        >
          {d.label ?? ""}
        </text>
      ))}
    </svg>
  );
}
