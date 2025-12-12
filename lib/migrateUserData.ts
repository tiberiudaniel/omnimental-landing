"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { ProgressFact } from "./progressFacts";
import type { DailyPracticeDoc } from "@/types/dailyPractice";
import type { ArcProgress, ArcState } from "@/types/arcState";
import type { UserMetrics } from "@/types/userMetrics";
import { buildDailyPracticeDocId } from "@/lib/dailyPracticeStore";

function toMs(v: unknown): number {
  try {
    if (!v) return 0;
    if (typeof v === "number") return v;
    if (v instanceof Date) return v.getTime();
    const ts = v as { toDate?: () => Date };
    return typeof ts?.toDate === "function" ? ts.toDate().getTime() : 0;
  } catch {
    return 0;
  }
}

function pickNewer<T extends { updatedAt?: unknown } | null | undefined>(src: T, dst: T): T {
  const sMs = toMs(src?.updatedAt);
  const dMs = toMs(dst?.updatedAt);
  return !dst || sMs > dMs ? src : dst;
}

const IS_DEV = process.env.NODE_ENV !== "production";
const SANITY_MIN_DAYS = 7;

interface MigrationResult {
  progressFacts: boolean;
  profile: boolean;
  dailyPracticeMigrated: number;
  arcStateUpdated: boolean;
  metricsUpdated: boolean;
}

interface UserProfileDoc {
  progressFacts?: ProgressFact;
  arcState?: ArcState;
  metrics?: UserMetrics;
}

function mergeArcProgress(existing: ArcProgress | undefined, incoming: ArcProgress | undefined): ArcProgress | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming;
  const incomingStrength = (incoming.daysCompleted ?? 0) * 1000 + (incoming.xp ?? 0);
  const existingStrength = (existing.daysCompleted ?? 0) * 1000 + (existing.xp ?? 0);
  return incomingStrength > existingStrength ? incoming : existing;
}

function mergeArcState(existing?: ArcState, incoming?: ArcState): ArcState | undefined {
  if (!existing && !incoming) return undefined;
  const next: ArcState = { ...(existing ?? {}) };
  if (!next.current && incoming?.current) {
    next.current = incoming.current;
  }
  const mergedProgress: Record<string, ArcProgress> = { ...(existing?.progress ?? {}) };
  const incomingProgress = incoming?.progress ?? {};
  Object.entries(incomingProgress).forEach(([arcId, arcProgress]) => {
    const merged = mergeArcProgress(mergedProgress[arcId], arcProgress);
    if (merged) {
      mergedProgress[arcId] = merged;
    }
  });
  if (Object.keys(mergedProgress).length) {
    next.progress = mergedProgress;
  }
  return next;
}

function pickLaterDate(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) > new Date(b) ? a : b;
}

function mergeMetrics(existing?: UserMetrics, incoming?: UserMetrics): UserMetrics | undefined {
  if (!existing && !incoming) return undefined;
  if (!existing) return incoming;
  if (!incoming) return existing;
  return {
    streakDays: Math.max(existing.streakDays ?? 0, incoming.streakDays ?? 0),
    longestStreakDays: Math.max(existing.longestStreakDays ?? 0, incoming.longestStreakDays ?? 0),
    lastCompletedDate: pickLaterDate(existing.lastCompletedDate, incoming.lastCompletedDate),
  };
}

async function migrateDailyPracticeDocs(params: {
  anonDocs: DailyPracticeDoc[];
  userId: string;
  db: ReturnType<typeof getDb>;
}): Promise<number> {
  const { anonDocs, userId, db } = params;
  if (!anonDocs.length) return 0;
  let migrated = 0;
  for (const docData of anonDocs) {
    const { configId, date } = docData;
    if (!configId || !date) continue;
    const newRef = doc(db, "dailyPractice", buildDailyPracticeDocId(userId, configId, date));
    const existingSnap = await getDoc(newRef);
    const existing = existingSnap.exists() ? (existingSnap.data() as DailyPracticeDoc) : null;
    if (existing?.completed && docData.completed) {
      continue;
    }
    await setDoc(
      newRef,
      {
        ...docData,
        userId,
      },
      { merge: true },
    );
    migrated += 1;
  }
  return migrated;
}

