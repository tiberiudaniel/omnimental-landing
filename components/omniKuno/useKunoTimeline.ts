import type { OmniKunoLesson, OmniKunoLessonType, OmniKunoLessonStatus } from "@/config/omniKunoLessons";
import { getNextAdaptiveLesson, normalizePerformance, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";

export type KunoTimelineItem = {
  id: string;
  order: number;
  type: OmniKunoLessonType;
  title: string;
  status: OmniKunoLessonStatus;
  difficulty?: OmniKunoLesson["difficulty"];
};

export function computeLessonsStatus(
  lessons: OmniKunoLesson[],
  completedIds: readonly string[] | undefined,
  performance?: Partial<KunoPerformanceSnapshot> | null,
): KunoTimelineItem[] {
  const completed = new Set((completedIds ?? []).filter(Boolean));
  const ordered = lessons.slice().sort((a, b) => a.order - b.order);
  const perfSnapshot = normalizePerformance(performance);
  const adaptiveLesson = getNextAdaptiveLesson(
    ordered.map((lesson) => ({ id: lesson.id, order: lesson.order, difficulty: lesson.difficulty })),
    Array.from(completed),
    perfSnapshot,
  );
  const fallbackActiveId = ordered.find((lesson) => !completed.has(lesson.id))?.id ?? null;
  const canUseAdaptive =
    completed.size > 0 || perfSnapshot.recentScores.length > 0 || perfSnapshot.recentTimeSpent.length > 0;
  const activeId = canUseAdaptive && adaptiveLesson?.id ? adaptiveLesson.id : fallbackActiveId;

  return ordered.map((lesson) => {
    if (completed.has(lesson.id)) {
      return { ...lesson, status: "done" as OmniKunoLessonStatus };
    }
    if (activeId && lesson.id === activeId) {
      return { ...lesson, status: "active" as OmniKunoLessonStatus };
    }
    return { ...lesson, status: "locked" as OmniKunoLessonStatus };
  });
}
