"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { IntentCloudResult } from "./IntentCloud";
import { getDb, ensureAuth, areWritesDisabled } from "../lib/firebase";
import {
  type ResolutionSpeed,
  type BudgetPreference,
  type GoalType,
  type EmotionalState,
  type FormatPreference,
  type EvaluationAnswers,
} from "../lib/evaluation";
import type { DimensionScores } from "../lib/scoring";
import type { SessionType } from "../lib/recommendation";
import { computeDirectionMotivationIndex, computeOmniIntelScore, type OmniBlock } from "../lib/omniIntel";
import {
  detectCategoryFromRawInput,
  type IntentPrimaryCategory,
} from "../lib/intentExpressions";
import { detectCategory as detectCategoryJSON } from "@/lib/detectCategory";
import {
  recordIntentProgressFact,
  recordMotivationProgressFact,
  recordRecommendationProgressFact,
} from "../lib/progressFacts";

const db = getDb();
const MAX_JOURNAL_LENGTH = 1000;
const GENERIC_SAVE_ERROR = "A apărut o problemă la salvare. Poți încerca din nou.";

export type IntentCategoryCount = { category: string; count: number };
export type WizardCardChoice = "individual" | "group";
const sanitizeTags = (tags: string[]) =>
  tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 50);

const sanitizeCategories = (categories: IntentCategoryCount[]): IntentCategoryCount[] =>
  categories
    .map((entry) => ({
      category: typeof entry.category === "string" ? entry.category.trim() : String(entry.category),
      count: Number(entry.count) || 0,
    }))
    .filter((entry) => entry.category.length > 0 && entry.count > 0);

const sanitizeJournalText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > MAX_JOURNAL_LENGTH ? trimmed.slice(0, MAX_JOURNAL_LENGTH) : trimmed;
};

type FirstExpressionMeta = {
  expressionId?: string;
  category?: IntentPrimaryCategory;
};

type UseWizardDataParams = {
  lang: string;
  profileId: string | null;
};

type IntentSnapshotExtras = {
  dimensionScores?: DimensionScores;
  algoVersion?: number;
  recommendation?: SessionType;
  recommendationReasonKey?: string;
};

type JourneyExtras = {
  recommendedPath?: SessionType;
  recommendationReasonKey?: string;
  algoVersion?: number;
  dimensionScores?: DimensionScores;
};

