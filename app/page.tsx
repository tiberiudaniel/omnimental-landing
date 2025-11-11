"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FirstScreen from "../components/FirstScreen";
import SessionDetails from "../components/SessionDetails";
import { I18nProvider, useI18n } from "../components/I18nProvider";
import SocialProof from "../components/SocialProof";
import SiteHeader from "../components/SiteHeader";
import MenuOverlay from "../components/MenuOverlay";
import IntentCloud, { type IntentCloudResult } from "../components/IntentCloud";
import { useNavigationLinks } from "../components/useNavigationLinks";
import JourneyIntro from "../components/JourneyIntro";
import IntentSummary from "../components/IntentSummary";
import RecommendationStep from "../components/RecommendationStep";
import { useProfile } from "../components/ProfileProvider";
import AccountModal from "../components/AccountModal";
import IntroAnimation from "../components/IntroAnimation";
import { useWizardSteps, type Step } from "../components/useWizardSteps";
import WizardReflection from "../components/WizardReflection";
import { useWizardData } from "../components/useWizardData";
import { WizardProgress } from "../components/WizardProgress";
import { clearWizardState } from "../components/wizardStorage";
import Toast from "../components/Toast";
import { recordWizardReset, recordWizardResetCanceled, recordWizardResetNoticeDismissed } from "../lib/progressFacts";
import type { GoalType, EmotionalState, ResolutionSpeed, BudgetPreference } from "../lib/evaluation";
import type { IntentPrimaryCategory } from "../lib/intentExpressions";
import { computeDimensionScores } from "../lib/scoring";
import type { DimensionScores } from "../lib/scoring";
import { recommendSession, type SessionType } from "../lib/recommendation";
// duplicate import cleanup
import { generateAdaptiveIntentCloudWords, type IntentCloudWord } from "@/lib/intentExpressions";

const MIN_INTENT_SELECTIONS = 5;
const MAX_INTENT_SELECTIONS = 7;

const getTranslationString = (
  translate: (key: string) => unknown,
  key: string,
  fallback = "",
) => {
  const value = translate(key);
  return typeof value === "string" ? value : fallback;
};

