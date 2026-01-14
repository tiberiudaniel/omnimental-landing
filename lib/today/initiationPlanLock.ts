import { readTodayPlan, clearTodayPlan, type StoredTodayPlan, type StoredInitiationBlock } from "@/lib/todayPlanStorage";
import { resolveInitiationLesson } from "@/lib/content/resolveLessonToExistingContent";
import type { LessonId, ModuleId, WorldId } from "@/lib/taxonomy/types";
import type { MindpacingFallbackReason } from "@/lib/mindpacing/moduleMapping";
import type { InitiationSessionPlanResult } from "@/lib/sessions/buildInitiationSessionPlan";

const INITIATION_WORLD: WorldId = "INITIATION";
const INITIATION_MODE = "initiation";

type PlanLockDeps = {
  readPlan: typeof readTodayPlan;
  clearPlan: typeof clearTodayPlan;
  resolveLesson: typeof resolveInitiationLesson;
  generateRunId: () => string;
};

const defaultDeps: PlanLockDeps = {
  readPlan: readTodayPlan,
  clearPlan: clearTodayPlan,
  resolveLesson: resolveInitiationLesson,
  generateRunId,
};

export function generateRunId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export type InitiationPlanLockResult =
  | {
      status: "reused";
      runId: string;
      planResult: InitiationSessionPlanResult;
    }
  | {
      status: "rebuild";
      runId: string;
    };

const isStoredPlanReusable = (
  storedPlan: StoredTodayPlan,
  todayKey: string,
  mindpacingTag: string | null,
): storedPlan is StoredTodayPlan & {
  initiationModuleId: ModuleId;
  initiationLessonIds: LessonId[];
  initiationBlocks: StoredInitiationBlock[];
  runId: string;
} => {
  const storedTag = storedPlan.mindpacingTag ?? null;
  const hasCoreBlock = Array.isArray(storedPlan.initiationBlocks)
    ? storedPlan.initiationBlocks.some((block) => block.kind === "core_lesson" && Boolean(block.lessonId))
    : false;
  return (
    storedPlan.todayKey === todayKey &&
    storedPlan.worldId === INITIATION_WORLD &&
    storedPlan.mode === INITIATION_MODE &&
    Boolean(storedPlan.initiationModuleId) &&
    Array.isArray(storedPlan.initiationLessonIds) &&
    storedPlan.initiationLessonIds.length > 0 &&
    hasCoreBlock &&
    Array.isArray(storedPlan.initiationBlocks) &&
    Boolean(storedPlan.runId) &&
    storedTag === mindpacingTag
  );
};

export function resolveInitiationPlanLock(
  {
    todayKey,
    mindpacingTag,
  }: {
    todayKey: string;
    mindpacingTag: string | null;
  },
  deps: PlanLockDeps = defaultDeps,
): InitiationPlanLockResult {
  const storedPlan = deps.readPlan();
  if (!storedPlan) {
    return { status: "rebuild", runId: deps.generateRunId() };
  }
  if (!isStoredPlanReusable(storedPlan, todayKey, mindpacingTag)) {
    return { status: "rebuild", runId: deps.generateRunId() };
  }
  try {
    const blockLessons: ReturnType<typeof deps.resolveLesson>[] = [];
    const planBlocks: InitiationSessionPlanResult["blocks"] = [];
    for (const block of storedPlan.initiationBlocks ?? []) {
      if (block.kind === "core_lesson" && block.lessonId) {
        const lesson = deps.resolveLesson(block.lessonId as LessonId);
        planBlocks.push({ kind: "core", lesson });
        blockLessons.push(lesson);
      } else if (block.kind === "elective_practice" && block.lessonId) {
        const lesson = deps.resolveLesson(block.lessonId as LessonId);
        const blockReason = "reason" in block ? block.reason : undefined;
        planBlocks.push({
          kind: "elective",
          lesson,
          reason: blockReason ?? storedPlan.initiationElectiveReason ?? "module_pool",
        });
        blockLessons.push(lesson);
      } else if (block.kind === "recall" && block.prompt) {
        planBlocks.push({ kind: "recall", prompt: block.prompt });
      }
    }
    const lessons =
      blockLessons.length > 0
        ? blockLessons
        : storedPlan.initiationLessonIds.map((lessonId) => deps.resolveLesson(lessonId as LessonId));
    const derivedLessonIds =
      blockLessons.length > 0
        ? (blockLessons.map((lesson) => lesson.meta.lessonId) as LessonId[])
        : (storedPlan.initiationLessonIds as LessonId[]);
    const recallPromptId =
      planBlocks.find((block) => block.kind === "recall")?.prompt.promptId ??
      storedPlan.initiationRecallPromptId ??
      null;
    return {
      status: "reused",
      runId: storedPlan.runId,
      planResult: {
        plan: undefined,
        lessons,
        blocks: planBlocks,
        initiation: {
          moduleId: storedPlan.initiationModuleId,
          lessonIds: derivedLessonIds,
          recallPromptId,
          electiveReason: storedPlan.initiationElectiveReason ?? undefined,
        },
        debug: {
          moduleId: storedPlan.initiationModuleId,
          mindpacingTag: storedPlan.mindpacingTag ?? null,
          fallbackReason: storedPlan.fallbackReason as MindpacingFallbackReason | undefined,
        },
      },
    };
  } catch {
    deps.clearPlan();
    return { status: "rebuild", runId: deps.generateRunId() };
  }
}
