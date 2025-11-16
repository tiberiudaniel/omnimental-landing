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
        className="h-8 w-8 rounded-[8px] border border-[#D8C6B6] text-[#2C2C2C] hover:bg-[#F6F2EE]"
        aria-label="decrease"
      >
        −
      </button>
      <span className="min-w-[2ch] text-center text-sm font-semibold text-[#2C2C2C]">{value}</span>
      <button
        type="button"
        onClick={next}
        data-testid={testIdPrefix ? `${testIdPrefix}-plus` : undefined}
        className="h-8 w-8 rounded-[8px] border border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C]/10"
        aria-label="increase"
      >
        +
      </button>
    </div>
  );
}