function PageContent() {
  const { t, lang } = useI18n();
  const { profile } = useProfile();
  const { step, goToStep } = useWizardSteps();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalKey, setAccountModalKey] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = searchParams?.get("returnTo");

  const {
    journalEntry,
    firstIntentCategory,
    intentCategories,
    intentUrgency,
    setIntentUrgency,
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
    handleFirstInputSubmit: submitFirstInput,
    handleIntentComplete: recordIntentSelection,
    handleIntentSummaryComplete: persistIntentSnapshot,
    handleCardSelect: persistJourneyChoice,
    dismissAccountPrompt,
    resetError,
    setResolutionSpeed,
    setDetermination,
    setTimeCommitmentHours,
    setBudgetPreference,
    setGoalType,
    setEmotionalState,
    setGroupComfort,
    setLearnFromOthers,
    setScheduleFit,
  } = useWizardData({ lang, profileId: profile?.id ?? null });

  const [dimensionScores, setDimensionScores] = useState<DimensionScores>(() => ({
    calm: 0,
    focus: 0,
    energy: 0,
    relationships: 0,
    performance: 0,
    health: 0,
  }));
  const [recommendedPath, setRecommendedPath] = useState<SessionType>("group");
  const [recommendationReasonKey, setRecommendationReasonKey] =
    useState<string>("reason_default");
  const [cloudWordCount, setCloudWordCount] = useState(25);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const compute = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCloudWordCount(18);
      } else if (width < 1024) {
        setCloudWordCount(22);
      } else {
        setCloudWordCount(25);
      }
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const adaptiveCloudWords = useMemo(
    () =>
      generateAdaptiveIntentCloudWords({
        locale: lang === "en" ? "en" : "ro",
        primaryCategory: firstIntentCategory ?? undefined,
        total: cloudWordCount,
      }),
    [cloudWordCount, firstIntentCategory, lang],
  );

  const adaptiveCloudKey = useMemo(
    () => adaptiveCloudWords.map((word) => word.id).join("|"),
    [adaptiveCloudWords],
  );

  useEffect(() => {
    if ((step === "cards" || step === "details") && intentCategories.length === 0) {
      goToStep("firstInput");
      return;
    }
    if (step === "intentSummary" && intentCategories.length === 0) {
      goToStep("intent");
    }
  }, [goToStep, intentCategories.length, step]);

  const handleReturnToOrigin = useCallback(() => {
    if (!returnTo) return;
    router.push(returnTo);
  }, [returnTo, router]);

  const categoryLabels = useMemo(() => {
    const categoryLabelsValue = t("intentCategoryLabels");
    return categoryLabelsValue && typeof categoryLabelsValue === "object"
      ? (categoryLabelsValue as Record<string, string>)
      : {};
  }, [t]);
  const recommendedBadgeValue = getTranslationString(t, "cardsRecommendedLabel");
  const recommendedBadgeLabel = recommendedBadgeValue || undefined;
  const reflectionOneLines = useMemo(() => {
    return ["reflectionOneLine1", "reflectionOneLine2"]
      .map((key) => getTranslationString(t, key))
      .filter((line) => line.length > 0);
  }, [t]);

  const reflectionSummaryLines = useMemo(() => {
    const introValue = getTranslationString(t, "reflectionTwoIntro");
    const bodyValue = getTranslationString(t, "reflectionTwoBody");
    const connector = lang === "ro" ? " și " : " & ";
    const summaryNames = intentCategories
      .filter((entry) => entry.count > 0)
      .slice(0, 2)
      .map((entry) => {
        const label = categoryLabels[entry.category];
        return typeof label === "string" && label.length > 0 ? label : entry.category;
      });
    const summaryText =
      summaryNames.length === 0
        ? lang === "ro"
          ? "temele tale principale"
          : "your main themes"
        : summaryNames.length === 1
        ? summaryNames[0]
        : `${summaryNames[0]}${connector}${summaryNames[1]}`;
    const introLine =
      introValue.length > 0
        ? introValue.replace("{{categorySummary}}", summaryText)
        : lang === "ro"
        ? `Pare că vrei să lucrezi la ${summaryText}.`
        : `Looks like you want to work on ${summaryText}.`;
    const bodyLine =
      bodyValue.length > 0
        ? bodyValue
        : lang === "ro"
        ? "Există două moduri prin care poți continua."
        : "There are two ways you can continue.";
    const lines = [introLine, bodyLine];
    const trimmedEntry = journalEntry?.trim();
    if (trimmedEntry && trimmedEntry.length > 0) {
      lines.push(
        lang === "ro"
          ? `Ai menționat că te preocupă: „${trimmedEntry}”.`
          : `You shared that you're working through: “${trimmedEntry}.”`,
      );
    }
    return lines;
  }, [intentCategories, categoryLabels, journalEntry, lang, t]);

  const navigateToStep = useCallback(
    (nextStep: Step) => {
      goToStep(nextStep);
      if (nextStep === "intro") {
        setMenuOpen(false);
      }
      resetError();
    },
    [goToStep, resetError],
  );

  const navLinks = useNavigationLinks();
  const getLabel = (key: string) => getTranslationString(t, key, key);

  const handleIntentComplete = useCallback(
    (result: IntentCloudResult) => {
      recordIntentSelection(result);
      navigateToStep("reflectionSummary");
    },
    [recordIntentSelection, navigateToStep],
  );

  const handleIntentSummaryComplete = useCallback(
    async (urgency: number) => {
      setIntentUrgency(urgency);
      const scores = computeDimensionScores(intentCategories, urgency);
      setDimensionScores(scores);
      const recommendation = recommendSession({
        urgency,
        primaryCategory: intentCategories[0]?.category,
        dimensionScores: scores,
        hasProfile: Boolean(profile),
      });
      setRecommendedPath(recommendation.recommendedPath);
      setRecommendationReasonKey(recommendation.reasonKey);
      const success = await persistIntentSnapshot(urgency, {
        dimensionScores: scores,
        algoVersion: 1,
        recommendation: recommendation.recommendedPath,
        recommendationReasonKey: recommendation.reasonKey,
      });
      if (!success) {
        console.warn("intent snapshot could not be persisted; staying on summary");
        return;
      }
      navigateToStep("cards");
    },
    [
      intentCategories,
      navigateToStep,
      persistIntentSnapshot,
      profile,
      setIntentUrgency,
    ],
  );

  const handleCardSelect = useCallback(
    async (type: "individual" | "group") => {
      const success = await persistJourneyChoice(type, {
        recommendedPath,
        recommendationReasonKey,
        algoVersion: 1,
        dimensionScores,
      });
      if (!success) {
        console.warn("journey choice could not be persisted; staying on recommendation");
        return;
      }
      navigateToStep("details");
    },
    [dimensionScores, navigateToStep, persistJourneyChoice, recommendationReasonKey, recommendedPath],
  );

  const openAccountModal = () => {
    setAccountModalKey((key) => key + 1);
    setAccountModalOpen(true);
  };

  const handleAccountDismiss = () => {
    setAccountModalOpen(false);
    dismissAccountPrompt();
  };

  // Auto-open account modal when the funnel requires authentication
  useEffect(() => {
    if (showAccountPrompt && !accountModalOpen) {
      openAccountModal();
    }
  }, [accountModalOpen, showAccountPrompt]);

  const savingGenericLabel = lang === "ro" ? "Se salvează..." : "Saving...";
  const savingChoiceLabel = getTranslationString(
    t,
    "cardsSavingChoiceLabel",
    lang === "ro" ? "Se salvează alegerea..." : "Saving your choice...",
  );
  const accountPromptMessage = getTranslationString(
    t,
    "accountPromptMessage",
    "Salvează-ți progresul și vezi istoricul evaluărilor.",
  );
  const accountPromptButton = getTranslationString(t, "accountPromptButton", "Creează cont");
  const intentSelectionTotal = useMemo(
    () => intentCategories.reduce((sum, entry) => sum + entry.count, 0),
    [intentCategories],
  );

  const stepContent = (() => {
    switch (step) {
      case "preIntro":
        return <PreIntroStep onDone={() => navigateToStep("intro")} />;
      case "intro":
        return <IntroStep onDone={() => navigateToStep("firstInput")} />;
      case "firstInput":
        return (
          <>
            <div className="mx-auto mb-3 max-w-4xl text-right">
              <button
                type="button"
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82] underline underline-offset-2 hover:text-[#E60012]"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const confirmed = window.confirm(
                      lang === "ro"
                        ? "Vrei să o iei de la capăt?"
                        : "Do you want to start over?",
                    );
                    if (!confirmed) {
                      void recordWizardResetCanceled();
                      return;
                    }
                  }
                  try {
                    clearWizardState();
                  } catch {}
                  void recordWizardReset();
                  if (typeof window !== "undefined") {
                    const params = new URLSearchParams(searchParams?.toString() ?? "");
                    params.set("step", "preIntro");
                    params.set("reset", "1");
                    const qs = params.toString();
                    window.location.assign(qs ? `/?${qs}` : "/");
                  }
                }}
              >
                {lang === "ro" ? "Resetează parcursul" : "Reset journey"}
              </button>
            </div>
            <FirstInputStep
              onSubmit={submitFirstInput}
              onNext={() => navigateToStep("reflectionPrompt")}
              errorMessage={saveError}
              lang={lang}
              onAuthRequest={openAccountModal}
            />
          </>
        );
      case "reflectionPrompt":
        return (
          <ReflectionPromptStep
            lines={reflectionOneLines}
            onContinue={() => navigateToStep("intent")}
          />
        );
      case "intent":
        return (
          <IntentStep
            minSelection={MIN_INTENT_SELECTIONS}
            maxSelection={MAX_INTENT_SELECTIONS}
            onComplete={handleIntentComplete}
            words={adaptiveCloudWords}
            cloudKey={adaptiveCloudKey}
          />
        );
      case "reflectionSummary":
        return (
          <WizardReflection
            lines={reflectionSummaryLines}
            onContinue={() => navigateToStep("intentSummary")}
            categories={intentCategories}
            maxSelection={intentSelectionTotal}
            categoryLabels={categoryLabels}
          />
        );
      case "intentSummary":
        return (
          <IntentSummaryStep
            onContinue={() => {
              void handleIntentSummaryComplete(intentUrgency);
            }}
            isSaving={isSavingIntentSnapshot}
            errorMessage={saveError}
            savingLabel={savingGenericLabel}
            urgency={intentUrgency}
            onUrgencyChange={setIntentUrgency}
            resolutionSpeed={resolutionSpeed}
            onResolutionSpeedChange={setResolutionSpeed}
            determination={determination}
            onDeterminationChange={setDetermination}
            timeCommitmentHours={timeCommitmentHours}
            onTimeCommitmentChange={setTimeCommitmentHours}
            budgetPreference={budgetPreference}
            onBudgetPreferenceChange={setBudgetPreference}
            goalType={goalType}
            onGoalTypeChange={setGoalType}
            emotionalState={emotionalState}
            onEmotionalStateChange={setEmotionalState}
            groupComfort={groupComfort}
            onGroupComfortChange={setGroupComfort}
            learnFromOthers={learnFromOthers}
            onLearnFromOthersChange={setLearnFromOthers}
            scheduleFit={scheduleFit}
            onScheduleFitChange={setScheduleFit}
            onAuthRequest={openAccountModal}
          />
        );
      case "cards":
        return (
          <RecommendationStep
            categories={intentCategories}
            intentUrgency={intentUrgency}
            recommendedPath={recommendedPath}
            recommendedBadgeLabel={recommendedBadgeLabel}
            onCardSelect={handleCardSelect}
            accountPromptMessage={accountPromptMessage}
            accountPromptButton={accountPromptButton}
            cardLabels={{
              individual: getLabel("individual"),
              group: getLabel("group"),
            }}
            isSavingChoice={isSavingJourney}
            savingChoiceType={journeySavingChoice}
            errorMessage={saveError}
            savingLabel={savingChoiceLabel}
            profile={profile}
            showAccountPrompt={showAccountPrompt}
            onAccountRequest={openAccountModal}
            categoryLabels={categoryLabels}
            resolutionSpeed={resolutionSpeed}
            determination={determination}
            timeCommitmentHours={timeCommitmentHours}
            budgetPreference={budgetPreference}
            goalType={goalType}
            emotionalState={emotionalState}
            groupComfort={groupComfort}
            learnFromOthers={learnFromOthers}
            scheduleFit={scheduleFit}
            formatPreference={formatPreference}
            recommendationReasonKey={recommendationReasonKey}
            initialStatement={journalEntry}
          />
        );
      case "details":
        return selectedCard ? (
          <DetailsStep
            selectedCard={selectedCard}
            onReturnToOrigin={returnTo ? handleReturnToOrigin : undefined}
            returnLabel={lang === "ro" ? "Înapoi la progres" : "Back to progress"}
          />
        ) : null;
      default:
        return null;
    }
  })();

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader
        showMenu
        onMenuToggle={() => setMenuOpen(true)}
        onAuthRequest={openAccountModal}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      {accountModalOpen ? (
        <AccountModal
          key={accountModalKey}
          open={accountModalOpen}
          onClose={handleAccountDismiss}
        />
      ) : null}

      <main className="px-4 py-8 sm:px-6">
        {searchParams?.get("reset") === "1" ? (
          <Toast
            message={getTranslationString(t, "toastResetMessage", lang === "ro" ? "Parcursul a fost resetat." : "Your journey was reset.")}
            okLabel={getTranslationString(t, "toastOk", "OK")}
            onClose={() => {
              void recordWizardResetNoticeDismissed();
              const params = new URLSearchParams(searchParams?.toString() ?? "");
              params.delete("reset");
              const qs = params.toString();
              router.replace(qs ? `/?${qs}` : "/", { scroll: false });
            }}
          />
        ) : null}
        {!["preIntro", "intro"].includes(step) && (
          <WizardProgress
            currentStep={step}
            lang={lang === "en" ? "en" : "ro"}
            onReset={() => {
              if (typeof window !== "undefined") {
                const confirmed = window.confirm(
                  lang === "ro"
                    ? "Sigur vrei să resetezi parcursul?"
                    : "Are you sure you want to reset your journey?",
                );
                if (!confirmed) {
                  void recordWizardResetCanceled();
                  return;
                }
              }
              try {
                clearWizardState();
              } catch {}
              void recordWizardReset();
              if (typeof window !== "undefined") {
                const params = new URLSearchParams(searchParams?.toString() ?? "");
                params.set("step", "preIntro");
                params.set("reset", "1");
                const qs = params.toString();
                window.location.assign(qs ? `/?${qs}` : "/");
              }
            }}
          />
        )}
        <div>{stepContent}</div>
      </main>
    </div>
  );
}

