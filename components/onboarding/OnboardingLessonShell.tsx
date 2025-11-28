"use client";

import { ReactNode, useCallback, useState } from "react";

type OnboardingLessonShellProps = {
  label: string;
  title: string;
  subtitle?: string;
  meta?: string;
  stepIndex?: number;
  stepCount?: number;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  statusLabel?: string;
  contentWrapperClassName?: string | null;
  backTestId?: string;
  continueTestId?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  continueDisabled?: boolean;
  collapsibleTestId?: string;
};

export function OnboardingLessonShell({
  label,
  title,
  subtitle,
  meta,
  stepIndex = 0,
  stepCount = 1,
  children,
  onBack,
  onContinue,
  backLabel = "Înapoi",
  continueLabel = "Continuă",
  statusLabel,
  contentWrapperClassName,
  backTestId,
  continueTestId,
  collapsible = false,
  defaultExpanded = true,
  continueDisabled,
  collapsibleTestId,
}: OnboardingLessonShellProps) {
  const current = Math.min(stepCount, Math.max(1, stepIndex + 1));
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);
  const toggle = useCallback(() => {
    if (!collapsible) return;
    setExpanded((prev) => !prev);
  }, [collapsible]);
  const containerSpacing = collapsible ? "space-y-0" : "space-y-4";

  return (
    <section className={containerSpacing} data-testid="onboarding-lesson-shell">
      <div
        className={`rounded-[32px] bg-gradient-to-b from-[#FFF3EC] to-[#FFF8F2] p-[1px] shadow-[0_30px_80px_rgba(253,211,187,0.35)] ${
          collapsible ? "cursor-pointer rounded-b-[12px]" : ""
        }`}
        onClick={collapsible ? toggle : undefined}
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? expanded : undefined}
        data-testid={collapsible ? collapsibleTestId : undefined}
        onKeyDown={
          collapsible
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggle();
                }
              }
            : undefined
        }
      >
        <div className="rounded-[30px] border border-[#F3D8C4] bg-white/90 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-full border border-[#F3B492] bg-[radial-gradient(circle_at_top,_#FFFDF9,_#FFEFE2)] text-[#D75C1E] shadow-[0_10px_28px_rgba(244,191,161,0.35)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M7.5 3.5l11 8.5-11 8.5V3.5z" fill="currentColor" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[#B08A78]">{label}</p>
                <h3 className="text-xl font-bold leading-tight text-[#2C2C2C] md:text-2xl">{title}</h3>
                {subtitle ? <p className="mt-1 text-[13px] text-[#7B6B60]">{subtitle}</p> : null}
              </div>
            </div>
            <div className="text-right text-[11px] text-[#7B6B60]">
              {meta ? <p className="font-medium">{meta}</p> : null}
              {statusLabel ? (
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-[#E45B0A]">
                  {statusLabel}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-[#B08A78]">
            <div className="flex gap-1">
              {Array.from({ length: stepCount }).map((_, idx) => (
                <span
                  key={`lesson-dot-${idx}`}
                  className={`h-2 w-2 rounded-full ${idx === stepIndex ? "bg-[#E45B0A]" : "bg-[#F2DCCC]"}`}
                />
              ))}
            </div>
            <p>{`Pas ${current} din ${stepCount}`}</p>
          </div>
        </div>
      </div>

      {(!collapsible || expanded) && (
        <div
          className={`rounded-[28px] border border-[#F5DFCF] bg-white px-6 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] ${
            collapsible ? "-mt-px rounded-t-[12px]" : ""
          }`}
        >
          {contentWrapperClassName === null ? (
            children
          ) : (
            <div className={contentWrapperClassName ?? "rounded-[22px] border border-[#FBE4D4] bg-[#FFF9F4] px-5 py-5"}>
              {children}
            </div>
          )}
          <div className="mt-6 flex items-center justify-between gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                data-testid={backTestId}
                className="rounded-[999px] border border-[#E4DAD1] px-5 py-2 text-[13px] font-medium text-[#7B6B60] hover:border-[#C07963] hover:text-[#C07963] transition"
              >
                {backLabel}
              </button>
            ) : (
              <span />
            )}
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              data-testid={continueTestId}
              className="rounded-[999px] border border-[#2C2C2C] px-6 py-2 text-[13px] font-semibold tracking-[0.18em] text-[#2C2C2C] transition hover:bg-[#2C2C2C] hover:text-white disabled:opacity-60"
              disabled={continueDisabled}
            >
              {continueLabel}
            </button>
          ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export default OnboardingLessonShell;
