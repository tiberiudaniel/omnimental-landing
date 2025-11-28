"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { IntentCloudResult } from "./IntentCloud";
import { getDb, ensureAuth, areWritesDisabled } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
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

/**
 * TODO(anon-auth-refactor):
 *  - ensureAuth() already creates anonymous users (see lib/firebase.ts), so every persistence call below must
 *    rely solely on that UID and never on a "full account" assumption.
 *  - confirm `requireFullAccountOrPrompt` is only invoked from the cards CTA (WizardRouter + RecommendationStep);
 *    journal, intent etc. must NOT trigger requestAccountPrompt anymore.
 *  - `pendingJourneyChoice` gets persisted in state/localStorage so post-link flows can resume automatically.
 */
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

type PendingJourneyPayload = {
  choice: WizardCardChoice;
  extra?: JourneyExtras;
};

const PENDING_JOURNEY_KEY_PREFIX = "OMNI_PENDING_JOURNEY_";

const pendingKey = (uid: string) => `${PENDING_JOURNEY_KEY_PREFIX}${uid}`;

const savePendingChoiceToLocal = (payload: PendingJourneyPayload, uid: string) => {
  if (typeof window === "undefined" || !uid) return;
  try {
    window.localStorage.setItem(pendingKey(uid), JSON.stringify(payload));
  } catch {}
};

const loadPendingChoiceFromLocal = (uid: string): PendingJourneyPayload | null => {
  if (typeof window === "undefined" || !uid) return null;
  try {
    const raw = window.localStorage.getItem(pendingKey(uid));
    return raw ? (JSON.parse(raw) as PendingJourneyPayload) : null;
  } catch {
    return null;
  }
};

const clearPendingChoiceFromLocal = (uid: string) => {
  if (typeof window === "undefined" || !uid) return;
  try {
    window.localStorage.removeItem(pendingKey(uid));
  } catch {}
};

type JournalHookArgs = {
  lang: string;
  setSaveError: (value: string | null) => void;
  ensurePersistableUser: () => Promise<User | null>;
};

type JournalHookState = {
  journalEntry: string;
  firstIntentExpression: string | null;
  firstIntentCategory: IntentPrimaryCategory | null;
  handleFirstInputSubmit: (text: string, meta?: FirstExpressionMeta) => Promise<boolean>;
};