export default function PageWrapper() {
  return (
    <I18nProvider>
      <Suspense fallback={null}>
        <PageContent />
      </Suspense>
    </I18nProvider>
  );
}

type PreIntroStepProps = {
  onDone: () => void;
};

function PreIntroStep({ onDone }: PreIntroStepProps) {
  return <IntroAnimation onComplete={onDone} />;
}

type IntroStepProps = {
  onDone: () => void;
};

function IntroStep({ onDone }: IntroStepProps) {
  return <JourneyIntro onStart={onDone} />;
}

type FirstInputStepProps = {
  onSubmit: (
    text: string,
    meta?: { expressionId?: string; category?: IntentPrimaryCategory },
  ) => Promise<void | boolean> | void | boolean;
  onNext: () => void;
  errorMessage: string | null;
  lang: string;
  onAuthRequest: () => void;
};

function FirstInputStep({ onSubmit, onNext, errorMessage, lang, onAuthRequest }: FirstInputStepProps) {
  return (
    <FirstScreen
      key={`first-screen-${lang}`}
      onSubmit={onSubmit}
      onNext={onNext}
      errorMessage={errorMessage}
      onAuthRequest={onAuthRequest}
    />
  );
}

type ReflectionPromptStepProps = {
  lines: string[];
  onContinue: () => void;
};

