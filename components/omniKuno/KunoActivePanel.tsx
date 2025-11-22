"use client";

import type { ReactNode } from "react";

export function KunoActivePanel({
  progress,
  xpLabel,
  children,
  nextLessonTitle,
  onContinue,
  disabled,
}: {
  progress: ReactNode;
  xpLabel: ReactNode;
  children?: ReactNode;
  nextLessonTitle?: string | null;
  onContinue?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E4DAD1] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#7B6B60]">
        <div>{progress}</div>
        <div>{xpLabel}</div>
      </div>
      {children}
      {nextLessonTitle ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#B08A78]">Next best step</p>
          <p className="mt-1 text-sm text-[#4D3F36]">{nextLessonTitle}</p>
          <button
            type="button"
            onClick={onContinue}
            disabled={disabled}
            className="mt-2 inline-flex items-center rounded-full bg-[#C07963] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#a86551] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continuă misiunea
          </button>
        </div>
      ) : null}
    </div>
  );
}
