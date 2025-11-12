"use client";

import type { Step } from "./useWizardSteps";

const PROGRESS_STEPS = [
  { id: "context", labelRo: "Context", labelEn: "Context" },
  { id: "themes", labelRo: "Intenții & Cloud", labelEn: "Intent & Cloud" },
  { id: "resources", labelRo: "Motivație & Resurse", labelEn: "Motivation & Resources" },
  { id: "recommendation", labelRo: "Recomandare", labelEn: "Recommendation" },
];

const STEP_MAPPING: Record<Step, number> = {
  preIntro: -1,
  intro: -1,
  firstInput: 0,
  reflectionPrompt: 0,
  intent: 1,
  reflectionSummary: 1,
  intentSummary: 2,
  cards: 3,
  details: 3,
};

type WizardProgressProps = {
  currentStep: Step;
  lang: "ro" | "en";
  onReset?: () => void;
  onExit?: () => void;
};

export function WizardProgress({ currentStep, lang, onReset, onExit }: WizardProgressProps) {
  const activeIndex = STEP_MAPPING[currentStep] ?? -1;
  if (activeIndex < 0) {
    return null;
  }

  const totalSteps = PROGRESS_STEPS.length;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((activeIndex + 1) / totalSteps) * 100),
  );

  return (
    <div className="mx-auto mb-6 w-full max-w-4xl px-4">
      <div className="flex flex-col gap-4 rounded-[16px] border border-[#E4D8CE] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
            {lang === "ro"
              ? `Pasul ${activeIndex + 1} din ${totalSteps}`
              : `Step ${activeIndex + 1} of ${totalSteps}`}
          </p>
          <p className="text-xs font-semibold text-[#4A3A30] sm:hidden">
            {lang === "ro"
              ? PROGRESS_STEPS[activeIndex]?.labelRo
              : PROGRESS_STEPS[activeIndex]?.labelEn}
          </p>
          <div className="hidden items-center gap-2 sm:flex">
            {PROGRESS_STEPS.map((step, index) => {
              const isActive = index === activeIndex;
              const isCompleted = index < activeIndex;
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] ${
                      isActive
                        ? "bg-[#2C2C2C] text-white"
                        : isCompleted
                        ? "bg-[#E60012] text-white"
                        : "bg-[#F5EDE4] text-[#A08F82]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#4A3A30]">
                    {lang === "ro" ? step.labelRo : step.labelEn}
                  </span>
                  {index < totalSteps - 1 ? (
                    <span className="h-px w-8 bg-[#E4D8CE]" aria-hidden="true" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-full" aria-hidden="true">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5EDE4]">
            <div
              className="h-full rounded-full bg-[#2C2C2C] transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82] sm:hidden">
            {lang === "ro" ? "Progres" : "Progress"}
          </p>
          <div className="ml-auto flex items-center gap-3">
            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82] underline underline-offset-2 hover:text-[#E60012]"
              >
                {lang === "ro" ? "Părăsește wizardul" : "Exit wizard"}
              </button>
            ) : null}
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82] underline underline-offset-2 hover:text-[#E60012]"
                aria-label={lang === "ro" ? "Resetează parcursul" : "Reset journey"}
              >
                {lang === "ro" ? "Resetează" : "Reset"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
