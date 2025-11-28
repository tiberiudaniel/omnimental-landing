import { doc, getDoc, serverTimestamp, setDoc, increment } from "firebase/firestore";
import { getDb, ensureAuth } from "@/lib/firebase";
import { recordOmniPatch } from "@/lib/progressFacts";

export type DailyCheckinPayload = {
  clarity: number;
  energy: number;
  emotion: number;
};

export type DailySummaryInput = {
  prevStreak: number | null;
  prevDate: string | null;
};

const toDateKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (base = new Date()) => toDateKey(base);

export const getTodayKey = () => formatDate();

const getPreviousDateKey = (dateKey: string | null | undefined) => {
  if (!dateKey) return null;
  const parts = dateKey.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map((segment) => Number(segment));
  if ([year, month, day].some((unit) => Number.isNaN(unit))) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return toDateKey(date);
};

export function getDailyResetPreviousDateKey(dateKey: string | null | undefined) {
  return getPreviousDateKey(dateKey);
}

export async function loadDailyCheckin(userId: string) {
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== userId) return null;
  const todayKey = `${userId}_${getTodayKey()}`;
  const ref = doc(getDb(), "userDailyCheckins", todayKey);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as DailyCheckinPayload & { date: string }) : null;
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
  const date = getTodayKey();
  const checkinId = `${userId}_${date}`;
  const ref = doc(getDb(), "userDailyCheckins", checkinId);
  await setDoc(ref, {
    userId,
    date,
    clarity: values.clarity,
    energy: values.energy,
    emotion: values.emotion,
    createdAt: serverTimestamp(),
  });
  const yesterdayKey = getPreviousDateKey(date);
  const continuesStreak =
    yesterdayKey && summary.prevDate === yesterdayKey && typeof summary.prevStreak === "number";
  const streakDays = continuesStreak ? summary.prevStreak! + 1 : 1;
  await recordOmniPatch(
    {
      daily: { streakDays, lastCheckinDate: date },
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
