import test from "node:test";
import assert from "node:assert/strict";
import {
  readInitiationRunState,
  saveInitiationRunState,
  clearInitiationRunState,
  type InitiationRunState,
} from "@/lib/today/initiationRunState";

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

test("saveInitiationRunState + readInitiationRunState resumes block progress", () => {
  withMockWindow(() => {
    const state: InitiationRunState = {
      runId: "run-init-state",
      blockIndex: 1,
      completed: { core: true },
    };
    saveInitiationRunState(state);
    const stored = readInitiationRunState("run-init-state");
    assert.ok(stored);
    assert.equal(stored?.blockIndex, 1);
    assert.equal(stored?.completed.core, true);
  });
});

test("clearInitiationRunState removes stored entry", () => {
  withMockWindow((sessionStorage) => {
    const state: InitiationRunState = {
      runId: "run-clear-state",
      blockIndex: 0,
      completed: {},
    };
    saveInitiationRunState(state);
    assert.ok(readInitiationRunState("run-clear-state"));
    clearInitiationRunState("run-clear-state");
    assert.equal(readInitiationRunState("run-clear-state"), null);
    assert.equal(sessionStorage.length, 0);
  });
});
