const KEYS = {
  seen: "omni:introSeen:v1",
  legacySeen: "intro_seen",
  variant: "omni:introVariant",
  lastChoice: "intro_last_choice",
  heuristics: "intro_heuristics",
  intent: "intro_intent",
};

export type IntroIntent = "explore" | "guided" | "today";
export type IntroChoice = IntroIntent;

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

function normalizeIntent(value: string | null): IntroIntent | null {
  if (value === "explore" || value === "guided" || value === "today") return value;
  if (value === "mindpacing") return "today";
  return null;
}

export function getIntroIntent(): IntroIntent | null {
  const storage = getStorage();
  if (!storage) return null;
  const value = storage.getItem(KEYS.intent) ?? storage.getItem(KEYS.lastChoice);
  const normalized = normalizeIntent(value);
  if (!normalized) return null;
  // Normalize persisted value for backwards compatibility
  try {
    storage.setItem(KEYS.intent, normalized);
    storage.setItem(KEYS.lastChoice, normalized);
  } catch {
    // ignore write failures
  }
  return normalized;
}

export function setIntroIntent(intent: IntroIntent) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(KEYS.intent, intent);
  storage.setItem(KEYS.lastChoice, intent);
}

export function getLastIntroChoice(): IntroChoice | null {
  return getIntroIntent();
}

export function setLastIntroChoice(choice: IntroChoice) {
  setIntroIntent(choice);
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
