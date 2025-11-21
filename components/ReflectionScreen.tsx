"use client";

import { useMemo, useRef, useState } from "react";
import TypewriterText from "./TypewriterText";
import MultiTypewriter from "./MultiTypewriter";
import { useI18n } from "./I18nProvider";
import { getString } from "@/lib/i18nGetString";
import RadarIndicators from "./RadarIndicators";
import { getWizardStepTestId } from "./useWizardSteps";
import {
  buildIndicatorSummary,
  INDICATOR_CHART_KEYS,
  INDICATOR_LABELS,
  type IndicatorChartKey,
} from "@/lib/indicators";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";

interface ReflectionScreenProps {
  lines: string[];
  onContinue: () => void;
  categories?: Array<{ category: string; count: number }>;
  maxSelection?: number;
  categoryLabels?: Record<string, string>;
  testId?: string; // optional override for container test id
  cardTestId?: string; // optional test id for inner card wrapper
  compact?: boolean; // align near top with reduced vertical padding
}

export default function ReflectionScreen({
  lines,
  onContinue,
  categories,
  maxSelection,
  categoryLabels,
  testId,
  cardTestId,
  compact = false,
}: ReflectionScreenProps) {
  const { t, lang } = useI18n();
  const isRO = lang !== "en";
  const buttonLabel = getString(t, "wizard.continue", isRO ? "Continuă" : "Continue");
  const guardRef = useRef<{ busy: boolean; ts: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const primaryLine = useMemo(() => {
    const cleaned = lines.find((line) => line && line.trim().length > 0);
    return cleaned ?? "";
  }, [lines]);
  const hasMultipleLines = useMemo(() => (lines || []).filter((l) => (l || '').trim().length > 0).length > 1, [lines]);
  const safeCategories = useMemo(() => categories ?? [], [categories]);
  const safeMaxSelection = maxSelection ?? 0;
  const displayTotal = safeMaxSelection > 0 ? safeMaxSelection : Math.max(1, safeCategories.reduce((sum, entry) => sum + entry.count, 0));
  const safeLabels = categoryLabels ?? {};
  const indicatorSummary = useMemo(() => buildIndicatorSummary(safeCategories), [safeCategories]);
  const indicatorEntries = INDICATOR_CHART_KEYS.map((key: IndicatorChartKey) => {
    const rawCount = indicatorSummary.chart[key] ?? 0;
    const share = indicatorSummary.shares[key] ?? 0; // 0..1
    return {
      key,
      label: INDICATOR_LABELS[key][isRO ? "ro" : "en"],
      value: Math.max(0, Math.min(1, share)),
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
  const topReflection = useMemo(() => {
    // Determine top category share from indicatorSummary (shares)
    const pairs: Array<[IndicatorChartKey, number]> = INDICATOR_CHART_KEYS.map((k) => [
      k,
      Number(indicatorSummary.shares[k] ?? 0),
    ]);
    pairs.sort((a, b) => b[1] - a[1]);
    const top = pairs[0]?.[0];
    if (!top) return null;
    // Map indicator key to RO category key used by CATEGORY_LABELS
    const mapToRoKey: Record<string, keyof typeof CATEGORY_LABELS> = {
      clarity: "claritate",
      relationships: "relatii",
      calm: "stres",
      energy: "echilibru",
      performance: "incredere",
    };
    const roKey = mapToRoKey[top];
    const item = roKey ? CATEGORY_LABELS[roKey] : undefined;
    if (!item) return null;
    const text = isRO ? item.reflection?.ro : item.reflection?.en;
    return text ?? null;
  }, [indicatorSummary.shares, isRO]);
  const showIndicators = safeCategories.length > 0;
  const emptyIndicatorsText = isRO
    ? "Selectează câteva opțiuni pentru a vedea analiza."
    : "Pick a few themes to reveal this view.";
  const sectionClasses = compact
    ? "flex w-full items-start justify-start bg-[#FDFCF9] px-5 pt-4 pb-8"
    : "flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-5 py-12";
  return (
    <section data-testid={testId ?? getWizardStepTestId("reflectionPrompt")} className={sectionClasses}>
      <div className="panel-canvas panel-canvas--hero panel-canvas--brain-right w-full max-w-5xl rounded-[20px] border border-[#E4D8CE] bg-white/92 px-7 py-10 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]" data-testid={cardTestId}>
        <div className="w-full flex justify-center">
          <div className="max-w-xl w-full text-left">
            {hasMultipleLines ? (
              <MultiTypewriter lines={lines} speed={90} gapMs={440} />
            ) : (
              <TypewriterText key={primaryLine} text={primaryLine} speed={90} enableSound />
            )}
          </div>
        </div>

        {showIndicators ? (
          <div className="mt-6 text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A08F82]">
              {getString(t, "wizard.keyIndicators", isRO ? "Indicatori principali" : "Key indicators")}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#1F1F1F]">
              {getString(t, "wizard.selectionProfile", isRO ? "Profilul selecțiilor tale" : "Your selection profile")}
            </h3>
            <div className="mt-6 grid gap-4 sm:gap-5 md:grid-cols-[minmax(240px,320px)_minmax(0,1fr)] md:items-start md:gap-8 md:justify-center">
              <div className="mx-auto w-full max-w-[300px] shrink-0 md:mr-4">
                <RadarIndicators data={indicatorEntries} maxValue={1} size="lg" />
              </div>
              <div className="min-w-0 w-full space-y-4 text-left md:justify-self-start">
                <div className="rounded-[12px] border border-[#F5E7DA] bg-[#FFFBF7] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#A08F82]">
                    {getString(t, "wizard.highlightedThemes", isRO ? "Teme evidențiate" : "Highlighted themes")}
                  </p>
                  {highlightedThemes.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-[#2C2C2C]">
                      {highlightedThemes.map((entry) => {
                        const label = safeLabels[entry.category] ?? entry.category;
                        return (
                          <li
                            key={`${entry.category}-${entry.count}`}
                            className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="break-words">{label}</span>
                            <span className="text-[11px] uppercase tracking-[0.2em] text-[#A08F82]">
                              {entry.count}/{displayTotal}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-[#2C2C2C]/70">{getString(t, "wizard.selectFew", emptyIndicatorsText)}</p>
                  )}
                  {topReflection ? (
                    <div className="mt-3 rounded-[10px] border border-[#F0E6DA] bg-white px-3 py-2 text-[13px] text-[#2C2C2C]">
                      {topReflection}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            const now = Date.now();
            if (guardRef.current?.busy && now - (guardRef.current.ts || 0) < 700) return;
            guardRef.current = { busy: true, ts: now };
            setBusy(true);
            setTimeout(() => {
              setBusy(false);
              if (guardRef.current) guardRef.current.busy = false;
            }, 700);
            onContinue();
          }}
          disabled={busy}
          className="mt-10 inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
          data-testid="wizard-reflection-continue"
        >
          {busy ? (isRO ? "Se procesează…" : "Processing…") : buttonLabel}
        </button>
      </div>
    </section>
  );
}
