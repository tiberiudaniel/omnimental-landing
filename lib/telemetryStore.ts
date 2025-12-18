import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { SessionTelemetry } from "@/lib/telemetry";
import { isE2EMode, readE2ETelemetry } from "@/lib/e2eMode";

export async function fetchRecentSessions(userId: string, take: number = 10): Promise<SessionTelemetry[]> {
  if (!userId) return [];
  if (isE2EMode()) {
    const data = readE2ETelemetry<SessionTelemetry>(userId);
    return data
      .slice()
      .sort((a, b) => {
        const aTime = new Date((a.recordedAt as Date) ?? a.recordedAtOverride ?? 0).getTime();
        const bTime = new Date((b.recordedAt as Date) ?? b.recordedAtOverride ?? 0).getTime();
        return bTime - aTime;
      })
      .slice(0, take);
  }
  const db = getDb();
  const colRef = collection(db, "userTelemetry", userId, "sessions");
  const q = query(colRef, orderBy("recordedAt", "desc"), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data() as SessionTelemetry);
}
