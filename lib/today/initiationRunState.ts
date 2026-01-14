import type { LessonId } from "@/lib/taxonomy/types";

const STORAGE_PREFIX = "omnimental:initiationRunState:";

export type InitiationRunState = {
  runId: string;
  blockIndex: number;
  completed: {
    core?: boolean;
    elective?: boolean;
    recall?: boolean;
  };
  responses?: Record<string, RecallResponse>;
};

export type RecallResponse = {
  promptId: string;
  answer?: string;
  choiceIndex?: number | null;
  microActionDone?: boolean;
};

type StoredRunState = InitiationRunState & {
  lessonContext?: {
    lastLessonId?: LessonId | null;
  };
};

const hasWindow = (): boolean => typeof window !== "undefined";

function getStorageKey(runId: string): string {
  return `${STORAGE_PREFIX}${runId}`;
}

export function readInitiationRunState(runId: string): InitiationRunState | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(runId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRunState;
    if (parsed.runId !== runId) {
      return null;
    }
    return {
      runId: parsed.runId,
      blockIndex: typeof parsed.blockIndex === "number" ? parsed.blockIndex : 0,
      completed: parsed.completed ?? {},
      responses: parsed.responses ?? undefined,
    };
  } catch {
    return null;
  }
}

export function saveInitiationRunState(state: InitiationRunState): void {
  if (!hasWindow()) return;
  try {
    const payload: StoredRunState = {
      ...state,
    };
    window.sessionStorage.setItem(getStorageKey(state.runId), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function clearInitiationRunState(runId: string | null | undefined): void {
  if (!runId || !hasWindow()) return;
  try {
    window.sessionStorage.removeItem(getStorageKey(runId));
  } catch {
    // ignore
  }
}
