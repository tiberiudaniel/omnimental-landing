"use client";

import type { ArenaDrill } from "@/config/arenaModules/v1/types";

interface Props {
  drills: ArenaDrill[];
  selectedDuration: ArenaDrill["duration"] | null;
  onSelect: (duration: ArenaDrill["duration"]) => void;
}

export function DrillSelector({ drills, selectedDuration, onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {drills.map((drill) => {
        const isSelected = drill.duration === selectedDuration;
        return (
          <button
            key={drill.duration}
            type="button"
            onClick={() => onSelect(drill.duration)}
            className={`rounded-2xl border p-4 text-left transition ${
              isSelected
                ? "border-white bg-white/10"
                : "border-white/10 bg-white/5 hover:border-white/30"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-white/60">{drill.duration}</p>
            <h4 className="text-lg font-semibold text-white">{drill.constraint}</h4>
            <p className="mt-2 text-sm text-white/70">{drill.successMetric}</p>
          </button>
        );
      })}
    </div>
  );
}
