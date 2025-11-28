"use client";

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { ensureAuth, getDb } from "../firebase";
import { computeDirectionMotivationIndex, computeOmniIntelScore } from "../omniIntel";
import {
  computeKunoAggregate,
  computeAbilityIndex,
  computeMotivationIndexEnhanced,
  computeFlowIndex,
  computeKunoComposite,
} from "../dashboardMetrics";
import type { PracticeSessionLite } from "../progressAnalytics";
import type { DimensionScores } from "../scoring";
import { OMNIKUNO_MODULES, resolveModuleId, type OmniKunoModuleId } from "@/config/omniKunoModules";
import type { OmniKnowledgeScores } from "../omniKnowledge";
import type { SessionType } from "../recommendation";
import type { OmniBlock } from "../omniIntel";
import type {
  EvaluationScoreTotals,
  ProgressFact,
  ProgressIntentCategories,
  ProgressMotivationPayload,
} from "./types";

const DIMENSION_KEYS: OmniKunoModuleId[] = OMNIKUNO_MODULES.map((meta) => meta.id as OmniKunoModuleId);

export function sanitizeDimensionScores(entry: unknown): DimensionScores | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const baseline: DimensionScores = DIMENSION_KEYS.reduce((acc, moduleId) => {
    acc[moduleId] = 0;
    return acc;
  }, {} as DimensionScores);
  let seen = false;
  Object.entries(entry as Record<string, unknown>).forEach(([rawKey, rawValue]) => {
    const moduleId = resolveModuleId(rawKey);
    if (!moduleId) return;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    baseline[moduleId] = value;
    seen = true;
  });
  return seen ? baseline : null;
}

