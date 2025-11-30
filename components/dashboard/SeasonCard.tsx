"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";
import type { ProgressFact } from "@/lib/progressFacts";
import { OMNI_ARCS } from "@/config/omniArcs";
import { getArcLessonProgress, getLessonNavigationMeta, getNextArcAction } from "@/lib/omniArcs";

type SeasonCardProps = {
  lang: string;
  facts: ProgressFact | null;
  arcId?: string;
};

const DEFAULT_ARC_ID = "claritate-energie";

export function SeasonCard({ lang, facts, arcId = DEFAULT_ARC_ID }: SeasonCardProps) {
  const router = useRouter();
  const arc = OMNI_ARCS.find((item) => item.id === arcId) ?? OMNI_ARCS[0];
  const progress = useMemo(() => getArcLessonProgress(facts, arc.id), [facts, arc.id]);
  const abilSummary = facts?.omni?.abil;
  const dailySummary = facts?.omni?.daily;
  const abilDailyCount = abilSummary?.dailyCompletedThisWeek ?? 0;
  const abilWeeklyCount = abilSummary?.weeklyCompletedThisMonth ?? 0;
  const dailyStreak = dailySummary?.streakDays ?? 0;
  const nextAction = useMemo(() => getNextArcAction(facts, arc.id), [facts, arc.id]);
  const arcLevel =
    typeof facts?.omni?.level === "number" ? Math.max(1, Math.floor(facts.omni.level)) : null;

  const { ctaLabel, href } = useMemo(() => {
    switch (nextAction.type) {
      case "lesson": {
        const meta = getLessonNavigationMeta(nextAction.target);
        if (meta) {
          const query = new URLSearchParams({
            area: meta.areaKey,
            module: meta.moduleId,
            lesson: nextAction.target,
          });
          return {
            ctaLabel: lang === "ro" ? "Continuă lecțiile" : "Resume lessons",
            href: `/omni-kuno?${query.toString()}`,
          };
        }
        return {
          ctaLabel: lang === "ro" ? "Continuă lecțiile" : "Resume lessons",
          href: "/omni-kuno",
        };
      }
      case "daily":
        return {
          ctaLabel: lang === "ro" ? "Fă Daily Reset" : "Complete Daily Reset",
          href: "/progress?highlight=daily-reset",
        };
      case "abil":
        return {
          ctaLabel: lang === "ro" ? "Lansează OmniAbil" : "Open OmniAbil",
          href: "/progress?highlight=omniabil",
        };
      default:
        return {
          ctaLabel: lang === "ro" ? "Explorează harta mentală" : "Explore the map",
          href: "/mental-universe",
        };
    }
  }, [lang, nextAction]);

  const handleCta = () => {
    router.push(href);
  };

  return (
    <DashboardCard
      title={lang === "ro" ? "Season 1" : "Season 1"}
      subtitle={arc.title}
      ctaLabel={ctaLabel}
      onCtaClick={handleCta}
    >
      <div className="space-y-3 text-sm text-[#4D3F36]">
        {arcLevel ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EADFD4] bg-[#FFF9F3] px-3 py-1 text-[12px] font-semibold text-[var(--omni-ink-soft)]">
            {lang === "ro" ? `Nivel ${arcLevel} – Arc 1` : `Level ${arcLevel} – Arc 1`}
          </div>
        ) : null}
        <div>
          <p className="text-[12px] font-semibold text-[var(--omni-ink)]">
            {lang === "ro" ? "Progres lecții" : "Lesson progress"}
          </p>
          <div className="mt-1 h-2 rounded-full bg-[#F2E7DD]">
            <div
              className="h-2 rounded-full bg-[var(--omni-energy)]"
              style={{ width: `${Math.min(100, progress.percentage)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--omni-muted)]">
            {progress.completed}/{progress.total} ({progress.percentage}%)
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px] text-[var(--omni-muted)]">
          <div className="rounded-2xl border border-[#EADFD4] bg-[var(--omni-bg-paper)] px-2 py-2 text-center">
            <p className="text-[18px] font-semibold text-[var(--omni-ink)]">{abilDailyCount}</p>
            <p>{lang === "ro" ? "Daily" : "Daily"}</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD4] bg-[var(--omni-bg-paper)] px-2 py-2 text-center">
            <p className="text-[18px] font-semibold text-[var(--omni-ink)]">{abilWeeklyCount}</p>
            <p>{lang === "ro" ? "Weekly" : "Weekly"}</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD4] bg-[var(--omni-bg-paper)] px-2 py-2 text-center">
            <p className="text-[18px] font-semibold text-[var(--omni-ink)]">{dailyStreak}</p>
            <p>{lang === "ro" ? "Streak" : "Streak"}</p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
