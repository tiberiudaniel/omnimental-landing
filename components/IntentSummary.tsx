"use client";

import { useState } from "react";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import type {
  GoalType,
  EmotionalState,
  BudgetPreference,
  ResolutionSpeed,
} from "../lib/evaluation";

interface IntentSummaryProps {
  urgency: number;
  onUrgencyChange: (value: number) => void;
  onContinue: () => void;
  isSaving?: boolean;
  errorMessage?: string | null;
  savingLabel?: string;
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
  onAuthRequest?: () => void;
}

const TOTAL_STEPS = 3;

const goalTypeLabels: Record<GoalType, string> = {
  single: "Am o singură temă foarte concretă",
  few: "Am 2–3 zone care se leagă între ele",
  broad: "Simt că am nevoie de o reorganizare mai amplă",
};

const emotionalStateLabels: Record<EmotionalState, string> = {
  stable: "Relativ stabilă. Am doar stres normal.",
  fluctuating: "Fluctuează. Uneori mă simt copleșit(ă).",
  unstable: "Foarte instabilă. Simt că abia fac față.",
};

const speedOptions: { value: ResolutionSpeed; fallback: string }[] = [
  { value: "days", fallback: "Zile" },
  { value: "weeks", fallback: "Săptămâni" },
  { value: "months", fallback: "Luni" },
];

const budgetOptions: { value: BudgetPreference; fallback: string }[] = [
  { value: "low", fallback: "Buget minim" },
  { value: "medium", fallback: "Buget mediu" },
  { value: "high", fallback: "Buget maxim" },
];