export async function migrateAnonToUser(
  anonUid: string,
  userUid: string,
): Promise<MigrationResult | null> {
  if (!anonUid || !userUid || anonUid === userUid) return null;
  const db = getDb();
  const anonFactsRef = doc(db, "userProgressFacts", anonUid);
  const userFactsRef = doc(db, "userProgressFacts", userUid);
  const anonProfileRef = doc(db, "userProfiles", anonUid);
  const userProfileRef = doc(db, "userProfiles", userUid);
  const dailyPracticeAnonQuery = query(collection(db, "dailyPractice"), where("userId", "==", anonUid));
  const dailyPracticeUserQuery = query(collection(db, "dailyPractice"), where("userId", "==", userUid));

  // Fetch sources and destinations
  const [anonFactsSnap, userFactsSnap, anonProfileSnap, userProfileSnap, anonDailySnap, userDailyBeforeSnap] =
    await Promise.all([
      getDoc(anonFactsRef),
      getDoc(userFactsRef),
      getDoc(anonProfileRef),
      getDoc(userProfileRef),
      getDocs(dailyPracticeAnonQuery),
      getDocs(dailyPracticeUserQuery),
    ]);

  const anonFacts = (anonFactsSnap.exists() ? (anonFactsSnap.data() as ProgressFact) : null) ?? null;
  const userFacts = (userFactsSnap.exists() ? (userFactsSnap.data() as ProgressFact) : null) ?? null;
  const anonProfile = (anonProfileSnap.exists() ? (anonProfileSnap.data() as UserProfileDoc) : null) ?? null;
  const userProfile = (userProfileSnap.exists() ? (userProfileSnap.data() as UserProfileDoc) : null) ?? null;
  const anonProfileFacts = anonProfile?.progressFacts ?? null;
  const userProfileFacts = userProfile?.progressFacts ?? null;

  const result: MigrationResult = {
    progressFacts: false,
    profile: false,
    dailyPracticeMigrated: 0,
    arcStateUpdated: false,
    metricsUpdated: false,
  };

  // Build merged progressFacts with "newer wins" per block
  const mergedExisting: ProgressFact = { ...(userFacts ?? {}), ...(userProfileFacts ?? {}) } as ProgressFact;
  const source: ProgressFact = { ...(anonFacts ?? {}), ...(anonProfileFacts ?? {}) } as ProgressFact;
  if (Object.keys(source || {}).length) {
    const next: ProgressFact = { ...(mergedExisting || {}) } as ProgressFact;
    const intentMerged = pickNewer(source.intent ?? undefined, mergedExisting.intent ?? undefined);
    if (intentMerged) next.intent = intentMerged;
    const motivationMerged = pickNewer(source.motivation ?? undefined, mergedExisting.motivation ?? undefined);
    if (motivationMerged) next.motivation = motivationMerged;
    const evaluationMerged = pickNewer(source.evaluation ?? undefined, mergedExisting.evaluation ?? undefined);
    if (evaluationMerged) next.evaluation = evaluationMerged;
    const recommendationMerged = pickNewer(
      source.recommendation ?? undefined,
      mergedExisting.recommendation ?? undefined,
    );
    if (recommendationMerged) next.recommendation = recommendationMerged;
    const qaMerged = pickNewer(source.quickAssessment ?? undefined, mergedExisting.quickAssessment ?? undefined);
    if (qaMerged) next.quickAssessment = qaMerged;
    if (Array.isArray(mergedExisting.practiceSessions) || Array.isArray(source.practiceSessions)) {
      type PracticeSession = NonNullable<ProgressFact["practiceSessions"]>[number];
      const combined: PracticeSession[] = [
        ...(mergedExisting.practiceSessions ?? []),
        ...(source.practiceSessions ?? []),
      ];
      const seen = new Set<string>();
      const dedup = combined.filter((it) => {
        try {
          const o = it as { type?: string; startedAt?: unknown };
          const ms = toMs(o?.startedAt);
          const k = `${o?.type ?? "x"}@${ms}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        } catch {
          return true;
        }
      });
      next.practiceSessions = dedup as ProgressFact["practiceSessions"];
    }
    const withUpdatedAt: Record<string, unknown> = { ...next, updatedAt: serverTimestamp() };
    await Promise.all([
      setDoc(userFactsRef, withUpdatedAt, { merge: true }),
      setDoc(userProfileRef, { progressFacts: withUpdatedAt }, { merge: true }),
    ]);
    result.progressFacts = true;
    result.profile = true;
  }

  const profileUpdates: Record<string, unknown> = {};
  if (anonProfile?.arcState) {
    const mergedArcState = mergeArcState(userProfile?.arcState, anonProfile.arcState);
    if (mergedArcState) {
      profileUpdates.arcState = mergedArcState;
      result.arcStateUpdated = true;
    }
  }
  if (anonProfile?.metrics) {
    const mergedMetrics = mergeMetrics(userProfile?.metrics, anonProfile.metrics);
    if (mergedMetrics) {
      profileUpdates.metrics = mergedMetrics;
      result.metricsUpdated = true;
    }
  }
  if (Object.keys(profileUpdates).length) {
    await setDoc(userProfileRef, profileUpdates, { merge: true });
    result.profile = true;
  }

  const anonDailyDocs = anonDailySnap.docs.map((docSnap) => docSnap.data() as DailyPracticeDoc);
  result.dailyPracticeMigrated = await migrateDailyPracticeDocs({
    anonDocs: anonDailyDocs,
    userId: userUid,
    db,
  });
  if (result.dailyPracticeMigrated > 0 && IS_DEV) {
    const userDailyAfterSnap = await getDocs(dailyPracticeUserQuery);
    const gained = userDailyAfterSnap.size - userDailyBeforeSnap.size;
    const expected = Math.min(anonDailyDocs.length, SANITY_MIN_DAYS);
    if (gained < expected) {
      console.warn(
        "[migrateAnonToUser] dailyPractice sanity check failed",
        { anonCount: anonDailyDocs.length, gained, expected },
      );
    } else {
      console.debug("[migrateAnonToUser] dailyPractice migrated", {
        migrated: result.dailyPracticeMigrated,
        anonCount: anonDailyDocs.length,
        finalCount: userDailyAfterSnap.size,
      });
    }
  }

  return result;
}