export async function backfillProgressFacts(profileId: string) {
  const auth = await ensureAuth();
  const db = getDb();
  const effectiveId = profileId || auth?.uid || null;
  if (!effectiveId) return null;
  try {
    const existingFactsSnap = await getDocs(
      query(
        collection(db, "userProgressFacts"),
        where("__name__", "==", effectiveId as unknown as string),
      ),
    );
    if (!existingFactsSnap.empty) {
      const data0 = existingFactsSnap.docs[0].data() as ProgressFact;
      if (data0?.intent && data0?.motivation && data0?.evaluation) {
        return data0;
      }
    }
  } catch {}
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
      const dirMot = computeDirectionMotivationIndex({
        urgency,
        determination: evaluationAnswers?.determination ?? 3,
        hoursPerWeek: evaluationAnswers?.hoursPerWeek ?? 0,
      });
      type MaybeKnowledge = { percent?: number } | null | undefined;
      const knowledgePercent = (knowledge as MaybeKnowledge)?.percent;
      const knowledgeIndex = typeof knowledgePercent === "number" ? knowledgePercent : 0;
      const skillsIndex = 0;
      const consistencyIndex = (answers && Object.keys(answers).length > 0) || tags.length > 0 ? 10 : 0;
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
  try {
    const omni = fact.omni as OmniBlock;
    const knowledgeDocs = await getDocs(
      query(
        collection(db, "userKnowledgeAssessments"),
        where("profileId", "==", effectiveId),
        orderBy("timestamp", "asc"),
        limit(50),
      ),
    );
    const percs: number[] = [];
    knowledgeDocs.forEach((d) => {
      const v = (d.data()?.score as { percent?: number } | undefined)?.percent;
      if (typeof v === "number") percs.push(Math.max(0, Math.min(100, Math.round(v))));
    });
    const kunoAgg = computeKunoAggregate(percs);
    omni.kuno.averagePercent = kunoAgg.ewma || kunoAgg.mean || omni.kuno.knowledgeIndex || 0;
    omni.kuno.runsCount = kunoAgg.runsCount;
    if (kunoAgg.lastPercent) omni.kuno.knowledgeIndex = kunoAgg.lastPercent;
    try {
      const currentK = omni.kuno as unknown as { masteryByCategory?: Record<string, number>; lessonsCompletedCount?: number } | undefined;
      const masteryMap = currentK?.masteryByCategory;
      const lessonsCompleted = Number(currentK?.lessonsCompletedCount ?? 0);
      const kc = computeKunoComposite({ percents: percs, masteryByCategory: masteryMap ?? null, lessonsCompleted });
      (omni.kuno as unknown as { generalIndex?: number }).generalIndex = kc.generalIndex;
    } catch {}
  } catch {}
  try {
    const omni = fact.omni as OmniBlock;
    const abilityDocs = await getDocs(
      query(
        collection(db, "userAbilityAssessments"),
        where("profileId", "==", effectiveId),
        orderBy("timestamp", "asc"),
        limit(50),
      ),
    );
    const asses: Array<{ total?: number; probes?: Record<string, { raw?: number; scaled?: number; maxRaw?: number }> }> = [];
    abilityDocs.forEach((d) => {
      const data = d.data() as { result?: { total?: number; probes?: Record<string, { raw?: number; scaled?: number; maxRaw?: number }> } };
      const result = data?.result ?? {};
      asses.push({ total: Number(result.total ?? 0), probes: result.probes });
    });
    const abilAgg = computeAbilityIndex(asses, Number(omni.abil.exercisesCompletedCount ?? 0));
    omni.abil.practiceIndex = abilAgg.practiceIndex;
    omni.abil.runsCount = abilAgg.runsCount;
    if (!omni.abil.skillsIndex && abilAgg.assessMean) omni.abil.skillsIndex = abilAgg.assessMean;
  } catch {}
  try {
    const omni = fact.omni as OmniBlock;
    omni.scope.motivationIndex = computeMotivationIndexEnhanced({
      urgency,
      determination: evaluationAnswers?.determination,
      hoursPerWeek: evaluationAnswers?.hoursPerWeek,
      learnFromOthers: evaluationAnswers?.learnFromOthers,
      scheduleFit: evaluationAnswers?.scheduleFit,
      budgetLevel: evaluationAnswers?.budgetLevel,
    });
  } catch {}
  try {
    const omni = fact.omni as OmniBlock;
    const sessions: PracticeSessionLite[] = Array.isArray(fact.practiceSessions)
      ? (fact.practiceSessions as unknown as PracticeSessionLite[])
      : [];
    const refMs = fact.updatedAt instanceof Date ? fact.updatedAt.getTime() : Date.now();
    const flow = computeFlowIndex(sessions, refMs);
    omni.flow = flow;
  } catch {}
  const factRef = doc(getDb(), "userProgressFacts", effectiveId);
  const profileRef = doc(getDb(), "userProfiles", effectiveId);
  try {
    let currentFacts: ProgressFact | null = null;
    let currentProfileFacts: ProgressFact | null = null;
    try {
      const curFactSnap = await (await import("firebase/firestore")).getDoc(factRef);
      if (curFactSnap.exists()) currentFacts = (curFactSnap.data() as ProgressFact) ?? null;
    } catch {}
    try {
      const curProfileSnap = await (await import("firebase/firestore")).getDoc(profileRef);
      if (curProfileSnap.exists()) {
        const pf = (curProfileSnap.data() as { progressFacts?: ProgressFact } | undefined)?.progressFacts ?? null;
        if (pf) currentProfileFacts = pf;
      }
    } catch {}
    const pickNewer = <T extends { updatedAt?: unknown } | null | undefined>(src: T, dst: T): T => {
      const toMs = (v: unknown): number => {
        try {
          if (!v) return 0;
          if (typeof v === "number") return v;
          if (v instanceof Date) return v.getTime();
          const ts = v as { toDate?: () => Date };
          return typeof ts?.toDate === "function" ? ts.toDate().getTime() : 0;
        } catch {
          return 0;
        }
      };
      const sMs = toMs(src?.updatedAt);
      const dMs = toMs(dst?.updatedAt);
      return !dst || sMs > dMs ? src : dst;
    };
    const merged: ProgressFact = { ...(currentFacts ?? {}), ...(currentProfileFacts ?? {}) } as ProgressFact;
    const next: ProgressFact = { ...(fact as ProgressFact) } as ProgressFact;
    const intentMerged = pickNewer(fact.intent ?? undefined, merged.intent ?? undefined);
    if (intentMerged) next.intent = intentMerged;
    const motivationMerged = pickNewer(fact.motivation ?? undefined, merged.motivation ?? undefined);
    if (motivationMerged) next.motivation = motivationMerged;
    const evaluationMerged = pickNewer(fact.evaluation ?? undefined, merged.evaluation ?? undefined);
    if (evaluationMerged) next.evaluation = evaluationMerged;
    const recommendationMerged = pickNewer(fact.recommendation ?? undefined, merged.recommendation ?? undefined);
    if (recommendationMerged) next.recommendation = recommendationMerged;
    const qaMerged = pickNewer(fact.quickAssessment ?? undefined, merged.quickAssessment ?? undefined);
    if (qaMerged) next.quickAssessment = qaMerged;
    if (Array.isArray(merged.practiceSessions) && Array.isArray(fact.practiceSessions)) {
      const seen = new Set<string>();
      const toKey = (x: unknown) => {
        try {
          const o = x as { type?: string; startedAt?: unknown };
          const ms = (() => {
            const v = o?.startedAt as unknown;
            if (!v) return 0;
            if (v instanceof Date) return v.getTime();
            if (typeof v === "number") return v;
            const ts = v as { toDate?: () => Date };
            return typeof ts?.toDate === "function" ? ts.toDate().getTime() : 0;
          })();
          return `${o?.type ?? "x"}@${ms}`;
        } catch {
          return Math.random().toString(36).slice(2);
        }
      };
      const combined = [...merged.practiceSessions, ...fact.practiceSessions];
      const dedup = combined.filter((it) => {
        const k = toKey(it);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      next.practiceSessions = dedup;
    }
    await Promise.all([
      setDoc(factRef, next, { merge: true }).catch((error) =>
        console.warn("progress fact backfill primary write failed", error),
      ),
      setDoc(profileRef, { progressFacts: next }, { merge: true }),
    ]);
  } catch {
    await Promise.all([
      setDoc(factRef, fact, { merge: true }).catch((error) =>
        console.warn("progress fact backfill primary write failed", error),
      ),
      setDoc(profileRef, { progressFacts: fact }, { merge: true }),
    ]);
  }
  try {
    console.log("Backfill completed for", effectiveId, "snapshot count", latestSnapshot.size);
  } catch {}
  return fact;
}
