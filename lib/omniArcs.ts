import type { ProgressFact } from "@/lib/progressFacts";
import { OMNI_ARCS } from "@/config/omniArcs";
import type { OmniAreaKey } from "@/config/omniKunoModules";
import { OMNIKUNO_MODULES as OMNIKUNO_LESSON_MODULES } from "@/config/omniKunoLessons";

export type ArcAction =
  | { type: "lesson"; target: string }
  | { type: "abil"; target: string }
  | { type: "daily"; target: string }
  | { type: "complete"; target: string };

const LESSON_MODULE_CACHE = new Map<
  string,
  { areaKey: OmniAreaKey; moduleId: string } | null
>();

function resolveLessonModule(lessonId: string) {
  if (LESSON_MODULE_CACHE.has(lessonId)) {
    return LESSON_MODULE_CACHE.get(lessonId) ?? null;
  }
  for (const [areaKey, module] of Object.entries(OMNIKUNO_LESSON_MODULES) as Array<
    [OmniAreaKey, (typeof OMNIKUNO_LESSON_MODULES)[keyof typeof OMNIKUNO_LESSON_MODULES]]
  >) {
    const lessons = Array.isArray(module?.lessons) ? module.lessons : [];
    if (lessons.some((lesson) => lesson.id === lessonId)) {
      const meta = { areaKey, moduleId: module.moduleId };
      LESSON_MODULE_CACHE.set(lessonId, meta);
      return meta;
    }
  }
  LESSON_MODULE_CACHE.set(lessonId, null);
  return null;
}

function collectCompletedLessonIds(userFacts: ProgressFact | null | undefined) {
  const result = new Set<string>();
  const lessonMap = (userFacts as { omni?: { kuno?: Record<string, unknown> } } | null | undefined)?.omni?.kuno;
  const lessons = (lessonMap as { lessons?: Record<string, { completedIds?: string[] }> } | undefined)?.lessons ?? {};
  Object.values(lessons).forEach((entry) => {
    entry?.completedIds?.forEach((lessonId) => result.add(lessonId));
  });
  return result;
}

export function getArcLessonProgress(userFacts: ProgressFact | null | undefined, arcId: string) {
  const arc = OMNI_ARCS.find((item) => item.id === arcId) ?? OMNI_ARCS[0];
  const completed = collectCompletedLessonIds(userFacts);
  const total = arc.lessonIds.length || 1;
  const completedCount = arc.lessonIds.filter((id) => completed.has(id)).length;
  const percentage = Math.min(100, Math.round((completedCount / total) * 100));
  return { completed: completedCount, total, percentage };
}

export function getNextArcAction(userFacts: ProgressFact | null | undefined, arcId: string): ArcAction {
  const arc = OMNI_ARCS.find((item) => item.id === arcId) ?? OMNI_ARCS[0];
  const completed = collectCompletedLessonIds(userFacts);
  const pendingLesson = arc.lessonIds.find((lessonId) => !completed.has(lessonId));
  if (pendingLesson) {
    return { type: "lesson", target: pendingLesson };
  }
  const abilTemplate = arc.abilTaskTemplates[0];
  if (abilTemplate) {
    if (abilTemplate.type === "daily") {
      return { type: "daily", target: abilTemplate.id };
    }
    return { type: "abil", target: abilTemplate.id };
  }
  return { type: "complete", target: arc.id };
}

export function getLessonNavigationMeta(lessonId: string) {
  return resolveLessonModule(lessonId);
}
