"use client";

import type { ReactNode } from "react";

type KunoActivePanelProps = {
  progressSummary: string;
  children?: ReactNode;
  nextLessonTitle?: string | null;
  onContinue?: () => void;
  disabled?: boolean;
};

export function KunoActivePanel({
  progressSummary,
  children,
  nextLessonTitle,
  onContinue,
  disabled,
}: KunoActivePanelProps) {
  return (
    <div className="rounded-2xl border border-[#E4DAD1] bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B08A78]">Progres misiune</p>
      <p className="mt-1 text-sm text-[#4D3F36]">{progressSummary}</p>
      {children ? <div className="mt-3">{children}</div> : null}
      {nextLessonTitle ? (
        <div className="mt-4 rounded-2xl border border-[#E4DAD1] bg-[#FFFBF7] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B08A78]">Următorul pas</p>
          <p className="mt-2 text-base font-semibold text-[#2C2C2C]">{nextLessonTitle}</p>
          <button
            type="button"
            onClick={onContinue}
            disabled={disabled}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-[#E2CFC2] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4F2C1F] shadow-[0_6px_18px_rgba(79,44,31,0.15)] transition hover:bg-[#FFF3EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C07963] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuă misiunea
          </button>
        </div>
      ) : null}
    </div>
  );
}
