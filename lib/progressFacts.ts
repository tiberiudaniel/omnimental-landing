"use client";

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { ensureAuth, getDb } from "./firebase";
import type {
  BudgetPreference,
  EmotionalState,
  FormatPreference,
  GoalType,
  ResolutionSpeed,
} from "./evaluation";
import type { OmniKnowledgeScores } from "./omniKnowledge";
import type { QuestSuggestion } from "./quests";

export type ProgressIntentCategories = Array<{ category: string; count: number }>;

export type ProgressMotivationPayload = {
  urgency: number;
  timeHorizon: ResolutionSpeed;
  determination: number;
  hoursPerWeek: number;
  budgetLevel: BudgetPreference;
  goalType: GoalType;
  emotionalState: EmotionalState;
  groupComfort: number;
  learnFromOthers: number;
  scheduleFit: number;
  formatPreference: FormatPreference;
  cloudFocusCount: number;
};

export type EvaluationScoreTotals = {
  pssTotal: number;
  gseTotal: number;
  maasTotal: number;
  panasPositive: number;
  panasNegative: number;
  svs: number;
};

export type ProgressFact = {
  updatedAt?: Date;
  intent?: {
    tags: string[];
    categories: ProgressIntentCategories;
    urgency: number;
    lang: string;
    updatedAt?: Date;
  };
  motivation?: ProgressMotivationPayload & { updatedAt?: Date };
  evaluation?: {
    scores: EvaluationScoreTotals;
    knowledge?: OmniKnowledgeScores | null;
    stageValue: string;
    lang: string;
    updatedAt?: Date;
  };
  quests?: {
    generatedAt: Date;
    items: Array<QuestSuggestion & { completed?: boolean }>;
  };
};

async function mergeProgressFact(data: Record<string, unknown>) {
  const user = await ensureAuth();
  if (!user) return null;
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  const factsRef = doc(getDb(), "userProgressFacts", user.uid);
  const profileRef = doc(getDb(), "userProfiles", user.uid);
  await Promise.all([
    setDoc(factsRef, payload, { merge: true }).catch((error) =>
      console.warn("progress fact primary write failed", error),
    ),
    setDoc(profileRef, { progressFacts: payload }, { merge: true }),
  ]);
  return user.uid;
}

export async function backfillProgressFacts(profileId: string) {
  const auth = await ensureAuth();
  if (!auth || auth.uid !== profileId) return null;
  const db = getDb();
  let latestSnapshot = await getDocs(
    query(
      collection(db, "userIntentSnapshots"),
      where("profileId", "==", profileId),
      orderBy("timestamp", "desc"),
      limit(1),
    ),
  );
  if (latestSnapshot.empty) {
    latestSnapshot = await getDocs(
      query(
        collection(db, "userIntentSnapshots"),
        where("profileId", "==", null),
        orderBy("timestamp", "desc"),
        limit(1),
      ),
    );
  }
  if (latestSnapshot.empty) {
    return null;
  }
  const docSnap = latestSnapshot.docs[0];
  const data = docSnap.data();
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const categories = Array.isArray(data.categories)
    ? (data.categories as ProgressIntentCategories)
    : [];
  const urgency = typeof data.urgency === "number" ? data.urgency : 0;
  const lang = typeof data.lang === "string" ? data.lang : "ro";
  const evaluationAnswers = (data.evaluation ?? null) as ProgressMotivationPayload | null;
  const answers = (data.answers ?? {}) as Record<string, unknown>;
  const scores = (answers.scores as EvaluationScoreTotals | undefined) ?? {
    pssTotal: 0,
    gseTotal: 0,
    maasTotal: 0,
    panasPositive: 0,
    panasNegative: 0,
    svs: 0,
  };
  const knowledge = (answers.knowledge as OmniKnowledgeScores | undefined) ?? null;
  const stageValue =
    typeof answers.stage === "string"
      ? (answers.stage as string)
      : (data.stage as string | undefined) ?? "t0";
  const fact: ProgressFact = {
    updatedAt: data.timestamp,
    intent: {
      tags,
      categories,
      urgency,
      lang,
      updatedAt: data.timestamp,
    },
    motivation: evaluationAnswers ?? undefined,
    evaluation: {
      scores,
      knowledge,
      stageValue,
      lang,
      updatedAt: data.timestamp,
    },
  };
  const factRef = doc(getDb(), "userProgressFacts", profileId);
  const profileRef = doc(getDb(), "userProfiles", profileId);
  await Promise.all([
    setDoc(factRef, fact, { merge: true }).catch((error) =>
      console.warn("progress fact backfill primary write failed", error),
    ),
    setDoc(profileRef, { progressFacts: fact }, { merge: true }),
  ]);
  return fact;
}

export async function recordIntentProgressFact(payload: {
  tags: string[];
  categories: ProgressIntentCategories;
  urgency: number;
  lang: string;
}) {
  return mergeProgressFact({
    intent: {
      ...payload,
      updatedAt: serverTimestamp(),
    },
  });
}

export async function recordMotivationProgressFact(payload: ProgressMotivationPayload) {
  return mergeProgressFact({
    motivation: {
      ...payload,
      updatedAt: serverTimestamp(),
    },
  });
}

export async function recordEvaluationProgressFact(payload: {
  scores: EvaluationScoreTotals;
  knowledge?: OmniKnowledgeScores;
  stageValue: string;
  lang: "ro" | "en";
}) {
  return mergeProgressFact({
    evaluation: {
      ...payload,
      knowledge: payload.knowledge ?? null,
      updatedAt: serverTimestamp(),
    },
  });
}

export async function recordQuestProgressFact(payload: {
  quests: QuestSuggestion[];
}) {
  return mergeProgressFact({
    quests: {
      generatedAt: serverTimestamp(),
      items: payload.quests.map((quest) => ({
        ...quest,
        completed: false,
      })),
    },
  });
}
