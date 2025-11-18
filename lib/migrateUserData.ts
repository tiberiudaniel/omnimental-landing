"use client";

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";
import type { ProgressFact } from "./progressFacts";

function toMs(v: unknown): number {
  try {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (v instanceof Date) return v.getTime();
    const ts = v as { toDate?: () => Date };
    return typeof ts?.toDate === 'function' ? ts.toDate().getTime() : 0;
  } catch { return 0; }
}

function pickNewer<T extends { updatedAt?: unknown } | null | undefined>(src: T, dst: T): T {
  const sMs = toMs(src?.updatedAt);
  const dMs = toMs(dst?.updatedAt);
  return (!dst || sMs > dMs) ? src : dst;
}

export async function migrateAnonToUser(anonUid: string, userUid: string): Promise<{ progressFacts: boolean; profile: boolean } | null> {
  if (!anonUid || !userUid || anonUid === userUid) return null;
  const db = getDb();
  const anonFactsRef = doc(db, 'userProgressFacts', anonUid);
  const userFactsRef = doc(db, 'userProgressFacts', userUid);
  const anonProfileRef = doc(db, 'userProfiles', anonUid);
  const userProfileRef = doc(db, 'userProfiles', userUid);

  // Fetch sources and destinations
  const [anonFactsSnap, userFactsSnap, anonProfileSnap, userProfileSnap] = await Promise.all([
    getDoc(anonFactsRef),
    getDoc(userFactsRef),
    getDoc(anonProfileRef),
    getDoc(userProfileRef),
  ]);

  const anonFacts = (anonFactsSnap.exists() ? (anonFactsSnap.data() as ProgressFact) : null) ?? null;
  const userFacts = (userFactsSnap.exists() ? (userFactsSnap.data() as ProgressFact) : null) ?? null;
  const anonProfileFacts = (anonProfileSnap.exists() ? ((anonProfileSnap.data() as { progressFacts?: ProgressFact }).progressFacts ?? null) : null) ?? null;
  const userProfileFacts = (userProfileSnap.exists() ? ((userProfileSnap.data() as { progressFacts?: ProgressFact }).progressFacts ?? null) : null) ?? null;

  // Build merged progressFacts with "newer wins" per block
  const mergedExisting: ProgressFact = { ...(userFacts ?? {}), ...(userProfileFacts ?? {}) } as ProgressFact;
  const source: ProgressFact = { ...(anonFacts ?? {}), ...(anonProfileFacts ?? {}) } as ProgressFact;
  if (!Object.keys(source || {}).length) {
    return { progressFacts: false, profile: false };
  }
  const next: ProgressFact = { ...(mergedExisting || {}) } as ProgressFact;
  const intentMerged = pickNewer(source.intent ?? undefined, mergedExisting.intent ?? undefined);
  if (intentMerged) next.intent = intentMerged;
  const motivationMerged = pickNewer(source.motivation ?? undefined, mergedExisting.motivation ?? undefined);
  if (motivationMerged) next.motivation = motivationMerged;
  const evaluationMerged = pickNewer(source.evaluation ?? undefined, mergedExisting.evaluation ?? undefined);
  if (evaluationMerged) next.evaluation = evaluationMerged;
  const recommendationMerged = pickNewer(source.recommendation ?? undefined, mergedExisting.recommendation ?? undefined);
  if (recommendationMerged) next.recommendation = recommendationMerged;
  const qaMerged = pickNewer(source.quickAssessment ?? undefined, mergedExisting.quickAssessment ?? undefined);
  if (qaMerged) next.quickAssessment = qaMerged;
  // Merge arrays conservatively
  if (Array.isArray(mergedExisting.practiceSessions) || Array.isArray(source.practiceSessions)) {
    type PracticeSession = NonNullable<ProgressFact['practiceSessions']>[number];
    const combined: PracticeSession[] = [ ...(mergedExisting.practiceSessions ?? []), ...(source.practiceSessions ?? []) ];
    const seen = new Set<string>();
    const dedup = combined.filter((it) => {
      try {
        const o = it as { type?: string; startedAt?: unknown };
        const ms = toMs(o?.startedAt);
        const k = `${o?.type ?? 'x'}@${ms}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      } catch { return true; }
    });
    next.practiceSessions = dedup as ProgressFact['practiceSessions'];
  }
  // Update updatedAt
  const withUpdatedAt: Record<string, unknown> = { ...next, updatedAt: serverTimestamp() };

  await Promise.all([
    setDoc(userFactsRef, withUpdatedAt, { merge: true }),
    setDoc(userProfileRef, { progressFacts: withUpdatedAt }, { merge: true }),
  ]);

  return { progressFacts: true, profile: true };
}
