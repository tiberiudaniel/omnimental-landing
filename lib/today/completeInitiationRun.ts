import type { StoredInitiationBlock, StoredTodayPlan } from "@/lib/todayPlanStorage";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";
import { markInitiationLessonsCompleted } from "@/lib/content/initiationProgressStorage";
import { hasInitiationRunCompleted, markInitiationRunCompleted } from "@/lib/content/initiationRunHistory";

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

type CompletionResult = {
  applied: boolean;
  alreadyCompleted?: boolean;
};

const deriveLessonIdsFromBlocks = (
  blocks: StoredInitiationBlock[] | undefined,
  fallbackLessons: LessonId[] | undefined,
): { coreLessonId: LessonId | null; electiveLessonId: LessonId | null } => {
  let coreLessonId: LessonId | null = null;
  let electiveLessonId: LessonId | null = null;
  if (blocks?.length) {
    for (const block of blocks) {
      if (!coreLessonId && block.kind === "core_lesson" && block.lessonId) {
        coreLessonId = block.lessonId as LessonId;
      } else if (!electiveLessonId && block.kind === "elective_practice" && block.lessonId) {
        electiveLessonId = block.lessonId as LessonId;
      }
      if (coreLessonId && electiveLessonId) {
        break;
      }
    }
  }
  if (!coreLessonId && fallbackLessons?.length) {
    coreLessonId = fallbackLessons[0] ?? null;
    if (!electiveLessonId && fallbackLessons.length > 1) {
      electiveLessonId = fallbackLessons[1] ?? null;
    }
  } else if (!electiveLessonId && fallbackLessons?.length) {
    electiveLessonId = fallbackLessons.find((id) => id !== coreLessonId) ?? null;
  }
  return { coreLessonId, electiveLessonId };
};

export function completeInitiationRunFromPlan(
  plan: StoredTodayPlan | null,
  userId: string | null | undefined,
  deps: CompletionDeps = defaultDeps,
): CompletionResult {
  if (!plan || plan.worldId !== "INITIATION") {
    return { applied: false };
  }
  if (!userId) {
    return { applied: false };
  }
  const runId = plan.runId;
  const moduleId = (plan.initiationModuleId ?? plan.moduleId ?? null) as ModuleId | null;
  const { coreLessonId, electiveLessonId } = deriveLessonIdsFromBlocks(
    plan.initiationBlocks,
    plan.initiationLessonIds as LessonId[] | undefined,
  );
  if (!runId || !moduleId || !coreLessonId) {
    return { applied: false };
  }
  if (deps.hasRunCompleted(userId, runId)) {
    return { applied: false, alreadyCompleted: true };
  }
  const lessonsToMark = new Set<LessonId>([coreLessonId]);
  if (electiveLessonId) {
    lessonsToMark.add(electiveLessonId);
  }
  deps.markLessonsCompleted(userId, moduleId, Array.from(lessonsToMark));
  deps.markRunCompleted(userId, runId);
  return { applied: true };
}
