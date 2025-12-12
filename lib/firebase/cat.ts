"use client";

import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { CAT_AXES, CAT_ITEMS, CAT_SUBAXES, scoreLikertTo0_100, type CatAxisId, type CatSubAxisConfig } from "@/config/catEngine";
import { areWritesDisabled, getDb } from "@/lib/firebase";
import type { CatAnswerMap, CatProfileDoc, CatScores, CatSubScores, SelfInsightAgreement } from "@/types/cat";

const BASELINE_ITEMS = CAT_ITEMS.filter((item) => item.usedInBaseline);
const BASELINE_SUBAXES = CAT_SUBAXES.filter((subAxis) => subAxis.usedInBaseline);

type ScoreBuckets = Record<CatAxisId, { sum: number; count: number }>;

function cloneBuckets(): ScoreBuckets {
  const copy: ScoreBuckets = {} as ScoreBuckets;
  for (const axis of CAT_AXES) {
    copy[axis.id] = { sum: 0, count: 0 };
  }
  return copy;
}

function computeAxisScores(answers: CatAnswerMap): CatScores {
  const buckets = cloneBuckets();
  for (const item of BASELINE_ITEMS) {
    const value = answers[item.id];
    if (typeof value !== "number") {
      continue;
    }
    const bucket = buckets[item.axisId];
    bucket.sum += value;
    bucket.count += 1;
  }

  const scores = {} as CatScores;
  for (const axis of CAT_AXES) {
    const bucket = buckets[axis.id];
    if (!bucket || bucket.count === 0) {
      scores[axis.id] = 0;
      continue;
    }
    const average = bucket.sum / bucket.count;
    scores[axis.id] = scoreLikertTo0_100(average);
  }
  return scores;
}

function computeSubScores(answers: CatAnswerMap): CatSubScores {
  const buckets: Record<CatSubAxisConfig["id"], { sum: number; count: number }> = {};
  for (const subAxis of BASELINE_SUBAXES) {
    buckets[subAxis.id] = { sum: 0, count: 0 };
  }
  for (const item of BASELINE_ITEMS) {
    const subAxisId = item.subAxisId;
    if (!subAxisId || !buckets[subAxisId]) continue;
    const value = answers[item.id];
    if (typeof value !== "number") continue;
    buckets[subAxisId].sum += value;
    buckets[subAxisId].count += 1;
  }
  const subScores: CatSubScores = {};
  for (const subAxis of BASELINE_SUBAXES) {
    const bucket = buckets[subAxis.id];
    if (!bucket || bucket.count === 0) {
      subScores[subAxis.id] = null;
      continue;
    }
    const average = bucket.sum / bucket.count;
    subScores[subAxis.id] = scoreLikertTo0_100(average);
  }
  return subScores;
}

function deriveExtremes(scores: CatScores): { strongestAxis?: CatAxisId; weakestAxis?: CatAxisId } {
  const entries = Object.entries(scores) as [CatAxisId, number][];
  if (!entries.length) return {};
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const [strongest] = sorted;
  const [weakest] = [...sorted].reverse();
  return { strongestAxis: strongest?.[0], weakestAxis: weakest?.[0] };
}

export async function saveCatBaseline(userId: string, answers: CatAnswerMap): Promise<CatProfileDoc> {
  if (!userId) {
    throw new Error("saveCatBaseline: missing userId");
  }
  const axisScores = computeAxisScores(answers);
  const subScores = computeSubScores(answers);
  const { strongestAxis, weakestAxis } = deriveExtremes(axisScores);

  const db = getDb();
  const profileRef = doc(db, "users", userId, "catProfile", "catV2");
  const payload: CatProfileDoc = {
    userId,
    version: "cat-v2",
    axisScores,
    subScores,
    answers,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    strongestAxis,
    weakestAxis,
    selfInsightAgreement: null,
    selfInsightNote: null,
    pillarsIntroCompleted: false,
    pillarsIntroCompletedAt: null,
  };

  if (!areWritesDisabled()) {
    await setDoc(profileRef, payload, { merge: true });
    const historyCollection = collection(db, "users", userId, "catHistory");
    const historyRef = doc(historyCollection);
    await setDoc(historyRef, {
      userId,
      entryType: "baseline",
      axisScores,
      subScores,
      answers,
      createdAt: serverTimestamp(),
      selfInsightAgreement: null,
      selfInsightNote: null,
    });
  }

  return payload;
}

export async function getCatProfile(userId: string): Promise<CatProfileDoc | null> {
  if (!userId) return null;
  const db = getDb();
  const profileRef = doc(db, "users", userId, "catProfile", "catV2");
  const snap = await getDoc(profileRef);
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data() as CatProfileDoc;
  return {
    ...data,
    selfInsightAgreement: data.selfInsightAgreement ?? null,
    selfInsightNote: data.selfInsightNote ?? null,
    pillarsIntroCompleted: data.pillarsIntroCompleted ?? false,
    pillarsIntroCompletedAt: data.pillarsIntroCompletedAt ?? null,
  };
}

export async function updateCatSelfInsight(
  userId: string,
  data: { agreement: SelfInsightAgreement | null; note: string | null },
): Promise<void> {
  if (!userId || areWritesDisabled()) return;
  const db = getDb();
  const profileRef = doc(db, "users", userId, "catProfile", "catV2");
  const payload = {
    selfInsightAgreement: data.agreement ?? null,
    selfInsightNote: data.note ?? null,
    updatedAt: serverTimestamp(),
  };
  await setDoc(profileRef, payload, { merge: true });

  const historyCollection = collection(db, "users", userId, "catHistory");
  const snap = await getDocs(query(historyCollection, orderBy("createdAt", "desc"), limit(1)));
  if (!snap.empty) {
    const latest = snap.docs[0];
    await setDoc(
      latest.ref,
      {
        selfInsightAgreement: data.agreement ?? null,
        selfInsightNote: data.note ?? null,
      },
      { merge: true },
    );
  }
}

export async function completePillarsIntro(userId: string): Promise<void> {
  if (!userId || areWritesDisabled()) return;
  const db = getDb();
  const profileRef = doc(db, "users", userId, "catProfile", "catV2");
  await setDoc(
    profileRef,
    {
      pillarsIntroCompleted: true,
      pillarsIntroCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
