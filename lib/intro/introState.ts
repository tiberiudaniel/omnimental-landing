const KEYS = {
  seen: "omni:introSeen:v1",
  legacySeen: "intro_seen",
  variant: "omni:introVariant",
  lastChoice: "intro_last_choice",
  heuristics: "intro_heuristics",
};

export type IntroChoice = "explore" | "guided";

export type HeuristicSnapshot = {
  avgDwellMs?: number;
  skipPressed?: boolean;
  rapidClicks?: number;
};

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
  const value = storage.getItem(KEYS.seen);
  if (value === "1") return true;
  const legacy = storage.getItem(KEYS.legacySeen);
  return legacy === "1";
}

export function setIntroSeen(value: boolean) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(KEYS.seen, value ? "1" : "0");
}

export function setIntroVariant(variant: string) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(KEYS.variant, variant);
}

export function getLastIntroChoice(): IntroChoice | null {
  const storage = getStorage();
  if (!storage) return null;
  const value = storage.getItem(KEYS.lastChoice);
  return value === "explore" || value === "guided" ? value : null;
}

export function setLastIntroChoice(choice: IntroChoice) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(KEYS.lastChoice, choice);
}

export function getIntroHeuristics(): HeuristicSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(KEYS.heuristics);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as HeuristicSnapshot) : null;
  } catch {
    return null;
  }
}

export function setIntroHeuristics(snapshot: HeuristicSnapshot) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(KEYS.heuristics, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}
