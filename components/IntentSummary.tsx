"use client";

import { useMemo, useState } from "react";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import type { IntentCategory } from "./IntentCloud";
import type {
  GoalType,
  EmotionalState,
  FormatPreference,
  BudgetPreference,
  ResolutionSpeed,
} from "../lib/evaluation";

interface IntentSummaryProps {
  categories: Array<{ category: IntentCategory | string; count: number }>;
  maxSelection: number;
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
  formatPreference: FormatPreference;
  onFormatPreferenceChange: (value: FormatPreference) => void;
}

const TOTAL_STEPS = 4;

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

const formatPreferenceLabels: Record<FormatPreference, string> = {
  individual: "Mai degrabă sesiuni individuale 1-la-1",
  group: "Mai degrabă grup online",
  unsure: "Nu știu sigur, am nevoie de recomandare",
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
  categories,
  maxSelection,
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
  formatPreference,
  onFormatPreferenceChange,
}: IntentSummaryProps) {
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);

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
  const emptyValue = getString(
    t("intentSummaryEmpty"),
    lang === "ro"
      ? "Selectează câteva opțiuni pentru a vedea analiza."
      : "Select a few options to unlock the analysis.",
  );

  const categoryLabelsValue = t("intentCategoryLabels");
  const categoryLabels =
    categoryLabelsValue && typeof categoryLabelsValue === "object"
      ? (categoryLabelsValue as Record<string, string>)
      : {};

  const sortedCategories = useMemo(
    () =>
      [...categories]
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count),
    [categories],
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
      ? "Explorăm starea emoțională și confortul tău."
      : "We check in on how you feel emotionally.",
    lang === "ro"
      ? "La final decidem formatul cu cele mai mari șanse."
      : "Finally, we choose the format with the best odds of success.",
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
                    onClick={() => onResolutionSpeedChange(option.value)}
                    className={`rounded-[10px] border px-3 py-2 text-sm ${
                      resolutionSpeed === option.value
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {speedOptionsLabels?.[option.value] ?? option.fallback}
                  </button>
                ))}
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
                    onClick={() => onBudgetPreferenceChange(option.value)}
                    className={`rounded-[10px] border px-3 py-2 text-sm ${
                      budgetPreference === option.value
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {budgetOptionsLabels?.[option.value] ?? option.fallback}
                  </button>
                ))}
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
                    onClick={() => onGoalTypeChange(option)}
                    className={`w-full rounded-[10px] border px-4 py-3 text-left text-sm ${
                      goalType === option
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {goalTypeLabels[option]}
                  </button>
                ))}
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
                    onClick={() => onEmotionalStateChange(option)}
                    className={`w-full rounded-[10px] border px-4 py-3 text-left text-sm ${
                      emotionalState === option
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {emotionalStateLabels[option]}
                  </button>
                ))}
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
          </div>
        );
      case 3:
      default:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cât de ușor îți este să respecți același interval orar în fiecare săptămână?"
                  : "How easy is it for you to stick to the same time slot every week?"}
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
            <div>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "După ce ai citit despre cele două formate, ce ți se potrivește acum?"
                  : "After reading about both formats, what feels best right now?"}
              </p>
              <div className="mt-3 space-y-3">
                {(Object.keys(formatPreferenceLabels) as FormatPreference[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onFormatPreferenceChange(option)}
                    className={`w-full rounded-[10px] border px-4 py-3 text-left text-sm ${
                      formatPreference === option
                        ? "border-[#E60012] bg-[#FDF1EF] text-[#E60012]"
                        : "border-[#D8C6B6] text-[#2C2C2C]"
                    }`}
                  >
                    {formatPreferenceLabels[option]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  })();

  const distributionCard = (
    <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
      <p className="text-xs uppercase tracking-[0.25em] text-[#A08F82]">
        {lang === "ro" ? "Distribuția alegerilor" : "Your selection mix"}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-[#1F1F1F]">
        {lang === "ro" ? "Unde este încărcarea" : "Where the weight is"}
      </h3>
      <div className="mt-4 space-y-4">
        {sortedCategories.length === 0 ? (
          <p className="text-sm text-[#2C2C2C]/70">{emptyValue}</p>
        ) : (
          sortedCategories.map((entry) => {
            const percentage = Math.round((entry.count / maxSelection) * 100);
            const label = categoryLabels[entry.category] ?? entry.category;
            return (
              <div key={`${entry.category}-${entry.count}`}>
                <div className="flex items-center justify-between text-sm font-medium text-[#2C2C2C]">
                  <span>{label}</span>
                  <span>
                    {entry.count}/{maxSelection}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#E8DDD3]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2C2C2C] via-[#C24B17] to-[#E60012]"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const stepHeadings = [
    lang === "ro" ? "Despre situația ta acum" : "About your current situation",
    lang === "ro" ? "Resurse și context practic" : "Practical resources",
    lang === "ro" ? "Starea emoțională și confortul" : "Emotional state & comfort",
    lang === "ro" ? "Program și preferințe de format" : "Schedule & format preference",
  ];

  const nextLabel =
    step === TOTAL_STEPS - 1
      ? savingLabel ?? (lang === "ro" ? "Se salvează..." : "Saving…")
      : lang === "ro"
      ? "Pasul următor"
      : "Next";

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
        <div className="rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
          <TypewriterText key={title} text={title} speed={90} enableSound />
          {description ? <p className="mt-3 text-sm text-[#2C2C2C]/80">{description}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {distributionCard}

          <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>
                  {lang === "ro" ? `Pas ${step + 1} din ${TOTAL_STEPS}` : `Step ${step + 1} of ${TOTAL_STEPS}`}
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#F2E8DF]">
                <div
                  className="h-full rounded-full bg-[#E60012] transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-[#5C4F45]">{stepLabels[step]}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#2C2C2C]">{stepHeadings[step]}</h3>
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
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {step === TOTAL_STEPS - 1 && isSaving ? savingLabel ?? "Se salvează..." : nextLabel}
              </button>
            </div>
            {errorMessage ? (
              <p className="mt-3 text-xs text-[#B8000E]">{errorMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
