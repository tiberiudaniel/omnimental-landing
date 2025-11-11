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
import type { SessionType } from "./recommendation";
import type { DimensionScores } from "./scoring";
import type { OmniBlock } from "./omniIntel";
import { computeDirectionMotivationIndex, computeOmniIntelScore } from "./omniIntel";

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
    firstExpression?: string | null;
    firstCategory?: string | null;
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
  recommendation?: {
    suggestedPath?: SessionType | null;
    reasonKey?: string | null;
    selectedPath?: SessionType | null;
    acceptedRecommendation?: boolean | null;
    dimensionScores?: DimensionScores | null;
    updatedAt?: Date;
  };
  omni?: OmniBlock;
};

const DIMENSION_KEYS: Array<keyof DimensionScores> = [
  "calm",
  "focus",
  "energy",
  "relationships",
  "performance",
  "health",
];

function sanitizeDimensionScores(entry: unknown): DimensionScores | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const source = entry as Partial<Record<keyof DimensionScores, unknown>>;
  const baseline: DimensionScores = {
    calm: 0,
    focus: 0,
    energy: 0,
    relationships: 0,
    performance: 0,
    health: 0,
  };
  let seen = false;
  DIMENSION_KEYS.forEach((key) => {
    const value = Number(source[key]);
    if (Number.isFinite(value)) {
      baseline[key] = value;
      seen = true;
    }
  });
  return seen ? baseline : null;
}

async function mergeProgressFact(data: Record<string, unknown>, ownerId?: string | null) {
  // Allow explicit owner override (e.g., when wizard has a known profileId).
  // Falls back to the currently authenticated user.
  const user = ownerId ? { uid: ownerId } : await ensureAuth();
  if (!user) return null;
  const updatedAt = serverTimestamp();
  const payload = {
    ...data,
    updatedAt,
  };
  const profilePayload: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    profilePayload[`progressFacts.${key}`] = value;
  });
  const factsRef = doc(getDb(), "userProgressFacts", user.uid);
  const profileRef = doc(getDb(), "userProfiles", user.uid);
  await Promise.all([
    setDoc(factsRef, payload, { merge: true }).catch((error) =>
      console.warn("progress fact primary write failed", error),
    ),
    setDoc(profileRef, profilePayload, { merge: true }),
  ]);
  return user.uid;
}

