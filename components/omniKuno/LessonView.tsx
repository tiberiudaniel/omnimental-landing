"use client";
import { useEffect, useRef, useState } from "react";
import type { OmniKunoLesson } from "@/config/omniKunoLessons";
import { getLessonXp, applyKunoXp } from "@/lib/omniKunoXp";
import { recordKunoLessonProgress } from "@/lib/progressFacts";
import { updatePerformanceSnapshot, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { useI18n } from "@/components/I18nProvider";
import { asDifficulty, DIFFICULTY_STYLES } from "./difficulty";

export type LessonViewProps = {
  areaKey: "calm" | "energy" | "relations" | "performance" | "sense";
  moduleId: string;
  lesson: OmniKunoLesson;
  existingCompletedIds: readonly string[];
  ownerId?: string | null;
  performanceSnapshot: KunoPerformanceSnapshot;
  onCompleted?: (lessonId: string, meta?: { timeSpentSec: number; updatedPerformance: KunoPerformanceSnapshot }) => void;
};

export default function LessonView({
  areaKey,
  moduleId,
  lesson,
  existingCompletedIds,
  ownerId,
  performanceSnapshot,
  onCompleted,
}: LessonViewProps) {
  const { t } = useI18n();
  const difficultyKey = asDifficulty(lesson.difficulty);
  const chipText = String(t(`omnikuno.difficulty.${difficultyKey}Chip`));
  const chipClass = DIFFICULTY_STYLES[difficultyKey].chip;
  const durationText = lesson.durationMin ? `~${lesson.durationMin} min` : null;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(existingCompletedIds.includes(lesson.id));
  const startRef = useRef(Date.now());
  useEffect(() => {
    setDone(existingCompletedIds.includes(lesson.id));
    startRef.current = Date.now();
  }, [existingCompletedIds, lesson.id]);

  const handleComplete = async () => {
    if (busy || done) return;
    setBusy(true);
    try {
      const merged = Array.from(new Set([...existingCompletedIds, lesson.id]));
      const timeSpentSec = Math.max(30, Math.round((Date.now() - startRef.current) / 1000));
      const updatedPerformance = updatePerformanceSnapshot(performanceSnapshot, { timeSpentSec });
      await recordKunoLessonProgress({ moduleId, completedIds: merged, ownerId, performance: updatedPerformance });
      applyKunoXp(areaKey, getLessonXp());
      setDone(true);
      onCompleted?.(lesson.id, { timeSpentSec, updatedPerformance });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#7B6B60]">Lecție</p>
        <h3 className="text-xl font-bold text-[#2C2C2C]">{lesson.title}</h3>
        <p className="text-sm text-[#7B6B60]">{lesson.summary}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#7B6B60]">
          <span className={`inline-flex items-center rounded-full px-3 py-0.5 uppercase tracking-[0.2em] ${chipClass}`}>
            {chipText}
          </span>
          {durationText ? <span className="text-[#A08F82]">{durationText}</span> : null}
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-[#E4DAD1] bg-[#FFFBF7] p-4 text-[#4D3F36]">
        Conținut placeholder. Aici vom reda lecția detaliată.
      </div>
      <button
        type="button"
        onClick={handleComplete}
        disabled={busy || done}
        className="inline-flex items-center rounded-full border border-[#C07963] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white disabled:cursor-not-allowed disabled:border-[#E4DAD1] disabled:text-[#B99484]"
      >
        {done ? "Lecție completă" : busy ? "Se salvează..." : "Marchează lecția ca finalizată"}
      </button>
    </div>
  );
}
