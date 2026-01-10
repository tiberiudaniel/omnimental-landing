const SCHEMA_VERSION = "v1";
const isBrowser = typeof window !== "undefined";
const memoryStorage = new Map<string, string>();

type RunHistoryState = {
  completedRunIds: string[];
};

const buildStorageKey = (uid?: string | null): string =>
  `omnimental:${SCHEMA_VERSION}:initiationRunHistory:${uid ?? "anon"}`;

const readRaw = (key: string): string | null => {
  if (isBrowser) {
    try {
      return window.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return memoryStorage.get(key) ?? null;
};

const writeRaw = (key: string, value: string | null): void => {
  if (isBrowser) {
    try {
      if (value === null) {
        window.localStorage?.removeItem(key);
      } else {
        window.localStorage?.setItem(key, value);
      }
    } catch {
      // ignore
    }
    return;
  }
  if (value === null) {
    memoryStorage.delete(key);
  } else {
    memoryStorage.set(key, value);
  }
};

function readRunHistory(userId?: string | null): RunHistoryState {
  try {
    const raw = readRaw(buildStorageKey(userId));
    if (!raw) return { completedRunIds: [] };
    const parsed = JSON.parse(raw) as RunHistoryState;
    if (!Array.isArray(parsed?.completedRunIds)) {
      return { completedRunIds: [] };
    }
    return { completedRunIds: parsed.completedRunIds };
  } catch {
    return { completedRunIds: [] };
  }
}

function writeRunHistory(userId: string | null | undefined, state: RunHistoryState): void {
  writeRaw(buildStorageKey(userId), JSON.stringify(state));
}

export function clearInitiationRunHistory(userId?: string | null): void {
  writeRaw(buildStorageKey(userId), null);
}

export function hasInitiationRunCompleted(userId: string | null | undefined, runId: string): boolean {
  if (!runId) return false;
  const history = readRunHistory(userId);
  return history.completedRunIds.includes(runId);
}

export function markInitiationRunCompleted(userId: string | null | undefined, runId: string): void {
  if (!runId) return;
  const history = readRunHistory(userId);
  if (history.completedRunIds.includes(runId)) return;
  history.completedRunIds.push(runId);
  writeRunHistory(userId, history);
}
