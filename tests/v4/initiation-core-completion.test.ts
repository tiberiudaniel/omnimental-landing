import test from "node:test";
import assert from "node:assert/strict";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";
import type { StoredTodayPlan } from "@/lib/todayPlanStorage";
import { completeInitiationRunFromPlan } from "@/lib/today/completeInitiationRun";

const BASE_PLAN: StoredTodayPlan = {
  arcId: null,
  todayKey: "2024-01-10",
  runId: "run-core",
  worldId: "INITIATION",
  mode: "initiation",
  initiationModuleId: "init_clarity_foundations" as ModuleId,
  initiationLessonIds: ["clarity_01_illusion_of_clarity" as LessonId],
};

test("completeInitiationRunFromPlan is idempotent per runId", () => {
  let lessonsCalls = 0;
  let runCalls = 0;
  const deps = {
    hasRunCompleted: () => runCalls > 0,
    markLessonsCompleted: () => {
      lessonsCalls += 1;
    },
    markRunCompleted: () => {
      runCalls += 1;
    },
  };
  const first = completeInitiationRunFromPlan(BASE_PLAN, "user-123", deps);
  assert.equal(first.applied, true);
  const second = completeInitiationRunFromPlan(BASE_PLAN, "user-123", deps);
  assert.equal(second.applied, false);
  assert.equal(lessonsCalls, 1);
  assert.equal(runCalls, 1);
});
