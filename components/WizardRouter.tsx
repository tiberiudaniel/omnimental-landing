"use client";

import JourneyIntro from "./JourneyIntro";
import FirstScreen from "./FirstScreen";
import WizardReflection from "./WizardReflection";
import IntentCloud, { type IntentCloudResult } from "./IntentCloud";
import IntentSummary from "./IntentSummary";
import RecommendationStep from "./RecommendationStep";
import SessionDetails from "./SessionDetails";
import type { IntentPrimaryCategory } from "@/lib/intentExpressions";
import type { ResolutionSpeed, BudgetPreference, GoalType, EmotionalState, FormatPreference } from "@/lib/evaluation";

export type Step =
  | "preIntro"
  | "intro"
  | "firstInput"
  | "reflectionPrompt"
  | "intent"
  | "intentSummary"
  | "reflectionSummary"
  | "cards"
  | "details";

export type IntentCategoryCount = { category: string; count: number };

type Props = {
  step: Step;
  lang: string;
  navigateToStep: (s: Step) => void;

  // First input
  onFirstInputSubmit: (text: string, meta?: { expressionId?: string; category?: IntentPrimaryCategory }) => Promise<void | boolean> | void | boolean;
  onAuthRequest: () => void;
  firstInputError: string | null;

  // Reflection prompt/summary
  reflectionPromptLines: string[];
  reflectionSummaryLines: string[];
  intentCategories: IntentCategoryCount[];
  intentSelectionTotal: number;
  categoryLabels: Record<string, string>;

  // Intent cloud
  minSelection: number;
  maxSelection: number;
  words?: Array<{ id: string; label: string; category: string; weight?: number }>;
  cloudKey?: string;
  onIntentComplete: (result: IntentCloudResult) => void;

  // Intent summary
  isSavingIntent: boolean;
  saveError: string | null;
  savingLabel: string;
  urgency: number;
  setUrgency: (n: number) => void;
  resolutionSpeed: ResolutionSpeed;
  setResolutionSpeed: (v: ResolutionSpeed) => void;
  determination: number;
  setDetermination: (n: number) => void;
  timeCommitmentHours: number;
  setTimeCommitmentHours: (n: number) => void;
  budgetPreference: BudgetPreference;
  setBudgetPreference: (v: BudgetPreference) => void;
  goalType: GoalType;
  setGoalType: (v: GoalType) => void;
  emotionalState: EmotionalState;
  setEmotionalState: (v: EmotionalState) => void;
  groupComfort: number;
  setGroupComfort: (n: number) => void;
  learnFromOthers: number;
  setLearnFromOthers: (n: number) => void;
  scheduleFit: number;
  setScheduleFit: (n: number) => void;
  onIntentSummaryContinue: () => void;

  // Recommendation cards
  profile: { id: string } | null;
  showAccountPrompt: boolean;
  onAccountRequestCards: () => void;
  recommendedPath: "individual" | "group";
  recommendedBadgeLabel?: string;
  onCardSelect: (type: "individual" | "group") => Promise<void | boolean> | void | boolean;
  isSavingChoice: boolean;
  savingChoiceType: "individual" | "group" | null;
  cardsSavingLabel: string;
  recommendationReasonKey: string;
  journalEntry: string;
  // preferences used in recommendation summary
  formatPreference: FormatPreference;

  // Details step
  selectedCard: "individual" | "group" | null;
  onReturnToOrigin?: () => void;
  returnLabel?: string;
};

export default function WizardRouter(props: Props) {
  const {
    step,
    lang,
    navigateToStep,
    onFirstInputSubmit,
    onAuthRequest,
    firstInputError,
    reflectionPromptLines,
    reflectionSummaryLines,
    intentCategories,
    intentSelectionTotal,
    categoryLabels,
    minSelection,
    maxSelection,
    words,
    cloudKey,
    onIntentComplete,
    isSavingIntent,
    saveError,
    savingLabel,
    urgency,
    setUrgency,
    resolutionSpeed,
    setResolutionSpeed,
    determination,
    setDetermination,
    timeCommitmentHours,
    setTimeCommitmentHours,
    budgetPreference,
    setBudgetPreference,
    goalType,
    setGoalType,
    emotionalState,
    setEmotionalState,
    groupComfort,
    setGroupComfort,
    learnFromOthers,
    setLearnFromOthers,
    scheduleFit,
    setScheduleFit,
    onIntentSummaryContinue,
    profile,
    showAccountPrompt,
    onAccountRequestCards,
    recommendedPath,
    recommendedBadgeLabel,
    onCardSelect,
    isSavingChoice,
    savingChoiceType,
    cardsSavingLabel,
    recommendationReasonKey,
    journalEntry,
    formatPreference,
    selectedCard,
    onReturnToOrigin,
    returnLabel,
  } = props;

  switch (step) {
    case "preIntro":
      return <IntroAnimation onComplete={() => navigateToStep("intro")} />;
    case "intro":
      return <JourneyIntro onStart={() => navigateToStep("firstInput")} />;
    case "firstInput":
      return (
        <FirstScreen
          key={`first-screen-${lang}`}
          onSubmit={onFirstInputSubmit}
          onNext={() => navigateToStep("reflectionPrompt")}
          errorMessage={firstInputError}
          onAuthRequest={onAuthRequest}
        />
      );
    case "reflectionPrompt":
      return <WizardReflection lines={reflectionPromptLines} onContinue={() => navigateToStep("intent")} />;
    case "intent":
      return (
        <IntentCloud
          key={cloudKey}
          minSelection={minSelection}
          maxSelection={maxSelection}
          onComplete={onIntentComplete}
          words={words}
        />
      );
    case "reflectionSummary":
      return (
        <WizardReflection
          lines={reflectionSummaryLines}
          onContinue={() => navigateToStep("intentSummary")}>
          {/* Additional summary info can be passed via props if needed */}
        </WizardReflection>
      );
    case "intentSummary":
      return (
        <IntentSummary
          urgency={urgency}
          onUrgencyChange={setUrgency}
          onContinue={onIntentSummaryContinue}
          isSaving={isSavingIntent}
          errorMessage={saveError}
          savingLabel={savingLabel}
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
          onAuthRequest={onAuthRequest}
        />
      );
    case "cards":
      return (
        <RecommendationStep
          categories={intentCategories}
          intentUrgency={urgency}
          recommendedPath={recommendedPath}
          onCardSelect={onCardSelect}
          cardLabels={{ individual: "", group: "" }}
          isSavingChoice={isSavingChoice}
          savingChoiceType={savingChoiceType}
          errorMessage={saveError}
          savingLabel={cardsSavingLabel}
          profile={profile}
          showAccountPrompt={showAccountPrompt}
          onAccountRequest={onAccountRequestCards}
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
          recommendedBadgeLabel={recommendedBadgeLabel}
        />
      );
    case "details":
      return selectedCard ? (
        <section className="px-4 pb-16 pt-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-10" id="sessions">
            <SessionDetails type={selectedCard} />
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
      ) : null;
    default:
      return null;
  }
}

function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  // simple passthrough to existing IntroAnimation component if needed
  // Imported at top-level as JourneyIntro covers intro content, preIntro uses this placeholder
  return <JourneyIntro onStart={onComplete} />;
}

