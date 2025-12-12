"use client";

import { addDoc, collection, getDocs, limit, query, serverTimestamp } from "firebase/firestore";
import { areWritesDisabled, getDb } from "@/lib/firebase";
import type { AdaptiveCluster } from "@/types/dailyPath";
import type { BehaviorSuggestionType } from "@/types/adaptivePractice";
import type { CatAxisId } from "@/config/catEngine";

type SessionPayload = {
  userId: string;
  cluster: AdaptiveCluster;
  primaryAxis: CatAxisId;
  microExerciseCompleted: boolean;
  behaviorSuggestionType: BehaviorSuggestionType;
  source?: string;
};

export async function logAdaptivePracticeSession({
  userId,
  cluster,
  primaryAxis,
  microExerciseCompleted,
  behaviorSuggestionType,
  source = "onboarding_core_v2",
}: SessionPayload): Promise<void> {
  if (!userId || areWritesDisabled()) return;
  const db = getDb();
  await addDoc(collection(db, "users", userId, "adaptivePracticeSessions"), {
    userId,
    cluster,
    primaryAxis,
    microExerciseCompleted,
    behaviorSuggestionType,
    source,
    createdAt: serverTimestamp(),
  });
}

export async function hasAdaptivePracticeSession(userId: string): Promise<boolean> {
  if (!userId) return false;
  const db = getDb();
  const snapshot = await getDocs(query(collection(db, "users", userId, "adaptivePracticeSessions"), limit(1)));
  return !snapshot.empty;
}
