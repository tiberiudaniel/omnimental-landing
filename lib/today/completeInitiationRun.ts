import type { StoredTodayPlan } from "@/lib/todayPlanStorage";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";
import { markInitiationLessonsCompleted } from "@/lib/content/initiationProgressStorage";
import {
  hasInitiationRunCompleted,
  markInitiationRunCompleted,
} from "@/lib/content/initiationRunHistory";

type CompletionDeps = {
  hasRunCompleted: typeof hasInitiationRunCompleted;
  markLessonsCompleted: typeof markInitiationLessonsCompleted;
  markRunCompleted: typeof markInitiationRunCompleted;
};

const defaultDeps: CompletionDeps = {
  hasRunCompleted: hasInitiationRunCompleted,
  markLessonsCompleted: markInitiationLessonsCompleted,
  markRunCompleted: markInitiationRunCompleted,
};

export function completeInitiationRunFromPlan(
  plan: StoredTodayPlan | null,
  userId: string | null | undefined,
  deps: CompletionDeps = defaultDeps,
): { applied: boolean } {
  if (!plan || plan.worldId !== "INITIATION") {
    return { applied: false };
  }
  if (!userId) {
    return { applied: false };
  }
  const runId = plan.runId;
  const moduleId = plan.initiationModuleId as ModuleId | undefined | null;
  const lessonIds = plan.initiationLessonIds as LessonId[] | undefined;
  const coreLessonId = lessonIds?.[0];
  if (!runId || !moduleId || !coreLessonId) {
    return { applied: false };
  }
  if (deps.hasRunCompleted(userId, runId)) {
    return { applied: false };
  }
  deps.markLessonsCompleted(userId, moduleId, [coreLessonId]);
  deps.markRunCompleted(userId, runId);
  return { applied: true };
}
