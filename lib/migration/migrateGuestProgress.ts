"use client";

import { getTodayKey, hasCompletedToday } from "@/lib/dailyCompletion";
import { recordDailyRunnerEvent, recordMindPacingSignal } from "@/lib/progressFacts/recorders";
import { getShownVocabIdForToday } from "@/lib/vocabProgress";

const SAVE_PROMPT_PREFIX = "guided_day1_save_progress_seen_v1:";
export const GUIDED_DAY_ONE_MIGRATE_PENDING_KEY = "guided_day1_migrate_pending_v1";
export const GUIDED_DAY_ONE_MIGRATED_KEY = "guided_day1_guest_migrated_v1";

type MindPacingStorageEntry = {
  questionId?: string;
  optionId?: string;
  answerTagPrimary?: string;
  answerTagsSecondary?: string[];
  mindTag?: string | null;
  axisId?: string | null;
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function hasGuidedDayOneSavePromptBeenSeen(dayKey: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(`${SAVE_PROMPT_PREFIX}${dayKey}`) === "1";
}

export function markGuidedDayOneSavePromptSeen(dayKey: string) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(`${SAVE_PROMPT_PREFIX}${dayKey}`, "1");
  } catch {
    // ignore
  }
}

export function markGuidedDayOneMigrationPending() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(GUIDED_DAY_ONE_MIGRATE_PENDING_KEY, "1");
  } catch {
    // ignore
  }
}

function clearGuidedDayOneMigrationPending() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(GUIDED_DAY_ONE_MIGRATE_PENDING_KEY);
  } catch {
    // ignore
  }
}

function markGuidedDayOneMigrated() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(GUIDED_DAY_ONE_MIGRATED_KEY, "1");
  } catch {
    // ignore
  }
}

function readMindPacingEntry(dayKey: string): MindPacingStorageEntry | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem("mind_info_state_v1");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, MindPacingStorageEntry>;
    const entry = parsed?.[dayKey];
    if (entry && typeof entry === "object") {
      return entry;
    }
  } catch {
    return null;
  }
  return null;
}

function getTodayCompletionModule(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const record = storage.getItem(`OMNI_DAILY_COMPLETED_${getTodayKey()}`);
    if (!record) return null;
    const parsed = JSON.parse(record) as { moduleKey?: string | null };
    return typeof parsed?.moduleKey === "string" ? parsed.moduleKey : null;
  } catch {
    return null;
  }
}

export async function migrateGuestProgress(userId: string | null | undefined) {
  if (typeof window === "undefined") return;
  if (!userId) return;
  const storage = getStorage();
  if (!storage) return;
  if (storage.getItem(GUIDED_DAY_ONE_MIGRATE_PENDING_KEY) !== "1") {
    return;
  }
  if (storage.getItem(GUIDED_DAY_ONE_MIGRATED_KEY) === "1") {
    storage.removeItem(GUIDED_DAY_ONE_MIGRATE_PENDING_KEY);
    return;
  }
  const dayKey = getTodayKey();
  const tasks: Array<Promise<unknown>> = [];
  const mindEntry = readMindPacingEntry(dayKey);
  if (mindEntry?.questionId) {
    tasks.push(
      recordMindPacingSignal(
        {
          dayKey,
          questionId: mindEntry.questionId,
          optionId: mindEntry.optionId ?? null,
          mindTag: mindEntry.mindTag ?? mindEntry.answerTagPrimary ?? null,
          axisId: mindEntry.axisId ?? null,
        },
        userId,
      ),
    );
  }
  const vocabId = getShownVocabIdForToday(dayKey);
  if (vocabId) {
    tasks.push(
      recordDailyRunnerEvent(
        {
          type: "vocab_completed",
          optionId: vocabId,
          label: vocabId,
          context: "guided_day1_migration",
        },
        userId,
      ),
    );
  }
  if (hasCompletedToday()) {
    tasks.push(
      recordDailyRunnerEvent(
        {
          type: "today_run_completed",
          mode: "deep",
          label: getTodayCompletionModule(),
          context: "guided_day1_migration",
        },
        userId,
      ),
    );
  }
  if (!tasks.length) {
    storage.removeItem(GUIDED_DAY_ONE_MIGRATE_PENDING_KEY);
    return;
  }
  try {
    await Promise.all(tasks);
    markGuidedDayOneMigrated();
    clearGuidedDayOneMigrationPending();
  } catch (error) {
    console.warn("migrateGuestProgress failed", error);
  }
}
