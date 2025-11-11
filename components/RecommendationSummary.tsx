
"use client";

import React from "react";
import RadarIndicators from "./RadarIndicators";
import {
  INDICATOR_CHART_KEYS,
  INDICATOR_LABELS,
  type IndicatorChartKey,
} from "@/lib/indicators";

type LoadLevel = "low" | "moderate" | "high";

type BudgetLevel = "min" | "medium" | "max";
type SpeedLevel = "days" | "weeks" | "months";
type SummaryVariant = "card" | "embedded";

export interface RecommendationSummaryProps {
  loadLevel: LoadLevel;
  mainArea: string;
  indicators: Record<IndicatorChartKey, number>;
  onBookCall: () => void;
  variant?: SummaryVariant;
  className?: string;
  language?: "ro" | "en";
  summaryMessage?: string;
  primaryThemes?: string[];
  mainRecommendationTitle?: string;
  mainRecommendationText?: string;
  reasoningBullets?: string[];
  speed?: SpeedLevel;
  commitment?: number;
  weeklyTimeHours?: number;
  budgetLevel?: BudgetLevel;
  goalType?: string;
  emotionalState?: string;
  prefersIndividual?: boolean;
  groupComfort?: number;
  learnsFromOthers?: number;
  programFit?: number;
}

const LOAD_LABELS: Record<LoadLevel, { ro: string; en: string }> = {
  low: { ro: "Scăzut", en: "Low" },
  moderate: { ro: "Moderat", en: "Moderate" },
  high: { ro: "Ridicat", en: "High" },
};

export function RecommendationSummary(props: RecommendationSummaryProps) {
  const {
    loadLevel,
    mainArea,
    indicators,
    onBookCall,
    variant = "card",
    className,
    language = "ro",
    summaryMessage,
  } = props;

  const isRO = language !== "en";
  const loadLabel = LOAD_LABELS[loadLevel][isRO ? "ro" : "en"];
  const containerBaseClass =
    variant === "card"
      ? "w-full max-w-3xl rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)] space-y-6 text-[#2C2C2C]"
      : "w-full space-y-6 text-[#2C2C2C]";
  const containerClass = [containerBaseClass, className].filter(Boolean).join(" ");
  const indicatorEntries = INDICATOR_CHART_KEYS.map((key) => ({
    key,
    label: INDICATOR_LABELS[key][isRO ? "ro" : "en"],
    value: Math.max(0, Math.min(5, indicators[key] ?? 0)),
  }));
  const topTwoIndicators = indicatorEntries
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  const messageParagraphs =
    summaryMessage
      ?.split("\n")
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0) ?? [];

  return (
    <section className={containerClass}>
      {messageParagraphs.length > 0 ? (
        <div className="space-y-2 text-sm leading-relaxed text-[#2C2C2C]">
          {messageParagraphs.map((paragraph, index) => (
            <p key={`${paragraph}-${index.toString()}`}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#2C2C2C]">
          {isRO
            ? `Aria principală este ${mainArea}, iar nivelul tău de încărcare este ${loadLabel}.`
            : `Your primary focus is ${mainArea}, and your overall load is ${loadLabel}.`}
        </p>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#1F1F1F]">
          {isRO ? "Indicatori principali" : "Key indicators"}
        </h3>
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10">
          <RadarIndicators
            data={indicatorEntries.map(({ key, label, value }) => ({
              key,
              label,
              value,
            }))}
          />
          <ul className="grid w-full max-w-sm gap-3 text-left text-sm">
            {topTwoIndicators.map(({ key, label, value }) => (
              <li
                key={key}
                className="flex items-center justify-between rounded-[12px] border border-[#F0E2D4] bg-white px-3 py-2"
              >
                <span className="text-[#5C4F45]">{label}</span>
                <span className="font-semibold text-[#1F1F1F]">{value}/5</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onBookCall}
          className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#2C2C2C] px-6 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#E60012]"
        >
          {isRO ? "Programează un call de 20 min" : "Book a 20-min call"}
        </button>
      </div>

      <p className="text-[11px] text-[#A08F82]">
        {isRO
          ? "OmniMental este coaching de performanță și claritate mentală. Nu înlocuiește evaluarea sau tratamentul medical/psihiatric."
          : "OmniMental offers performance & clarity coaching. It is not a medical or psychiatric service."}
      </p>
    </section>
  );
}