function ReflectionPromptStep({ lines, onContinue }: ReflectionPromptStepProps) {
  return <WizardReflection lines={lines} onContinue={onContinue} />;
}

type IntentStepProps = {
  minSelection: number;
  maxSelection: number;
  onComplete: (result: IntentCloudResult) => void;
  words?: IntentCloudWord[];
  cloudKey?: string;
};

function IntentStep({ minSelection, maxSelection, onComplete, words, cloudKey }: IntentStepProps) {
  return (
    <IntentCloud
      key={cloudKey}
      minSelection={minSelection}
      maxSelection={maxSelection}
      onComplete={onComplete}
      words={words}
    />
  );
}

type IntentSummaryStepProps = {
  onContinue: () => void;
  isSaving: boolean;
  errorMessage: string | null;
  savingLabel: string;
  urgency: number;
  onUrgencyChange: (value: number) => void;
  resolutionSpeed: ResolutionSpeed;
  onResolutionSpeedChange: (value: ResolutionSpeed) => void;
  determination: number;
  onDeterminationChange: (value: number) => void;
  timeCommitmentHours: number;
  onTimeCommitmentChange: (value: number) => void;
  budgetPreference: BudgetPreference;
  onBudgetPreferenceChange: (value: BudgetPreference) => void;
  goalType: GoalType;
  onGoalTypeChange: (value: GoalType) => void;
  emotionalState: EmotionalState;
  onEmotionalStateChange: (value: EmotionalState) => void;
  groupComfort: number;
  onGroupComfortChange: (value: number) => void;
  learnFromOthers: number;
  onLearnFromOthersChange: (value: number) => void;
  scheduleFit: number;
  onScheduleFitChange: (value: number) => void;
};

