"use client";

import React from "react";

export default function Stepper({
  value,
  steps,
  onChange,
  testIdPrefix,
}: {
  value: number;
  steps: number[];
  onChange: (v: number) => void;
  testIdPrefix?: string;
}) {
  const next = () => {
    const idx = steps.findIndex((s) => s >= value);
    const v = steps[Math.min(steps.length - 1, Math.max(0, idx + 1))];
    onChange(v);
  };
  const prev = () => {
    const idx = steps.findIndex((s) => s >= value);
    const target = idx <= 0 ? steps[0] : steps[idx - 1];
    onChange(target);
  };
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={prev}
        data-testid={testIdPrefix ? `${testIdPrefix}-minus` : undefined}
        className="h-8 w-8 rounded-[8px] border border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:bg-[var(--omni-bg-paper)]"
        aria-label="decrease"
      >
        −
      </button>
      <span className="min-w-[2ch] text-center text-sm font-semibold text-[var(--omni-ink)]">{value}</span>
      <button
        type="button"
        onClick={next}
        data-testid={testIdPrefix ? `${testIdPrefix}-plus` : undefined}
        className="h-8 w-8 rounded-[8px] border border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:bg-[color-mix(in_oklab,var(--omni-energy)_15%,transparent)]"
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}
