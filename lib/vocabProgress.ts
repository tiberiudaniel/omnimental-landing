"use client";

const STORAGE_KEYS = {
  unlocked: "omni_vocab_unlocked",
  shownDay: "omni_vocab_shown_day",
  shownMeta: "omni_vocab_shown_meta",
  history: "omni_vocab_history",
  shownTodayMeta: "omni_vocab_shown_today_meta",
  lastById: "omni_vocab_last_day_by_id",
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

export function getRecentVocabIds(limit = 7): string[] {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(STORAGE_KEYS.history);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, limit) : [];
  } catch {
    return [];
  }
}

export function pushRecentVocabId(vocabId: string, limit = 7): string[] {
  const storage = getStorage();
  if (!storage) return [];
  const current = getRecentVocabIds(limit);
  const filtered = current.filter((id) => id !== vocabId);
  filtered.unshift(vocabId);
  const next = filtered.slice(0, limit);
  try {
    storage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

type VocabShownCountMeta = {
  dayKey: string;
  count: number;
};

export function getVocabShownTodayCount(dayKey: string): number {
  const storage = getStorage();
  if (!storage) return 0;
  const raw = storage.getItem(STORAGE_KEYS.shownTodayMeta);
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as VocabShownCountMeta;
    if (parsed.dayKey === dayKey && typeof parsed.count === "number") {
      return parsed.count;
    }
  } catch {
    return 0;
  }
  return 0;
}

export function incrementVocabShownTodayCount(dayKey: string): number {
  const storage = getStorage();
  if (!storage) return 0;
  const current = getVocabShownTodayCount(dayKey);
  const payload: VocabShownCountMeta = { dayKey, count: current + 1 };
  try {
    storage.setItem(STORAGE_KEYS.shownTodayMeta, JSON.stringify(payload));
  } catch {
    // ignore
  }
  return payload.count;
}

function loadLastShownMap(): Record<string, string> {
  const storage = getStorage();
  if (!storage) return {};
  const raw = storage.getItem(STORAGE_KEYS.lastById);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return {};
  }
  return {};
}

export function getLastShownDayById(): Record<string, string> {
  return loadLastShownMap();
}

export function setLastShownDayForVocab(vocabId: string, dayKey: string) {
  const storage = getStorage();
  if (!storage) return;
  const map = loadLastShownMap();
  map[vocabId] = dayKey;
  try {
    storage.setItem(STORAGE_KEYS.lastById, JSON.stringify(map));
  } catch {
    // ignore
  }
}
