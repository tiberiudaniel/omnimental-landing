import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { ArcDefinition, ArcLevel } from "@/types/arcs";
import { arcs } from "@/config/arcs/arcs";
import type { ArcState, CurrentArcState } from "@/types/arcState";
import type { UserMetrics } from "@/types/userMetrics";
import { selectArcForUser } from "@/lib/arcs";

const USER_PROFILE_COLLECTION = "userProfiles";

interface UserProfileCore {
  arcState?: ArcState;
  metrics?: UserMetrics;
}

function profileRef(userId: string) {
  return doc(getDb(), USER_PROFILE_COLLECTION, userId);
}

export async function getUserArcState(userId: string): Promise<ArcState | undefined> {
  if (!userId) return undefined;
  const snapshot = await getDoc(profileRef(userId));
  if (!snapshot.exists()) return undefined;
  const data = snapshot.data() as UserProfileCore;
  return data.arcState;
}

export async function upsertUserArcState(userId: string, arcState: ArcState): Promise<void> {
  if (!userId) return;
  await setDoc(profileRef(userId), { arcState }, { merge: true });
}

export async function getUserMetrics(userId: string): Promise<UserMetrics | undefined> {
  if (!userId) return undefined;
  const snapshot = await getDoc(profileRef(userId));
  if (!snapshot.exists()) return undefined;
  const data = snapshot.data() as UserProfileCore;
  return data.metrics;
}

export async function upsertUserMetrics(userId: string, metrics: UserMetrics): Promise<void> {
  if (!userId) return;
  await setDoc(profileRef(userId), { metrics }, { merge: true });
}

function findArcById(id: string): ArcDefinition | undefined {
  return arcs.find((arc) => arc.id === id);
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function ensureCurrentArcForUser(
  userId: string,
  overallLevel: ArcLevel,
): Promise<{ arc: ArcDefinition; arcState: ArcState }> {
  if (!userId) {
    const fallbackArc = selectArcForUser(overallLevel);
    return { arc: fallbackArc, arcState: {} };
  }

  const snapshot = await getDoc(profileRef(userId));
  const existingState: ArcState = snapshot.exists() ? (snapshot.data() as UserProfileCore).arcState ?? {} : {};
  const currentArcId = existingState.current?.id;
  if (currentArcId) {
    const existingArc = findArcById(currentArcId);
    if (existingArc) {
      return { arc: existingArc, arcState: existingState };
    }
  }

  const newArc = selectArcForUser(overallLevel);
  const current: CurrentArcState = {
    id: newArc.id,
    level: newArc.level,
    domain: newArc.domain,
    startedAt: todayDateString(),
    status: "active",
  };
  const nextArcState: ArcState = {
    ...existingState,
    current,
  };
  await upsertUserArcState(userId, nextArcState);
  return { arc: newArc, arcState: nextArcState };
}
