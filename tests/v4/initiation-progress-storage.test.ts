import test from "node:test";
import assert from "node:assert/strict";
import {
  writeInitiationProgressState,
  readInitiationProgressState,
  clearInitiationProgress,
  LEGACY_INITIATION_PROGRESS_KEY,
} from "@/lib/content/initiationProgressStorage";
import type { LessonId, ModuleId } from "@/lib/taxonomy/types";

const MODULE_A = "init_clarity_foundations" as ModuleId;
const MODULE_B = "init_energy_foundations" as ModuleId;
const LESSON_A = "clarity_01_illusion_of_clarity" as LessonId;

test("progress storage isolates per user", () => {
  clearInitiationProgress("userA");
  clearInitiationProgress("userB");
  writeInitiationProgressState("userA", {
    moduleId: MODULE_A,
    completedLessonIds: [LESSON_A],
  });
  writeInitiationProgressState("userB", {
    moduleId: MODULE_B,
    completedLessonIds: [],
  });
  assert.equal(readInitiationProgressState("userA")?.moduleId, MODULE_A);
  assert.equal(readInitiationProgressState("userB")?.moduleId, MODULE_B);
});

test("legacy key migrates when accessed in browser context", () => {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
  const globalWithWindow = globalThis as { window?: Window & typeof globalThis };
  const originalWindow = globalWithWindow.window;
  const workingWindow =
    originalWindow ??
    (({
      localStorage: localStorageMock,
      dispatchEvent: () => true,
    } as unknown) as Window & typeof globalThis);
  const originalLocalStorage = workingWindow.localStorage;
  const originalDispatchEvent = workingWindow.dispatchEvent;
  const dispatchEventMock: typeof workingWindow.dispatchEvent = (event: Event) => {
    void event;
    return true;
  };
  const patchedWindow = {
    ...workingWindow,
    localStorage: localStorageMock,
    dispatchEvent: dispatchEventMock,
  } as Window & typeof globalThis;
  globalWithWindow.window = patchedWindow;
  const legacyPayload = JSON.stringify({
    moduleId: MODULE_B,
    completedLessonIds: ["focus_energy_01_energy_not_motivation"],
  });
  localStorageMock.setItem(LEGACY_INITIATION_PROGRESS_KEY, legacyPayload);
  const state = readInitiationProgressState("legacy-user");
  assert.equal(state?.moduleId, MODULE_B);
  if (originalWindow) {
    originalWindow.localStorage = originalLocalStorage;
    originalWindow.dispatchEvent = originalDispatchEvent;
    globalWithWindow.window = originalWindow;
  } else {
    delete globalWithWindow.window;
  }
});
