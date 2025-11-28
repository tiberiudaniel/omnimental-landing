import type { OmniKunoLesson, OmniKunoLessonType, OmniKunoLessonStatus } from "@/config/omniKunoLessons";

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
): KunoTimelineItem[] {
  const completed = new Set((completedIds ?? []).filter(Boolean));
  const ordered = lessons.slice().sort((a, b) => a.order - b.order);

  let hasActive = false;
  return ordered.map((lesson) => {
    if (completed.has(lesson.id)) {
      return { ...lesson, status: "done" as OmniKunoLessonStatus };
    }
    if (!hasActive) {
      hasActive = true;
      return { ...lesson, status: "active" as OmniKunoLessonStatus };
    }
    return { ...lesson, status: "locked" as OmniKunoLessonStatus };
  });
}
