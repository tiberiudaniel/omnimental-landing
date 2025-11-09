"use client";

import React, { useCallback, useMemo, useState } from "react";
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
import { useWizardData, type IntentCategoryCount } from "../components/useWizardData";
import type {
  GoalType,
  EmotionalState,
  FormatPreference,
  ResolutionSpeed,
  BudgetPreference,
} from "../lib/evaluation";
import { computeDimensionScores } from "../lib/scoring";
import type { DimensionScores } from "../lib/scoring";
import { recommendSession, type SessionType } from "../lib/recommendation";

const REQUIRED_SELECTIONS = 7;

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

  const {
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
  setFormatPreference,
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

  const chooseOptionText = getTranslationString(t, "chooseOption");
  const cardsHeadline = getTranslationString(t, "cardsHeadline", chooseOptionText);
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
    return [introLine, bodyLine];
  }, [intentCategories, categoryLabels, lang, t]);

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
      navigateToStep("intentSummary");
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
        console.warn("intent snapshot persisted locally only");
      }
      navigateToStep("reflectionSummary");
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
        console.warn("journey choice stored locally only");
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

  const recommendationCopyKey =
    recommendedPath === "individual"
      ? "cardsRecommendationIndividual"
      : "cardsRecommendationGroup";
  const recommendationText = getTranslationString(t, recommendationCopyKey);
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

  const stepContent = (() => {
    switch (step) {
      case "preIntro":
        return <PreIntroStep onDone={() => navigateToStep("intro")} />;
      case "intro":
        return <IntroStep onDone={() => navigateToStep("firstInput")} />;
      case "firstInput":
        return (
          <FirstInputStep
            onSubmit={submitFirstInput}
            onNext={() => navigateToStep("reflectionPrompt")}
            errorMessage={saveError}
            lang={lang}
          />
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
            minSelection={REQUIRED_SELECTIONS}
            maxSelection={REQUIRED_SELECTIONS}
            onComplete={handleIntentComplete}
          />
        );
      case "intentSummary":
        return (
          <IntentSummaryStep
            categories={intentCategories}
            maxSelection={REQUIRED_SELECTIONS}
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
            formatPreference={formatPreference}
            onFormatPreferenceChange={setFormatPreference}
          />
        );
      case "reflectionSummary":
        return (
          <WizardReflection lines={reflectionSummaryLines} onContinue={() => navigateToStep("cards")} />
        );
      case "cards":
        return (
          <RecommendationStep
            categories={intentCategories}
            intentUrgency={intentUrgency}
            recommendationText={recommendationText}
            cardsHeadline={cardsHeadline}
            chooseOptionText={chooseOptionText}
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
            dimensionScores={dimensionScores}
            recommendationReasonKey={recommendationReasonKey}
          />
        );
      case "details":
        return selectedCard ? <DetailsStep selectedCard={selectedCard} /> : null;
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

      <main>{stepContent}</main>
    </div>
  );
}

export default function PageWrapper() {
  return (
    <I18nProvider>
      <PageContent />
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
  onSubmit: (text: string) => Promise<void> | void;
  onNext: () => void;
  errorMessage: string | null;
  lang: string;
};

function FirstInputStep({ onSubmit, onNext, errorMessage, lang }: FirstInputStepProps) {
  return (
    <FirstScreen
      key={`first-screen-${lang}`}
      onSubmit={onSubmit}
      onNext={onNext}
      errorMessage={errorMessage}
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
};

function IntentStep({ minSelection, maxSelection, onComplete }: IntentStepProps) {
  return (
    <IntentCloud minSelection={minSelection} maxSelection={maxSelection} onComplete={onComplete} />
  );
}

type IntentSummaryStepProps = {
  categories: IntentCategoryCount[];
  maxSelection: number;
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
  formatPreference: FormatPreference;
  onFormatPreferenceChange: (value: FormatPreference) => void;
};

function IntentSummaryStep({
  categories,
  maxSelection,
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
  formatPreference,
  onFormatPreferenceChange,
}: IntentSummaryStepProps) {
  return (
    <IntentSummary
      categories={categories}
      maxSelection={maxSelection}
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
      formatPreference={formatPreference}
      onFormatPreferenceChange={onFormatPreferenceChange}
    />
  );
}

type DetailsStepProps = {
  selectedCard: "individual" | "group";
};

function DetailsStep({ selectedCard }: DetailsStepProps) {
  return (
    <section className="px-4 pb-16 pt-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10" id="sessions">
        <SessionDetails type={selectedCard} />
        <SocialProof />
      </div>
    </section>
  );
}
