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
    <header className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)]">OmniKuno – Misiunea ta de azi</p>
      <h1 className="text-2xl font-bold text-[var(--omni-ink)]">
        {title} <span className="text-xl text-[var(--omni-energy)]">· {focusLabel}</span>
      </h1>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1 text-sm text-[#4D3F36]">
          <p className="font-semibold text-[var(--omni-ink)]">
            {focusLabel} <span className="text-[var(--omni-muted)]">· {moduleLevelLabel}</span>
          </p>
          <p className="text-[var(--omni-muted)]">{progressSummary}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right text-sm text-[#4D3F36]">
          {xpSummary ? <p className="font-semibold text-[var(--omni-ink)]">{xpSummary}</p> : null}
          {overviewLabel && onOpenOverview ? (
            <button
              type="button"
              onClick={onOpenOverview}
              className="rounded-full border border-[var(--omni-border-soft)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
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
