import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import type { useI18n } from "@/components/I18nProvider";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";

type MotivationCardProps = {
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  omniScopeScore: number;
  motivationDelta: number | null;
  facts: ProgressFact | null;
};

export default function MotivationCard({ lang, t, omniScopeScore, motivationDelta, facts }: MotivationCardProps) {
  return (
    <motion.div variants={fadeDelayed(0.15)} {...hoverScale}>
      <Card className="flex flex-col justify-between border border-[var(--omni-border-soft)] bg-[#FCF7F1] p-2 sm:p-2">
        <h2 className="mb-1 whitespace-nowrap text-[12px] font-semibold text-[var(--omni-ink)] sm:mb-1.5 sm:text-[13px]" title={lang === "ro" ? "Motivație / Resurse" : "Motivation / Resources"}>
          {lang === "ro" ? "Motivație / Resurse" : "Motivation / Resources"}
        </h2>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-[var(--omni-muted)] sm:text-xs">
              {getString(t, "dashboard.motivation.index", lang === "ro" ? "Indice motivație" : "Motivation index")}
            </span>
            <span className="flex items-baseline gap-1 text-sm font-bold text-[var(--omni-ink)] sm:text-base">
              {Math.max(0, Math.min(100, Math.round(omniScopeScore)))}
              {motivationDelta != null && Number.isFinite(motivationDelta) ? (
                <span
                  className={`text-[10px] font-semibold ${motivationDelta >= 0 ? "text-[#1F7A43]" : "text-[var(--omni-danger)]"}`}
                  title={getString(t, "dashboard.delta.vsLast", lang === "ro" ? "față de ultima vizită" : "vs last visit")}
                >
                  {motivationDelta >= 0 ? "+" : ""}
                  {Math.round(motivationDelta)}
                </span>
              ) : null}
            </span>
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, Math.round(omniScopeScore)))} className="h-1.5 w-full rounded bg-[#F7F2EC]">
            <div className="h-1.5 rounded bg-[#D8B6A3]" style={{ width: `${Math.max(0, Math.min(100, Math.round(omniScopeScore)))}%` }} />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-2">
          {(() => {
            const m = (facts?.motivation ?? {}) as Record<string, unknown>;
            const hours = Number(m.hoursPerWeek ?? 0);
            const tz = String(m.timeHorizon ?? "");
            const budget = String(m.budgetLevel ?? "");
            const mapBudget: Record<string, string> = {
              low: getString(t, "dashboard.budget.low", lang === "ro" ? "Buget minim" : "Low budget"),
              medium: getString(t, "dashboard.budget.medium", lang === "ro" ? "Buget mediu" : "Medium budget"),
              high: getString(t, "dashboard.budget.high", lang === "ro" ? "Buget maxim" : "High budget"),
            };
            const mapTz: Record<string, string> = {
              days: getString(t, "dashboard.tz.days", lang === "ro" ? "Zile" : "Days"),
              weeks: getString(t, "dashboard.tz.weeks", lang === "ro" ? "Săptămâni" : "Weeks"),
              months: getString(t, "dashboard.tz.months", lang === "ro" ? "Luni" : "Months"),
            };
            const chips: string[] = [];
            if (hours && Number.isFinite(hours)) chips.push(`${hours}h/săpt`);
            if (budget) chips.push(mapBudget[budget] ?? budget);
            if (tz) chips.push(mapTz[tz] ?? tz);
            if (!chips.length) {
              return (
                <span
                  className="rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-2 py-0.5 text-[10px] text-[var(--omni-muted)]"
                  title={getString(t, "dashboard.motivation.completeTooltip", lang === "ro" ? "Completează motivația pentru detalii." : "Complete motivation for details.")}
                >
                  {getString(t, "dashboard.motivation.complete", lang === "ro" ? "Completează motivația pentru detalii." : "Complete motivation for details.")}
                </span>
              );
            }
            return <p className="text-[10px] text-[var(--omni-muted)]">{chips.join(" · ")}</p>;
          })()}
        </div>
        <div className="mt-2 flex items-center justify-end">
          <Link href="/wizard?step=intentMotivation" className="text-[10px] text-[var(--omni-muted)] underline-offset-2 transition hover:text-[var(--omni-ink)] hover:underline">
            {lang === "ro" ? "Schimbă" : "Change"}
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
