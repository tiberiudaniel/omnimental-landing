import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb, ensureAuth } from "@/lib/firebase";

export type DailyCheckinPayload = {
  clarity: number;
  energy: number;
  emotion: number;
};

export type DailySummaryInput = {
  prevStreak: number | null;
  prevDate: string | null;
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" };

const formatDate = () => {
  const date = new Date();
  return date.toLocaleDateString("sv-SE", DATE_OPTIONS).split("T")[0] ?? "";
};

export async function loadDailyCheckin(userId: string) {
  const authUser = await ensureAuth();
  if (!authUser || authUser.uid !== userId) return null;
  const todayKey = `${userId}_${formatDate()}`;
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
  const date = formatDate();
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
  return {
    streakDays: typeof summary.prevStreak === "number" ? summary.prevStreak + 1 : 1,
    lastCheckinDate: date,
  };
}
