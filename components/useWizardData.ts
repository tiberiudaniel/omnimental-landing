"use client";

import { useCallback, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { IntentCloudResult } from "./IntentCloud";
import { getDb, ensureAuth, areWritesDisabled } from "@/lib/firebase";
import {
  type ResolutionSpeed,
  type BudgetPreference,
  type GoalType,
  type EmotionalState,
  type FormatPreference,
  type EvaluationAnswers,
} from "@/lib/evaluation";
import type { DimensionScores } from "@/lib/scoring";
import type { SessionType } from "@/lib/recommendation";
import { computeDirectionMotivationIndex, computeOmniIntelScore, type OmniBlock } from "@/lib/omniIntel";
import {
  detectCategoryFromRawInput,
  type IntentPrimaryCategory,
} from "@/lib/intentExpressions";
import { detectCategory as detectCategoryJSON } from "@/lib/detectCategory";
import {
  recordIntentProgressFact,
  recordMotivationProgressFact,
  recordRecommendationProgressFact,
} from "@/lib/progressFacts";

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

type JournalHookArgs = {
  lang: string;
  setSaveError: (value: string | null) => void;
  requestAccountPrompt: (value: boolean) => void;
};

type JournalHookState = {
  journalEntry: string;
  firstIntentExpression: string | null;
  firstIntentCategory: IntentPrimaryCategory | null;
  handleFirstInputSubmit: (text: string, meta?: FirstExpressionMeta) => Promise<boolean>;
};

export function useWizardJournalState({ lang, setSaveError, requestAccountPrompt }: JournalHookArgs): JournalHookState {
  const [journalEntry, setJournalEntry] = useState("");
  const [firstIntentExpression, setFirstIntentExpression] = useState<string | null>(null);
  const [firstIntentCategory, setFirstIntentCategory] = useState<IntentPrimaryCategory | null>(null);

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
          requestAccountPrompt(true);
          return false;
        }
        if (!areWritesDisabled()) {
          await addDoc(collection(db, "userInterests"), {
            text: cleanText,
            lang,
            timestamp: serverTimestamp(),
          });
        }
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
      return true;
    },
    [lang, setSaveError, requestAccountPrompt],
  );

  return {
    journalEntry,
    firstIntentExpression,
    firstIntentCategory,
    handleFirstInputSubmit,
  };
}

type IntentHookState = {
  intentTags: string[];
  intentCategories: IntentCategoryCount[];
  intentSelectionIds: string[];
  intentCategoryScores: Record<IntentPrimaryCategory, number>;
  handleIntentComplete: (result: IntentCloudResult) => void;
};

export function useWizardIntentState(): IntentHookState {
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

  return {
    intentTags,
    intentCategories,
    intentSelectionIds,
    intentCategoryScores,
    handleIntentComplete,
  };
}

type JourneyHookArgs = {
  lang: string;
  profileId: string | null;
  setSaveError: (value: string | null) => void;
  requestAccountPrompt: (value: boolean) => void;
  journalEntry: string;
  firstIntentExpression: string | null;
  firstIntentCategory: IntentPrimaryCategory | null;
  intentTags: string[];
  intentCategories: IntentCategoryCount[];
  intentSelectionIds: string[];
  intentCategoryScores: Record<IntentPrimaryCategory, number>;
};

type JourneyHookState = {
  intentUrgency: number;
  setIntentUrgency: (value: number) => void;
  selectedCard: WizardCardChoice | null;
  handleIntentSummaryComplete: (urgency: number, extra?: IntentSnapshotExtras) => Promise<boolean>;
  handleCardSelect: (type: WizardCardChoice, extra?: JourneyExtras) => Promise<boolean>;
  isSavingIntentSnapshot: boolean;
  isSavingJourney: boolean;
  journeySavingChoice: WizardCardChoice | null;
  resolutionSpeed: ResolutionSpeed;
  determination: number;
  timeCommitmentHours: number;
  budgetPreference: BudgetPreference;
  goalType: GoalType;
  emotionalState: EmotionalState;
  groupComfort: number;
  learnFromOthers: number;
  scheduleFit: number;
  formatPreference: FormatPreference;
  setResolutionSpeed: (value: ResolutionSpeed) => void;
  setDetermination: (value: number) => void;
  setTimeCommitmentHours: (value: number) => void;
  setBudgetPreference: (value: BudgetPreference) => void;
  setGoalType: (value: GoalType) => void;
  setEmotionalState: (value: EmotionalState) => void;
  setGroupComfort: (value: number) => void;
  setLearnFromOthers: (value: number) => void;
  setScheduleFit: (value: number) => void;
  setFormatPreference: (value: FormatPreference) => void;
};

