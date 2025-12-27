const STORAGE_KEYS = {
  startedAt: "intro_explore_started_at",
  testsCompleted: "intro_explore_tests_completed",
  mediumUnlocked: "intro_explore_medium_unlocked",
  mapViewed: "intro_explore_map_viewed",
  offerShown: "intro_explore_offer_shown",
  axisChoice: "intro_explore_axis_choice",
  completion: "intro_explore_completion",
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getExploreStartedAt(): number | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEYS.startedAt);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setExploreStartedAt(value: number) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.startedAt, String(value));
}

export function getTestsCompleted(): number {
  const storage = getStorage();
  if (!storage) return 0;
  const raw = storage.getItem(STORAGE_KEYS.testsCompleted);
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function setTestsCompleted(count: number) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.testsCompleted, String(Math.max(0, count)));
}

export function getUnlockedMediumTests(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(STORAGE_KEYS.mediumUnlocked) === "1";
}

export function setUnlockedMediumTests(value: boolean) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.mediumUnlocked, value ? "1" : "0");
}

export function getExploreMapViewed(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(STORAGE_KEYS.mapViewed) === "1";
}

export function setExploreMapViewed() {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.mapViewed, "1");
}

export function getExploreOfferShown(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(STORAGE_KEYS.offerShown) === "1";
}

export function setExploreOfferShown(value: boolean) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.offerShown, value ? "1" : "0");
}

export function getAxisLessonChoice(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(STORAGE_KEYS.axisChoice);
}

export function setAxisLessonChoice(axisId: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.axisChoice, axisId);
}

export function getExploreCompletion(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(STORAGE_KEYS.completion);
}

export function setExploreCompletion(source: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS.completion, source);
}
