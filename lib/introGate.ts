const INTRO_KEY = "omni:introSeen:v1";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getIntroSeen(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  return storage.getItem(INTRO_KEY) === "1";
}

export function setIntroSeen(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(INTRO_KEY, "1");
}