export function useWizardJourneyState({
  lang,
  profileId,
  setSaveError,
  requestAccountPrompt,
  journalEntry,
  firstIntentExpression,
  firstIntentCategory,
  intentTags,
  intentCategories,
  intentSelectionIds,
  intentCategoryScores,
}: JourneyHookArgs): JourneyHookState {
  const [intentUrgency, setIntentUrgency] = useState(6);
  const [selectedCard, setSelectedCard] = useState<WizardCardChoice | null>(null);
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
  const selectGuardRef = useRef<{ busy: boolean; last?: WizardCardChoice } | null>(null);

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

      const { shares } = await import("@/lib/indicators").then((m) => m.buildIndicatorSummary(categories));
      const shareClarity = Number(shares.focus_clarity ?? 0);
      const shareRelationships = Number(shares.relationships_communication ?? 0);
      const shareEmotional = Number(shares.emotional_balance ?? 0);
      const shareEnergy = Number(shares.energy_body ?? 0);
      const shareDecision = Number(shares.decision_discernment ?? 0);
      const shareSelfTrust = Number(shares.self_trust ?? 0);
      const topShare = Math.max(
        shareClarity,
        shareRelationships,
        shareEmotional,
        shareEnergy,
        shareDecision,
        shareSelfTrust,
      );
      const topCategory = (() => {
        const pairs: Array<[string, number]> = [
          ["focus_clarity", shareClarity],
          ["relationships_communication", shareRelationships],
          ["emotional_balance", shareEmotional],
          ["energy_body", shareEnergy],
          ["decision_discernment", shareDecision],
          ["self_trust", shareSelfTrust],
        ];
        pairs.sort((a, b) => b[1] - a[1]);
        return pairs[0]?.[0] ?? null;
      })();

      const includeExtras =
        Boolean(extra.dimensionScores) ||
        Boolean(extra.recommendation) ||
        Boolean(extra.recommendationReasonKey) ||
        typeof extra.algoVersion !== "undefined";

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
        const knowledgeIndex = 0;
        const skillsIndex = 0;
        const consistencyIndex = 0;
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
        void recordIntentProgressFact(
          {
            tags,
            categories,
            urgency,
            lang,
            firstExpression: firstIntentExpression ?? null,
            firstCategory: firstIntentCategory ?? null,
            selectionTotal: selectionCount,
            topCategory,
            topShare,
          },
          snapshotOwnerId,
        ).catch((progressError) => {
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
          requestAccountPrompt(true);
        }
        return true;
      } catch (error) {
        console.error("intent summary save failed", error);
        if (includeExtras) {
          try {
            await attemptSnapshotSave(false);
            if (!profileId) {
              requestAccountPrompt(true);
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
      profileId,
      intentTags,
      intentCategories,
      intentSelectionIds,
      intentCategoryScores,
      firstIntentExpression,
      firstIntentCategory,
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
      setSaveError,
      requestAccountPrompt,
    ],
  );

  const handleCardSelect = useCallback(
    async (type: WizardCardChoice, extra: JourneyExtras = {}) => {
      if (isSavingJourney) {
        return false;
      }
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
      firstIntentExpression,
      firstIntentCategory,
      intentUrgency,
      profileId,
      lang,
      setSaveError,
    ],
  );

  return {
    intentUrgency,
    setIntentUrgency,
    selectedCard,
    handleIntentSummaryComplete,
    handleCardSelect,
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

export function useWizardData({ lang, profileId }: UseWizardDataParams) {
  const [accountPromptRequested, setAccountPromptRequested] = useState(false);
  const showAccountPrompt = accountPromptRequested && !profileId;
  const [saveError, setSaveError] = useState<string | null>(null);

  const journal = useWizardJournalState({ lang, setSaveError, requestAccountPrompt: setAccountPromptRequested });
  const intent = useWizardIntentState();
  const journey = useWizardJourneyState({
    lang,
    profileId,
    setSaveError,
    requestAccountPrompt: setAccountPromptRequested,
    journalEntry: journal.journalEntry,
    firstIntentExpression: journal.firstIntentExpression,
    firstIntentCategory: journal.firstIntentCategory,
    intentTags: intent.intentTags,
    intentCategories: intent.intentCategories,
    intentSelectionIds: intent.intentSelectionIds,
    intentCategoryScores: intent.intentCategoryScores,
  });

  const resetError = useCallback(() => {
    setSaveError(null);
  }, []);

  const dismissAccountPrompt = useCallback(() => {
    setAccountPromptRequested(false);
  }, []);

  return {
    journalEntry: journal.journalEntry,
    firstIntentExpression: journal.firstIntentExpression,
    firstIntentCategory: journal.firstIntentCategory,
    intentSelectionIds: intent.intentSelectionIds,
    intentCategoryScores: intent.intentCategoryScores,
    intentTags: intent.intentTags,
    intentCategories: intent.intentCategories,
    intentUrgency: journey.intentUrgency,
    setIntentUrgency: journey.setIntentUrgency,
    selectedCard: journey.selectedCard,
    showAccountPrompt,
    saveError,
    isSavingIntentSnapshot: journey.isSavingIntentSnapshot,
    isSavingJourney: journey.isSavingJourney,
    journeySavingChoice: journey.journeySavingChoice,
    resolutionSpeed: journey.resolutionSpeed,
    determination: journey.determination,
    timeCommitmentHours: journey.timeCommitmentHours,
    budgetPreference: journey.budgetPreference,
    goalType: journey.goalType,
    emotionalState: journey.emotionalState,
    groupComfort: journey.groupComfort,
    learnFromOthers: journey.learnFromOthers,
    scheduleFit: journey.scheduleFit,
    formatPreference: journey.formatPreference,
    handleFirstInputSubmit: journal.handleFirstInputSubmit,
    handleIntentComplete: intent.handleIntentComplete,
    handleIntentSummaryComplete: journey.handleIntentSummaryComplete,
    handleCardSelect: journey.handleCardSelect,
    dismissAccountPrompt,
    resetError,
    setResolutionSpeed: journey.setResolutionSpeed,
    setDetermination: journey.setDetermination,
    setTimeCommitmentHours: journey.setTimeCommitmentHours,
    setBudgetPreference: journey.setBudgetPreference,
    setGoalType: journey.setGoalType,
    setEmotionalState: journey.setEmotionalState,
    setGroupComfort: journey.setGroupComfort,
    setLearnFromOthers: journey.setLearnFromOthers,
    setScheduleFit: journey.setScheduleFit,
    setFormatPreference: journey.setFormatPreference,
  };
}
