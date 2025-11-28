"use client";

import LessonView from "./LessonView";
import QuizView from "./QuizView";
import type { OmniKunoModuleConfig, OmniKunoLesson } from "@/config/omniKunoLessons";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import type { KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";

type ActiveLessonInnerProps = {
  areaKey: OmniKunoModuleId;
  module: OmniKunoModuleConfig;
  lesson: OmniKunoLesson;
  existingCompletedIds: readonly string[];
  ownerId?: string | null;
  performanceSnapshot: KunoPerformanceSnapshot;
  onLessonCompleted: (
    lessonId: string,
    meta?: { updatedPerformance?: KunoPerformanceSnapshot; score?: number; timeSpentSec?: number },
  ) => void;
  onProgressChange?: (lessonId: string, current: number, total: number) => void;
};

export default function ActiveLessonInner({
  areaKey,
  module,
  lesson,
  existingCompletedIds,
  ownerId,
  performanceSnapshot,
  onLessonCompleted,
  onProgressChange,
}: ActiveLessonInnerProps) {
  if (!lesson) return null;

  if (lesson.type === "quiz") {
    return (
      <QuizView
        areaKey={areaKey}
        moduleId={module.moduleId}
        lesson={lesson}
        existingCompletedIds={existingCompletedIds}
        ownerId={ownerId}
        performanceSnapshot={performanceSnapshot}
        showHeader={false}
        onStepChange={(current, total) => onProgressChange?.(lesson.id, current, total)}
        onCompleted={(lessonId, meta) => onLessonCompleted(lessonId, meta)}
      />
    );
  }

  return (
    <LessonView
      areaKey={areaKey}
      moduleId={module.moduleId}
      lesson={lesson}
      existingCompletedIds={existingCompletedIds}
      ownerId={ownerId}
      performanceSnapshot={performanceSnapshot}
      onCompleted={(lessonId, meta) => onLessonCompleted(lessonId, meta)}
      onStepChange={(current, total) => onProgressChange?.(lesson.id, current, total)}
      showHeader={false}
    />
  );
}
