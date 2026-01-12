import { readTodayPlan, clearTodayPlan, type StoredTodayPlan } from "@/lib/todayPlanStorage";
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
  runId: string;
} => {
  const storedTag = storedPlan.mindpacingTag ?? null;
  return (
    storedPlan.todayKey === todayKey &&
    storedPlan.worldId === INITIATION_WORLD &&
    storedPlan.mode === INITIATION_MODE &&
    Boolean(storedPlan.initiationModuleId) &&
    Array.isArray(storedPlan.initiationLessonIds) &&
    storedPlan.initiationLessonIds.length > 0 &&
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
    const lessons = storedPlan.initiationLessonIds.map((lessonId) =>
      deps.resolveLesson(lessonId as LessonId),
    );
    return {
      status: "reused",
      runId: storedPlan.runId,
      planResult: {
        plan: undefined,
        lessons,
        blocks: [],
        initiation: {
          moduleId: storedPlan.initiationModuleId,
          lessonIds: (storedPlan.initiationLessonIds ?? []) as LessonId[],
          recallPromptId: storedPlan.initiationRecallPromptId ?? null,
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
