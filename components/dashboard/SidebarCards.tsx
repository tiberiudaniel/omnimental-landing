import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import Metric from "@/components/dashboard/Metric";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import type { useI18n } from "@/components/I18nProvider";
import { toMsLocal } from "@/lib/dashboard/progressSelectors";
import type { Dispatch, SetStateAction } from "react";
import type { adaptProgressFacts } from "@/lib/progressAdapter";
import type { getDailyInsight } from "@/lib/insights";

type SidebarCardsProps = {
  debugGrid?: boolean;
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  facts: ProgressFact | null;
  profile: { simulatedInsights?: string[] } | null;
  quest: { title: string; text: string };
  questPreview: string;
  questExpanded: boolean;
  setQuestExpanded: Dispatch<SetStateAction<boolean>>;
  showAchv: boolean;
  setAchvDismissed: Dispatch<SetStateAction<boolean>>;
  insight: ReturnType<typeof getDailyInsight>;
  prog: ReturnType<typeof adaptProgressFacts>;
};

export default function SidebarCards({
  debugGrid,
  lang,
  t,
  facts,
  profile,
  quest,
  questPreview,
  questExpanded,
  setQuestExpanded,
  showAchv,
  setAchvDismissed,
  insight,
  prog,
}: SidebarCardsProps) {
  return (
    <div
      className={`mt-2 flex flex-col gap-2 md:mt-3 lg:mt-0 lg:w-[320px] lg:flex-none ${
        debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""
      }`}
    >
      <motion.div variants={fadeDelayed(0.16)} {...hoverScale}>
        <DailyInsightCard lang={lang} t={t} insight={insight} />
      </motion.div>
      <motion.div variants={fadeDelayed(0.28)} {...hoverScale}>
        <RecentEntriesCard lang={lang} facts={facts} />
      </motion.div>
      <motion.div variants={fadeDelayed(0.26)} {...hoverScale}>
        <PracticeSnapshotCard prog={prog} />
      </motion.div>
      <motion.div variants={fadeDelayed(0.32)} {...hoverScale}>
        <TodaysQuestCard lang={lang} t={t} quest={quest} questPreview={questPreview} questExpanded={questExpanded} setQuestExpanded={setQuestExpanded} />
      </motion.div>
      {showAchv ? <AchievementBanner lang={lang} setAchvDismissed={setAchvDismissed} /> : null}
      {Array.isArray(profile?.simulatedInsights) && profile.simulatedInsights.length > 0 ? (
        <motion.div variants={fadeDelayed(0.3)} {...hoverScale} className="mt-1 sm:mt-2">
          <SimulatedInsightsCard lang={lang} t={t} insights={profile.simulatedInsights} />
        </motion.div>
      ) : null}
    </div>
  );
}

function DailyInsightCard({ lang, t, insight }: { lang: string; t: ReturnType<typeof useI18n>["t"]; insight: ReturnType<typeof getDailyInsight> }) {
  return (
    <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
      <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
        {getString(t, "dashboard.insightTitle", lang === "ro" ? "Revelația zilei" : "Insight of the Day")}
      </h3>
      <div className="relative">
        <p className="text-[11px] leading-relaxed text-[#2C2C2C] sm:text-xs">{insight.text}</p>
      </div>
      <div className="mt-1 flex items-center justify-between sm:mt-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-[#A08F82] sm:text-[10px]">
          {getString(t, "dashboard.themeLabel", lang === "ro" ? "Temă" : "Theme")}: {insight.theme}
        </p>
      </div>
    </Card>
  );
}

