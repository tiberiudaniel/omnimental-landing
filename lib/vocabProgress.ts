"use client";

const STORAGE_KEYS = {
  unlocked: "omni_vocab_unlocked",
  shownDay: "omni_vocab_shown_day",
  shownMeta: "omni_vocab_shown_meta",
};

type VocabShownMeta = {
  dayKey: string;
  vocabId: string;
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getUnlockedVocabIds(): string[] {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(STORAGE_KEYS.unlocked);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function unlockVocab(id: string): string[] {
  const storage = getStorage();
  if (!storage) return [];
  const prev = getUnlockedVocabIds();
  if (prev.includes(id)) return prev;
  const next = [...prev, id];
  try {
    storage.setItem(STORAGE_KEYS.unlocked, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function wasVocabShownToday(dayKey: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(STORAGE_KEYS.shownDay) === dayKey;
}

export function markVocabShownToday(dayKey: string) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.shownDay, dayKey);
  } catch {
    // ignore
  }
}

export function getShownVocabIdForToday(dayKey: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  const payload = storage.getItem(STORAGE_KEYS.shownMeta);
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as VocabShownMeta;
    if (parsed.dayKey === dayKey && typeof parsed.vocabId === "string") {
      return parsed.vocabId;
    }
  } catch {
    return null;
  }
  return null;
}

export function setShownVocabIdForToday(dayKey: string, vocabId: string) {
  const storage = getStorage();
  if (!storage) return;
  const payload: VocabShownMeta = { dayKey, vocabId };
  try {
    storage.setItem(STORAGE_KEYS.shownMeta, JSON.stringify(payload));
  } catch {
    // ignore
  }
}
