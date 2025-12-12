 "use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DailyAxesEntry } from "@/lib/dailyReset";
import { DailyAxesMicroChart, getDailyAxesMessage } from "@/components/dailyReset/DailyResetAxesSection";

type PulseOfDayProps = {
  today: DailyAxesEntry | null;
  recentEntries: DailyAxesEntry[];
  lang: "ro" | "en";
};

export function PulseOfDayColumn({ today, recentEntries, lang }: PulseOfDayProps) {
  const router = useRouter();
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

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border/70 bg-surface px-5 py-6 text-textMain shadow-card min-h-[380px]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-textSecondary">
          {lang === "ro" ? "Axe zilnice · Claritate · Emoție · Energie" : "Daily axes · Clarity · Emotion · Energy"}
        </p>
        <p className="mt-1 text-xs text-textSecondary">
          {lang === "ro"
            ? "Rezumatul scorurilor tale de azi vs. media personală."
            : "Summary of today’s scores versus your personal average."}
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-surfaceAlt/80 px-4 py-4 text-sm leading-relaxed text-textMain">
        {message}
      </div>

      {hasEntries && resolvedToday ? (
        <div className="rounded-xl border border-border/60 bg-surfaceAlt px-3 py-3">
          <DailyAxesMicroChart entries={recentEntries} lang={lang} />
        </div>
      ) : null}

      <button
        type="button"
        className="w-full rounded-[32px] bg-[var(--omni-ink)] px-6 py-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:-translate-y-0.5 hover:shadow-ctaHover"
        onClick={() => router.push("/omni-abil")}
      >
        {lang === "ro" ? "Continuă cu acțiunea ta Omni-Abil de azi →" : "Continue today’s Omni-Abil action →"}
      </button>
    </div>
  );
}