function RecentEntriesCard({ lang, facts }: { lang: string; facts: ProgressFact | null }) {
  const entries = (facts?.recentEntries as Array<{ text?: string; timestamp?: unknown; tabId?: string }> | undefined) ?? [];
  const hasEntries = entries.length > 0;
  const grouped = (() => {
    if (!hasEntries) return [];
    const sorted = entries
      .map((e) => ({ ...e, _ms: toMsLocal(e.timestamp), _text: String(e.text ?? "").trim() }))
      .sort((a, b) => b._ms - a._ms);
    const dedup: Array<(typeof sorted)[number]> = [];
    const seen = new Set<string>();
    for (const item of sorted) {
      const key = item._text;
      if (key && !seen.has(key)) {
        seen.add(key);
        dedup.push(item);
      }
    }
    const items = dedup.slice(0, 2);
    const groups: Record<string, Array<{ text: string; ms: number; tab?: string }>> = {};
    const fmtDay = (ms: number) => {
      try {
        return new Date(ms).toLocaleDateString(lang === "ro" ? "ro-RO" : "en-US", { year: "numeric", month: "short", day: "numeric" });
      } catch {
        return "";
      }
    };
    for (const it of items) {
      if (!it._ms) continue;
      const day = fmtDay(it._ms);
      if (!day) continue;
      if (!groups[day]) groups[day] = [];
      groups[day].push({ text: it._text || "-", ms: it._ms, tab: it.tabId });
    }
    return Object.entries(groups).map(([day, list]) => ({ day, items: list }));
  })();
  const fmtTime = (ms: number) => {
    try {
      return new Date(ms).toLocaleTimeString(lang === "ro" ? "ro-RO" : "en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };
  return (
    <Card className="min-w-0 rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3.5">
      <div className="mb-1 flex items-center justify-between sm:mb-2">
        <h4 className="text-xs font-semibold text-[#7B6B60] sm:text-sm">{lang === "ro" ? "Însemnări recente" : "Recent Entries"}</h4>
        <div className="flex items-center gap-1">
          <Link
            href={{ pathname: "/progress", query: { open: "journal" } }}
            className="rounded-[10px] border border-[#2C2C2C] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] sm:px-2 sm:text-[10px]"
            aria-label="Open journal"
          >
            {lang === "ro" ? "Jurnal" : "Journal"}
          </Link>
        </div>
      </div>
      {!hasEntries ? (
        <p className="rounded-[10px] border border-[#F0E8E0] bg-[#FFFBF7] px-2 py-1.5 text-[11px] text-[#6A6A6A] sm:px-2.5 sm:py-2 sm:text-xs">
          {lang === "ro" ? "Nimic deocamdată. Scrie un jurnal sau finalizează un exercițiu." : "Nothing yet. Add a journal entry or complete a practice."}
        </p>
      ) : (
        <div className="space-y-2">
          {grouped.map((group) => (
            <div key={group.day}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A08F82] sm:text-[11px]">{group.day}</p>
              {group.items.map((item, idx) => {
                const tab = typeof item.tab === "string" && item.tab ? item.tab : "OBSERVATII_EVALUARE";
                const href = { pathname: "/progress", query: { open: "journal", tab } } as const;
                const full = String(item.text);
                const MAX_PREVIEW = 60;
                const short = full.length > MAX_PREVIEW ? `${full.slice(0, MAX_PREVIEW).trimEnd()}…` : full;
                return (
                  <div key={`${group.day}-${idx}`} className="mb-1.5 border-b border-[#F0E8E0] pb-1.5 last:border-b-0 last:pb-0 sm:mb-2.5 sm:pb-2">
                    <Link href={href} className="block truncate text-[11px] text-[#2C2C2C] underline-offset-2 hover:underline sm:text-xs" title={full}>
                      {short}
                    </Link>
                    <p className="mt-0.5 text-[9px] text-[#A08F82] sm:mt-1 sm:text-[10px]" suppressHydrationWarning>
                      {fmtTime(item.ms)}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <div className="mt-1 flex items-center justify-end sm:mt-2">
        <Link
          href={{ pathname: "/progress", query: { open: "journal" } }}
          className="text-[10px] text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline"
        >
          {lang === "ro" ? "Vezi tot" : "See all"}
        </Link>
      </div>
    </Card>
  );
}

function PracticeSnapshotCard({ prog }: { prog: ReturnType<typeof adaptProgressFacts> }) {
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
      <h4 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">Practice snapshot</h4>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Metric label="Reflections" value={prog.reflectionCount} testId="metric-reflections" />
        <Metric label="Breathing min" value={prog.breathingCount} />
        <Metric label="Focus drills" value={prog.drillsCount} />
        <Metric label="Energy idx" value={prog.indices.energy} />
      </div>
    </Card>
  );
}

type TodaysQuestCardProps = {
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  quest: { title: string; text: string };
  questPreview: string;
  questExpanded: boolean;
  setQuestExpanded: Dispatch<SetStateAction<boolean>>;
};

function TodaysQuestCard({ lang, t, quest, questPreview, questExpanded, setQuestExpanded }: TodaysQuestCardProps) {
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-3 h-auto">
      <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">{getString(t, "dashboard.todayQuest", lang === "ro" ? "Provocarea de azi" : "Today’s quest")}</h3>
      <div className="relative">
        <p className="text-[11px] leading-relaxed text-[#2C2C2C] sm:text-xs">{questExpanded ? quest.text : questPreview}</p>
      </div>
      <div className="mt-1 flex items-center justify-between sm:mt-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-[#A08F82] sm:text-[10px]">{lang === "ro" ? "Aplică azi, în viața reală." : "Apply today, in real life."}</p>
        {(quest?.text || "").length > (questPreview?.length || 0) ? (
          <button type="button" onClick={() => setQuestExpanded((v) => !v)} className="text-[11px] font-semibold text-[#7B6B60] underline hover:text-[#2C2C2C]">
            {questExpanded ? (lang === "ro" ? "Mai puțin" : "Less") : lang === "ro" ? "Vezi tot" : "More"}
          </button>
        ) : (
          <span className="text-[11px] text-transparent">—</span>
        )}
      </div>
    </Card>
  );
}

function AchievementBanner({ lang, setAchvDismissed }: { lang: string; setAchvDismissed: Dispatch<SetStateAction<boolean>> }) {
  return (
    <div className="mt-1 rounded-xl border border-[#CBE8D7] bg-[#F3FFF8] p-2 text-sm text-[#1F3C2F] sm:mt-2 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
        <p className="text-[13px] font-medium sm:text-sm">{lang === "ro" ? "Prima treaptă atinsă: Claritate mentală" : "First milestone reached: Clarity"}</p>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/antrenament" className="rounded border border-[#1F3C2F] px-1.5 py-0.5 text-[10px] hover:bg-[#1F3C2F] hover:text-white sm:px-2 sm:text-[11px]" aria-label="Go to Training">
            {lang === "ro" ? "Începe antrenamentul" : "Go to Training"}
          </Link>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.localStorage.setItem("omni_onboarding_achv_dismissed", "1");
              setAchvDismissed(true);
            }}
            className="rounded border border-[#1F3C2F] px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px]"
            aria-label="Dismiss achievement"
          >
            {lang === "ro" ? "OK" : "OK"}
          </button>
        </div>
      </div>
      <p className="mt-0.5 text-[12px] text-[#1F3C2F] sm:mt-1 sm:text-[12px]">
        {lang === "ro" ? "Ai trecut prin primele două etape. Continuă cu exercițiile scurte pentru a stabiliza progresul." : "You’ve completed the first two steps. Continue with short exercises to stabilize progress."}
      </p>
    </div>
  );
}

function SimulatedInsightsCard({ lang, t, insights }: { lang: string; t: ReturnType<typeof useI18n>["t"]; insights: string[] }) {
  return (
    <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2 shadow-sm sm:p-3">
      <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">{getString(t, "dashboard.initialInsights", lang === "ro" ? "Insight-uri inițiale" : "Initial insights")}</h3>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {insights.map((tag, i) => (
          <span key={`${tag}-${i}`} className="rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#2C2C2C] sm:px-2.5 sm:text-[11px]">
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
}
