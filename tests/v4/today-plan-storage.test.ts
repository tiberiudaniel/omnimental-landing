import test from "node:test";
import assert from "node:assert/strict";
import { saveTodayPlan, readTodayPlan, clearTodayPlan, type StoredTodayPlan } from "@/lib/todayPlanStorage";

const STORAGE_KEY = "omnimental:todayPlanV2";

function withMockWindow(run: (sessionStorage: Storage) => void) {
  const store = new Map<string, string>();
  const sessionStorage: Storage = {
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
      return Array.from(store.keys())[index] ?? null;
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
  globalWithWindow.window = {
    ...(originalWindow ?? {}),
    sessionStorage,
  } as Window & typeof globalThis;
  try {
    run(sessionStorage);
  } finally {
    if (originalWindow) {
      globalWithWindow.window = originalWindow;
    } else {
      delete globalWithWindow.window;
    }
  }
}

const basePlan: StoredTodayPlan = {
  arcId: null,
  todayKey: "2024-01-10",
  runId: "run-123",
  worldId: "INITIATION",
  mode: "initiation",
};

test("saveTodayPlan + readTodayPlan round-trip when schema matches", () => {
  withMockWindow(() => {
    clearTodayPlan();
    saveTodayPlan(basePlan);
    const stored = readTodayPlan();
    assert.ok(stored);
    assert.equal(stored?.runId, basePlan.runId);
  });
});

test("readTodayPlan clears storage on schema mismatch", () => {
  withMockWindow((sessionStorage) => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...basePlan, schemaVersion: "legacy_init" }),
    );
    const stored = readTodayPlan();
    assert.equal(stored, null);
    assert.equal(sessionStorage.getItem(STORAGE_KEY), null);
  });
});
