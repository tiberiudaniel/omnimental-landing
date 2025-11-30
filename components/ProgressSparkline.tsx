"use client";

import React, { useId } from "react";

interface ProgressSparklineProps {
  values: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  fillOpacityStart?: number;
}

export default function ProgressSparkline({
  values,
  width = 160,
  height = 48,
  strokeColor = "var(--omni-energy)",
  fillColor = "var(--omni-energy)",
  fillOpacityStart = 0.6,
}: ProgressSparklineProps) {
  // Hooks must appear before any early returns
  const gradId = useId();
  if (values.length === 0) {
    return null;
  }

  const normalizedValues = values.length === 1 ? [...values, values[0]] : values;
  const points = normalizedValues.map((value, index) => {
    const x =
      normalizedValues.length === 1
        ? width
        : (index / (normalizedValues.length - 1)) * width;
    const y = height - (value / 10) * height;
    return `${x},${y}`;
  });

  const areaPoints = [`0,${height}`, ...points, `${width},${height}`].join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Trend"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor} stopOpacity={fillOpacityStart} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={areaPoints}
        fill={`url(#${gradId})`}
        stroke="none"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
