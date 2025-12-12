"use client";

import { useId } from "react";

type HexProps = {
  label: string;
  value: number; // 0–100
  size?: number; // px, defaults to 96
  id?: string;
};

export function HoneyHex({ label, value, size = 96, id }: HexProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const generatedId = useId();
  const baseId = (id ?? generatedId).replace(/[^a-zA-Z0-9_-]/g, "_");
  const clipId = `hex-clip-${baseId}`;
  const gradientId = `honey-gradient-${baseId}`;
  const dimension = Math.max(48, size);

  return (
    <div
      className="relative"
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* hexagon pointy-top */}
        <polygon
          points="50,0 95,25 95,75 50,100 5,75 5,25"
          className="fill-[#f6e8d1] stroke-[#7b4a2f]"
          strokeWidth={2}
        />
        <defs>
          <clipPath id={clipId}>
            <polygon points="50,4 92,26 92,74 50,96 8,74 8,26" />
          </clipPath>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e1a02b" />
            <stop offset="40%" stopColor="#c37300" />
            <stop offset="100%" stopColor="#502400" />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={100 - clamped}
          width={100}
          height={clamped}
          fill={`url(#${gradientId})`}
          clipPath={`url(#${clipId})`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center gap-0.5">
        <span className="text-[11px] font-semibold text-[#3c2418]">{clamped}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4b2d1f]">{label}</span>
    </div>
    </div>
  );
}
