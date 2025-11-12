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
    <div className="mx-auto w-full md:w-[70%] rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
      <header className="mb-1">
        <p className="text-sm font-semibold text-[#1F1F1F]">
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
                ? "border border-[#C07963] bg-[#FFF4EE] text-[#2C2C2C] font-semibold ring-1 ring-[#C07963]/40 shadow-sm"
                : "border border-[#F0E6DA] bg-[#FFFBF7] text-[#5C4F45]"
            }`}
          >
            {label}
            {idx === 0 && primaryPercentLabel ? (
                <>
                  <span className="ml-1 text-[10px] font-semibold text-[#7A6455]">
                    {primaryPercentLabel}
                  </span>
                  <span className="ml-1 rounded-full bg-[#F6F2EE] px-1.5 py-[1px] text-[9px] uppercase tracking-[0.15em] text-[#C07963]">
                    {lang === "ro" ? "Focus" : "Focus"}
                  </span>
                </>
              ) : null}
          </span>
        ))}
          {categoryChips.length > 8 ? (
            <span className="text-[10px] text-[#7A6455]">+{categoryChips.length - 8}</span>
          ) : null}
        </div>
      {/* Radar after chips */}
      <div className="mt-2">
        {isEmpty ? (
          <p className="text-xs text-[#7A6455]">{lang === "ro" ? "Încă nu ai selectat teme." : "No selections yet."}</p>
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
          className="rounded-[10px] border border-[#2C2C2C] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
        >
          {lang === "ro" ? "Reia clarificarea" : "Refine themes"}
        </button>
      </div>
    </div>
  );
}
