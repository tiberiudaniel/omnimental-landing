import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { areWritesDisabled, getDb } from "@/lib/firebase";
import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { DailyPracticeDoc, DailyPracticePathVariant } from "@/types/dailyPractice";
import { getTodayKey } from "@/lib/time/todayKey";

const COLLECTION_NAME = "dailyPractice";

/** @deprecated Use getTodayKey from "@/lib/time/todayKey" */
export function getCurrentDateKey(date: Date = new Date()): string {
  return getTodayKey(date);
}

export function buildDailyPracticeDocId(userId: string, configId: string, date: string): string {
  return `${userId}_${configId}_${date}`;
}

interface BasePayload {
  userId: string;
  configId: string;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  lang: DailyPathLanguage;
  date?: string;
  timeAvailableMin?: number | null;
}

export async function markDailyPracticeStart(payload: BasePayload) {
  if (!payload.userId || areWritesDisabled()) return;
  const db = getDb();
  const date = payload.date ?? getCurrentDateKey();
  const ref = doc(db, COLLECTION_NAME, buildDailyPracticeDocId(payload.userId, payload.configId, date));
  const existingSnap = await getDoc(ref);
  const existing = existingSnap.exists() ? (existingSnap.data() as DailyPracticeDoc) : null;
  if (existing?.completed) {
    return;
  }
  await setDoc(
    ref,
    {
      userId: payload.userId,
      date,
      configId: payload.configId,
      cluster: payload.cluster,
      mode: payload.mode,
      lang: payload.lang,
      completed: false,
      xpEarned: 0,
      nodesCompletedCount: 0,
      pathVariant: null,
      durationSeconds: null,
      startedAt: serverTimestamp(),
      completedAt: null,
      timeAvailableMin: payload.timeAvailableMin ?? null,
    },
    { merge: true },
  );
}

export async function markDailyPracticeCompleted(
  payload: BasePayload & {
    xpEarned: number;
    nodesCompletedCount: number;
    pathVariant: DailyPracticePathVariant;
    durationSeconds: number | null;
  },
) {
  if (!payload.userId || areWritesDisabled()) return;
  const db = getDb();
  const date = payload.date ?? getCurrentDateKey();
  const ref = doc(db, COLLECTION_NAME, buildDailyPracticeDocId(payload.userId, payload.configId, date));
  const existingSnap = await getDoc(ref);
  const existing = existingSnap.exists() ? (existingSnap.data() as DailyPracticeDoc) : null;
  if (existing?.completed) {
    return;
  }
  await setDoc(
    ref,
    {
      userId: payload.userId,
      date,
      configId: payload.configId,
      cluster: payload.cluster,
      mode: payload.mode,
      lang: payload.lang,
      completed: true,
      xpEarned: payload.xpEarned,
      nodesCompletedCount: payload.nodesCompletedCount,
      pathVariant: payload.pathVariant,
      durationSeconds: payload.durationSeconds,
      completedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getDailyPracticeHistory(userId: string, limitCount = 14): Promise<DailyPracticeDoc[]> {
  if (!userId) return [];
  const db = getDb();
  const snapshot = await getDocs(
    query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("date", "desc"),
      orderBy("completedAt", "desc"),
      limit(limitCount),
    ),
  );
  return snapshot.docs.map((docSnap) => docSnap.data() as DailyPracticeDoc);
}
