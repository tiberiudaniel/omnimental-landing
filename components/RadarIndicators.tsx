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
  ringSteps?: number; // optional explicit number of concentric rings
  showValues?: boolean; // show percent labels on wedges
};

const WEDGE_COLORS: Record<IndicatorChartKey, string> = {
  focus_clarity: "#F2B84B",
  relationships_communication: "#F28157",
  emotional_balance: "#D95032",
  energy_body: "#1E3A8A",
  decision_discernment: "#2B6F88",
  self_trust: "#8F5DA2",
  willpower_perseverance: "#C17E2B",
  optimal_weight_management: "#5E8C4A",
};

const clampValue = (value: number, max: number) => Math.max(0, Math.min(max, value));

export function RadarIndicators({ data, maxValue = 5, size = "md", ringSteps, showValues = true }: RadarIndicatorsProps) {
  const normalized = data.map((point) => ({
    ...point,
    value: clampValue(point.value, maxValue),
    color: WEDGE_COLORS[point.key],
  }));

  // Smaller defaults to avoid overpowering the card
  const base = size === "sm" ? 140 : size === "lg" ? 220 : 180;
  const center = base / 2;
  const radius = center - 24;
  const total = normalized.length;
  const step = (Math.PI * 2) / total;
  const startOffset = -Math.PI / 2;

  const polarToCartesian = (angle: number, distance: number) => ({
    x: center + distance * Math.cos(angle),
    y: center + distance * Math.sin(angle),
  });

  // When using shares (maxValue=1), draw more guide rings for clarity
  const steps = typeof ringSteps === "number" && ringSteps > 0 ? ringSteps : (maxValue === 1 ? 5 : maxValue);
  const rings = Array.from({ length: steps }, (_, index) => {
    const ringRadius = radius * ((index + 1) / steps);
    return (
      <circle
        key={`ring-${ringRadius}`}
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke="rgba(94, 69, 42, 0.14)"
        strokeWidth={0.6}
        strokeDasharray={index % 2 === 1 ? "2.5 3" : undefined}
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
        stroke="rgba(94, 69, 42, 0.16)"
        strokeWidth={0.9}
        strokeDasharray="3 3"
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
    const labelDistance = Math.max(radiusValue + 16, radius * 0.55);
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
        <defs>
          <linearGradient id={`grad-${point.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={point.color} stopOpacity={0.85} />
            <stop offset="100%" stopColor={point.color} stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill={`url(#grad-${point.key})`}
          stroke={point.color}
          strokeOpacity={0.85}
          strokeWidth={0.8}
        />
        {showValues ? (
          <g transform={`translate(${labelPoint.x}, ${labelPoint.y})`}>
            <text textAnchor="middle" dy="0.35em" className="text-[9px] font-medium" fill="#5C4F45" fillOpacity={0.9}>
              {percent}%
            </text>
          </g>
        ) : null}
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
          <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="rgba(0,0,0,0.18)" />
        </filter>
        <radialGradient id="parchment" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#F8F4EC" stopOpacity="0.92" />
        </radialGradient>
      </defs>
      {/* Subtle parchment disc background */}
      <circle cx={center} cy={center} r={radius + 10} fill="url(#parchment)" />
      <g filter="url(#radarShadow)">
        <circle cx={center} cy={center} r={radius} fill="rgba(255,255,255,0.92)" />
        {rings}
        {axes}
        {wedges}
        {/* Golden outer ring */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#C2A05A" strokeOpacity={0.25} strokeWidth={1.2} />
        {/* Center medallion */}
        <circle cx={center} cy={center} r={2.6} fill="#C2A05A" fillOpacity={0.8} />
      </g>
    </svg>
  );
}

export default RadarIndicators;
