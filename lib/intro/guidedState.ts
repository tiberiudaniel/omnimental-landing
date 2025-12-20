const STORAGE_KEYS = {
  answers: "guided_day1_answers",
  completed: "guided_day1_completed",
  completedCount: "guided_day1_completed_count",
};

type GuidedAnswers = Record<string, string>;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getGuidedAnswers(): GuidedAnswers {
  const storage = getStorage();
  if (!storage) return {};
  const raw = storage.getItem(STORAGE_KEYS.answers);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as GuidedAnswers) : {};
  } catch {
    return {};
  }
}

export function setGuidedAnswer(step: string, value: string) {
  const storage = getStorage();
  if (!storage) return;
  const answers = getGuidedAnswers();
  answers[step] = value;
  try {
    storage.setItem(STORAGE_KEYS.answers, JSON.stringify(answers));
  } catch {
    // ignore
  }
}

export function getGuidedCompleted(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(STORAGE_KEYS.completed) === "1";
}

export function setGuidedCompleted(value: boolean) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.completed, value ? "1" : "0");
}

export function getGuidedCompletionCount(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const raw = storage.getItem(STORAGE_KEYS.completedCount);
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function incrementGuidedCompletionCount(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const next = getGuidedCompletionCount() + 1;
  storage.setItem(STORAGE_KEYS.completedCount, String(next));
  return next;
}
