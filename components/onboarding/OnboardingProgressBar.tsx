"use client";

import clsx from "clsx";

export type OnboardingProgressMeta = {
  stepIndex: number;
  totalSteps: number;
};

type Props = OnboardingProgressMeta & {
  className?: string;
};

export default function OnboardingProgressBar({ stepIndex, totalSteps, className }: Props) {
  const progress = Math.max(0, Math.min(1, (stepIndex + 1) / Math.max(1, totalSteps)));
  const percent = Math.round(progress * 100);

  return (
    <div className={clsx("mb-6", className)}>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
        <span>
          Pasul {Math.min(stepIndex + 1, totalSteps)} din {totalSteps}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[var(--omni-border-soft)]/40">
        <div
          className="h-2 rounded-full bg-[var(--omni-energy)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
