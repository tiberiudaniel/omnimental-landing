"use client";

import type { CSSProperties } from "react";
import type { WizardStepId } from "./useWizardSteps";

const PROGRESS_STEPS = [
  { id: "context", labelRo: "Context", labelEn: "Context" },
  { id: "themes", labelRo: "Scop și intenție", labelEn: "Scope & Intent" },
  { id: "resources", labelRo: "Motivație & Resurse", labelEn: "Motivation & Resources" },
  { id: "recommendation", labelRo: "Recomandare", labelEn: "Recommendation" },
];

const STEP_MAPPING: Record<WizardStepId, number> = {
  preIntro: -1,
  intro: -1,
  firstInput: 0,
  reflectionPrompt: 0,
  intent: 1,
  reflectionSummary: 1,
  needMain: 1,
  needConfidence: 1,
  microLessonInfo: 1,
  intentMotivation: 2,
  cards: 3,
  details: 3,
};

type WizardProgressProps = {
  currentStep: WizardStepId;
  lang: "ro" | "en";
  onReset?: () => void;
  onExit?: () => void;
};

export function WizardProgress({ currentStep, lang, onReset: _onReset, onExit: _onExit }: WizardProgressProps) {
  // Mark as used to satisfy lint while keeping API surface
  void _onReset; void _onExit;
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
    <div className="mx-auto mb-3 w-full max-w-4xl px-3">
      <div className="flex flex-col gap-2 rounded-[12px] border border-transparent bg-transparent px-2 py-2 shadow-none">
        <div className="flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:items-center">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: "var(--text-soft)" }}
          >
            {lang === "ro"
              ? `Pasul ${activeIndex + 1} din ${totalSteps}`
              : `Step ${activeIndex + 1} of ${totalSteps}`}
          </p>
          <p
            className="text-[11px] font-semibold sm:hidden"
            style={{ color: "var(--text-main)" }}
          >
            {lang === "ro"
              ? PROGRESS_STEPS[activeIndex]?.labelRo
              : PROGRESS_STEPS[activeIndex]?.labelEn}
          </p>
          <div className="hidden items-center gap-2 sm:flex">
            {PROGRESS_STEPS.map((step, index) => {
              const isActive = index === activeIndex;
              const isCompleted = index < activeIndex;
              const dotStyle: CSSProperties = isActive
                ? {
                    backgroundColor: "var(--bg-card)",
                    boxShadow: "0 0 0 2px var(--accent-main)",
                  }
                : isCompleted
                ? { backgroundColor: "var(--bg-elevated)" }
                : { backgroundColor: "var(--bg-card-soft)" };
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <span
                    className="flex h-3 w-3 items-center justify-center rounded-full"
                    style={dotStyle}
                    aria-label={`${lang === 'ro' ? 'Pasul' : 'Step'} ${index + 1}`}
                  >
                    {/* minimalist bullet; number hidden for visual simplicity */}
                  </span>
                  <span
                    className="hidden text-[11px] font-semibold lg:inline"
                    style={{ color: "var(--text-main)" }}
                  >
                    {lang === "ro" ? step.labelRo : step.labelEn}
                  </span>
                  {index < totalSteps - 1 ? (
                    <span
                      className="h-px w-6"
                      style={{ backgroundColor: "var(--border-subtle)" }}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        <div className="w-full" aria-hidden="true">
          <div
            className="h-[3px] w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--bg-card-soft)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: "var(--accent-main)",
              }}
            />
          </div>
        </div>
        {/* action links removed for minimal UX */}
      </div>
    </div>
  );
} 
