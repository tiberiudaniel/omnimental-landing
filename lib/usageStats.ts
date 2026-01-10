import { collection, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { isE2EMode, readE2ETelemetry } from "@/lib/e2eMode";
import type { SessionTelemetry } from "@/lib/telemetry";
import { getTodayKey } from "@/lib/time/todayKey";

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function sessionsCollection(userId: string) {
  const db = getDb();
  return collection(db, "userTelemetry", userId, "sessions");
}

export async function getSessionsToday(userId: string): Promise<number> {
  if (!userId) return 0;
  if (isE2EMode()) {
    const data = readE2ETelemetry<SessionTelemetry>(userId);
    const todayKey = getTodayKey();
    return data.filter((entry) => {
      const recordedAt = entry.recordedAt instanceof Date ? entry.recordedAt : entry.recordedAtOverride;
      if (!recordedAt) return false;
      const entryDate = recordedAt instanceof Date ? recordedAt : new Date(recordedAt);
      return getTodayKey(entryDate) === todayKey && entry.sessionType === "daily";
    }).length;
  }
  const colRef = sessionsCollection(userId);
  const start = Timestamp.fromDate(startOfToday());
  const q = query(colRef, where("sessionType", "==", "daily"), where("recordedAt", ">=", start));
  const snap = await getDocs(q);
  return snap.size;
}

export async function getArenaRunsById(userId: string): Promise<Record<string, number>> {
  if (!userId) return {};
  if (isE2EMode()) {
    const data = readE2ETelemetry<SessionTelemetry>(userId);
    const counts: Record<string, number> = {};
    data.forEach((entry) => {
      if (entry.sessionType !== "arena") return;
      const arenaId = entry.arenaId ?? entry.moduleId ?? "unknown";
      counts[arenaId] = (counts[arenaId] ?? 0) + 1;
    });
    return counts;
  }
  const colRef = sessionsCollection(userId);
  const q = query(colRef, where("sessionType", "==", "arena"), orderBy("recordedAt", "desc"), limit(200));
  const snap = await getDocs(q);
  const counts: Record<string, number> = {};
  snap.forEach((docSnap) => {
    const data = docSnap.data() as { arenaId?: string | null };
    const arenaId = data?.arenaId ?? "unknown";
    counts[arenaId] = (counts[arenaId] ?? 0) + 1;
  });
  return counts;
}

export async function getUsageStats(userId: string): Promise<{
  sessionsToday: number;
  arenasRunsById: Record<string, number>;
}> {
  const [sessionsToday, arenasRunsById] = await Promise.allSettled([
    getSessionsToday(userId),
    getArenaRunsById(userId),
  ]);

  return {
    sessionsToday: sessionsToday.status === "fulfilled" ? sessionsToday.value ?? 0 : 0,
    arenasRunsById: arenasRunsById.status === "fulfilled" ? arenasRunsById.value ?? {} : {},
  };
}
