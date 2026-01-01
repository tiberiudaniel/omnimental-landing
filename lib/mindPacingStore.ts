"use client";

type MindPacingEntry = {
  questionId: string;
  optionId?: string;
  answerTagPrimary?: string;
  answerTagsSecondary?: string[];
  vocabPrimaryId?: string;
  vocabSecondaryId?: string | null;
  mindTag?: string | null;
  updatedAt: number;
};

type MindPacingState = Record<string, MindPacingEntry>;

const STORAGE_KEYS = {
  state: "mind_info_state_v1",
  rotation: "mind_info_rotation_index",
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadState(): MindPacingState {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEYS.state);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MindPacingState;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function persistState(state: MindPacingState) {
  const storage = getStorage();
  if (!storage) return;
  const entries = Object.entries(state)
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .slice(0, 14);
  const pruned: MindPacingState = {};
  entries.forEach(([dayKey, entry]) => {
    pruned[dayKey] = entry;
  });
  try {
    storage.setItem(STORAGE_KEYS.state, JSON.stringify(pruned));
  } catch {
    // ignore
  }
}

export function getMindPacingEntry(dayKey: string): MindPacingEntry | null {
  const state = loadState();
  return state[dayKey] ?? null;
}

export function ensureMindPacingQuestion(dayKey: string, questionId: string): MindPacingEntry {
  const state = loadState();
  const existing = state[dayKey];
  if (existing && existing.questionId === questionId) {
    return existing;
  }
  const next: MindPacingEntry = {
    questionId,
    updatedAt: Date.now(),
  };
  state[dayKey] = next;
  persistState(state);
  return next;
}

export function storeMindPacingAnswer(
  dayKey: string,
  payload: {
    questionId: string;
    optionId: string;
    answerTagPrimary: string;
    answerTagsSecondary?: string[];
    vocabPrimaryId?: string | null;
    vocabSecondaryId?: string | null;
    mindTag?: string | null;
  },
) {
  const state = loadState();
  const current = state[dayKey] ?? { questionId: payload.questionId, updatedAt: Date.now() };
  const next: MindPacingEntry = {
    ...current,
    questionId: payload.questionId,
    optionId: payload.optionId,
    answerTagPrimary: payload.answerTagPrimary,
    answerTagsSecondary: payload.answerTagsSecondary,
    mindTag: payload.mindTag ?? current.mindTag ?? null,
    updatedAt: Date.now(),
  };
  if (payload.vocabPrimaryId !== undefined) {
    if (payload.vocabPrimaryId) {
      next.vocabPrimaryId = payload.vocabPrimaryId;
    } else {
      delete next.vocabPrimaryId;
    }
  }
  if (payload.vocabSecondaryId !== undefined) {
    next.vocabSecondaryId = payload.vocabSecondaryId;
  }
  state[dayKey] = next;
  persistState(state);
}

export function setMindPacingVocab(dayKey: string, vocabPrimaryId: string | null) {
  const state = loadState();
  const entry = state[dayKey];
  if (!entry) return;
  if (vocabPrimaryId) {
    entry.vocabPrimaryId = vocabPrimaryId;
  } else {
    delete entry.vocabPrimaryId;
  }
  entry.updatedAt = Date.now();
  state[dayKey] = entry;
  persistState(state);
}

export function getLastMindPacingQuestionId(excludeDayKey?: string): string | null {
  const state = loadState();
  const entries = Object.entries(state)
    .filter(([dayKey]) => (excludeDayKey ? dayKey !== excludeDayKey : true))
    .sort(([a], [b]) => (a > b ? -1 : 1));
  for (const [, entry] of entries) {
    if (entry?.questionId) {
      return entry.questionId;
    }
  }
  return null;
}

export function getMindPacingRotationIndex(): number {
  const storage = getStorage();
  if (!storage) return -1;
  const raw = storage.getItem(STORAGE_KEYS.rotation);
  if (!raw) return -1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : -1;
}

export function setMindPacingRotationIndex(index: number) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.rotation, String(index));
  } catch {
    // ignore
  }
}

export type { MindPacingEntry };
