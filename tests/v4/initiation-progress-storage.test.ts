import test from "node:test";
import assert from "node:assert/strict";
import {
  writeInitiationProgressState,
  readInitiationProgressState,
  clearInitiationProgress,
  LEGACY_INITIATION_PROGRESS_KEY,
} from "@/lib/content/initiationProgressStorage";

const MODULE_A = "init_clarity_foundations";
const MODULE_B = "init_energy_foundations";

test("progress storage isolates per user", () => {
  clearInitiationProgress("userA");
  clearInitiationProgress("userB");
  writeInitiationProgressState("userA", {
    moduleId: MODULE_A as never,
    completedLessonIds: ["clarity_01_illusion_of_clarity" as never],
  });
  writeInitiationProgressState("userB", {
    moduleId: MODULE_B as never,
    completedLessonIds: [],
  });
  assert.equal(readInitiationProgressState("userA")?.moduleId, MODULE_A);
  assert.equal(readInitiationProgressState("userB")?.moduleId, MODULE_B);
});

test("legacy key migrates when accessed in browser context", () => {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  (globalThis as typeof globalThis & { window?: unknown }).window = {
    localStorage: localStorageMock,
    dispatchEvent: () => {},
  } as unknown as Window;
  const legacyPayload = JSON.stringify({
    moduleId: MODULE_B,
    completedLessonIds: ["focus_energy_01_energy_not_motivation"],
  });
  localStorageMock.setItem(LEGACY_INITIATION_PROGRESS_KEY, legacyPayload);
  const state = readInitiationProgressState("legacy-user");
  assert.equal(state?.moduleId, MODULE_B);
  delete (globalThis as typeof globalThis & { window?: unknown }).window;
});
