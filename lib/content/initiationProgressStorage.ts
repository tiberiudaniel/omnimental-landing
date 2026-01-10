import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import { getNextLessonInModule } from "@/lib/content/getNextLessonInModule";
import { getLocalCompletionStreak } from "@/lib/dailyCompletion";
import type { LessonId, ModuleId, WorldId } from "@/lib/taxonomy/types";
import { persistRemoteInitiationFacts } from "@/lib/content/initiationFactsRemote";

const SCHEMA_VERSION = "v1";
const LEGACY_STORAGE_KEY = "omnimental:initiationProgress";
const LOCAL_EVENT = "initiation-progress-updated";
const memoryStorage = new Map<string, string>();

const buildStorageKey = (uid?: string | null): string =>
  `omnimental:${SCHEMA_VERSION}:initiationProgress:${uid ?? "anon"}`;

export type InitiationProgressState = {
  moduleId: ModuleId;
  completedLessonIds: LessonId[];
};

const canUseDOM = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const notifyProgressUpdate = (): void => {
  if (!canUseDOM()) return;
  try {
    window.dispatchEvent(new Event(LOCAL_EVENT));
  } catch {
    // ignore
  }
};

function readRaw(key: string): string | null {
  if (canUseDOM()) {
    try {
      return window.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return memoryStorage.get(key) ?? null;
}

function writeRaw(key: string, value: string | null): void {
  if (canUseDOM()) {
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
}

function safeParse(raw: string | null): InitiationProgressState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as InitiationProgressState;
    if (!parsed?.moduleId) return null;
    return {
      moduleId: parsed.moduleId,
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
    };
  } catch {
    return null;
  }
}

function safeStringify(state: InitiationProgressState): string | null {
  try {
    return JSON.stringify(state);
  } catch {
    return null;
  }
}

function migrateLegacyState(targetKey: string): InitiationProgressState | null {
  if (!canUseDOM()) return null;
  const legacy = readRaw(LEGACY_STORAGE_KEY);
  if (!legacy) return null;
  const parsed = safeParse(legacy);
  if (!parsed) return null;
  const payload = safeStringify(parsed);
  if (payload) {
    writeRaw(targetKey, payload);
    writeRaw(LEGACY_STORAGE_KEY, null);
  }
  return parsed;
}

export function readInitiationProgressState(userId?: string | null): InitiationProgressState | null {
  const key = buildStorageKey(userId);
  const existing = safeParse(readRaw(key));
  if (existing) return existing;
  return migrateLegacyState(key);
}

export function writeInitiationProgressState(
  userId: string | null | undefined,
  state: InitiationProgressState,
): void {
  const payload = safeStringify(state);
  if (!payload) return;
  writeRaw(buildStorageKey(userId), payload);
  notifyProgressUpdate();
}

export function clearInitiationProgress(userId?: string | null): void {
  writeRaw(buildStorageKey(userId), null);
  notifyProgressUpdate();
}

export function ensureInitiationProgress(
  userId: string | null | undefined,
  moduleId: ModuleId,
): InitiationProgressState {
  const existing = readInitiationProgressState(userId);
  if (existing && existing.moduleId === moduleId) {
    return existing;
  }
  const next = { moduleId, completedLessonIds: [] };
  writeInitiationProgressState(userId, next);
  return next;
}

export function markInitiationLessonsCompleted(
  userId: string | null | undefined,
  moduleId: ModuleId,
  lessons: LessonId[],
): void {
  if (!lessons.length) return;
  const state = ensureInitiationProgress(userId, moduleId);
  let nextState: InitiationProgressState;
  if (state.moduleId !== moduleId) {
    nextState = { moduleId, completedLessonIds: lessons };
  } else {
    const updated = new Set(state.completedLessonIds);
    lessons.forEach((lesson) => updated.add(lesson));
    nextState = { moduleId, completedLessonIds: Array.from(updated) };
  }
  writeInitiationProgressState(userId, nextState);
  void persistRemoteInitiationFacts(userId ?? null, nextState).catch(() => {});
}

export type InitiationFacts = {
  activeWorld: WorldId;
  currentModuleId: ModuleId;
  completedLessons: number;
  moduleLessonCount: number;
  nextLessonId: LessonId | null;
  streakDays: number;
};

export function getLocalInitiationFacts(userId?: string | null): InitiationFacts | null {
  const state = readInitiationProgressState(userId);
  if (!state?.moduleId) return null;
  const moduleMeta = INITIATION_MODULES[state.moduleId];
  if (!moduleMeta) return null;
  const completedLessons = Math.min(state.completedLessonIds.length, moduleMeta.lessonIds.length);
  const moduleLessonCount = moduleMeta.lessonIds.length;
  const nextLessonId = getNextLessonInModule(state.moduleId, state.completedLessonIds);
  return {
    activeWorld: "INITIATION",
    currentModuleId: state.moduleId,
    completedLessons,
    moduleLessonCount,
    nextLessonId: nextLessonId ?? null,
    streakDays: getLocalCompletionStreak(),
  };
}

export const INITIATION_PROGRESS_EVENT = LOCAL_EVENT;
export const LEGACY_INITIATION_PROGRESS_KEY = LEGACY_STORAGE_KEY;
