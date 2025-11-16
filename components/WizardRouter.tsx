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
import { useState } from "react";
import MultiTypewriter from "./MultiTypewriter";

export type Step =
  | "preIntro"
  | "intro"
  | "firstInput"
  | "reflectionPrompt"
  | "intent"
  | "intentMotivation" // canonical name
  | "intentSummary" // legacy alias supported
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reflectionPromptLines: _reflectionPromptLines,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reflectionSummaryLines: _reflectionSummaryLines,
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

  // Local guide sequencing for the Intent step (second instruction waits the first sequence)
  const [intentIntroDone, setIntentIntroDone] = useState(false);
  const [intentInstructionDone, setIntentInstructionDone] = useState(false);

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
    case "reflectionPrompt": {
      const v = s('wizard.reflectionPrompt');
      const lines = Array.isArray(v)
        ? (v as string[])
        : (lang === 'en'
            ? [
                'What you wrote is not just a complaint — it’s a candid photo of your mind today.',
                'Behind those words are stress patterns, pressure, and how you treat yourself.',
                'We don’t judge; we use these signals to build something genuinely useful for you.',
              ]
            : [
                'Ce ai scris nu e doar o plângere, e o fotografie sinceră a minții tale, azi.',
                'În spatele acelor cuvinte sunt tipare de stres, presiune și felul în care te tratezi pe tine.',
                'Aici nu te judecăm; folosim aceste semnale ca să construim ceva cu adevărat util pentru tine.',
              ]);
      return (
        <WizardReflection
          lines={lines}
          onContinue={() => navigateToStep("intent")}
          cardTestId="wizard-step-reflection-card"
          compact
        />
      );
    }
    case "intent": {
      const linesRaw = s('wizard.intent');
      const lines = Array.isArray(linesRaw)
        ? (linesRaw as string[])
        : (lang === 'en'
            ? [
                'Your mind isn’t only in the brain: your heart and gut also send signals when making decisions.',
                'When these three “minds” are misaligned, blocks, hesitation and stress spikes appear.',
                'OmniMental blends education, biohacking (sleep, energy, habits) and biofeedback — and it all starts from the intention you choose now.',
              ]
            : [
                'Mintea ta nu stă doar în creier: și inima, și intestinul trimit semnale când iei decizii importante.',
                'Când aceste trei ‘minți’ nu sunt aliniate, apar blocajele, ezitările și exploziile de stres.',
                'OmniMental folosește educație, biohacking (somn, energie, obiceiuri) și biofeedback, iar totul pornește de la intenția pe care o alegi acum.',
              ]);
      const instruction = ((): string => {
        const v = s('wizard.intentInstruction');
        if (typeof v === 'string') return v as string;
        return lang === 'en'
          ? 'Choose 7 statements that best describe what you experience now.'
          : 'Alege 7 afirmații care descriu cel mai bine ce trăiești acum.';
      })();
      return (
        <div className="flex min-h-[calc(100vh-96px)] w-full flex-col items-center bg-[#FDFCF9] px-6 py-8">
          <div className="w-full max-w-5xl rounded-[12px] border border-[#E4D8CE] bg-white/92 px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            {/* Multi-line typewriter scaffold */}
            <div className="mb-4">
              <MultiTypewriter lines={lines} speed={60} onDone={() => setIntentIntroDone(true)} />
            </div>
            {intentIntroDone ? (
              <div className="mb-4">
                <MultiTypewriter lines={[instruction]} speed={60} gapMs={750} onDone={() => setIntentInstructionDone(true)} />
              </div>
            ) : null}
            {intentInstructionDone ? (
              <div className="mt-2">
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
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    case "reflectionSummary": {
      const v = s('wizard.reflectionSummary');
      const lines = Array.isArray(v)
        ? (v as string[])
        : (lang === 'en'
            ? [
                'You said what hurts and picked a direction: this is your starting point in OmniMental.',
                'Next, you’ll receive short combinations of explanations, exercises and reflections — not just generic advice.',
                'The goal is to be clearer, more flexible, and harder to knock down than you were today.',
              ]
            : [
                'Ai spus ce te doare și ai ales o direcție: acesta este punctul tău de start în OmniMental.',
                'În continuare vei primi combinații scurte de explicații, exerciții și reflecții, nu doar sfaturi generale.',
                'Scopul este să devii mai clar, mai flexibil și mai greu de doborât decât erai în ziua asta.',
              ]);
      const canJournal = Boolean(
        profileCtx?.profile?.id &&
          (profileCtx.profile.selection === "individual" || profileCtx.profile.selection === "group"),
      );
      return (
        <div className="relative" data-testid="wizard-step-reflection">
          <WizardReflection
            lines={lines}
            onContinue={() => navigateToStep("intentMotivation")}
            categories={intentCategories}
            maxSelection={maxSelection}
            categoryLabels={categoryLabels}
            testId="wizard-step-reflection-card"
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
    case "intentMotivation":
    case "intentSummary": {
      const sorted = [...intentCategories].filter(c => c.count > 0).sort((a,b) => b.count - a.count);
      const primary = sorted[0];
      const primaryAreaLabel = primary ? (categoryLabels[primary.category] ?? primary.category) : '';
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
          primaryAreaLabel={primaryAreaLabel}
        />
      );
    }
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
          accountPromptMessage={s("accountPromptMessage", lang === 'ro' ? "Salvează-ți progresul și vezi istoricul evaluărilor." : "Save your progress and see your evaluation history.")}
          accountPromptButton={s("accountPromptButton", lang === 'ro' ? "Creează cont" : "Create account")}
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
                {s("wizardNextStepEyebrow", lang === 'ro' ? "Pasul următor" : "Next step")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={{ pathname: "/antrenament", query: { tab: "os", source: "wizard" } }}
                  onClick={() => {
                    void recordEvaluationTabChange("os");
                  }}
                  className="inline-flex items-center justify-center rounded-[12px] border border-[#2C2C2C] bg-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:opacity-90"
                >
                  {s("wizardCtaGoTraining", lang === 'ro' ? "Fă un antrenament complet" : "Start a full training")}
                </Link>
                <Link
                  href="/progress"
                  className="inline-flex items-center justify-center rounded-[12px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                >
                  {s("wizardCtaGoDashboard", lang === 'ro' ? "Vezi tabloul tău de bord" : "Go to your dashboard")}
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
                  {returnLabel ?? s("wizardBack", lang === 'ro' ? "Înapoi" : "Back")}
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
