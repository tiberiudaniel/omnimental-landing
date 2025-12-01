import { arrayUnion, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { areWritesDisabled, ensureAuth, getDb } from "@/lib/firebase";
import type { ReplayTimeTrackingPayload } from "@/lib/types/replay";

type ReplayWritePayload = Record<string, unknown>;

async function writeReplayData(payload: ReplayWritePayload, ownerId?: string | null) {
  if (areWritesDisabled()) return;
  const user = ownerId ? { uid: ownerId } : await ensureAuth();
  if (!user?.uid) return;
  const ref = doc(getDb(), "userReplayData", user.uid);
  await setDoc(ref, { ...payload, updatedAt: serverTimestamp() }, { merge: true }).catch((error) => {
    console.warn("recordReplayData failed", error);
  });
}

export async function recordReplayTimeTracking(
  snapshot: ReplayTimeTrackingPayload,
  ownerId?: string | null,
) {
  const entry = {
    ...snapshot,
    recordedAt: typeof snapshot.endTimestamp === "number" ? snapshot.endTimestamp : Date.now(),
  };
  await writeReplayData(
    {
      timeTracking: arrayUnion(entry),
    },
    ownerId,
  );
}
