"use client";

import RadarIndicators from "./RadarIndicators";
import { INDICATOR_CHART_KEYS, INDICATOR_LABELS, type IndicatorChartValues } from "@/lib/indicators";

type Props = {
  lang: "ro" | "en";
  radarShares: IndicatorChartValues;
  categoryChips: string[];
  onRefineThemes: () => void;
  primaryPercentLabel?: string | null;
};

export default function ThemeDistributionCard({ lang, radarShares, categoryChips, onRefineThemes, primaryPercentLabel }: Props) {
  const isEmpty = Object.values(radarShares).every((v) => !v);
  return (
    <div className="mx-auto w-full md:w-[70%] rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
      <header className="mb-1">
        <p className="text-sm font-semibold text-[var(--omni-ink)]">
          {lang === "ro" ? "Distribuția temelor" : "Theme distribution"}
        </p>
      </header>
      {/* Chips first, immediately under title */}
      <div className="mt-1 flex flex-wrap gap-2">
        {categoryChips.slice(0, 8).map((label, idx) => (
          <span
            key={`${label}-${idx}`}
            className={`rounded-[10px] px-2.5 py-1 text-[11px] capitalize ${
              idx === 0
                ? "border border-[var(--omni-energy)] bg-[var(--omni-bg-paper)] text-[var(--omni-ink)] font-semibold ring-1 ring-[var(--omni-energy)]/40 shadow-sm"
                : "border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] text-[var(--omni-ink-soft)]"
            }`}
          >
            {label}
            {idx === 0 && primaryPercentLabel ? (
                <>
                  <span className="ml-1 text-[10px] font-semibold text-[var(--omni-muted)]">
                    {primaryPercentLabel}
                  </span>
                  <span className="ml-1 rounded-full bg-[var(--omni-bg-paper)] px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em] text-[var(--omni-energy)]">
                    {lang === "ro" ? "Focus" : "Focus"}
                  </span>
                </>
              ) : null}
          </span>
        ))}
          {categoryChips.length > 8 ? (
            <span className="text-[10px] text-[var(--omni-muted)]">+{categoryChips.length - 8}</span>
          ) : null}
        </div>
      {/* Radar after chips */}
      <div className="mt-2">
        {isEmpty ? (
          <p className="text-xs text-[var(--omni-muted)]">{lang === "ro" ? "Încă nu ai selectat teme." : "No selections yet."}</p>
        ) : (
          <div className="mx-auto max-w-[240px]">
            <RadarIndicators
              data={INDICATOR_CHART_KEYS.map((key) => ({
                key,
                label: INDICATOR_LABELS[key][lang === "ro" ? "ro" : "en"],
                value: Math.max(0, Math.min(1, radarShares[key] ?? 0)),
              }))}
              maxValue={1}
              size="sm"
              ringSteps={5}
            />
          </div>
        )}
      </div>
      {/* Refine button aligned to the right */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={onRefineThemes}
          className="rounded-[10px] border border-[var(--omni-border-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
        >
          {lang === "ro" ? "Reia clarificarea" : "Refine themes"}
        </button>
      </div>
    </div>
  );
}
