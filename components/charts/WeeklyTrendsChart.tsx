"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ReactNode } from "react";

type Point = {
  day: number | string | Date;
  totalMin: number;
  label?: string;
};

type SeriesConfig = {
  data: Point[];
  accent?: string;
  strokeWidth?: number;
};

type WeeklyTrendsChartProps = {
  data: Point[];              // single-series compatibility
  series?: SeriesConfig[];    // multi-line (clarity, calm, energy)
  showBars?: boolean;         // ignored for now; kept for prop compatibility
  showValues?: boolean;
  ariaLabel?: string;
};

function normalizeDay(day: Point["day"]): string {
  if (day instanceof Date) return day.getTime().toString();
  if (typeof day === "number") return day.toString();
  return String(day);
}

export default function WeeklyTrendsChart({
  data,
  series,
  showBars = false,
  showValues = false,
  ariaLabel = "Trend chart",
}: WeeklyTrendsChartProps) {
  const multiSeries: SeriesConfig[] =
    series && series.length
      ? series
      : [
          {
            data,
            accent: "#C07963",
            strokeWidth: 2,
          },
        ];

  const base = data.map((p) => ({
    ...p,
    _x: p.label ?? normalizeDay(p.day),
  }));

  const rows = base.map((p, idx) => {
    const row: Record<string, unknown> = {
      _x: p._x,
    };
    multiSeries.forEach((s, sIdx) => {
      const src = s.data[idx];
      row[`s${sIdx}`] = src ? src.totalMin : 0;
    });
    return row;
  });

  const tooltipFormatter = (value: unknown, name: string): [string, ReactNode] => {
    const idx = Number(name.replace("s", ""));
    const s = multiSeries[idx];
    return [`${value}`, s ? `Linia ${idx + 1}` : name];
  };

  return (
    <div role="img" aria-label={ariaLabel} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="_x" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip formatter={tooltipFormatter} labelStyle={{ fontSize: 10 }} contentStyle={{ fontSize: 10 }} />
          {/* Bars only for single-series usage */}
          {(!series || series.length === 0) && showBars ? (
            <Bar dataKey="s0" fill="#F0E6DB" radius={[3,3,0,0]} />
          ) : null}
          {multiSeries.map((s, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={`s${idx}`}
              stroke={s.accent ?? "#C07963"}
              strokeWidth={s.strokeWidth ?? 2}
              dot={false}
              activeDot={showValues ? { r: 3 } : { r: 2 }}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
