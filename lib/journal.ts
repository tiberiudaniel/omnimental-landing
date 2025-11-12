"use client";

import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDb, areWritesDisabled } from "./firebase";

export type JournalTabId =
  | "SCOP_INTENTIE"
  | "MOTIVATIE_REZURSE"
  | "PLAN_RECOMANDARI"
  | "OBSERVATII_EVALUARE"
  | "NOTE_LIBERE";

export type JournalTabContent = {
  text: string;
  updatedAt?: unknown;
  theme?: string | null;
  sourcePage?: string | null;
  sourceBlock?: string | null;
};

export type JournalDoc = {
  userId: string;
  tabs: Partial<Record<JournalTabId, JournalTabContent>>;
  createdAt?: unknown;
  updatedAt?: unknown;
};

const DEFAULT_TABS: Partial<Record<JournalTabId, JournalTabContent>> = {
  SCOP_INTENTIE: { text: "" },
  MOTIVATIE_REZURSE: { text: "" },
  PLAN_RECOMANDARI: { text: "" },
  OBSERVATII_EVALUARE: { text: "" },
  NOTE_LIBERE: { text: "" },
};

export async function getJournalByUser(userId: string): Promise<JournalDoc> {
  const db = getDb();
  const ref = doc(db, "journals", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // create lazily to avoid quota when disabled
    const initial: JournalDoc = {
      userId,
      tabs: DEFAULT_TABS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (!areWritesDisabled()) {
      await setDoc(ref, initial);
    }
    return initial;
  }
  const data = snap.data() as JournalDoc;
  return { ...data, tabs: { ...DEFAULT_TABS, ...(data.tabs || {}) } };
}

export async function updateJournalTab(
  userId: string,
  tabId: JournalTabId,
  content: Partial<JournalTabContent>,
): Promise<void> {
  if (areWritesDisabled()) return;
  const db = getDb();
  const ref = doc(db, "journals", userId);
  const update: Partial<JournalDoc> = {
    [`tabs.${tabId}`]: {
      ...content,
      updatedAt: serverTimestamp(),
    } as JournalTabContent,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, update as unknown as Record<string, unknown>);
}