export async function backfillProgressFacts(profileId: string) {
  const auth = await ensureAuth();
  const db = getDb();
  const effectiveId = profileId || auth?.uid || null;
  if (!effectiveId) return null;
  let latestSnapshot = await getDocs(
    query(
      collection(db, "userIntentSnapshots"),
      where("profileId", "==", effectiveId),
      orderBy("timestamp", "desc"),
      limit(1),
    ),
  );
  if (latestSnapshot.empty) {
    latestSnapshot = await getDocs(
      query(
        collection(db, "userIntentSnapshots"),
        where("ownerUid", "==", profileId),
        orderBy("timestamp", "desc"),
        limit(1),
      ),
    );
  }
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
  const firstExpression = typeof (data as Record<string, unknown>).firstExpression === "string"
    ? (data as Record<string, string>).firstExpression
    : null;
  const firstCategory = typeof (data as Record<string, unknown>).firstCategory === "string"
    ? (data as Record<string, string>).firstCategory
    : null;
  const evaluationAnswers = (data.evaluation ?? null) as ProgressMotivationPayload | null;
  const omniFromSnapshot = (data.omni ?? null) as OmniBlock | null;
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
  const snapshotRecommendation =
    typeof data.recommendation === "string" ? (data.recommendation as SessionType) : null;
  const snapshotReasonKey =
    typeof data.recommendationReasonKey === "string"
      ? (data.recommendationReasonKey as string)
      : null;
  const snapshotDimensions = sanitizeDimensionScores(data.dimensionScores);

  let latestJourneyRecommendation:
    | {
        suggestedPath?: SessionType | null;
        selectedPath?: SessionType | null;
        reasonKey?: string | null;
        acceptedRecommendation?: boolean | null;
        dimensionScores?: DimensionScores | null;
        updatedAt?: Date;
      }
    | null = null;

  const journeySnapshot = await getDocs(
    query(
      collection(db, "userJourneys"),
      where("profileId", "==", profileId),
      orderBy("timestamp", "desc"),
      limit(1),
    ),
  );
  if (!journeySnapshot.empty) {
    const journeyData = journeySnapshot.docs[0].data();
    const suggested =
      typeof journeyData.recommendedPath === "string"
        ? (journeyData.recommendedPath as SessionType)
        : null;
    const choice =
      typeof journeyData.choice === "string" ? (journeyData.choice as SessionType) : null;
    const accepted =
      typeof journeyData.acceptedRecommendation === "boolean"
        ? (journeyData.acceptedRecommendation as boolean)
        : suggested && choice
        ? suggested === choice
        : null;
    const reason =
      typeof journeyData.recommendationReasonKey === "string"
        ? (journeyData.recommendationReasonKey as string)
        : null;
    latestJourneyRecommendation = {
      suggestedPath: suggested,
      selectedPath: choice,
      reasonKey: reason,
      acceptedRecommendation: accepted,
      dimensionScores: sanitizeDimensionScores(journeyData.dimensionScores) ?? snapshotDimensions,
      updatedAt: journeyData.timestamp,
    };
  }

  const recommendationBlock =
    snapshotRecommendation || latestJourneyRecommendation
      ? {
          suggestedPath: latestJourneyRecommendation?.suggestedPath ?? snapshotRecommendation,
          reasonKey: latestJourneyRecommendation?.reasonKey ?? snapshotReasonKey ?? null,
          selectedPath: latestJourneyRecommendation?.selectedPath ?? null,
          acceptedRecommendation:
            latestJourneyRecommendation?.acceptedRecommendation ??
            (snapshotRecommendation && latestJourneyRecommendation?.selectedPath
              ? snapshotRecommendation === latestJourneyRecommendation.selectedPath
              : null),
          dimensionScores:
            latestJourneyRecommendation?.dimensionScores ?? snapshotDimensions ?? null,
          updatedAt: (latestJourneyRecommendation?.updatedAt ?? data.timestamp) as Date | undefined,
        }
      : undefined;
  const fact: ProgressFact = {
    updatedAt: data.timestamp,
    intent: {
      tags,
      categories,
      urgency,
      lang,
      firstExpression,
      firstCategory,
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
    recommendation: recommendationBlock,
    omni: (() => {
      if (omniFromSnapshot) return omniFromSnapshot;
      // Minimal backfilled Omni when snapshot doesn't have it
      const dirMot = computeDirectionMotivationIndex({
        urgency,
        determination: evaluationAnswers?.determination ?? 3,
        hoursPerWeek: evaluationAnswers?.hoursPerWeek ?? 0,
      });
      const knowledgeIndex = typeof (knowledge as any)?.percent === "number" ? (knowledge as any).percent : 0;
      const skillsIndex = 0;
      const consistencyIndex = 0;
      const omniIntelScore = computeOmniIntelScore({
        knowledgeIndex,
        skillsIndex,
        directionMotivationIndex: dirMot,
        consistencyIndex,
      });
      return {
        scope: { goalDescription: null, mainPain: null, idealDay: null, wordCount: null, tags, directionMotivationIndex: dirMot },
        kuno: { completedTests: 0, totalTestsAvailable: 0, scores: {}, knowledgeIndex },
        sensei: { unlocked: false, activeQuests: [], completedQuestsCount: 0 },
        abil: { unlocked: false, exercisesCompletedCount: 0, skillsIndex },
        intel: { unlocked: false, evaluationsCount: 0, consistencyIndex },
        omniIntelScore,
        omniPoints: 0,
      } as OmniBlock;
    })(),
  };
  const factRef = doc(getDb(), "userProgressFacts", effectiveId);
  const profileRef = doc(getDb(), "userProfiles", effectiveId);
  await Promise.all([
    setDoc(factRef, fact, { merge: true }).catch((error) =>
      console.warn("progress fact backfill primary write failed", error),
    ),
    setDoc(profileRef, { progressFacts: fact }, { merge: true }),
  ]);
  try {
    // Simple dev log to confirm backfill ran and what it found
    // Note: latestSnapshot.size reflects the last query result set
    console.log("Backfill completed for", effectiveId, "snapshot count", latestSnapshot.size);
  } catch {}
  return fact;
}

// Lightweight tracking helpers for UI analytics
export async function recordEvaluationTabChange(tabKey: string) {
  try {
    await mergeProgressFact({ evaluationTab: { key: tabKey, updatedAt: serverTimestamp() } });
  } catch (e) {
    console.warn("recordEvaluationTabChange failed", e);
  }
}

export async function recordKnowledgeViewSummary() {
  try {
    await mergeProgressFact({ knowledgeSummaryViewed: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordKnowledgeViewSummary failed", e);
  }
}

export async function recordWizardReset() {
  try {
    await mergeProgressFact({ wizardReset: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordWizardReset failed", e);
  }
}

export async function recordWizardResetCanceled() {
  try {
    await mergeProgressFact({ wizardResetCanceled: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordWizardResetCanceled failed", e);
  }
}

export async function recordWizardResetNoticeDismissed() {
  try {
    await mergeProgressFact({ wizardResetNoticeDismissed: { at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordWizardResetNoticeDismissed failed", e);
  }
}

export async function recordEvaluationSubmitStarted(stage: string, lang: string) {
  try {
    await mergeProgressFact({ evaluationSubmit: { stage, lang, status: "started", at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordEvaluationSubmitStarted failed", e);
  }
}

export async function recordEvaluationSubmitFinished(stage: string, lang: string, ok: boolean) {
  try {
    await mergeProgressFact({ evaluationSubmit: { stage, lang, status: ok ? "ok" : "failed", at: serverTimestamp() } });
  } catch (e) {
    console.warn("recordEvaluationSubmitFinished failed", e);
  }
}

export async function recordIntentProgressFact(
  payload: {
  tags: string[];
  categories: ProgressIntentCategories;
  urgency: number;
  lang: string;
  firstExpression?: string | null;
  firstCategory?: string | null;
  },
  profileId?: string | null,
) {
  return mergeProgressFact(
    {
      intent: {
        ...payload,
        updatedAt: serverTimestamp(),
      },
    },
    profileId,
  );
}

export async function recordMotivationProgressFact(
  payload: ProgressMotivationPayload,
  profileId?: string | null,
) {
  return mergeProgressFact(
    {
      motivation: {
        ...payload,
        updatedAt: serverTimestamp(),
      },
    },
    profileId,
  );
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

export async function recordRecommendationProgressFact(payload: {
  suggestedPath?: SessionType | null;
  reasonKey?: string | null;
  selectedPath?: SessionType | null;
  acceptedRecommendation?: boolean | null;
  dimensionScores?: DimensionScores | null;
}) {
  return mergeProgressFact({
    recommendation: {
      suggestedPath: (payload.suggestedPath as SessionType | null) ?? null,
      reasonKey: payload.reasonKey ?? null,
      selectedPath: (payload.selectedPath as SessionType | null) ?? null,
      acceptedRecommendation:
        typeof payload.acceptedRecommendation === "boolean"
          ? payload.acceptedRecommendation
          : payload.selectedPath && payload.suggestedPath
          ? payload.selectedPath === payload.suggestedPath
          : null,
      dimensionScores: payload.dimensionScores ?? null,
      updatedAt: serverTimestamp(),
    },
  });
}
