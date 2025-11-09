"use client";

import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { IntentCloudResult } from "./IntentCloud";
import { getDb } from "../lib/firebase";
import {
  type ResolutionSpeed,
  type BudgetPreference,
  type GoalType,
  type EmotionalState,
  type FormatPreference,
} from "../lib/evaluation";
import type { DimensionScores } from "../lib/scoring";
import type { SessionType } from "../lib/recommendation";

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
  const [intentTags, setIntentTags] = useState<string[]>([]);
  const [intentCategories, setIntentCategories] = useState<IntentCategoryCount[]>([]);
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
    async (text: string) => {
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
        await addDoc(collection(db, "userInterests"), {
          text: cleanText,
          lang,
          timestamp: serverTimestamp(),
        });
      } catch (error) {
        console.error("journal entry save failed", error);
        setSaveError(GENERIC_SAVE_ERROR);
        throw error;
      }
    },
    [lang],
  );

  const handleIntentComplete = useCallback((result: IntentCloudResult) => {
    setIntentTags(sanitizeTags(result.tags));
    setIntentCategories(sanitizeCategories(result.categories));
  }, []);

  const handleIntentSummaryComplete = useCallback(
    async (urgency: number, extra: IntentSnapshotExtras = {}) => {
      setIntentUrgency(urgency);
      setIsSavingIntentSnapshot(true);
      setSaveError(null);
      const tags = sanitizeTags(intentTags);
      const categories = sanitizeCategories(intentCategories);
      const cloudFocusCount = Math.max(
        1,
        Math.min(4, categories.filter((entry) => entry.count > 0).length || 1),
      );

      const includeExtras =
        Boolean(extra.dimensionScores) ||
        Boolean(extra.recommendation) ||
        Boolean(extra.recommendationReasonKey) ||
        typeof extra.algoVersion !== "undefined";

      const buildSnapshotPayload = (withExtras: boolean) => ({
        tags,
        categories,
        urgency,
        profileId,
        lang,
        evaluation: {
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
        },
        timestamp: serverTimestamp(),
        ...(withExtras
          ? {
              algoVersion: extra.algoVersion ?? 1,
              dimensionScores: extra.dimensionScores ?? null,
              recommendation: extra.recommendation ?? null,
              recommendationReasonKey: extra.recommendationReasonKey ?? null,
            }
          : {}),
      });

      const buildInsightPayload = (snapshotId: string, withExtras: boolean) => ({
        snapshotId,
        evaluation: {
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
        },
        profileId,
        lang,
        timestamp: serverTimestamp(),
        ...(withExtras
          ? {
              algoVersion: extra.algoVersion ?? 1,
              dimensionScores: extra.dimensionScores ?? null,
              recommendation: extra.recommendation ?? null,
              recommendationReasonKey: extra.recommendationReasonKey ?? null,
            }
          : {}),
      });

      const attemptSnapshotSave = async (withExtras: boolean) => {
        const snapshotRef = await addDoc(collection(db, "userIntentSnapshots"), buildSnapshotPayload(withExtras));
        try {
          await addDoc(collection(db, "userIntentInsights"), buildInsightPayload(snapshotRef.id, withExtras));
        } catch (insightError) {
          console.error("intent insight save failed", insightError);
        }
      };

      try {
        await attemptSnapshotSave(includeExtras);
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

  const handleCardSelect = useCallback(
    async (type: WizardCardChoice, extra: JourneyExtras = {}) => {
      if (isSavingJourney) {
        return false;
      }
      setSaveError(null);
      setIsSavingJourney(true);
      setJourneySavingChoice(type);
      const safeEntry = sanitizeJournalText(journalEntry) ?? "";
      const tags = sanitizeTags(intentTags);
      const categories = sanitizeCategories(intentCategories);
      const includeExtras =
        Boolean(extra.recommendedPath) ||
        Boolean(extra.recommendationReasonKey) ||
        Boolean(extra.dimensionScores) ||
        typeof extra.algoVersion !== "undefined";

      const buildJourneyPayload = (withExtras: boolean) => ({
        entry: safeEntry,
        tags,
        categorySummary: categories,
        urgency: intentUrgency,
        profileId,
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
        await addDoc(collection(db, "userJourneys"), buildJourneyPayload(includeExtras));
        setSelectedCard(type);
        return true;
      } catch (error) {
        console.error("journey choice save failed", error);
        if (includeExtras) {
          try {
            await addDoc(collection(db, "userJourneys"), buildJourneyPayload(false));
            setSelectedCard(type);
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
      }
    },
    [isSavingJourney, journalEntry, intentTags, intentCategories, intentUrgency, profileId, lang],
  );

  const dismissAccountPrompt = useCallback(() => {
    setShowAccountPrompt(false);
  }, []);

  return {
    journalEntry,
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
