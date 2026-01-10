import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as limitQuery,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { getDb, ensureAuth } from "@/lib/firebase";
import { recordOmniPatch } from "@/lib/progressFacts";
import { getTodayKey as getCanonicalTodayKey } from "@/lib/time/todayKey";
import { resolveDailyResetKeys } from "@/lib/dailyReset/dateKeys";

export { getDailyResetPreviousDateKey, resolveDailyResetKeys } from "@/lib/dailyReset/dateKeys";

export type DailyCheckinPayload = {
  clarity: number;
  energy: number;
  stress: number;
  sleep?: number | null;
};

export type DailySummaryInput = {
  prevStreak: number | null;
  prevDate: string | null;
};

export type DailyAxesEntry = {
  id: string;
  date: string;
  createdAt: Date;
  clarityScore: number;
  emotionScore: number;
  energyScore: number;
  clarityDeltaFromPersonalMean: number;
  emotionDeltaFromPersonalMean: number;
  energyDeltaFromPersonalMean: number;
};

/** @deprecated Use getTodayKey from "@/lib/time/todayKey" */
export const getTodayKey = (date: Date = new Date()) => getCanonicalTodayKey(date);

export async function loadDailyCheckin(userId: string) {
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== userId) return null;
  const todayKey = `${userId}_${getTodayKey()}`;
  const ref = doc(getDb(), "userDailyCheckins", todayKey);
  const snap = await getDoc(ref);
  return snap.exists()
    ? (snap.data() as DailyCheckinPayload & { date: string })
    : null;
}

export async function saveDailyCheckin(
  userId: string,
  values: DailyCheckinPayload,
  summary: DailySummaryInput,
) {
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== userId) {
    throw new Error("User not authenticated for daily reset");
  }
  const { todayKey: date, yesterdayKey } = resolveDailyResetKeys();
  const checkinId = `${userId}_${date}`;
  const ref = doc(getDb(), "userDailyCheckins", checkinId);
  const entry = {
    energy: values.energy,
    stress: values.stress,
    clarity: values.clarity,
    ...(typeof values.sleep === "number" ? { sleep: values.sleep } : {}),
  };

  await setDoc(ref, {
    userId,
    date,
    ...entry,
    createdAt: serverTimestamp(),
  });
  const continuesStreak =
    yesterdayKey && summary.prevDate === yesterdayKey && typeof summary.prevStreak === "number";
  const streakDays = continuesStreak ? summary.prevStreak! + 1 : 1;
  await recordOmniPatch(
    {
      daily: {
        streakDays,
        lastCheckinDate: date,
        today: entry,
        history: {
          [date]: entry,
        },
      },
      kuno: {
        global: {
          totalXp: increment(5) as unknown as number,
        },
      },
    },
    userId,
  );
  return {
    streakDays,
    lastCheckinDate: date,
  };
}

const clampScoreValue = (value: number | null | undefined, fallback = 5) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(10, value));
  }
  return fallback;
};

const toDateFromPieces = (raw: string | null | undefined): Date | null => {
  if (!raw) return null;
  const parts = raw.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map((segment) => Number(segment));
  if ([y, m, d].some((unit) => Number.isNaN(unit))) return null;
  return new Date(Date.UTC(y, m - 1, d));
};

const normalizeCreatedAt = (input: unknown, fallbackDateKey?: string): Date => {
  if (input instanceof Timestamp) {
    return input.toDate();
  }
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === "object" && input && typeof (input as { toDate?: () => Date }).toDate === "function") {
    try {
      return (input as { toDate: () => Date }).toDate();
    } catch {}
  }
  const derived = toDateFromPieces(fallbackDateKey);
  return derived ?? new Date();
};

const entryTime = (entry: Pick<DailyAxesEntry, "createdAt">) => entry.createdAt?.getTime?.() ?? 0;

export async function getLastAxesEntries(userId: string, limitCount = 4): Promise<DailyAxesEntry[]> {
  if (!userId) return [];
  try {
    await ensureAuth();
  } catch {
    // noop – read attempts can continue, Firestore will enforce security rules
  }
  const db = getDb();
  const ref = collection(db, "userDailyCheckins");
  const cappedLimit = Math.max(1, Math.min(limitCount, 10));
  const q = query(
    ref,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limitQuery(cappedLimit),
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];
  const rawEntries = snap.docs.map((docSnap) => {
    const data = docSnap.data() as DailyCheckinPayload & {
      createdAt?: Timestamp | Date | { toDate?: () => Date } | null;
    } & { emotion?: number; date?: string };
    const createdAt = normalizeCreatedAt(data.createdAt ?? null, data.date);
    const dateKey = typeof data.date === "string" ? data.date : getCanonicalTodayKey(createdAt);
    const clarityScore = clampScoreValue(data.clarity, 5);
    const stressScore = clampScoreValue((data as { stress?: number }).stress, undefined);
    const storedEmotion = clampScoreValue((data as { emotion?: number }).emotion, undefined);
    const emotionScore =
      storedEmotion !== null && !Number.isNaN(storedEmotion)
        ? storedEmotion
        : typeof stressScore === "number"
          ? clampScoreValue(10 - stressScore, 5)
          : 5;
    const energyBase = clampScoreValue(data.energy, 5);
    const sleepScore = clampScoreValue(data.sleep, undefined);
    const energyScore =
      typeof sleepScore === "number" ? clampScoreValue((energyBase + sleepScore) / 2, energyBase) : energyBase;
    return {
      id: docSnap.id,
      date: dateKey,
      createdAt,
      clarityScore,
      emotionScore,
      energyScore,
    };
  });
  const count = rawEntries.length || 1;
  const clarityMean = rawEntries.reduce((acc, entry) => acc + entry.clarityScore, 0) / count;
  const emotionMean = rawEntries.reduce((acc, entry) => acc + entry.emotionScore, 0) / count;
  const energyMean = rawEntries.reduce((acc, entry) => acc + entry.energyScore, 0) / count;
  return rawEntries
    .map((entry) => ({
      ...entry,
      clarityDeltaFromPersonalMean: entry.clarityScore - clarityMean,
      emotionDeltaFromPersonalMean: entry.emotionScore - emotionMean,
      energyDeltaFromPersonalMean: entry.energyScore - energyMean,
    }))
    .sort((a, b) => entryTime(a) - entryTime(b));
}
