"use client";

import { useMemo } from "react";
import type { DailyAxesEntry } from "@/lib/dailyReset";
import { DailyAxesMicroChart, getDailyAxesMessage } from "@/components/dailyReset/DailyResetAxesSection";

export type PulseOfDayCardProps = {
  today: DailyAxesEntry | null;
  recentEntries: DailyAxesEntry[];
  lang?: "ro" | "en";
};

export function PulseOfDayCard({ today, recentEntries, lang = "ro" }: PulseOfDayCardProps) {
  const hasEntries = Array.isArray(recentEntries) && recentEntries.length > 0;
  const resolvedToday = today ?? (hasEntries ? recentEntries[recentEntries.length - 1] : null);
  const message = useMemo(() => {
    if (!resolvedToday) {
      return lang === "ro"
        ? "Completează Reset-ul Zilnic pentru a vedea tendințele tale de azi."
        : "Complete the Daily Reset to see today’s trend.";
    }
    return getDailyAxesMessage(resolvedToday, lang);
  }, [resolvedToday, lang]);

  const title = hasEntries
    ? lang === "ro"
      ? "Pulsul zilei – Evoluție"
      : "Pulse of the day – Evolution"
    : lang === "ro"
      ? "Pulsul zilei – Start"
      : "Pulse of the day – Start";
  const subtitle = hasEntries
    ? lang === "ro"
      ? "Rezumatul scorurilor tale de azi vs. media personală."
      : "Summary of today’s scores versus your personal average."
    : lang === "ro"
      ? "Completează Reset-ul pentru a debloca evoluția axelor."
      : "Complete the Daily Reset to unlock your trend.";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-surface-soft bg-surface px-5 py-6 text-textMain">
      <div>
        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-textSecondary">{title}</p>
        <p className="text-xs text-textSecondary">{subtitle}</p>
      </div>
      <div className="rounded-xl border border-surface-soft px-4 py-4 text-sm leading-relaxed">
        {message}
      </div>

      {hasEntries && resolvedToday ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <AxisMiniCard
              label={lang === "ro" ? "Claritate" : "Clarity"}
              score={resolvedToday.clarityScore}
              delta={resolvedToday.clarityDeltaFromPersonalMean}
              colorClass="text-kunoAccent"
              lang={lang}
            />
            <AxisMiniCard
              label={lang === "ro" ? "Emoție" : "Emotion"}
              score={resolvedToday.emotionScore}
              delta={resolvedToday.emotionDeltaFromPersonalMean}
              colorClass="text-abilAccent"
              lang={lang}
            />
            <AxisMiniCard
              label={lang === "ro" ? "Energie" : "Energy"}
              score={resolvedToday.energyScore}
              delta={resolvedToday.energyDeltaFromPersonalMean}
              colorClass="text-flexAccent"
              lang={lang}
            />
          </div>

          <div className="rounded-xl border border-surface-soft px-3 py-3">
            <DailyAxesMicroChart entries={recentEntries} lang={lang} />
          </div>
        </>
      ) : null}
    </div>
  );
}

type AxisMiniCardProps = {
  label: string;
  score: number | null | undefined;
  delta: number | null | undefined;
  colorClass: string;
  lang: "ro" | "en";
};

function AxisMiniCard({ label, score, delta, colorClass, lang }: AxisMiniCardProps) {
  const validScore = typeof score === "number" && Number.isFinite(score);
  const formattedScore = validScore ? score.toFixed(1) : "–";
  const numericDelta = typeof delta === "number" && Number.isFinite(delta) ? delta : null;
  const deltaLabel = (() => {
    if (numericDelta === null || Math.abs(numericDelta) < 0.05) {
      return lang === "ro" ? "egal cu media" : "even with average";
    }
    const prefix = numericDelta > 0 ? "+" : "";
    return `${prefix}${numericDelta.toFixed(1)} ${lang === "ro" ? "vs. medie" : "vs. avg"}`;
  })();
  const deltaClass =
    numericDelta === null || Math.abs(numericDelta) < 0.05
      ? "text-textSecondary"
      : numericDelta > 0
        ? "text-[var(--omni-success)]"
        : "text-[var(--omni-danger)]";
  return (
    <div className="rounded-xl border border-surface-soft px-4 py-3 text-center">
      <p className="text-xs text-textSecondary">{label}</p>
      <p className={`text-xl font-semibold ${colorClass}`}>{formattedScore}</p>
      <p className={`text-xs ${deltaClass}`}>{deltaLabel}</p>
    </div>
  );
}
