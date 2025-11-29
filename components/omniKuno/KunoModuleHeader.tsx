"use client";

type KunoModuleHeaderProps = {
  title: string;
  focusLabel: string;
  moduleLevelLabel: string;
  progressSummary: string;
  xpSummary?: string;
  overviewLabel?: string;
  onOpenOverview?: () => void;
};

export function KunoModuleHeader({
  title,
  focusLabel,
  moduleLevelLabel,
  progressSummary,
  xpSummary,
  overviewLabel,
  onOpenOverview,
}: KunoModuleHeaderProps) {
  return (
    <header className="rounded-2xl border border-[#E4DAD1] bg-white px-6 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C07963]">OmniKuno – Misiunea ta de azi</p>
      <h1 className="text-2xl font-bold text-[#2C2C2C]">
        {title} <span className="text-xl text-[#C07963]">· {focusLabel}</span>
      </h1>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 text-sm text-[#4D3F36]">
          <p className="font-semibold text-[#2C2C2C]">
            {focusLabel} <span className="text-[#B08A78]">· {moduleLevelLabel}</span>
          </p>
          <p className="text-[#7B6B60]">{progressSummary}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-sm text-[#4D3F36]">
          {xpSummary ? <p className="font-semibold text-[#2C2C2C]">{xpSummary}</p> : null}
          {overviewLabel && onOpenOverview ? (
            <button
              type="button"
              onClick={onOpenOverview}
              className="rounded-full border border-[#E4DAD1] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] transition hover:border-[#C07963] hover:text-[#C07963]"
              data-testid="omnikuno-overview-button"
            >
              {overviewLabel}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
