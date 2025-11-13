"use client";

import JourneyIntro from "./JourneyIntro";
import Link from "next/link";
import FirstScreen from "./FirstScreen";
import WizardReflection from "./WizardReflection";
import { useProfile } from "./ProfileProvider";
import IntentCloud, { type IntentCloudResult } from "./IntentCloud";
import IntentSummary from "./IntentSummary";
import RecommendationStep from "./RecommendationStep";
import { useTStrings } from "./useTStrings";
import { recordEvaluationTabChange } from "@/lib/progressFacts";
import SessionDetails from "./SessionDetails";
import type { IntentPrimaryCategory, IntentCloudWord } from "@/lib/intentExpressions";
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
  words?: IntentCloudWord[];
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
  onCardSelect: (type: "individual" | "group") => void | Promise<void>;
  isSavingChoice: boolean;
  savingChoiceType: "individual" | "group" | null;
  cardsSavingLabel: string;
  recommendationReasonKey: string;
  journalEntry: string;
  // preferences used in recommendation summary
  formatPreference: FormatPreference;
  // unified recommendation extras
  dimensionScores: { calm: number; focus: number; energy: number; relationships: number; performance: number; health: number };
  algoVersion?: number;

  // Details step
  selectedCard: "individual" | "group" | null;
  onReturnToOrigin?: () => void;
  returnLabel?: string;
};

export default function WizardRouter(props: Props) {
  const { s } = useTStrings();
  // Use hooks at the top to respect the Rules of Hooks
  const profileCtx = useProfile();
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
    // intentSelectionTotal not used in this router; kept in parent
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
    dimensionScores,
    algoVersion,
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
          onComplete={(result) => {
            onIntentComplete(result);
            navigateToStep("reflectionSummary");
          }}
          words={words}
        />
      );
    case "reflectionSummary": {
      const canJournal = Boolean(
        profileCtx?.profile?.id &&
          (profileCtx.profile.selection === "individual" || profileCtx.profile.selection === "group"),
      );
      return (
        <div className="relative">
          <WizardReflection
            lines={reflectionSummaryLines}
            onContinue={() => navigateToStep("intentSummary")}
            categories={intentCategories}
            maxSelection={maxSelection}
            categoryLabels={categoryLabels}
          />
          {/* Mobile FAB: Journal only if selection allows; else prompts account/choice */}
          <div className="pointer-events-none fixed bottom-4 right-4 z-40 block sm:hidden">
            <button
              type="button"
              onClick={() => {
                if (canJournal) {
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.origin + "/progress");
                    url.searchParams.set("open", "journal");
                    window.location.assign(url.pathname + url.search);
                  }
                } else {
                  onAccountRequestCards();
                }
              }}
              className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#2C2C2C] bg-white text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] shadow-md"
              aria-label="Journal"
            >
              J
            </button>
          </div>
        </div>
      );
    }
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
    case "cards": {
      const recommendation = {
        path: recommendedPath,
        reasonKey: recommendationReasonKey,
        badgeLabel: recommendedBadgeLabel,
        // formatPreference mapping not available; leave undefined for now
        dimensionScores,
        algoVersion: String(algoVersion ?? 1),
      } as const;
      return (
        <RecommendationStep
          categories={intentCategories}
          intentUrgency={urgency}
          recommendedPath={recommendedPath}
          onCardSelect={onCardSelect}
          cardLabels={{ individual: s("cardIndividualLabel", "Individual"), group: s("cardGroupLabel", "Group") }}
          accountPromptMessage={s("accountPromptMessage", "Salvează-ți progresul și vezi istoricul evaluărilor.")}
          accountPromptButton={s("accountPromptButton", "Creează cont")}
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
          recommendation={recommendation}
        />
      );
    }
    case "details":
      return selectedCard ? (
        <section className="px-4 pb-16 pt-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-8" id="sessions">
            <SessionDetails type={selectedCard} />

            {/* Clear next-step CTAs to continue the journey */}
            <div className="rounded-[14px] border border-[#F0E6DA] bg-[#FFFBF7] px-6 py-5 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#C07963]">
                {s("wizardNextStepEyebrow", "Pasul următor")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={{ pathname: "/antrenament", query: { tab: "os", source: "wizard" } }}
                  onClick={() => {
                    void recordEvaluationTabChange("os");
                  }}
                  className="inline-flex items-center justify-center rounded-[12px] border border-[#2C2C2C] bg-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:opacity-90"
                >
                  {s("wizardCtaGoTraining", "Fă un antrenament complet")}
                </Link>
                <Link
                  href="/progress"
                  className="inline-flex items-center justify-center rounded-[12px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                >
                  {s("wizardCtaGoDashboard", "Vezi tabloul tău de bord")}
                </Link>
              </div>
            </div>

            {onReturnToOrigin ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onReturnToOrigin}
                  className="rounded-[12px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                >
                  {returnLabel ?? s("wizardBack", "Înapoi")}
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
