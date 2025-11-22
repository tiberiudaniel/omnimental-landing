"use client";

import type { ReactNode } from "react";
import type { OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import type { OmniKunoArcZoneKey } from "@/config/omniKunoLessonContent";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { asDifficulty, DIFFICULTY_STYLES } from "./difficulty";
import { getLessonObjective } from "./lessonUtils";
import KunoLessonItem from "./KunoLessonItem";
import LessonView from "./LessonView";
import QuizView from "./QuizView";
import type { KunoTimelineItem } from "./useKunoTimeline";
import type { KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";

type TimelineSegment = { zoneKey: OmniKunoArcZoneKey | null; items: KunoTimelineItem[] };

type Props = {
  areaKey: OmniKunoModuleId;
  segments: TimelineSegment[];
  module: OmniKunoModuleConfig;
  lang: string;
  profileId?: string | null;
  resolvedLessonId: string | null;
  localCompleted: string[];
  localPerformance: KunoPerformanceSnapshot;
  onLessonSelect: (lessonId: string) => void;
  onLessonCompleted: (
    lessonId: string,
    meta?: { updatedPerformance?: KunoPerformanceSnapshot; score?: number; timeSpentSec?: number },
  ) => void;
  onLockedAttempt: () => void;
  renderZoneIntro: (zoneKey: OmniKunoArcZoneKey | null) => ReactNode;
  renderEffortBadges: (module: OmniKunoModuleConfig, lessonId: string, lang: string) => ReactNode;
  t: (key: string) => string | number;
};

export function KunoTimeline({
  areaKey,
  segments,
  module,
  lang,
  profileId,
  resolvedLessonId,
  localCompleted,
  localPerformance,
  onLessonSelect,
  onLessonCompleted,
  onLockedAttempt,
  renderZoneIntro,
  renderEffortBadges,
  t,
}: Props) {
  return (
    <div className="mt-4 grid gap-5 lg:grid-cols-2" data-testid="kuno-timeline">
      {segments.map((segment, segmentIndex) => (
        <div key={`${segment.zoneKey ?? `segment-${segmentIndex}`}-${areaKey}`} className="space-y-3">
          {renderZoneIntro(segment.zoneKey)}
          {segment.items.map((item) => {
            const lessonDef = module.lessons.find((lesson) => lesson.id === item.id);
            if (!lessonDef) return null;
            const disabled = item.status === "locked";
            const difficultyKey = asDifficulty(item.difficulty);
            const difficultyLabel = String(t(`omnikuno.difficulty.${difficultyKey}Label`));
            const difficultyShort = String(t(`omnikuno.difficulty.${difficultyKey}Short`));
            const isOpen = resolvedLessonId ? resolvedLessonId === item.id : false;
            const objective = String(getLessonObjective(lessonDef, lang));
            const centerLabel = (() => {
              if (!lessonDef.center) return null;
              const map =
                lang === "ro"
                  ? { mind: "Minte", body: "Corp", heart: "Inimă", combined: "Integrat" }
                  : { mind: "Mind", body: "Body", heart: "Heart", combined: "Integrated" };
              return map[lessonDef.center];
            })();
            return (
              <div key={item.id} data-testid="kuno-lesson-item">
                <KunoLessonItem
                lesson={{
                  id: item.id,
                  order: item.order,
                  title: item.title,
                  type: item.type,
                  status: item.status,
                  difficulty: difficultyKey,
                }}
                  isActive={Boolean(isOpen)}
                  disabled={disabled}
                  onSelect={() => {
                    onLessonSelect(item.id);
                  }}
                  onLockedAttempt={onLockedAttempt}
                  header={
                  <div className="flex w-full items-start gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                        item.status === "done"
                          ? "border-[#1F7A43] bg-[#ECF8F0] text-[#1F7A43]"
                          : item.status === "active"
                            ? "border-[#C07963] bg-[#FFF3EC] text-[#C07963]"
                            : "border-[#F0E8E0] bg-white text-[#B0A295]"
                      }`}
                    >
                      {item.status === "done" ? "✓" : item.status === "locked" ? "…" : "▶"}
                    </div>
                    <div className={`flex-1 rounded-xl border px-3 py-2 ${isOpen ? "border-[#C07963] bg-white" : "border-[#F0E8E0]"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#2C2C2C]">
                            {item.order}. {item.title}
                          </p>
                          <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">
                            {item.type === "quiz" ? "Quiz" : lang === "ro" ? "Lecție" : "Lesson"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] ${DIFFICULTY_STYLES[difficultyKey].badge}`}
                            title={difficultyShort}
                          >
                            {difficultyLabel}
                          </span>
                          {centerLabel ? (
                            <span className="rounded-full bg-[#FFF3EC] px-2 py-0.5 text-[10px] font-semibold text-[#B4634D]">
                              {centerLabel}
                            </span>
                          ) : null}
                          {renderEffortBadges(module, item.id, lang)}
                        </div>
                      </div>
                      {!isOpen ? <p className="mt-2 text-[11px] text-[#7B6B60]">{objective}</p> : null}
                    </div>
                  </div>
                  }
                >
                {lessonDef.type === "quiz" ? (
                  <QuizView
                    areaKey={areaKey}
                    moduleId={module.moduleId}
                    lesson={lessonDef}
                    existingCompletedIds={localCompleted}
                    ownerId={profileId}
                    performanceSnapshot={localPerformance}
                    onCompleted={(lessonId, meta) => onLessonCompleted(lessonId, meta)}
                  />
                ) : (
                  <LessonView
                    areaKey={areaKey}
                    moduleId={module.moduleId}
                    lesson={lessonDef}
                    existingCompletedIds={localCompleted}
                    ownerId={profileId}
                    performanceSnapshot={localPerformance}
                    onCompleted={(lessonId, meta) => onLessonCompleted(lessonId, meta)}
                  />
                )}
                </KunoLessonItem>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