export default function IntentSummary({
  urgency,
  onUrgencyChange,
  onContinue,
  isSaving = false,
  errorMessage = null,
  savingLabel,
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
  onAuthRequest,
}: IntentSummaryProps) {
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [speedTouched, setSpeedTouched] = useState(false);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [goalTouched, setGoalTouched] = useState(false);
  const [emotionalTouched, setEmotionalTouched] = useState(false);

  const getString = (value: unknown, fallback: string) =>
    typeof value === "string" ? value : fallback;

  const title = getString(
    t("intentSummaryTitle"),
    lang === "ro" ? "Analiza preferințelor tale" : "Your evaluation summary",
  );
  const description = getString(
    t("intentSummaryDescription"),
    lang === "ro"
      ? "În câțiva pași aflăm ce ți se potrivește mai bine acum."
      : "A few guided steps to understand what fits you best.",
  );
  const urgencyQuestion = getString(
    t("intentSummaryIntensityQuestion"),
    lang === "ro"
      ? "Cât de urgent simți să lucrezi la aceste teme?"
      : "How urgent does it feel to work on these themes?",
  );
  const urgencyLow = getString(t("intentSummaryIntensityLow"), lang === "ro" ? "Mai calm" : "Calm");
  const urgencyHigh = getString(
    t("intentSummaryIntensityHigh"),
    lang === "ro" ? "Foarte urgent" : "Very urgent",
  );
  const timeSuffix = getString(
    t("intentSummaryTimeSuffix"),
    lang === "ro" ? "ore/săptămână" : "hrs/week",
  );
  const progressPercentage = ((step + 1) / TOTAL_STEPS) * 100;
  const stepLabels = [
    lang === "ro"
      ? "Întâi înțelegem cât de presant este pentru tine."
      : "First, we gauge how pressing things feel.",
    lang === "ro"
      ? "Apoi vedem ce resurse practice ai la dispoziție."
      : "Next, we look at the resources you can count on.",
    lang === "ro"
      ? "Explorăm starea emoțională, confortul și ritmul potrivit."
      : "We check in on emotional state, comfort, and cadence.",
  ];

  const speedOptionsLabels =
    (t("intentSummarySpeedOptions") as Record<ResolutionSpeed, string> | undefined) ?? undefined;
  const budgetOptionsLabels =
    (t("intentSummaryBudgetOptions") as Record<BudgetPreference, string> | undefined) ?? undefined;

  const stepContent = (() => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">{urgencyQuestion}</p>
              <input
                type="range"
                min={1}
                max={10}
                value={urgency}
                onChange={(event) => onUrgencyChange(Number(event.target.value))}
                className="mt-3 w-full accent-[#E60012]"
              />
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{urgencyLow}</span>
                <span className="text-[#E60012]">{urgency}/10</span>
                <span>{urgencyHigh}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {getString(
                  t("intentSummarySpeedQuestion"),
                  lang === "ro"
                    ? "Cât de repede vrei să simți mai multă liniște?"
                    : "How quickly do you want to feel more regulated?",
                )}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {speedOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onResolutionSpeedChange(option.value);
                      setSpeedTouched(true);
                    }}
                    className={`rounded-[10px] border px-3 py-2 text-sm ${
                      resolutionSpeed === option.value
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {speedOptionsLabels?.[option.value] ?? option.fallback}
                  </button>
                ))}
              {!speedTouched ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A08F82]">
                  {lang === "ro" ? "Selectează o opțiune" : "Select an option"}
                </p>
              ) : null}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {getString(
                  t("intentSummaryMotivationQuestion"),
                  lang === "ro"
                    ? "Cât de hotărât(ă) te simți să faci efectiv schimbări?"
                    : "How determined are you to actually make changes?",
                )}
              </p>
              <input
                type="range"
                min={1}
                max={5}
                value={determination}
                onChange={(event) => onDeterminationChange(Number(event.target.value))}
                className="mt-3 w-full accent-[#E60012]"
              />
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Mai puțin" : "Less"}</span>
                <span className="text-[#E60012]">{determination}/5</span>
                <span>{lang === "ro" ? "Foarte hotărât(ă)" : "Very determined"}</span>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {getString(
                  t("intentSummaryTimeQuestion"),
                  lang === "ro"
                    ? "Cât timp pe săptămână poți investi în mod realist?"
                    : "How much weekly time can you realistically invest?",
                )}
              </p>
              <input
                type="range"
                min={0}
                max={8}
                value={timeCommitmentHours}
                step={1}
                onChange={(event) => onTimeCommitmentChange(Number(event.target.value))}
                className="mt-3 w-full accent-[#E60012]"
              />
              <div className="mt-2 text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                {timeCommitmentHours} {timeSuffix}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {getString(
                  t("intentSummaryBudgetQuestion"),
                  lang === "ro"
                    ? "Ce buget este realist pentru această temă?"
                    : "What budget feels realistic for this goal?",
                )}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {budgetOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onBudgetPreferenceChange(option.value);
                      setBudgetTouched(true);
                    }}
                    className={`rounded-[10px] border px-3 py-2 text-sm ${
                      budgetPreference === option.value
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {budgetOptionsLabels?.[option.value] ?? option.fallback}
                  </button>
                ))}
              {!budgetTouched ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A08F82]">
                  {lang === "ro" ? "Selectează o opțiune" : "Select an option"}
                </p>
              ) : null}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cum ai descrie cel mai bine ce vrei să lucrezi acum?"
                  : "How would you best describe what you want to work on now?"}
              </p>
              <div className="mt-3 space-y-3">
                {(Object.keys(goalTypeLabels) as GoalType[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onGoalTypeChange(option);
                      setGoalTouched(true);
                    }}
                    className={`w-full rounded-[10px] border px-4 py-3 text-left text-sm ${
                      goalType === option
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {goalTypeLabels[option]}
                  </button>
                ))}
              {!goalTouched ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A08F82]">
                  {lang === "ro" ? "Selectează o opțiune" : "Select an option"}
                </p>
              ) : null}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cum ai descrie starea ta emoțională din ultimele două săptămâni?"
                  : "How would you describe your emotional state during the past two weeks?"}
              </p>
              <div className="mt-3 space-y-3">
                {(Object.keys(emotionalStateLabels) as EmotionalState[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onEmotionalStateChange(option);
                      setEmotionalTouched(true);
                    }}
                    className={`w-full rounded-[10px] border px-4 py-3 text-left text-sm ${
                      emotionalState === option
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {emotionalStateLabels[option]}
                  </button>
                ))}
              {!emotionalTouched ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A08F82]">
                  {lang === "ro" ? "Selectează o opțiune" : "Select an option"}
                </p>
              ) : null}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cât de confortabil te simți cu ideea de a discuta aceste teme într-un grup mic online?"
                  : "How comfortable are you with discussing these topics in a small group online?"}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={groupComfort}
                onChange={(event) => onGroupComfortChange(Number(event.target.value))}
                className="mt-3 w-full accent-[#E60012]"
              />
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Deloc confortabil(ă)" : "Not comfortable"}</span>
                <span className="text-[#E60012]">{groupComfort}/10</span>
                <span>{lang === "ro" ? "Foarte confortabil(ă)" : "Very comfortable"}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cât de mult te ajută să auzi întrebările și greșelile altor persoane?"
                  : "How much does it help you to hear others’ questions and mistakes?"}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={learnFromOthers}
                onChange={(event) => onLearnFromOthersChange(Number(event.target.value))}
                className="mt-3 w-full accent-[#E60012]"
              />
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Mai deloc" : "Not much"}</span>
                <span className="text-[#E60012]">{learnFromOthers}/10</span>
                <span>{lang === "ro" ? "Foarte mult" : "A lot"}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cât de ușor îți este să respecți același interval orar în fiecare săptămână?"
                  : "How easy is it for you to stick to the same weekly time slot?"}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                value={scheduleFit}
                onChange={(event) => onScheduleFitChange(Number(event.target.value))}
                className="mt-3 w-full accent-[#E60012]"
              />
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Greu de tot" : "Very difficult"}</span>
                <span className="text-[#E60012]">{scheduleFit}/10</span>
                <span>{lang === "ro" ? "Ușor" : "Very easy"}</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  })();

  const stepHeadings = [
    lang === "ro" ? "Despre situația ta acum" : "About your current situation",
    lang === "ro" ? "Resurse și context practic" : "Practical resources",
    lang === "ro" ? "Starea emoțională și confortul" : "Emotional state & comfort",
  ];

  const nextLabel =
    step === TOTAL_STEPS - 1
      ? savingLabel ?? (lang === "ro" ? "Se salvează..." : "Saving…")
      : lang === "ro"
      ? "Pasul următor"
      : "Next";

  const canProceed = (() => {
    if (step === 0) return speedTouched;
    if (step === 1) return budgetTouched && goalTouched;
    if (step === 2) return emotionalTouched;
    return true;
  })();

  const handleNext = () => {
    if (step === TOTAL_STEPS - 1) {
      onContinue();
    } else {
      setStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <section className="bg-[#FDFCF9] px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-10 text-left shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#8A7059]">
              <span>
                {lang === "ro"
                  ? `Pasul ${step + 1} din ${TOTAL_STEPS}`
                  : `Step ${step + 1} of ${TOTAL_STEPS}`}
              </span>
              <span className="text-[#2C2C2C]">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#E9DED3]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1F1F1F] via-[#A2541A] to-[#E60012] transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#5C4F45]">{stepLabels[step]}</p>
          </div>
          <TypewriterText key={title} text={title} speed={90} enableSound />
          {description ? <p className="mt-3 text-sm text-[#2C2C2C]/80">{description}</p> : null}
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#2C2C2C]">{stepHeadings[step]}</h3>
            </div>

            {stepContent}

            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:text-[#E60012]"
                >
                  {lang === "ro" ? "Înapoi" : "Back"}
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving || !canProceed}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {step === TOTAL_STEPS - 1 && isSaving ? savingLabel ?? "Se salvează..." : nextLabel}
              </button>
            </div>
            {errorMessage ? (
              <div className="mt-3 flex items-center gap-3">
                <p className="text-xs text-[#B8000E]">{errorMessage}</p>
                {onAuthRequest && /conect|sign in/i.test(errorMessage) ? (
                  <button
                    type="button"
                    onClick={onAuthRequest}
                    className="rounded-[8px] border border-[#2C2C2C] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Autentifică-te" : "Sign in"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
