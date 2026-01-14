import test from "node:test";
import assert from "node:assert/strict";
import type { LessonId, ModuleId, WorldId } from "@/lib/taxonomy/types";
import type { StoredTodayPlan } from "@/lib/todayPlanStorage";
import { resolveInitiationPlanLock } from "@/lib/today/initiationPlanLock";
import type { InitiationLessonReference } from "@/lib/content/resolveLessonToExistingContent";
import type { LessonMeta } from "@/config/content/initiations/lessons.registry";

const MODULE_ID = "init_clarity_foundations" as ModuleId;
const LESSON_ID = "clarity_01_illusion_of_clarity" as LessonId;

const basePlan: StoredTodayPlan = {
  arcId: null,
  todayKey: "2024-01-10",
  runId: "run-stored",
  worldId: "INITIATION" as WorldId,
  mode: "initiation",
  initiationModuleId: MODULE_ID,
  initiationLessonIds: [LESSON_ID],
  initiationBlocks: [{ kind: "core_lesson", lessonId: LESSON_ID }],
  mindpacingTag: "focus",
};

const lessonMeta: LessonMeta = {
  lessonId: LESSON_ID,
  cluster: "clarity_cluster",
  axis: "clarity",
  estimatedMinutes: 10,
  world: "INITIATION",
  zone: "SESSIONS",
  localesAvailable: ["ro"],
  source: "wow",
  refs: {
    wowModuleKey: LESSON_ID,
  },
};

const lessonRef: InitiationLessonReference = {
  meta: lessonMeta,
  source: "wow",
  refId: LESSON_ID,
};

type PlanLockDeps = NonNullable<Parameters<typeof resolveInitiationPlanLock>[1]>;

function createDeps(overrides: Partial<PlanLockDeps> = {}): PlanLockDeps {
  return {
    readPlan: () => basePlan,
    clearPlan: () => {},
    resolveLesson: () => lessonRef,
    generateRunId: () => "generated-run",
    ...overrides,
  };
}

test("resolveInitiationPlanLock reuses stored plan when metadata matches", () => {
  const result = resolveInitiationPlanLock(
    { todayKey: "2024-01-10", mindpacingTag: "focus" },
    createDeps(),
  );
  assert.equal(result.status, "reused");
  if (result.status === "reused") {
    assert.equal(result.runId, "run-stored");
    assert.equal(result.planResult.lessons.length, 1);
    assert.equal(result.planResult.debug.moduleId, MODULE_ID);
  }
});

test("resolveInitiationPlanLock rebuilds and clears when lessons cannot be resolved", () => {
  let cleared = 0;
  const deps = createDeps({
    resolveLesson: () => {
      throw new Error("missing lesson");
    },
    clearPlan: () => {
      cleared += 1;
    },
  });
  const result = resolveInitiationPlanLock({ todayKey: "2024-01-10", mindpacingTag: "focus" }, deps);
  assert.equal(result.status, "rebuild");
  assert.equal(result.runId, "generated-run");
  assert.equal(cleared, 1);
});

test("resolveInitiationPlanLock rebuilds with new runId on metadata mismatch", () => {
  const deps = createDeps({
    generateRunId: () => "new-run",
  });
  const result = resolveInitiationPlanLock({ todayKey: "2024-01-10", mindpacingTag: "other" }, deps);
  assert.equal(result.status, "rebuild");
  assert.equal(result.runId, "new-run");
});
