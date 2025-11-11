"use client";

const STORAGE_KEY = "omnimental_wizard_state_v1";

type StoredWizardState = {
  version: 1;
  step?: string;
};

const isBrowser = () => typeof window !== "undefined";

const parseState = (raw: string | null): StoredWizardState | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredWizardState;
    if (parsed && typeof parsed === "object" && parsed.version === 1) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse wizard state", error);
  }
  return null;
};

export const readWizardState = (): StoredWizardState | null => {
  if (!isBrowser()) {
    return null;
  }
  return parseState(window.localStorage.getItem(STORAGE_KEY));
};

export const writeWizardState = (update: Partial<StoredWizardState>) => {
  if (!isBrowser()) {
    return;
  }
  const existing = readWizardState() ?? { version: 1 };
  const next: StoredWizardState = {
    ...existing,
    ...update,
    version: 1,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};
