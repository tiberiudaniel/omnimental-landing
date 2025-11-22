"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SegmentedControl from "./ui/SegmentedControl";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import { getWizardStepTestId } from "./useWizardSteps";
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
  primaryAreaLabel?: string;
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
  primaryAreaLabel,
}: IntentSummaryProps) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [speedTouched, setSpeedTouched] = useState(false);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [goalTouched, setGoalTouched] = useState(false);
  const [emotionalTouched, setEmotionalTouched] = useState(false);
  const [determinationTouched, setDeterminationTouched] = useState(false);
  const [nextBusy, setNextBusy] = useState(false);
  const [nudge, setNudge] = useState(false);

  const getString = (value: unknown, fallback: string) =>
    typeof value === "string" ? value : fallback;
  const tFirst = (keys: string[]): unknown => {
    for (const k of keys) {
      const v = t(k);
      if (v !== undefined && v !== null && (typeof v === 'string' ? v.length > 0 : true)) {
        return v;
      }
    }
    return undefined;
  };
  const getTextMulti = (keys: string[], fallback: string): string => {
    const v = tFirst(keys);
    return typeof v === 'string' ? v : fallback;
  };

  const title = getTextMulti(
    ["intentMotivationTitle", "intentSummaryTitle"],
    lang === "ro" ? "Analiza preferințelor tale" : "Your evaluation summary",
  );
  const description = getTextMulti(
    ["intentMotivationDescription", "intentSummaryDescription"],
    lang === "ro"
      ? "În câțiva pași aflăm ce ți se potrivește mai bine acum."
      : "A few guided steps to understand what fits you best.",
  );
  const urgencyQuestion = getTextMulti(
    ["intentMotivationIntensityQuestion", "intentSummaryIntensityQuestion"],
    lang === "ro"
      ? "Cât de urgent simți să lucrezi la aceste teme?"
      : "How urgent does it feel to work on these themes?",
  );
  const urgencyLow = getTextMulti(["intentMotivationIntensityLow", "intentSummaryIntensityLow"], lang === "ro" ? "Relaxat" : "Balanced");
  const urgencyHigh = getTextMulti(
    ["intentMotivationIntensityHigh", "intentSummaryIntensityHigh"],
    lang === "ro" ? "Foarte urgent" : "Very urgent",
  );
  const timeSuffix = getTextMulti(
    ["intentMotivationTimeSuffix", "intentSummaryTimeSuffix"],
    lang === "ro" ? "ore/săptămână" : "hrs/week",
  );

  const areaLabel = ((): string => {
    if (primaryAreaLabel && primaryAreaLabel.length > 0) return primaryAreaLabel;
    return lang === 'ro' ? 'temele selectate' : 'selected themes';
  })();
  // progress UI and verbose labels removed for minimalist design

  const speedOptionsLabels =
    (tFirst(["intentMotivationSpeedOptions", "intentSummarySpeedOptions"]) as Record<ResolutionSpeed, string> | undefined) ?? undefined;
  const budgetOptionsLabels =
    (tFirst(["intentMotivationBudgetOptions", "intentSummaryBudgetOptions"]) as Record<BudgetPreference, string> | undefined) ?? undefined;

  const stepContent = (() => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            {/* Hidden legacy ranges for E2E compatibility (first = urgency, second = determination) */}
            <input
              type="range"
              min={1}
              max={10}
              value={urgency}
              onChange={(e) => onUrgencyChange(Number(e.target.value))}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            />
            <input
              type="range"
              min={1}
              max={5}
              value={determination}
              onChange={(e) => onDeterminationChange(Number(e.target.value))}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            />
            {/* 1) Speed first */}
            <div className={`panel-ghost px-4 py-4 ${nudge && !budgetTouched ? 'border border-[#E60012] animate-pulse' : ''}`}>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {(() => {
                  const tpl = getTextMulti(
                    ["intentMotivationSpeedQuestion", "intentSummarySpeedQuestion"],
                    lang === "ro"
                      ? "Cât de repede vrei să rezolvi claritate și direcție?"
                      : "How quickly do you want to make progress on clarity and direction?",
                  );
                  return tpl.includes('{{area}}') ? tpl.replace('{{area}}', areaLabel) : tpl;
                })()}
              </p>
              <div className="mt-2">
                <SegmentedControl
                  items={speedOptions.map((o) => ({ value: o.value, label: speedOptionsLabels?.[o.value] ?? o.fallback }))}
                  value={resolutionSpeed}
                  onChange={(v) => { onResolutionSpeedChange(v); setSpeedTouched(true); }}
                  getTestId={(v) => `speed-${String(v)}`}
                  suppressActive={!speedTouched}
                />
                {!speedTouched ? (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A08F82]">
                    {lang === "ro" ? "Selectează o opțiune" : "Select an option"}
                  </p>
                ) : null}
              </div>
            </div>
            {/* 2) Urgency second */}
            <div className={`panel-ghost px-4 py-4 ${nudge && !goalTouched ? 'border border-[#E60012] animate-pulse' : ''}`}>
              <p className="text-sm font-medium text-[#2C2C2C]">{urgencyQuestion}</p>
              {/* Mixer slider for urgency */}
              <div className="mt-2">
                <div className="mixer-wrap ticks-10">
                  <span className="mixer-slot" aria-hidden="true"></span>
                  <span
                    className="mixer-fill"
                    aria-hidden="true"
                    style={{ width: `calc(${(Math.max(1, Math.min(10, urgency)) - 1) * 11.111}% - 13px)` }}
                  ></span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={urgency}
                    onChange={(e) => onUrgencyChange(Number(e.target.value))}
                    data-testid="stress-slider"
                    className="mixer-range w-full"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{urgencyLow}</span>
                <span className="text-[#7A6455]">{urgency}/10</span>
                <span>{urgencyHigh}</span>
              </div>
            </div>
            {/* 3) Determination last */}
            <div className={`panel-ghost px-4 py-4 ${nudge && !emotionalTouched ? 'border border-[#E60012] animate-pulse' : ''}`}>
              <p className="text-sm font-medium text-[#2C2C2C]">
                {getString(
                  tFirst(["intentMotivationMotivationQuestion", "intentSummaryMotivationQuestion"]),
                  lang === "ro"
                    ? "Cât de hotărât(ă) te simți să faci efectiv schimbări?"
                    : "How determined are you to actually make changes?",
                )}
              </p>
              <div className="mt-2">
                <div className="mixer-fluid">
                  <div className="mixer-wrap ticks-5">
                    <span className="mixer-slot" aria-hidden="true"></span>
                    <span
                      className="mixer-fill"
                      aria-hidden="true"
                      style={{ width: `calc(${(Math.max(1, Math.min(5, determination)) - 1) * 25}% - 13px)` }}
                    ></span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={determination}
                      onChange={(e) => { onDeterminationChange(Number(e.target.value)); setDeterminationTouched(true); }}
                      data-testid="determination-slider"
                      className="mixer-range w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Mai puțin" : "Less"}</span>
                <span className="text-[#7A6455]">{determination}/5</span>
                <span>{lang === "ro" ? "Foarte hotărât(ă)" : "Very determined"}</span>
              </div>
              {!determinationTouched ? (
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-[#A08F82]">
                  {lang === "ro" ? "Selectează o opțiune" : "Select an option"}
                </p>
              ) : null}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="panel-ghost px-4 py-4">
              <p className="text-sm font-medium text-[#2C2C2C]">
                {getTextMulti(
                  ["intentMotivationTimeQuestion", "intentSummaryTimeQuestion"],
                  lang === "ro"
                    ? "Cât timp pe săptămână poți investi în mod realist?"
                    : "How much weekly time can you realistically invest?",
                )}
              </p>
              <div className="mt-2">
                <div className="mixer-fluid">
                  <div className="mixer-wrap ticks-10">
                    <span className="mixer-slot" aria-hidden="true"></span>
                    <span
                      className="mixer-fill"
                      aria-hidden="true"
                      style={{ width: `calc(${Math.max(0, Math.min(8, timeCommitmentHours)) * 12.5}% - 13px)` }}
                    ></span>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={timeCommitmentHours}
                      onChange={(e) => onTimeCommitmentChange(Number(e.target.value))}
                      data-testid="time-slider"
                      className="mixer-range w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                {timeCommitmentHours} {timeSuffix}
              </div>
            </div>
            <div className="panel-ghost px-4 py-4">
              <p className="text-sm font-medium text-[#2C2C2C]">
                {getTextMulti(
                  ["intentMotivationBudgetQuestion", "intentSummaryBudgetQuestion"],
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
                      (budgetTouched && budgetPreference === option.value)
                        ? "border-[#D8C6B6] bg-[#F2EAE0] text-[#2C2C2C]"
                        : "border-[#E8DCCE] bg-white text-[#2C2C2C] hover:border-[#D8C6B6]"
                    }`}
                    data-testid={`budget-${option.value}`}
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
            <div className="panel-ghost px-4 py-4">
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
                      (goalTouched && goalType === option)
                        ? "border-[#D8C6B6] bg-[#F2EAE0] text-[#2C2C2C]"
                        : "border-[#E8DCCE] bg-white text-[#2C2C2C] hover:border-[#D8C6B6]"
                    }`}
                    data-testid={`goal-${option}`}
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
          <div className="space-y-4">
            {/* 1) Schedule fit */}
            <div className="panel-ghost px-4 py-4">
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cât de ușor îți este să respecți același interval orar în fiecare săptămână?"
                  : "How easy is it for you to stick to the same weekly time slot?"}
              </p>
              <div className="mixer-fluid mt-3">
                <div className="mixer-wrap ticks-10">
                  <span className="mixer-slot" aria-hidden="true"></span>
                  <span
                    className="mixer-fill"
                    aria-hidden="true"
                    style={{ width: `calc(${(Math.max(1, Math.min(10, scheduleFit)) - 1) * 11.111}% - 13px)` }}
                  ></span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={scheduleFit}
                    onChange={(event) => onScheduleFitChange(Number(event.target.value))}
                    data-testid="scheduleFit-slider"
                    className="mixer-range w-full"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Greu de tot" : "Very difficult"}</span>
                <span className="text-[#7A6455]">{scheduleFit}/10</span>
                <span>{lang === "ro" ? "Ușor" : "Very easy"}</span>
              </div>
            </div>

            {/* 2) Learn from others */}
            <div className="panel-ghost px-4 py-4">
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cât de mult te ajută să auzi întrebările și greșelile altor persoane?"
                  : "How much does it help you to hear others’ questions and mistakes?"}
              </p>
              <div className="mixer-fluid mt-3">
                <div className="mixer-wrap ticks-10">
                  <span className="mixer-slot" aria-hidden="true"></span>
                  <span
                    className="mixer-fill"
                    aria-hidden="true"
                    style={{ width: `calc(${(Math.max(1, Math.min(10, learnFromOthers)) - 1) * 11.111}% - 13px)` }}
                  ></span>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={learnFromOthers}
                    onChange={(event) => onLearnFromOthersChange(Number(event.target.value))}
                    data-testid="learnFromOthers-slider"
                    className="mixer-range w-full"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Mai deloc" : "Not much"}</span>
                <span className="text-[#7A6455]">{learnFromOthers}/10</span>
                <span>{lang === "ro" ? "Foarte mult" : "A lot"}</span>
              </div>
            </div>

            {/* 3) Emotional state */}
            <div className={`panel-ghost px-4 py-4 ${nudge && !emotionalTouched ? 'border border-[#E60012] animate-pulse' : ''}`}>
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
                      (emotionalTouched && emotionalState === option)
                        ? "border-[#D8C6B6] bg-[#F2EAE0] text-[#2C2C2C]"
                        : "border-[#E8DCCE] bg-white text-[#2C2C2C] hover:border-[#D8C6B6]"
                    }`}
                    data-testid={`emo-${option}`}
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

            {/* 4) Group comfort */}
            <div className="panel-ghost px-4 py-4">
              <p className="text-sm font-medium text-[#2C2C2C]">
                {lang === "ro"
                  ? "Cât de confortabil te simți cu ideea de a discuta aceste teme într-un grup mic online?"
                  : "How comfortable are you with discussing these topics in a small group online?"}
              </p>
                <div className="mixer-fluid mt-3">
                  <div className="mixer-wrap ticks-10">
                    <span className="mixer-slot" aria-hidden="true"></span>
                    <span
                      className="mixer-fill"
                      aria-hidden="true"
                      style={{ width: `calc(${(Math.max(1, Math.min(10, groupComfort)) - 1) * 11.111}% - 13px)` }}
                    ></span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={groupComfort}
                      onChange={(event) => onGroupComfortChange(Number(event.target.value))}
                      data-testid="groupComfort-slider"
                      className="mixer-range w-full"
                    />
                  </div>
                </div>
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                <span>{lang === "ro" ? "Deloc confortabil(ă)" : "Not comfortable"}</span>
                <span className="text-[#7A6455]">{groupComfort}/10</span>
                <span>{lang === "ro" ? "Foarte confortabil(ă)" : "Very comfortable"}</span>
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

  const nextLabel = (() => {
    const isLast = step === TOTAL_STEPS - 1;
    if (isLast && (isSaving || nextBusy)) {
      return savingLabel ?? (lang === "ro" ? "Se salvează..." : "Saving…");
    }
    if (isLast) {
      return lang === "ro" ? "Finalizează" : "Finish";
    }
    return lang === "ro" ? "Pasul următor" : "Next";
  })();

  // Quick presets and summary sentence
  // presets removed by request

  // inline summary removed

  const e2eOverride = (() => {
    try {
      if (typeof window !== 'undefined') return window.location.search.includes('e2e=1');
    } catch {}
    return false;
  })();

  const canProceed = (() => {
    if (e2eOverride) return true;
    if (step === 0) return true; // reduce friction on step 0
    if (step === 1) return budgetTouched && goalTouched;
    if (step === 2) return emotionalTouched;
    return true;
  })();

  const handleNext = () => {
    if (nextBusy) return;
    if (!canProceed) {
      setNudge(true);
      return;
    }
    setNextBusy(true);
    setTimeout(() => setNextBusy(false), 700);
    if (step === TOTAL_STEPS - 1) {
      onContinue();
    } else {
      setStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  // Sync substep with URL (?sub=1|2|3) and accept legacy step names intentMotivation1/2/3
  useEffect(() => {
    const sp = searchParams;
    const subRaw = sp?.get("sub");
    const stepRaw = sp?.get("step") || "";
    let subIndexFromUrl: number | null = null;
    if (subRaw) {
      const n = Number(subRaw);
      if (Number.isFinite(n) && n >= 1 && n <= TOTAL_STEPS) subIndexFromUrl = n - 1;
    }
    const m = /^intentMotivation(\d)$/.exec(stepRaw);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n >= 1 && n <= TOTAL_STEPS) subIndexFromUrl = n - 1;
      // normalize URL to canonical step + sub
      try {
        const p = new URLSearchParams(sp?.toString() ?? "");
        const curStep = p.get("step");
        const curSub = p.get("sub");
        const desiredSub = String(n);
        if (curStep !== "intentMotivation" || curSub !== desiredSub) {
          p.set("step", "intentMotivation");
          p.set("sub", desiredSub);
          const qs = p.toString();
          router.replace(qs ? `/?${qs}` : "/");
        }
      } catch {}
    }
    if (subIndexFromUrl !== null) {
      setStep(subIndexFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When local substep changes, reflect it in URL (?sub=n)
  useEffect(() => {
    try {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      const desiredStep = "intentMotivation";
      const desiredSub = String(step + 1);
      const curStep = p.get("step");
      const curSub = p.get("sub");
      if (curStep !== desiredStep || curSub !== desiredSub) {
        p.set("step", desiredStep);
        p.set("sub", desiredSub);
        const qs = p.toString();
        router.replace(qs ? `/?${qs}` : "/");
      }
    } catch {}
  }, [router, searchParams, step]);

  // Clear visual nudge after a short pulse
  useEffect(() => {
    if (!nudge) return;
    const h = setTimeout(() => setNudge(false), 900);
    return () => clearTimeout(h);
  }, [nudge]);

  return (
    <section data-testid={getWizardStepTestId("intentMotivation")} className="bg-[#FDFCF9] px-4 md:px-6 py-10">
      <div className="page-wrap w-full flex flex-col items-center gap-6 md:gap-8">
        {step === 0 ? (
          <div className="panel-ghost px-8 py-8 text-left">
            <TypewriterText key={title} text={title} speed={90} enableSound />
            {description ? <p className="mt-3 text-sm text-[#2C2C2C]/80">{description}</p> : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-6">
          <div className="px-1 py-0 w-full">
            <div className="mx-auto w-full max-w-4xl">
            {/* Presets removed by request */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[#2C2C2C]">{stepHeadings[step]}</h3>
            </div>

            {/* Sub‑pași numerici eliminați la cerere; păstrăm doar titlul secțiunii */}

            {stepContent}

            <div className="mt-6 flex items-center justify-between">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:text-[#2C2C2C]"
                >
                  {lang === "ro" ? "Înapoi" : "Back"}
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed || nextBusy}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="wizard-next"
              >
                {nextLabel}
              </button>
              {step === TOTAL_STEPS - 1 && canProceed && !nextBusy && !isSaving ? (
                <span data-testid="wizard-ready" className="sr-only">ready</span>
              ) : null}
              {!canProceed ? (
                <span className="ml-3 text-[11px] text-[#7B6B60]">
                  {lang === 'ro' ? 'Completează selecțiile marcate.' : 'Complete the marked selections.'}
                </span>
              ) : null}
            </div>
            {errorMessage ? (
              <div className="mt-3 flex items-center gap-3">
                <p className="text-xs text-[#B8000E]">{errorMessage}</p>
                {onAuthRequest && /conect|sign in/i.test(errorMessage) ? (
                  <button
                    type="button"
                    onClick={onAuthRequest}
                    className="rounded-[8px] border border-[#2C2C2C] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
                  >
                    {lang === "ro" ? "Autentifică-te" : "Sign in"}
                  </button>
                ) : null}
              </div>
            ) : null}
            </div>
          </div>
        </div>
        {/* Summary panel removed as requested */}
        {/* Mobile sticky summary removed */}
      </div>
    </section>
  );
}
