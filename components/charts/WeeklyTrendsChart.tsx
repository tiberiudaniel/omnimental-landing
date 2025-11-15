"use client";

import { useEffect, useRef, useState } from "react";

type Point = { day: number; totalMin: number; label?: string };

export default function WeeklyTrendsChart({
  data,
  accent = "#7A6455",
  showValues = true,
  ariaLabel,
}: {
  data: Point[];
  accent?: string;
  showValues?: boolean;
  ariaLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 320, h: 140 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    if (typeof window === 'undefined' || !('ResizeObserver' in window)) return;
    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ w: Math.max(220, cr.width), h: Math.max(110, cr.height) });
      }
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setSize({ w: Math.max(220, rect.width), h: Math.max(110, rect.height) });
    return () => ro.disconnect();
  }, []);

  const padding = 12;
  const w = Math.round(size.w);
  const h = Math.round(size.h);
  const innerW = Math.max(1, w - padding * 2);
  const innerH = Math.max(1, h - padding * 2);
  const max = Math.max(1, ...data.map((d) => d.totalMin));
  const bars = data.map((d, i) => {
    const step = innerW / Math.max(1, data.length);
    const bw = Math.max(2, Math.floor(step * 0.6));
    const x = padding + i * step + Math.max(0, (step - bw) / 2);
    const bh = Math.round((d.totalMin / max) * innerH);
    const y = padding + (innerH - bh);
    return { x, y, bw, bh, value: d.totalMin };
  });
  const points = data.map((d, i) => {
    const x = padding + i * (innerW / (data.length - 1 || 1));
    const y = padding + (innerH - (d.totalMin / max) * innerH);
    return `${x},${y}`;
  });
  const path = points.length ? `M ${points[0]} L ${points.slice(1).join(" ")}` : "";

  return (
    <div ref={wrapRef} className="h-full w-full">
      <svg width={w} height={h} className="block" role="img" aria-label={ariaLabel ?? "Weekly trend"}>
        {bars.map((b, i) => (
          <g key={`b-${i}`}>
            <rect x={b.x} y={b.y} width={b.bw} height={b.bh} fill="#F0E6DB" rx={2} />
            <title>{`${data[i]?.label ?? ''} ${Math.round(data[i]?.totalMin ?? 0)}`.trim()}</title>
          </g>
        ))}
        {path ? <path d={path} stroke={accent} strokeWidth={2} fill="none" /> : null}
        {showValues
          ? bars.map((b, i) => (
              <text
                key={`v-${i}`}
                x={b.x + b.bw / 2}
                y={Math.max(10, b.y - 4)}
                textAnchor="middle"
                fontSize={10}
                fill="#7B6B60"
              >
                {Math.round(b.value)}
              </text>
            ))
          : null}
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
    </div>
  );
}
