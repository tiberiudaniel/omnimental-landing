"use client";

import React from "react"; // default import kept for explicit React namespace if needed
import type { IndicatorChartKey } from "@/lib/indicators";

type RadarDataPoint = {
  key: IndicatorChartKey;
  label: string;
  value: number;
};

type RadarIndicatorsProps = {
  data: RadarDataPoint[];
  maxValue?: number;
  size?: "sm" | "md" | "lg";
};

const WEDGE_COLORS: Record<IndicatorChartKey, string> = {
  clarity: "#F2B84B",
  relationships: "#F28157",
  calm: "#D95032",
  energy: "#1E3A8A",
  performance: "#2B6F88",
  bodyHabits: "#7FAE92",
};

const clampValue = (value: number, max: number) => Math.max(0, Math.min(max, value));

export function RadarIndicators({ data, maxValue = 5, size = "md" }: RadarIndicatorsProps) {
  const normalized = data.map((point) => ({
    ...point,
    value: clampValue(point.value, maxValue),
    color: WEDGE_COLORS[point.key],
  }));

  const base = size === "sm" ? 220 : size === "lg" ? 360 : 320;
  const center = base / 2;
  const radius = center - 24;
  const total = normalized.length;
  const step = (Math.PI * 2) / total;
  const startOffset = -Math.PI / 2;

  const polarToCartesian = (angle: number, distance: number) => ({
    x: center + distance * Math.cos(angle),
    y: center + distance * Math.sin(angle),
  });

  const rings = Array.from({ length: maxValue }, (_, index) => {
    const ringRadius = radius * ((index + 1) / maxValue);
    return (
      <circle
        key={`ring-${ringRadius}`}
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke="rgba(44, 44, 44, 0.12)"
        strokeWidth={1.5}
      />
    );
  });

  const axes = normalized.map((_, index) => {
    const angle = startOffset + index * step;
    const { x, y } = polarToCartesian(angle, radius);
    return (
      <line
        key={`axis-${normalized[index].key}`}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="rgba(44, 44, 44, 0.2)"
        strokeWidth={1.25}
      />
    );
  });

  const wedges = normalized.map((point, index) => {
    if (point.value <= 0) {
      return null;
    }

    const startAngle = startOffset + index * step - step / 2;
    const endAngle = startAngle + step;
    const radiusValue = (point.value / maxValue) * radius;
    const startPoint = polarToCartesian(startAngle, radiusValue);
    const endPoint = polarToCartesian(endAngle, radiusValue);
    const midAngle = startAngle + step / 2;
    const labelDistance = Math.max(radiusValue + 18, radius * 0.55);
    const labelPoint = polarToCartesian(midAngle, labelDistance);
    const percent = Math.round((point.value / maxValue) * 100);

    const pathData = [
      `M ${center} ${center}`,
      `L ${startPoint.x} ${startPoint.y}`,
      `A ${radiusValue} ${radiusValue} 0 0 1 ${endPoint.x} ${endPoint.y}`,
      "Z",
    ].join(" ");

    return (
      <g key={`wedge-${point.key}`}>
        <path
          d={pathData}
          fill={point.color}
          fillOpacity={0.75}
          stroke={point.color}
          strokeWidth={1}
        />
        <g transform={`translate(${labelPoint.x}, ${labelPoint.y})`}>
          <circle r={16} fill="#FFFFFF" stroke="rgba(44,44,44,0.1)" strokeWidth={1} />
          <text
            textAnchor="middle"
            dy="0.35em"
            className="text-[10px] font-semibold"
            fill="#1F1F1F"
          >
            {percent}%
          </text>
        </g>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${base} ${base}`}
      className="mx-auto max-w-full"
      role="img"
      aria-label="Radar chart with key indicators"
    >
      <defs>
        <filter id="radarShadow" x="-50%" y="-50%" width="220%" height="220%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>
      {/* Inner card frame to match other cards */}
      <rect x="8" y="8" width={base - 16} height={base - 16} rx="14" ry="14" fill="#FFFFFF" stroke="rgba(44,44,44,0.06)" />
      <g filter="url(#radarShadow)">
        <circle cx={center} cy={center} r={radius} fill="rgba(255,255,255,0.9)" />
        {rings}
        {axes}
        {wedges}
      </g>
    </svg>
  );
}

export default RadarIndicators;