export function useWizardData({ lang, profileId }: UseWizardDataParams) {
  const [journalEntry, setJournalEntry] = useState("");
  const [firstIntentExpression, setFirstIntentExpression] = useState<string | null>(null);
  const [firstIntentCategory, setFirstIntentCategory] = useState<IntentPrimaryCategory | null>(null);
  const [intentTags, setIntentTags] = useState<string[]>([]);
  const [intentCategories, setIntentCategories] = useState<IntentCategoryCount[]>([]);
  const [intentSelectionIds, setIntentSelectionIds] = useState<string[]>([]);
  const [intentCategoryScores, setIntentCategoryScores] = useState<Record<IntentPrimaryCategory, number>>({
    clarity: 0,
    relationships: 0,
    stress: 0,
    confidence: 0,
    balance: 0,
  });
  const [intentUrgency, setIntentUrgency] = useState(6);
  const [selectedCard, setSelectedCard] = useState<WizardCardChoice | null>(null);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingIntentSnapshot, setIsSavingIntentSnapshot] = useState(false);
  const [isSavingJourney, setIsSavingJourney] = useState(false);
  const [journeySavingChoice, setJourneySavingChoice] = useState<WizardCardChoice | null>(null);
  const [resolutionSpeed, setResolutionSpeed] = useState<ResolutionSpeed>("weeks");
  const [determination, setDetermination] = useState(3);
  const [timeCommitmentHours, setTimeCommitmentHours] = useState(3);
  const [budgetPreference, setBudgetPreference] = useState<BudgetPreference>("medium");
  const [goalType, setGoalType] = useState<GoalType>("few");
  const [emotionalState, setEmotionalState] = useState<EmotionalState>("stable");
  const [groupComfort, setGroupComfort] = useState(5);
  const [learnFromOthers, setLearnFromOthers] = useState(5);
  const [scheduleFit, setScheduleFit] = useState(6);
  const [formatPreference, setFormatPreference] = useState<FormatPreference>("unsure");

  useEffect(() => {
    if (profileId) {
      setShowAccountPrompt(false);
    }
  }, [profileId]);

  const resetError = useCallback(() => {
    setSaveError(null);
  }, []);

  const handleFirstInputSubmit = useCallback(
    async (text: string, meta?: FirstExpressionMeta) => {
      const cleanText = sanitizeJournalText(text);
      if (!cleanText) {
        const message =
          lang === "ro"
            ? "Completează câteva detalii înainte de a continua."
            : "Please add a bit more detail before continuing.";
        setSaveError(message);
        throw new Error("FIRST_INPUT_VALIDATION");
      }
      setJournalEntry(cleanText);
      setSaveError(null);
      try {
        const user = await ensureAuth();
        if (!user) {
          const message =
            lang === "ro"
              ? "Te rugăm să te conectezi pentru a salva și continua."
              : "Please sign in to save and continue.";
        setSaveError(message);
        setShowAccountPrompt(true);
          // Signal to caller not to advance without throwing to console
          return false;
        }
        if (!areWritesDisabled()) {
          await addDoc(collection(db, "userInterests"), {
            text: cleanText,
            lang,
            timestamp: serverTimestamp(),
          });
        }
        // Text analytics (best-effort)
        try {
          const { recordTextSignals } = await import("@/lib/textSignals");
          void recordTextSignals({ text: cleanText, lang: lang === "en" ? "en" : "ro", source: "firstInput" });
        } catch {}
        let resolvedCategory = meta?.category ?? detectCategoryFromRawInput(cleanText) ?? null;
        if (!resolvedCategory && lang === "ro") {
          const roCat = detectCategoryJSON(cleanText);
          const map: Record<string, IntentPrimaryCategory> = {
            claritate: "clarity",
            relatii: "relationships",
            stres: "stress",
            incredere: "confidence",
            echilibru: "balance",
          };
          resolvedCategory = roCat ? map[roCat] ?? null : null;
        }
        setFirstIntentCategory(resolvedCategory);
        setFirstIntentExpression(meta?.expressionId ?? cleanText);
      } catch (error) {
        console.error("journal entry save failed", error);
        setSaveError(GENERIC_SAVE_ERROR);
        return false;
      }
    },
    [lang],
  );

  const handleIntentComplete = useCallback((result: IntentCloudResult) => {
    const tags = sanitizeTags(result.tags);
    setIntentTags(tags);
    setIntentSelectionIds(result.selectionIds ?? []);
    const categories = sanitizeCategories(
      result.categories.map((entry) => ({
        category: entry.category,
        count: entry.count,
      })),
    );
    setIntentCategories(categories);

    const totals: Record<IntentPrimaryCategory, number> = {
      clarity: 0,
      relationships: 0,
      stress: 0,
      confidence: 0,
      balance: 0,
    };
    result.categories.forEach((entry) => {
      totals[entry.category] += entry.count;
    });
    setIntentCategoryScores(totals);
  }, []);

  const handleIntentSummaryComplete = useCallback(
    async (urgency: number, extra: IntentSnapshotExtras = {}) => {
      setIntentUrgency(urgency);
      setIsSavingIntentSnapshot(true);
      setSaveError(null);
      const snapshotAuth = await ensureAuth();
      const snapshotOwnerId = profileId ?? snapshotAuth?.uid ?? null;
      const tags = sanitizeTags(intentTags);
      const categories = sanitizeCategories(intentCategories);
      const selectionCount = tags.length;
      const cloudFocusCount = selectionCount
        ? Math.min(7, Math.max(5, selectionCount))
        : 5;

      // Derive top category and share (pondere din selecții)
      const { shares } = await import("@/lib/indicators").then((m) => m.buildIndicatorSummary(categories));
      const topShare = Math.max(
        Number(shares.clarity ?? 0),
        Number(shares.relationships ?? 0),
        Number(shares.calm ?? 0),
        Number(shares.energy ?? 0),
        Number(shares.performance ?? 0),
      );
      const topCategory = (() => {
        const pairs: Array<[string, number]> = [
          ["clarity", Number(shares.clarity ?? 0)],
          ["relationships", Number(shares.relationships ?? 0)],
          ["calm", Number(shares.calm ?? 0)],
          ["energy", Number(shares.energy ?? 0)],
          ["performance", Number(shares.performance ?? 0)],
        ];
        pairs.sort((a, b) => b[1] - a[1]);
        return pairs[0]?.[0] ?? null;
      })();

      const includeExtras =
        Boolean(extra.dimensionScores) ||
        Boolean(extra.recommendation) ||
        Boolean(extra.recommendationReasonKey) ||
        typeof extra.algoVersion !== "undefined";

      // Dev-only integrity check: sum of category counts should equal selection count
      if (process.env.NODE_ENV !== "production") {
        try {
          const sum = categories.reduce((s, e) => s + (Number(e.count) || 0), 0);
          if (sum !== selectionCount) {
            console.warn("[DEBUG] category-count mismatch:", { selectionCount, sum, categories });
          }
        } catch {}
      }

      const evaluationAnswerPayload: EvaluationAnswers = {
        urgency,
        timeHorizon: resolutionSpeed,
        determination,
        hoursPerWeek: timeCommitmentHours,
        budgetLevel: budgetPreference,
        goalType,
        emotionalState,
        groupComfort,
        learnFromOthers,
        scheduleFit,
        formatPreference,
        cloudFocusCount,
      };

      const buildSnapshotPayload = (withExtras: boolean) => {
        const timestamp = serverTimestamp();
        const dirMot = computeDirectionMotivationIndex({
          urgency,
          determination,
          hoursPerWeek: timeCommitmentHours,
        });
        const knowledgeIndex = 0; // se va actualiza după Kuno
        const skillsIndex = 0; // se va actualiza după Abil
        const consistencyIndex = 0; // se va calcula din activitate
        const omniIntelScore = computeOmniIntelScore({
          knowledgeIndex,
          skillsIndex,
          directionMotivationIndex: dirMot,
          consistencyIndex,
        });
        const omni: OmniBlock = {
          scope: { goalDescription: null, mainPain: null, idealDay: null, wordCount: null, tags, directionMotivationIndex: dirMot },
          kuno: { completedTests: 0, totalTestsAvailable: 0, scores: {}, knowledgeIndex },
          sensei: { unlocked: false, activeQuests: [], completedQuestsCount: 0 },
          abil: { unlocked: false, exercisesCompletedCount: 0, skillsIndex },
          intel: { unlocked: false, evaluationsCount: 0, consistencyIndex },
          omniIntelScore,
          omniPoints: 0,
        };
        return {
          tags,
          categories,
          urgency,
          selectionIds: intentSelectionIds,
          categoryScores: intentCategoryScores,
          taxonomyVersion: 2,
          selectionTotal: selectionCount,
          topCategory,
          topShare,
          firstExpression: firstIntentExpression ?? null,
          firstCategory: firstIntentCategory ?? null,
          profileId: snapshotOwnerId,
          ownerUid: snapshotOwnerId,
          lang,
          evaluation: evaluationAnswerPayload,
          omni,
          timestamp,
          createdAt: timestamp,
          ...(withExtras
            ? {
                algoVersion: extra.algoVersion ?? 1,
                dimensionScores: extra.dimensionScores ?? null,
                recommendation: extra.recommendation ?? null,
                recommendationReasonKey: extra.recommendationReasonKey ?? null,
              }
            : {}),
        };
      };

      const buildInsightPayload = (snapshotId: string, withExtras: boolean) => {
        const timestamp = serverTimestamp();
        return {
          snapshotId,
          evaluation: evaluationAnswerPayload,
          profileId: snapshotOwnerId,
          ownerUid: snapshotOwnerId,
          lang,
          taxonomyVersion: 2,
          selectionTotal: selectionCount,
          topCategory,
          topShare,
          timestamp,
          createdAt: timestamp,
          ...(withExtras
            ? {
                algoVersion: extra.algoVersion ?? 1,
                dimensionScores: extra.dimensionScores ?? null,
                recommendation: extra.recommendation ?? null,
                recommendationReasonKey: extra.recommendationReasonKey ?? null,
              }
            : {}),
        };
      };

      const attemptSnapshotSave = async (withExtras: boolean) => {
        if (areWritesDisabled()) return;
        const snapshotRef = await addDoc(collection(db, "userIntentSnapshots"), buildSnapshotPayload(withExtras));
        try {
          await addDoc(collection(db, "userIntentInsights"), buildInsightPayload(snapshotRef.id, withExtras));
        } catch (insightError) {
          console.error("intent insight save failed", insightError);
        }
      };

      try {
        await attemptSnapshotSave(includeExtras);
        void recordIntentProgressFact({
          tags,
          categories,
          urgency,
          lang,
          firstExpression: firstIntentExpression ?? null,
          firstCategory: firstIntentCategory ?? null,
          selectionTotal: selectionCount,
          topCategory,
          topShare,
        }, snapshotOwnerId).catch((progressError) => {
          console.error("progress fact intent failed", progressError);
        });
        void recordMotivationProgressFact(evaluationAnswerPayload, snapshotOwnerId).catch((progressError) => {
          console.error("progress fact motivation failed", progressError);
        });
        if (includeExtras) {
          void recordRecommendationProgressFact({
            suggestedPath: extra.recommendation,
            reasonKey: extra.recommendationReasonKey,
            dimensionScores: extra.dimensionScores,
          }).catch((progressError) => {
            console.error("progress fact recommendation failed", progressError);
          });
        }
        if (!profileId) {
          setShowAccountPrompt(true);
        }
        return true;
      } catch (error) {
        console.error("intent summary save failed", error);
        if (includeExtras) {
          try {
            await attemptSnapshotSave(false);
            if (!profileId) {
              setShowAccountPrompt(true);
            }
            return true;
          } catch (fallbackError) {
            console.error("intent summary fallback save failed", fallbackError);
          }
        }
        setSaveError(GENERIC_SAVE_ERROR);
        return false;
      } finally {
        setIsSavingIntentSnapshot(false);
      }
    },
    [
      intentTags,
      intentCategories,
      intentSelectionIds,
      intentCategoryScores,
      firstIntentExpression,
      firstIntentCategory,
      profileId,
      lang,
      resolutionSpeed,
      determination,
      timeCommitmentHours,
      budgetPreference,
      goalType,
      emotionalState,
      groupComfort,
      learnFromOthers,
      scheduleFit,
      formatPreference,
    ],
  );

  const selectGuardRef = useRef<{ busy: boolean; last?: WizardCardChoice } | null>(null);

  const handleCardSelect = useCallback(
    async (type: WizardCardChoice, extra: JourneyExtras = {}) => {
      if (isSavingJourney) {
        return false;
      }
      // Simple guard to prevent accidental double submit
      if (selectGuardRef.current?.busy) return false;
      selectGuardRef.current = { busy: true, last: type };
      setSaveError(null);
      setIsSavingJourney(true);
      setJourneySavingChoice(type);
      const safeEntry = sanitizeJournalText(journalEntry) ?? "";
      const tags = sanitizeTags(intentTags);
      const categories = sanitizeCategories(intentCategories);
      const journeyAuth = await ensureAuth();
      const journeyOwnerId = profileId ?? journeyAuth?.uid ?? null;
      const includeExtras =
        Boolean(extra.recommendedPath) ||
        Boolean(extra.recommendationReasonKey) ||
        Boolean(extra.dimensionScores) ||
        typeof extra.algoVersion !== "undefined";

      const buildJourneyPayload = (withExtras: boolean) => ({
        entry: safeEntry,
        tags,
        categorySummary: categories,
        categoryScores: intentCategoryScores,
        selectionIds: intentSelectionIds,
        firstExpression: firstIntentExpression ?? null,
        firstCategory: firstIntentCategory ?? null,
        urgency: intentUrgency,
        profileId: journeyOwnerId,
        choice: type,
        lang,
        timestamp: serverTimestamp(),
        ...(withExtras
          ? {
              recommendedPath: extra.recommendedPath ?? null,
              acceptedRecommendation:
                typeof extra.recommendedPath === "string" ? extra.recommendedPath === type : null,
              algoVersion: extra.algoVersion ?? 1,
              dimensionScores: extra.dimensionScores ?? null,
              recommendationReasonKey: extra.recommendationReasonKey ?? null,
            }
          : {}),
      });

      try {
        if (!areWritesDisabled()) {
          await addDoc(collection(db, "userJourneys"), buildJourneyPayload(includeExtras));
        }
        setSelectedCard(type);
        // Gate unlock: persist selection on profile (best-effort)
        try {
          const { updateProfileSelection } = await import("@/lib/selection");
          void updateProfileSelection(type);
        } catch {}
        if (includeExtras) {
          void recordRecommendationProgressFact({
            suggestedPath: extra.recommendedPath,
            selectedPath: type,
            reasonKey: extra.recommendationReasonKey,
            dimensionScores: extra.dimensionScores,
          }).catch((progressError) => {
            console.error("progress fact recommendation update failed", progressError);
          });
        } else {
          void recordRecommendationProgressFact({
            selectedPath: type,
          }).catch((progressError) => {
            console.error("progress fact recommendation update failed", progressError);
          });
        }
        return true;
      } catch (error) {
        console.error("journey choice save failed", error);
        if (includeExtras) {
          try {
            await addDoc(collection(db, "userJourneys"), buildJourneyPayload(false));
            setSelectedCard(type);
            try {
              const { updateProfileSelection } = await import("@/lib/selection");
              void updateProfileSelection(type);
            } catch {}
            void recordRecommendationProgressFact({
              selectedPath: type,
            }).catch((progressError) => {
              console.error("progress fact recommendation fallback failed", progressError);
            });
            return true;
          } catch (fallbackError) {
            console.error("journey choice fallback save failed", fallbackError);
          }
        }
        setSaveError(GENERIC_SAVE_ERROR);
        return false;
      } finally {
        setIsSavingJourney(false);
        setJourneySavingChoice(null);
        selectGuardRef.current = { busy: false, last: type };
      }
    },
    [
      isSavingJourney,
      journalEntry,
      intentTags,
      intentCategories,
      intentSelectionIds,
      intentCategoryScores,
      intentUrgency,
      firstIntentExpression,
      firstIntentCategory,
      profileId,
      lang,
    ],
  );

  const dismissAccountPrompt = useCallback(() => {
    setShowAccountPrompt(false);
  }, []);

  return {
    journalEntry,
    firstIntentExpression,
    firstIntentCategory,
    intentSelectionIds,
    intentCategoryScores,
    intentTags,
    intentCategories,
    intentUrgency,
    selectedCard,
    showAccountPrompt,
    saveError,
    isSavingIntentSnapshot,
    isSavingJourney,
    journeySavingChoice,
    resolutionSpeed,
    determination,
    timeCommitmentHours,
    budgetPreference,
    goalType,
    emotionalState,
    groupComfort,
    learnFromOthers,
    scheduleFit,
    formatPreference,
    handleFirstInputSubmit,
    handleIntentComplete,
    handleIntentSummaryComplete,
    handleCardSelect,
    dismissAccountPrompt,
    resetError,
    setIntentUrgency,
    setResolutionSpeed,
    setDetermination,
    setTimeCommitmentHours,
    setBudgetPreference,
    setGoalType,
    setEmotionalState,
    setGroupComfort,
    setLearnFromOthers,
    setScheduleFit,
    setFormatPreference,
  };
}
