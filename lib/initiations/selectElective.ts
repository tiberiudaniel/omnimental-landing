import { INITIATION_ELECTIVES } from "@/config/content/initiations/electives";
import { INITIATION_LESSONS } from "@/config/content/initiations/lessons.registry";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";
import type { CatAxisId } from "@/lib/profileEngine";

type ElectiveSelectionParams = {
  coreModuleId: ModuleId;
  completedLessonIds?: LessonId[];
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
  coreAxis = null,
}: ElectiveSelectionParams): ElectiveSelection {
  const completed = new Set(completedLessonIds);
  const modulePool = INITIATION_ELECTIVES.byModule[coreModuleId] ?? [];
  const fromModule = modulePool.find((lessonId) => !completed.has(lessonId) && isSafeAxisMatch(lessonId, coreAxis));
  if (fromModule) {
    return { lessonId: fromModule, reason: "module_pool" };
  }
  const fallback = INITIATION_ELECTIVES.genericWow.find(
    (lessonId) => !completed.has(lessonId) && isSafeAxisMatch(lessonId, coreAxis),
  );
  if (fallback) {
    return { lessonId: fallback, reason: "generic_pool" };
  }
  return { lessonId: null, reason: "none_available" };
}
