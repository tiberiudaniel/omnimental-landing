import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";

export function getNextLessonInModule(
  moduleId: ModuleId,
  completedLessonIds: LessonId[],
): LessonId | null {
  const moduleMeta = INITIATION_MODULES[moduleId];
  if (!moduleMeta) {
    throw new Error(`Unknown initiation module "${moduleId}"`);
  }
  const completedSet = new Set(completedLessonIds);
  const nextLesson = moduleMeta.lessonIds.find((lessonId) => !completedSet.has(lessonId));
  return nextLesson ?? null;
}
