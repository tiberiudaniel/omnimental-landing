"use client";

import type { CatAxisId } from "@/config/catEngine";

type CatRadarPoint = {
  id: CatAxisId;
  label: string;
  value: number; // 0-100
};

type CatRadarChartProps = {
  data: CatRadarPoint[];
};

const AXIS_COLORS: Record<CatAxisId, string> = {
  clarity: "#D07435",
  flex: "#C94E2D",
  emo_stab: "#8F5DA2",
  recalib: "#2F6278",
  focus: "#BF8F3F",
  energy: "#1F7A8C",
  adapt_conf: "#5A3A2E",
};

const STEPS = 4;

export default function CatRadarChart({ data }: CatRadarChartProps) {
  if (!data.length) return null;
  const size = 320;
  const center = size / 2;
  const radius = center - 36;
  const angleStep = (Math.PI * 2) / data.length;
  const startAngle = -Math.PI / 2;

  const polarPoint = (angle: number, distance: number) => ({
    x: center + distance * Math.cos(angle),
    y: center + distance * Math.sin(angle),
  });

  const guidePolygons = Array.from({ length: STEPS }, (_, step) => {
    const ratio = ((step + 1) / STEPS) * radius;
    const points = data
      .map((_, index) => {
        const angle = startAngle + index * angleStep;
        const { x, y } = polarPoint(angle, ratio);
        return `${x},${y}`;
      })
      .join(" ");
    return (
      <polygon
        key={`guide-${step}`}
        points={points}
        fill="none"
        stroke="rgba(90, 58, 46, 0.18)"
        strokeWidth={0.6}
        strokeDasharray={step % 2 === 0 ? "3 4" : undefined}
      />
    );
  });

  const axes = data.map((point, index) => {
    const angle = startAngle + index * angleStep;
    const { x, y } = polarPoint(angle, radius);
    return <line key={`axis-${point.id}`} x1={center} y1={center} x2={x} y2={y} stroke="rgba(90,58,46,0.28)" strokeWidth={0.8} />;
  });

  const polygonPoints = data
    .map((point, index) => {
      const angle = startAngle + index * angleStep;
      const distance = (Math.max(0, Math.min(100, point.value)) / 100) * radius;
      const { x, y } = polarPoint(angle, distance);
      return `${x},${y}`;
    })
    .join(" ");

  const dots = data.map((point, index) => {
    const angle = startAngle + index * angleStep;
    const distance = (Math.max(0, Math.min(100, point.value)) / 100) * radius;
    const { x, y } = polarPoint(angle, distance);
    const color = AXIS_COLORS[point.id];
    return (
      <circle key={`dot-${point.id}`} cx={x} cy={y} r={4} fill={color} stroke="#fff" strokeWidth={1.4} />
    );
  });

  const labels = data.map((point, index) => {
    const angle = startAngle + index * angleStep;
    const { x, y } = polarPoint(angle, radius + 22);
    return (
      <text
        key={`label-${point.id}`}
        x={x}
        y={y}
        textAnchor="middle"
        className="text-[11px] font-medium"
        fill="var(--omni-ink)"
      >
        {point.label}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-full" role="img" aria-label="Profilul CAT">
      <defs>
        <radialGradient id="catRadarBg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(250,244,234,0.86)" />
        </radialGradient>
      </defs>
      <circle cx={center} cy={center} r={radius + 24} fill="url(#catRadarBg)" />
      {guidePolygons}
      {axes}
      <polygon
        points={polygonPoints}
        fill="rgba(239, 147, 69, 0.35)"
        stroke="rgba(239, 147, 69, 0.8)"
        strokeWidth={1.6}
      />
      {dots}
      {labels}
    </svg>
  );
}
