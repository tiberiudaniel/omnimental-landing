import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "./firebase";
import type { Quest } from "./questSchema";

export async function getUserStyle(userId: string): Promise<string | null> {
  const db = getDb();
  try {
    const ref = doc(db, "userProfiles", userId);
    const snap = await getDoc(ref);
    const style = (snap.exists() ? (snap.data()?.style as string | undefined) : undefined) ?? null;
    return style;
  } catch {
    return null;
  }
}

export async function getTodayInputs(userId: string): Promise<string[]> {
  // Minimal dev implementation: could read from logs; return empty for now
  void userId;
  return [];
}

export async function saveQuest(userId: string, quest: Quest) {
  const db = getDb();
  const ref = collection(db, "users", userId, "quests");
  await addDoc(ref, { ...quest, serverCreatedAt: serverTimestamp() });
}

