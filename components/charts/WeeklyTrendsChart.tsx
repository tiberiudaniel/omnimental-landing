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
  LabelList,
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
  showXAxisBaseline?: boolean;
  ariaLabel?: string;
  yAxisWidth?: number;        // tweakable reserved width for Y axis (reduces left gutter)
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
  showXAxisBaseline = false,
  ariaLabel = "Trend chart",
  yAxisWidth = 28,
}: WeeklyTrendsChartProps) {
  const multiSeries: SeriesConfig[] =
    series && series.length
      ? series
      : [
          {
            data,
            accent: "var(--omni-energy)",
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
        <ComposedChart data={rows} margin={{ top: 14, right: 6, bottom: 6, left: 2 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="_x" tick={{ fontSize: 9 }} axisLine={showXAxisBaseline} tickLine={false} tickMargin={2} />
          <YAxis width={yAxisWidth} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <Tooltip formatter={tooltipFormatter} labelStyle={{ fontSize: 10 }} contentStyle={{ fontSize: 10 }} />
          {/* Bars only for single-series usage */}
          {(!series || series.length === 0) && showBars ? (
            <Bar dataKey="s0" fill="#F4B890" radius={[4,4,0,0]}>
              {showValues ? (
                <LabelList dataKey="s0" position="top" offset={6} style={{ fontSize: 10, fill: "#7B6B60" }} />
              ) : null}
            </Bar>
          ) : null}
          {multiSeries.map((s, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={`s${idx}`}
              stroke={s.accent ?? "var(--omni-energy)"}
              strokeWidth={s.strokeWidth ?? 2}
              dot={false}
              activeDot={showValues ? { r: 3 } : { r: 2 }}
              isAnimationActive={false}
            >
              {showValues ? (
                <LabelList dataKey={`s${idx}`} position="top" offset={6} style={{ fontSize: 10, fill: "#7B6B60" }} />
              ) : null}
            </Line>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
