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
};

export function WizardProgress({ currentStep, lang }: WizardProgressProps) {
  const activeIndex = STEP_MAPPING[currentStep] ?? -1;
  if (activeIndex < 0) {
    return null;
  }

  return (
    <div className="mx-auto mb-6 w-full max-w-4xl px-4">
      <div className="flex flex-col gap-3 rounded-[16px] border border-[#E4D8CE] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
          {lang === "ro"
            ? `Pasul ${activeIndex + 1} din ${PROGRESS_STEPS.length}`
            : `Step ${activeIndex + 1} of ${PROGRESS_STEPS.length}`}
        </p>
        <div className="flex items-center gap-2">
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
                <span className="hidden text-xs font-semibold text-[#4A3A30] sm:block">
                  {lang === "ro" ? step.labelRo : step.labelEn}
                </span>
                {index < PROGRESS_STEPS.length - 1 ? (
                  <span className="hidden h-px w-8 bg-[#E4D8CE] sm:block" aria-hidden="true" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
