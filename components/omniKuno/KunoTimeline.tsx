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
    <div className="mt-4 space-y-5" data-testid="kuno-timeline">
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
                  <div className="flex w-full items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                        item.status === "done"
                          ? "border-[#1F7A43] bg-[#ECF8F0] text-[#1F7A43]"
                          : item.status === "active"
                            ? "border-[var(--omni-energy)] bg-[var(--omni-energy-tint)] text-[var(--omni-energy)]"
                            : "border-[#F0E8E0] bg-[var(--omni-surface-card)] text-[#B0A295]"
                      }`}
                    >
                      {item.status === "done" ? "✓" : item.status === "locked" ? "…" : "▶"}
                    </div>
                    <div
                      className={`flex-1 rounded-card border px-3.5 py-2 transition ${
                        isOpen ? "border-[var(--omni-energy)] bg-[var(--omni-surface-card)] shadow-[0_18px_36px_rgba(192,121,99,0.16)]" : "border-[#F2E7DD] bg-[var(--omni-surface-card)]/70"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-1.5">
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-2">
                            <p className="text-[15px] font-semibold text-[var(--omni-ink)]">
                              {item.order}. {item.title}
                            </p>
                          </div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                            {item.type === "quiz" ? "Quiz" : lang === "ro" ? "Lecție" : "Lesson"}
                          </p>
                          {!isOpen ? <p className="text-[11px] text-[var(--omni-muted)]">{objective}</p> : null}
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] ${DIFFICULTY_STYLES[difficultyKey].badge}`}
                            title={difficultyShort}
                          >
                            {difficultyLabel}
                          </span>
                          {centerLabel ? (
                            <span className="rounded-full bg-[var(--omni-energy-tint)] px-2 py-0.5 text-[10px] font-semibold text-[#B4634D]">
                              {centerLabel}
                            </span>
                          ) : null}
                          {renderEffortBadges(module, item.id, lang)}
                        </div>
                      </div>
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
