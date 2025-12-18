"use client";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { ArcConfig } from "@/config/arcs";
import { ARC_CONFIGS, getArcById } from "@/config/arcs";
import type { UserProfileSnapshot, CatAxisId } from "@/lib/profileEngine";
import { areWritesDisabled, getDb } from "@/lib/firebase";

function pickWeakestAxis(snapshot: UserProfileSnapshot | null): CatAxisId | null {
  const axes = snapshot?.catProfile?.axes;
  if (!axes) return null;
  let weakest: { id: CatAxisId; score: number } | null = null;
  for (const [axisId, value] of Object.entries(axes) as Array<[CatAxisId, { score: number | null }]>) {
    if (typeof value.score !== "number") continue;
    const score = value.score ?? 0;
    if (!weakest || score < weakest.score) {
      weakest = { id: axisId, score };
    }
  }
  return weakest?.id ?? null;
}

function defaultArc(): ArcConfig {
  return getArcById("clarity_01") ?? ARC_CONFIGS[0];
}

export function getActiveArc(user: UserProfileSnapshot | null): ArcConfig | null {
  if (!user?.activeArcId || user.activeArcCompleted) return null;
  const arc = getArcById(user.activeArcId);
  if (!arc) return null;
  const dayIndex = user.activeArcDayIndex ?? 0;
  if (dayIndex >= arc.lengthDays) {
    return null;
  }
  return arc;
}

export function getNextArcRecommendation(user: UserProfileSnapshot | null): ArcConfig {
  const weakest = pickWeakestAxis(user);
  if (weakest === "energy" || weakest === "flexibility") {
    return getArcById("energy_01") ?? defaultArc();
  }
  if (weakest === "emotionalStability" || weakest === "recalibration") {
    return getArcById("emotional_01") ?? defaultArc();
  }
  return defaultArc();
}

export async function setActiveArc(userId: string, arcId: string, dayIndex = 0): Promise<void> {
  if (!userId || areWritesDisabled()) return;
  const db = getDb();
  const ref = doc(db, "userProfiles", userId);
  await setDoc(
    ref,
    {
      activeArcId: arcId,
      activeArcDayIndex: dayIndex,
      activeArcCompleted: false,
      activeArcStartedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
