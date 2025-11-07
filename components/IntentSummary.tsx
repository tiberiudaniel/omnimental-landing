"use client";

import { useState } from "react";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import type { IntentCategory } from "./IntentCloud";

interface IntentSummaryProps {
  categories: Array<{ category: IntentCategory | string; count: number }>;
  maxSelection: number;
  onContinue: (urgency: number) => void;
}

const MIN_URGENCY = 1;
const MAX_URGENCY = 10;

export default function IntentSummary({ categories, maxSelection, onContinue }: IntentSummaryProps) {
  const { t } = useI18n();
  const [urgency, setUrgency] = useState(6);

  const titleValue = t("intentSummaryTitle");
  const descriptionValue = t("intentSummaryDescription");
  const questionValue = t("intentSummaryIntensityQuestion");
  const lowLabelValue = t("intentSummaryIntensityLow");
  const highLabelValue = t("intentSummaryIntensityHigh");
  const buttonValue = t("intentSummaryButton");
  const categoryLabelsValue = t("intentCategoryLabels");
  const emptyValue = t("intentSummaryEmpty");

  const title = typeof titleValue === "string" ? titleValue : "";
  const description = typeof descriptionValue === "string" ? descriptionValue : "";
  const question = typeof questionValue === "string" ? questionValue : "";
  const lowLabel = typeof lowLabelValue === "string" ? lowLabelValue : "Calm";
  const highLabel = typeof highLabelValue === "string" ? highLabelValue : "Imediat";
  const buttonLabel = typeof buttonValue === "string" ? buttonValue : "Continuă";
  const categoryLabels =
    categoryLabelsValue && typeof categoryLabelsValue === "object"
      ? (categoryLabelsValue as Record<string, string>)
      : {};

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-12">
      <div className="w-full max-w-4xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-10 text-center shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <TypewriterText key={title} text={title} speed={90} enableSound />
        {description ? (
          <p className="text-sm text-[#2C2C2C]/80">{description}</p>
        ) : null}

        <div className="space-y-4">
          {categories.filter((entry) => entry.count > 0).length === 0 ? (
            <p className="text-sm text-[#2C2C2C]/70">
              {typeof emptyValue === "string"
                ? emptyValue
                : "Selectează câteva opțiuni pentru a vedea analiza."}
            </p>
          ) : (
            categories
              .filter((entry) => entry.count > 0)
              .map((entry) => {
                const percentage = Math.round((entry.count / maxSelection) * 100);
                const label = categoryLabels[entry.category] ?? entry.category;
                return (
                  <div
                    key={`${entry.category}-${entry.count}`}
                    className="rounded-[12px] border border-[#E4D8CE] bg-[#FDFCF9]/60 px-5 py-4 text-left"
                  >
                    <div className="flex items-center justify-between text-sm font-medium text-[#2C2C2C]">
                      <span>{label}</span>
                      <span>
                        {entry.count}/{maxSelection}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-[#E8DDD3]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2C2C2C] via-[#C24B17] to-[#E60012]"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div className="space-y-3">
          {question ? (
            <p className="text-sm font-medium text-[#2C2C2C]">{question}</p>
          ) : null}
          <input
            type="range"
            min={MIN_URGENCY}
            max={MAX_URGENCY}
            value={urgency}
            onChange={(event) => setUrgency(Number(event.target.value))}
            className="w-full accent-[#E60012]"
            aria-label={question || "Select intensity"}
          />
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[#A08F82]">
            <span>{lowLabel}</span>
            <span className="text-[#E60012]">{urgency}/10</span>
            <span>{highLabel}</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onContinue(urgency)}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
