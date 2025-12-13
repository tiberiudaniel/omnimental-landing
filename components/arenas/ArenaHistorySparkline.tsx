"use client";

import { useMemo } from "react";
import type { ArenaRunRecord } from "@/lib/arenaRunStore";

interface ArenaHistorySparklineProps {
  runs: ArenaRunRecord[];
  width?: number;
  height?: number;
}

export function ArenaHistorySparkline({
  runs,
  width = 220,
  height = 60,
}: ArenaHistorySparklineProps) {
  const { coords, minScore, maxScore } = useMemo(() => {
    if (!runs.length) {
      return { coords: [] as Array<{ x: number; y: number; id: string }>, minScore: 0, maxScore: 0 };
    }
    const ordered = [...runs]
      .sort((a, b) => a.completedAt - b.completedAt)
      .slice(-7);
    const scores = ordered.map((run) => (typeof run.score === "number" ? run.score : 0));
    const minScore = Math.min(...scores, 0);
    const maxScore = Math.max(...scores, 100);
    const span = maxScore - minScore || 1;
    const usableWidth = width - 16;
    const usableHeight = height - 16;
    const coords = ordered.map((run, index) => {
      const x = (index / Math.max(ordered.length - 1, 1)) * usableWidth + 8;
      const runScore = typeof run.score === "number" ? run.score : 0;
      const y = height - 8 - ((runScore - minScore) / span) * usableHeight;
      return { x, y, id: run.id, score: runScore };
    });
    return { coords, minScore, maxScore };
  }, [runs, width, height]);

  if (!runs.length) {
    return <p className="text-xs text-white/60">Fără date recente</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <svg width={width} height={height} className="text-white/70">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          points={coords.map((point) => `${point.x},${point.y}`).join(" ")}
          opacity={0.8}
        />
        {coords.map((point) => (
          <circle key={point.id} cx={point.x} cy={point.y} r={2.5} fill="currentColor" opacity={0.8} />
        ))}
      </svg>
      <p className="text-[10px] uppercase tracking-wide text-white/50">
        {coords.length} runs · {Math.round(minScore)} – {Math.round(maxScore)}
      </p>
    </div>
  );
}
