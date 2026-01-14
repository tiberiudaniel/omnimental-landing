import { INITIATION_ELECTIVES } from "@/config/content/initiations/electives";
import { INITIATION_LESSONS } from "@/config/content/initiations/lessons.registry";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";
import type { CatAxisId } from "@/lib/profileEngine";

type ElectiveSelectionParams = {
  coreModuleId: ModuleId;
  completedLessonIds?: LessonId[];
  plannedLessonIds?: LessonId[];
  coreLessonId?: LessonId | null;
  coreAxis?: CatAxisId | null;
};

export type ElectiveSelection = {
  lessonId: LessonId | null;
  reason: "module_pool" | "generic_pool" | "none_available";
};

const isSafeAxisMatch = (lessonId: LessonId, axis: CatAxisId | null | undefined): boolean => {
  if (!axis) return true;
  const meta = INITIATION_LESSONS[lessonId];
  if (!meta) return false;
  return meta.axis ? meta.axis === axis : true;
};

export function selectElective({
  coreModuleId,
  completedLessonIds = [],
  plannedLessonIds = [],
  coreLessonId = null,
  coreAxis = null,
}: ElectiveSelectionParams): ElectiveSelection {
  const excluded = new Set<LessonId>([...(completedLessonIds ?? []), ...(plannedLessonIds ?? [])]);
  if (coreLessonId) {
    excluded.add(coreLessonId);
  }
  const modulePool = INITIATION_ELECTIVES.byModule[coreModuleId] ?? [];
  const fromModule = modulePool.find((lessonId) => !excluded.has(lessonId) && isSafeAxisMatch(lessonId, coreAxis));
  if (fromModule) {
    return { lessonId: fromModule, reason: "module_pool" };
  }
  const fallback = INITIATION_ELECTIVES.genericWow.find(
    (lessonId) => !excluded.has(lessonId) && isSafeAxisMatch(lessonId, coreAxis),
  );
  if (fallback) {
    return { lessonId: fallback, reason: "generic_pool" };
  }
  return { lessonId: null, reason: "none_available" };
}
