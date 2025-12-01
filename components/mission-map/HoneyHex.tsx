"use client";

import { useId } from "react";

type HexProps = {
  label: string;
  value: number; // 0–100
};

export function HoneyHex({ label, value }: HexProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const clipId = `hex-clip-${useId().replace(/:/g, "")}`;

  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {/* hexagon pointy-top */}
        <polygon
          points="50,0 95,25 95,75 50,100 5,75 5,25"
          className="fill-[#f6e8d1] stroke-[#7b4a2f]"
          strokeWidth={2}
        />
        <defs>
          <clipPath id={clipId}>
            <polygon points="50,0 95,25 95,75 50,100 5,75 5,25" />
          </clipPath>
        </defs>
        <rect
          x={0}
          y={100 - clamped}
          width={100}
          height={clamped}
          className="fill-[#d68a2f]"
          clipPath={`url(#${clipId})`}
        />
     </svg>
     <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-semibold text-[#3c2418]">{clamped}%</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#4b2d1f]">{label}</span>
     </div>
    </div>
  );
}
