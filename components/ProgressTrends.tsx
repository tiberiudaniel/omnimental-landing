"use client";

import { motion } from "framer-motion";
import RadarIndicators from "./RadarIndicators";
import { INDICATOR_CHART_KEYS, INDICATOR_LABELS, type IndicatorChartValues } from "@/lib/indicators";

type Props = {
  lang: "ro" | "en";
  sparkValues: number[];
  radarChart: IndicatorChartValues;
  categoryChips: string[];
  onRefineThemes: () => void;
};

export default function ProgressTrends({ lang, sparkValues, radarChart, categoryChips, onRefineThemes }: Props) {
  return (
    <section className="mx-auto mb-6 max-w-5xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.08)] md:col-span-2">
          <header className="mb-2 flex items-center justify-between">
            <p className="t-title-sm text-[var(--omni-ink)]">
              {lang === "ro" ? "Trend 7 zile: Echilibru emoțional (proxy)" : "7-day trend: Emotional balance (proxy)"}
            </p>
            <span className="text-xs text-[var(--omni-muted)]">
              {lang === "ro" ? "Auto-raport" : "Self-report"}
            </span>
          </header>
          <div className="mt-2 h-[150px] w-full">
            <div className="flex h-full items-end gap-1.5">
              {sparkValues.length === 0 ? (
                <p className="text-xs text-[var(--omni-muted)]">
                  {lang === "ro" ? "Nu există încă date." : "No data yet."}
                </p>
              ) : (
                sparkValues.map((v, i) => {
                  const h = Math.max(18, Math.min(140, v * 13.5));
                  return (
                    <motion.div
                      key={`spark-${i}`}
                      className="w-5 rounded-sm bg-[var(--omni-energy)]"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: h, opacity: 1 }}
                      transition={{ duration: 0.35, delay: i * 0.03, ease: "easeOut" }}
                      aria-label={`t${i}: ${v}`}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
          <header className="mb-2">
            <p className="text-sm font-semibold text-[var(--omni-ink)]">
              {lang === "ro" ? "Distribuția temelor" : "Theme distribution"}
            </p>
          </header>
          {Object.values(radarChart).every((v) => !v) ? (
            <p className="text-xs text-[var(--omni-muted)]">{lang === "ro" ? "Încă nu ai selectat teme." : "No selections yet."}</p>
          ) : (
            <div className="mx-auto max-w-[260px]">
              <RadarIndicators
                data={INDICATOR_CHART_KEYS.map((key) => ({
                  key,
                  label: INDICATOR_LABELS[key][lang === "ro" ? "ro" : "en"],
                  value: Math.max(0, Math.min(5, radarChart[key] ?? 0)),
                }))}
                maxValue={5}
                size="md"
              />
            </div>
          )}
          {/* Chips cu temele alese + acțiune de rafinare */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <motion.div className="flex flex-wrap gap-2" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
              {categoryChips.slice(0, 8).map((label, idx) => (
                <span key={`${label}-${idx}`} className="rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2.5 py-1 t-label-xs text-[var(--omni-ink-soft)]">
                  {label}
                </span>
              ))}
              {categoryChips.length > 8 ? (
                <span className="text-[10px] text-[var(--omni-muted)]">+{categoryChips.length - 8}</span>
              ) : null}
            </motion.div>
            <button
              type="button"
              onClick={onRefineThemes}
              className="rounded-[10px] border border-[var(--omni-border-soft)] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
            >
              {lang === "ro" ? "Reia clarificarea" : "Refine themes"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