function IntentSummaryStep({
  onContinue,
  isSaving,
  errorMessage,
  savingLabel,
  urgency,
  onUrgencyChange,
  resolutionSpeed,
  onResolutionSpeedChange,
  determination,
  onDeterminationChange,
  timeCommitmentHours,
  onTimeCommitmentChange,
  budgetPreference,
  onBudgetPreferenceChange,
  goalType,
  onGoalTypeChange,
  emotionalState,
  onEmotionalStateChange,
  groupComfort,
  onGroupComfortChange,
  learnFromOthers,
  onLearnFromOthersChange,
  scheduleFit,
  onScheduleFitChange,
}: IntentSummaryStepProps) {
  return (
    <IntentSummary
      urgency={urgency}
      onUrgencyChange={onUrgencyChange}
      onContinue={onContinue}
      isSaving={isSaving}
      errorMessage={errorMessage}
      savingLabel={savingLabel}
      resolutionSpeed={resolutionSpeed}
      onResolutionSpeedChange={onResolutionSpeedChange}
      determination={determination}
      onDeterminationChange={onDeterminationChange}
      timeCommitmentHours={timeCommitmentHours}
      onTimeCommitmentChange={onTimeCommitmentChange}
      budgetPreference={budgetPreference}
      onBudgetPreferenceChange={onBudgetPreferenceChange}
      goalType={goalType}
      onGoalTypeChange={onGoalTypeChange}
      emotionalState={emotionalState}
      onEmotionalStateChange={onEmotionalStateChange}
      groupComfort={groupComfort}
      onGroupComfortChange={onGroupComfortChange}
      learnFromOthers={learnFromOthers}
      onLearnFromOthersChange={onLearnFromOthersChange}
      scheduleFit={scheduleFit}
      onScheduleFitChange={onScheduleFitChange}
    />
  );
}

type DetailsStepProps = {
  selectedCard: "individual" | "group";
  onReturnToOrigin?: () => void;
  returnLabel?: string;
};

function DetailsStep({ selectedCard, onReturnToOrigin, returnLabel }: DetailsStepProps) {
  return (
    <section className="px-4 pb-16 pt-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10" id="sessions">
        <SessionDetails type={selectedCard} />
        <SocialProof />
        {onReturnToOrigin ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onReturnToOrigin}
              className="rounded-[12px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
            >
              {returnLabel ?? "Înapoi"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
