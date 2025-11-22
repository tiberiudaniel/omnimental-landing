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
import type { DimensionScores } from "@/lib/scoring";
import MultiTypewriter from "./MultiTypewriter";
import TypewriterText from "./TypewriterText";
import { motion } from "framer-motion";
import { recordFamiliarityMentalCoaching } from "@/lib/progressFacts";
import StepNeedMain from "./wizard/StepNeedMain";
import StepNeedConfidence from "./wizard/StepNeedConfidence";
import type { NeedOptionId } from "@/config/needSurveyConfig";
import { getWizardStepTestId, type WizardStepId } from "./useWizardSteps";

export type IntentCategoryCount = { category: string; count: number };

type Props = {
  step: WizardStepId;
  lang: string;
  navigateToStep: (s: WizardStepId) => void;

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
  dimensionScores: DimensionScores;
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
          cardTestId={`${getWizardStepTestId("reflectionPrompt")}-card`}
          compact
        />
      );
    }
    case "intent": {
      const intentTestId = getWizardStepTestId("intent");
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
      // Instruction removed — we run only the scaffold lines
      return (
        <section data-testid={intentTestId} className="flex min-h-[calc(100vh-96px)] w-full flex-col items-center bg-[#FDFCF9] px-6 py-8">
          <div className="w-full max-w-5xl rounded-[12px] border border-[#E4D8CE] bg-white/92 px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            {/* Single typewriter: use the scaffold lines in the lower position */}
            <div className="mb-4 w-full flex justify-center">
              <div className="max-w-xl text-left w-full">
                <MultiTypewriter lines={lines} speed={60} gapMs={500} />
              </div>
            </div>
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
          </div>
        </section>
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
      const summaryTestId = getWizardStepTestId("reflectionSummary");
      return (
        <div className="relative" data-testid={summaryTestId}>
          <WizardReflection
            lines={lines}
            onContinue={() => navigateToStep("needMain")}
            categories={intentCategories}
            maxSelection={maxSelection}
            categoryLabels={categoryLabels}
            cardTestId={`${summaryTestId}-card`}
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
    case "needMain": {
      return (
        <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
          <StepNeedMain onNext={(sel, other) => {
            const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
            params.set('needSel', sel.join(','));
            if (other) params.set('needOther', other);
            const qs = params.toString();
            if (typeof window !== 'undefined') window.history.replaceState(null, '', qs ? `?${qs}` : '');
            navigateToStep('needConfidence');
          }} />
        </div>
      );
    }
    case "needConfidence": {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const raw = (params.get('needSel') || '').split(',').filter(Boolean);
      const allowed: ReadonlyArray<NeedOptionId> = [
        'need_info','need_plan','need_examples','need_social','need_beliefs','need_benefits','need_motivation','need_consistency','need_other',
      ];
      const sel: NeedOptionId[] = raw.filter((v): v is NeedOptionId => (allowed as readonly string[]).includes(v));
      return (
        <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
          <StepNeedConfidence selectedOptions={sel} onDone={() => {
            try {
              if (typeof window !== 'undefined') {
                const p = new URLSearchParams(window.location.search);
                p.set('sub', '1');
                const qs = p.toString();
                window.history.replaceState(null, '', qs ? `?${qs}` : '');
              }
            } catch {}
            navigateToStep('microLessonInfo');
          }} />
        </div>
      );
    }
    case "intentMotivation": {
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
    case "microLessonInfo": {
      const title = lang === 'ro' ? 'Probabil ai auzit deja,  că mintea se poate antrena ca un mușchi?' : 'Did you know the mind can be trained like a muscle?';
      const body = (
        lang === 'ro'
          ? [
              'Știai că Mental Coaching a apărut la intersecția dintre psihologie sportivă și pregătirea pentru performanță de vârf? Antrenorii mentali au început să lucreze cu sportivi de elită ca să își gestioneze stresul, emoțiile și concentrarea, iar apoi metodele au fost adaptate pentru antreprenori, profesioniști și, mai nou, pentru traderi.',
            ]
          : [
              'Did you know Mental Coaching emerged at the crossroads of sport psychology and elite performance training? Mental coaches first worked with top athletes to manage stress, emotions and focus, then the methods were adapted for entrepreneurs and professionals — and more recently for traders.',
            ]
      );
      const definition = lang === 'ro'
        ? 'Mental Coaching înseamnă un antrenament structurat al atenției, emoțiilor și dialogului interior, astfel încât să poți lua decizii mai lucide, să rămâi stabil în stres și să folosești la maxim resursele tale mentale.'
        : 'Mental Coaching means a structured training of attention, emotions and inner dialogue so you can decide more clearly, stay stable under stress and use your mental resources better.';
      const familiarity = lang === 'ro' ? 'Tu cât de familiar ești cu Mental Coaching?' : 'How familiar are you with Mental Coaching?';
      const btns = (
        lang === 'ro'
          ? ['Știam','Am auzit ceva','Nu știam']
          : ['I knew','Heard about it','Didn’t know']
      );
      return (
        <div className="flex min-h-[calc(100vh-96px)] w-full flex-col items-center bg-[#FDFCF9] px-6 py-8">
        <section className="mx-auto w-full max-w-4xl px-4 md:px-6">
          {/* Eyebrow */}
          <div className="mb-2 text-[11px] uppercase tracking-[0.35em] text-[#C07963]">
            {lang === 'ro' ? 'Mini‑lecție' : 'Micro‑lesson'}
          </div>
          {/* Card consistent with wizard cards */}
          <div className="rounded-[12px] border border-[#E4D8CE] bg-white/92 px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
            <div className="mb-1">
              <div onClick={() => { /* detect skip in parent via bubbling */ }}>
                <TypewriterText
                  text={title}
                  wrapperClassName="mb-0 w-full bg-[#FFFBF7] px-4 py-3 text-center rounded-[10px] border border-[#F0E6DA]"
                  headingClassName="text-xl md:text-2xl"
                />
              </div>
              <p className="mt-1 text-center text-[10px] text-[#8C7C70]">{lang === 'ro' ? 'Apasă pentru a afișa tot textul' : 'Tap to reveal quickly'}</p>
            </div>
            {/* Sub-head: Știai că…? */}
            <div className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
              {lang === 'ro' ? 'Știai că…?' : 'Did you know…?'}
            </div>
            <motion.div
              className="mx-auto max-w-[64ch] space-y-2 text-[15px] md:text-[16px] leading-[1.8] text-[#2C2C2C]"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0, y: 4 },
                show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
              }}
            >
              {body.map((p, i) => (
                <motion.p key={i} variants={{ hidden: { opacity: 0, y: 3 }, show: { opacity: 1, y: 0 } }}>{p}</motion.p>
              ))}
            </motion.div>
            {/* Definition in a soft box */}
            <motion.div
              className="mx-auto mt-4 max-w-[64ch] rounded-[10px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-[14px] md:text-[15px] leading-relaxed text-[#4A3A30] border-l-2 border-l-[#C07963]"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.25 }}
            >
              <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-[#2C2C2C]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="#C07963" strokeWidth="1.2"/>
                  <path d="M12 7.5v.8M11.3 10.8h1.4v5h-1.4z" stroke="#C07963" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {lang === 'ro' ? 'Definiție:' : 'Definition:'}
              </div>
              <div>{definition}</div>
            </motion.div>
            <div className="mt-5">
              <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]">{familiarity}</p>
              <div className="mx-auto grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-3">
                {btns.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={async () => {
                      try {
                        const map: ('knew'|'heard'|'unknown')[] = ['knew','heard','unknown'];
                        await recordFamiliarityMentalCoaching(map[idx] ?? 'unknown', profileCtx?.profile?.id);
                      } catch {}
                      navigateToStep('intentMotivation');
                    }}
                    className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                    data-testid="wizard-microlesson-btn"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto mt-3 max-w-[64ch] text-center text-[10px] text-[#8C7C70]">
              {lang === 'ro'
                ? 'Primele studii: Norman Triplett (1898) — efectul competiției la cicliști; termenul „sport psychology” (1900) — Pierre de Coubertin; anii 1920–1930 — Coleman Griffith lucrează cu echipe (ex. Chicago Cubs).'
                : 'Early studies: Norman Triplett (1898) — cyclists and competition; “sport psychology” term (1900) — Pierre de Coubertin; 1920s–1930s — Coleman Griffith works with teams (e.g., Chicago Cubs).'}
            </div>
          </div>
        </section>
        </div>
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
