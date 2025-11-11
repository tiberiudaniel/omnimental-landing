"use client";

import React from "react";

interface ProgressSparklineProps {
  values: number[];
  width?: number;
  height?: number;
}

export default function ProgressSparkline({
  values,
  width = 160,
  height = 48,
}: ProgressSparklineProps) {
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
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E60012" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#E60012" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={areaPoints}
        fill="url(#sparklineGradient)"
        stroke="none"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="#E60012"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