export function useWizardJournalState({ lang, setSaveError, ensurePersistableUser }: JournalHookArgs): JournalHookState {
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
        const user = await ensurePersistableUser();
        if (!user) {
          const message =
            lang === "ro"
              ? "Nu am putut iniția sesiunea ta. Te rugăm să reîncerci."
              : "We couldn't start your session. Please try again.";
          setSaveError(message);
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
          disciplina: "willpower_perseverance",
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
    [lang, setSaveError, ensurePersistableUser],
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
    willpower_perseverance: 0,
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
      willpower_perseverance: 0,
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
  journalEntry: string;
  firstIntentExpression: string | null;
  firstIntentCategory: IntentPrimaryCategory | null;
  intentTags: string[];
  intentCategories: IntentCategoryCount[];
  intentSelectionIds: string[];
  intentCategoryScores: Record<IntentPrimaryCategory, number>;
  ensurePersistableUser: () => Promise<User | null>;
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
  journalEntry,
  firstIntentExpression,
  firstIntentCategory,
  intentTags,
  intentCategories,
  intentSelectionIds,
  intentCategoryScores,
  ensurePersistableUser,
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
  const relaxedModeRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const search = window.location.search || "";
      if (search.includes("e2e=1") || search.includes("demo=1")) {
        relaxedModeRef.current = true;
      }
    } catch {
      relaxedModeRef.current = false;
    }
  }, []);

  const handleIntentSummaryComplete = useCallback(
    async (urgency: number, extra: IntentSnapshotExtras = {}) => {
      setIntentUrgency(urgency);
      setSaveError(null);
      if (relaxedModeRef.current) {
        setIsSavingIntentSnapshot(false);
        return true;
      }
      setIsSavingIntentSnapshot(true);
      const snapshotAuth = await ensurePersistableUser();
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
      const shareWillpower = Number(shares.willpower_perseverance ?? 0);
      const topShare = Math.max(
        shareClarity,
        shareRelationships,
        shareEmotional,
        shareEnergy,
        shareDecision,
        shareSelfTrust,
        shareWillpower,
      );
      const topCategory = (() => {
        const pairs: Array<[string, number]> = [
          ["focus_clarity", shareClarity],
          ["relationships_communication", shareRelationships],
          ["emotional_balance", shareEmotional],
          ["energy_body", shareEnergy],
          ["decision_discernment", shareDecision],
          ["self_trust", shareSelfTrust],
          ["willpower_perseverance", shareWillpower],
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
        return true;
      } catch (error) {
        console.error("intent summary save failed", error);
        if (includeExtras) {
          try {
            await attemptSnapshotSave(false);
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
      ensurePersistableUser,
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
      const journeyAuth = await ensurePersistableUser();
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
        if (journeyAuth?.uid) {
          clearPendingChoiceFromLocal(journeyAuth.uid);
        }
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
            if (journeyAuth?.uid) {
              clearPendingChoiceFromLocal(journeyAuth.uid);
            }
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
      ensurePersistableUser,
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
  const { user: authUser } = useAuth();
  const isAnonymousUser = Boolean(authUser?.isAnonymous);
  const authUserRef = useRef<User | null>(null);
  useEffect(() => {
    authUserRef.current = authUser ?? null;
  }, [authUser]);
  const [cardPromptVisible, setCardPromptVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingJourneyChoice, setPendingJourneyChoice] = useState<{ choice: WizardCardChoice; extra?: JourneyExtras } | null>(null);
  const showAccountPrompt = cardPromptVisible && Boolean(pendingJourneyChoice);

  const ensurePersistableUser = useCallback(async () => {
    const current = authUserRef.current;
    if (current) return current;
    const ensured = await ensureAuth();
    if (ensured) {
      authUserRef.current = ensured;
    }
    return ensured;
  }, []);

  const requireFullAccountOrPrompt = useCallback(() => {
    const current = authUserRef.current;
    if (current && !current.isAnonymous) return true;
    return false;
  }, []);

  const queueJourneyChoice = useCallback((choice: WizardCardChoice, extra?: JourneyExtras) => {
    setCardPromptVisible(true);
    setPendingJourneyChoice({ choice, extra });
    const current = authUserRef.current;
    if (current) {
      savePendingChoiceToLocal({ choice, extra }, current.uid);
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const stored = loadPendingChoiceFromLocal(authUser.uid);
    if (stored && !pendingJourneyChoice) {
      console.log("[wizard] loaded pending journey from storage", stored);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingJourneyChoice(stored);
    }
  }, [authUser, pendingJourneyChoice]);

  const journal = useWizardJournalState({ lang, setSaveError, ensurePersistableUser });
  const intent = useWizardIntentState();
  const journey = useWizardJourneyState({
    lang,
    profileId,
    setSaveError,
    journalEntry: journal.journalEntry,
    firstIntentExpression: journal.firstIntentExpression,
    firstIntentCategory: journal.firstIntentCategory,
    intentTags: intent.intentTags,
    intentCategories: intent.intentCategories,
    intentSelectionIds: intent.intentSelectionIds,
    intentCategoryScores: intent.intentCategoryScores,
    ensurePersistableUser,
  });
  const handleJourneyCardSelect = journey.handleCardSelect;

  useEffect(() => {
    if (!authUser || authUser.isAnonymous || !pendingJourneyChoice) return;
    let cancelled = false;
    (async () => {
      const ok = await handleJourneyCardSelect(pendingJourneyChoice.choice, pendingJourneyChoice.extra);
      if (cancelled) return;
      if (ok) {
        setCardPromptVisible(false);
        clearPendingChoiceFromLocal(authUser.uid);
      }
      setPendingJourneyChoice(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser, pendingJourneyChoice, handleJourneyCardSelect]);

  const resetError = useCallback(() => {
    setSaveError(null);
  }, []);

  const dismissAccountPrompt = useCallback(() => {
    setCardPromptVisible(false);
  }, []);


  const resetWizardStateHard = useCallback(() => {
    try {
      if (typeof window !== "undefined" && authUserRef.current?.uid) {
        clearPendingChoiceFromLocal(authUserRef.current.uid);
      }
    } catch {}
    setPendingJourneyChoice(null);
    setCardPromptVisible(false);
    setSaveError(null);
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
    isAnonymousUser,
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
    handleCardSelect: handleJourneyCardSelect,
    dismissAccountPrompt,
    resetError,
    resetWizardStateHard,
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
    requireFullAccountOrPrompt,
    queueJourneyChoice,
  };
}
