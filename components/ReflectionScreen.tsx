"use client";

import { useMemo } from "react";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import RadarIndicators from "./RadarIndicators";
import {
  buildIndicatorSummary,
  INDICATOR_CHART_KEYS,
  INDICATOR_LABELS,
  type IndicatorChartKey,
} from "@/lib/indicators";

interface ReflectionScreenProps {
  lines: string[];
  onContinue: () => void;
  categories?: Array<{ category: string; count: number }>;
  maxSelection?: number;
  categoryLabels?: Record<string, string>;
}

export default function ReflectionScreen({
  lines,
  onContinue,
  categories,
  maxSelection,
  categoryLabels,
}: ReflectionScreenProps) {
  const { lang } = useI18n();
  const isRO = lang !== "en";
  const buttonLabel = isRO ? "Continuă" : "Continue";
  const primaryLine = useMemo(() => {
    const cleaned = lines.find((line) => line && line.trim().length > 0);
    return cleaned ?? "";
  }, [lines]);
  const safeCategories = useMemo(() => categories ?? [], [categories]);
  const safeMaxSelection = maxSelection ?? 0;
  const displayTotal = safeMaxSelection > 0 ? safeMaxSelection : Math.max(1, safeCategories.reduce((sum, entry) => sum + entry.count, 0));
  const safeLabels = categoryLabels ?? {};
  const indicatorSummary = useMemo(() => buildIndicatorSummary(safeCategories), [safeCategories]);
  const indicatorEntries = INDICATOR_CHART_KEYS.map((key: IndicatorChartKey) => {
    const rawCount = indicatorSummary.chart[key] ?? 0;
    const normalized = Math.max(0, Math.min(5, (rawCount / displayTotal) * 5));
    return {
      key,
      label: INDICATOR_LABELS[key][isRO ? "ro" : "en"],
      value: normalized,
      rawCount,
    };
  });
  const highlightedThemes = useMemo(
    () =>
      [...safeCategories]
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 2),
    [safeCategories],
  );
  const showIndicators = safeCategories.length > 0;
  const emptyIndicatorsText = isRO
    ? "Selectează câteva opțiuni pentru a vedea analiza."
    : "Pick a few themes to reveal this view.";
  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-5xl rounded-[20px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <TypewriterText key={primaryLine} text={primaryLine} speed={90} enableSound />

        {showIndicators ? (
          <div className="mt-10 text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A08F82]">
              {isRO ? "Indicatori principali" : "Key indicators"}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#1F1F1F]">
              {isRO ? "Profilul selecțiilor tale" : "Your selection profile"}
            </h3>
            <div className="mt-6 flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10">
              <RadarIndicators data={indicatorEntries} />
              <div className="flex-1 space-y-4">
                <ul className="grid w-full gap-3 text-sm">
                  {indicatorEntries.map(({ key, label, rawCount }) => (
                    <li
                      key={key}
                      className="flex items-center justify-between rounded-[12px] border border-[#F0E2D4] bg-white px-3 py-2"
                    >
                      <span className="text-[#5C4F45]">{label}</span>
                      <span className="font-semibold text-[#1F1F1F]">
                        {rawCount}/{displayTotal}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-[12px] border border-[#F5E7DA] bg-[#FFFBF7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                    {isRO ? "Teme evidențiate" : "Highlighted themes"}
                  </p>
                  {highlightedThemes.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-[#2C2C2C]">
                      {highlightedThemes.map((entry) => {
                        const label = safeLabels[entry.category] ?? entry.category;
                        return (
                          <li
                            key={`${entry.category}-${entry.count}`}
                            className="flex items-center justify-between"
                          >
                            <span>{label}</span>
                            <span className="text-xs uppercase tracking-[0.2em] text-[#A08F82]">
                              {entry.count}/{displayTotal}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-[#2C2C2C]/70">{emptyIndicatorsText}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}
