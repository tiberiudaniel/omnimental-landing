import test from "node:test";
import assert from "node:assert/strict";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";
import type { InitiationProgressState } from "@/lib/content/initiationProgressStorage";
import {
  buildRemoteInitiationFacts,
  persistRemoteInitiationFacts,
  __resetInitiationFactsRemoteCache,
} from "@/lib/content/initiationFactsRemote";
import type { RecorderDeps } from "@/lib/content/initiationFactsRemote";

const MODULE_A = "init_clarity_foundations" as ModuleId;

function createRecorderDeps(overrides: Partial<RecorderDeps> = {}) {
  let setDocCalls = 0;
  const base: RecorderDeps = {
    ensureAuth: async () =>
      ({ uid: "user-test" } as unknown as Awaited<ReturnType<RecorderDeps["ensureAuth"]>>),
    getDb: () => ({} as ReturnType<RecorderDeps["getDb"]>),
    doc: ((...args: Parameters<RecorderDeps["doc"]>) => {
      void args;
      return { id: "ref" } as ReturnType<RecorderDeps["doc"]>;
    }) as RecorderDeps["doc"],
    setDoc: async () => {
      setDocCalls += 1;
    },
  };
  return {
    deps: { ...base, ...overrides },
    getSetDocCalls: () => setDocCalls,
  };
}

const LESSONS = [
  "clarity_01_illusion_of_clarity",
  "clarity_02_one_real_thing",
  "clarity_03_fog_vs_fatigue",
  "clarity_04_brutal_writing",
  "clarity_05_decisions_without_data",
] as LessonId[];

test("buildRemoteInitiationFacts derives module stats", () => {
  const state: InitiationProgressState = {
    moduleId: MODULE_A,
    completedLessonIds: LESSONS.slice(0, 2),
  };
  const payload = buildRemoteInitiationFacts(state, new Date("2024-01-10T10:00:00.000Z"));
  assert.ok(payload);
  assert.equal(payload?.currentModuleId, MODULE_A);
  assert.equal(payload?.completedLessons, 2);
  assert.equal(payload?.moduleLessonCount, LESSONS.length);
  assert.equal(payload?.completedLessonIds.length, 2);
  assert.equal(payload?.lastCompletedAt, "2024-01-10T10:00:00.000Z");
});

test("buildRemoteInitiationFacts trims duplicate lesson ids", () => {
  const repeated = [...LESSONS.slice(0, 1), LESSONS[0]];
  const state: InitiationProgressState = {
    moduleId: MODULE_A,
    completedLessonIds: repeated,
  };
  const payload = buildRemoteInitiationFacts(state);
  assert.ok(payload);
  assert.equal(payload?.completedLessonIds.length, 1);
});

test("persistRemoteInitiationFacts skips duplicate payloads", async () => {
  __resetInitiationFactsRemoteCache();
  const state: InitiationProgressState = { moduleId: MODULE_A, completedLessonIds: LESSONS.slice(0, 1) };
  const { deps, getSetDocCalls } = createRecorderDeps();
  const completedAt = new Date("2024-01-10T00:00:00.000Z");
  await persistRemoteInitiationFacts("user-test", state, completedAt, deps);
  await persistRemoteInitiationFacts("user-test", state, completedAt, deps);
  assert.equal(getSetDocCalls(), 1);
});

test("persistRemoteInitiationFacts skips when firebase unavailable", async () => {
  __resetInitiationFactsRemoteCache();
  const state: InitiationProgressState = { moduleId: MODULE_A, completedLessonIds: LESSONS.slice(0, 1) };
  const { deps, getSetDocCalls } = createRecorderDeps({
    ensureAuth: async () => {
      throw new Error("auth disabled");
    },
  });
  await persistRemoteInitiationFacts("user-test", state, new Date("2024-01-10T00:00:00.000Z"), deps);
  assert.equal(getSetDocCalls(), 0);
});
