import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { areWritesDisabled, getDb } from "@/lib/firebase";
import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import type { DailyPracticeDoc } from "@/types/dailyPractice";

const COLLECTION_NAME = "dailyPractice";

export function getCurrentDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getDocId(userId: string, configId: string, date: string) {
  return `${userId}_${configId}_${date}`;
}

interface BasePayload {
  userId: string;
  configId: string;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  lang: DailyPathLanguage;
  date?: string;
}

export async function markDailyPracticeStart(payload: BasePayload) {
  if (!payload.userId || areWritesDisabled()) return;
  const db = getDb();
  const date = payload.date ?? getCurrentDateKey();
  await setDoc(
    doc(db, COLLECTION_NAME, getDocId(payload.userId, payload.configId, date)),
    {
      userId: payload.userId,
      date,
      configId: payload.configId,
      cluster: payload.cluster,
      mode: payload.mode,
      lang: payload.lang,
      completed: false,
      xpEarned: 0,
      startedAt: serverTimestamp(),
      completedAt: null,
    },
    { merge: true },
  );
}

export async function markDailyPracticeCompleted(payload: BasePayload & { xpEarned: number }) {
  if (!payload.userId || areWritesDisabled()) return;
  const db = getDb();
  const date = payload.date ?? getCurrentDateKey();
  await setDoc(
    doc(db, COLLECTION_NAME, getDocId(payload.userId, payload.configId, date)),
    {
      userId: payload.userId,
      date,
      configId: payload.configId,
      cluster: payload.cluster,
      mode: payload.mode,
      lang: payload.lang,
      completed: true,
      xpEarned: payload.xpEarned,
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
