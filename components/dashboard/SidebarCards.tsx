import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import Metric from "@/components/dashboard/Metric";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import type { useI18n } from "@/components/I18nProvider";
import type { Dispatch, SetStateAction } from "react";
import type { adaptProgressFacts } from "@/lib/progressAdapter";
import type { getDailyInsight } from "@/lib/insights";
import type { extractSessions } from "@/lib/progressAnalytics";
import type { OmniDailySnapshot } from "@/lib/omniState";
import { TodayGuidanceCard } from "./CenterColumnCards";
import { buildOmniAbilSnapshot, type OmniAbilSnapshot } from "./omniAbilSnapshot";

type SidebarCardsProps = {
  debugGrid?: boolean;
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  facts: ProgressFact | null;
  snapshot: OmniDailySnapshot | null;
  profile: { id?: string; simulatedInsights?: string[] } | null;
  quest: { title: string; text: string };
  questPreview: string;
  questExpanded: boolean;
  setQuestExpanded: Dispatch<SetStateAction<boolean>>;
  showAchv: boolean;
  setAchvDismissed: Dispatch<SetStateAction<boolean>>;
  insight: ReturnType<typeof getDailyInsight>;
  prog: ReturnType<typeof adaptProgressFacts>;
  sessions: ReturnType<typeof extractSessions>;
  refMs: number;
  currentFocusTag?: string;
  nowAnchor: number;
};

export default function SidebarCards({
  debugGrid,
  lang,
  t,
  facts,
  snapshot,
  profile,
  quest,
  questPreview,
  questExpanded,
  setQuestExpanded,
  showAchv,
  setAchvDismissed,
  insight,
  prog,
  sessions,
  refMs,
  currentFocusTag,
  nowAnchor,
}: SidebarCardsProps) {
  const readinessSnapshot = buildOmniAbilSnapshot({ lang, facts, sessions, refMs, currentFocusTag, nowAnchor });
  return (
    <div
      className={`mt-2 flex flex-col gap-2 md:mt-3 md:gap-3 lg:mt-0 lg:w-[320px] lg:flex-none lg:gap-4 ${
        debugGrid ? "outline outline-1 outline-[var(--omni-energy-soft)]/40" : ""
      }`}
    >
      <motion.div variants={fadeDelayed(0.16)} {...hoverScale}>
        <DailyInsightCard lang={lang} t={t} insight={insight} />
      </motion.div>
      <motion.div variants={fadeDelayed(0.2)} {...hoverScale}>
        <TodayGuidanceCard
          lang={lang}
          snapshot={snapshot}
          facts={facts}
        />
      </motion.div>
      <motion.div variants={fadeDelayed(0.26)} {...hoverScale}>
        <PracticeSnapshotCard prog={prog} />
      </motion.div>
      <motion.div variants={fadeDelayed(0.32)} {...hoverScale}>
        <TodaysQuestCard
          lang={lang}
          t={t}
          quest={quest}
          questPreview={questPreview}
          questExpanded={questExpanded}
          setQuestExpanded={setQuestExpanded}
          snapshot={readinessSnapshot}
        />
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
    <Card className="flex h-full flex-col rounded-xl border border-transparent bg-transparent p-0 shadow-none sm:p-0">
      <div>
        <h3 className="sr-only">
          {getString(t, "dashboard.insightTitle", lang === "ro" ? "Revelația zilei" : "Insight of the Day")}
        </h3>
        <div className="relative rounded-2xl border border-transparent bg-[var(--omni-surface-card)]/60 px-3 py-4 text-[#3E2F27] shadow-none">
          <span className="absolute -top-1 left-2 text-xl text-[#E3D3C6]">“</span>
          <p
            id="daily-insight-text"
            className="text-[11px] italic leading-relaxed text-[#9A7D70] sm:text-xs line-clamp-3"
            style={{ fontFamily: '"Comic Sans MS","Segoe Script","Bradley Hand",cursive' }}
          >
            {insight.text}
          </p>
          <span className="absolute -bottom-1 right-2 text-xl text-[#E3D3C6]">”</span>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-end sm:mt-2">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("daily-insight-text");
            if (el) el.classList.toggle("line-clamp-3");
          }}
          className="text-[10px] font-medium text-[#A3765A] underline-offset-2 hover:text-[#7A4E3B] hover:underline"
        >
          {lang === "ro" ? "Vezi tot" : "See all"}
        </button>
      </div>
    </Card>
  );
}

function PracticeSnapshotCard({ prog }: { prog: ReturnType<typeof adaptProgressFacts> }) {
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-2.5 shadow-sm sm:p-3">
      <h4 className="mb-1 text-xs font-semibold text-[var(--omni-muted)] sm:mb-2 sm:text-sm">Practice snapshot</h4>
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
  snapshot: OmniAbilSnapshot;
};

function TodaysQuestCard({ lang, t, quest, questPreview, questExpanded, setQuestExpanded, snapshot }: TodaysQuestCardProps) {
  const makeBar = (val01: number, accent: string) => (
    <div className="h-1.5 w-full rounded-full bg-[#E8DED4]">
      <div className="h-1.5 rounded-full" style={{ width: `${Math.max(0, Math.min(100, Math.round(val01 * 100)))}%`, background: accent }} />
    </div>
  );
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-3 py-2 shadow-sm sm:px-4 sm:py-3 h-auto">
      <h3 className="mb-1 text-xs font-semibold text-[var(--omni-muted)] sm:mb-2 sm:text-sm">{getString(t, "dashboard.todayQuest", lang === "ro" ? "Provocarea de azi" : "Today’s quest")}</h3>
      <div className="relative">
        <p className="text-[11px] leading-relaxed text-[var(--omni-ink)] sm:text-xs">{questExpanded ? quest.text : questPreview}</p>
      </div>
      <div className="mt-1 flex items-center justify-between sm:mt-2">
        <p className="text-[9px] uppercase tracking-[0.16em] text-[var(--omni-muted)] sm:text-[10px]">{lang === "ro" ? "Aplică azi, în viața reală." : "Apply today, in real life."}</p>
        {(quest?.text || "").length > (questPreview?.length || 0) ? (
          <button type="button" onClick={() => setQuestExpanded((v) => !v)} className="text-[11px] font-semibold text-[var(--omni-muted)] underline hover:text-[var(--omni-ink)]">
            {questExpanded ? (lang === "ro" ? "Mai puțin" : "Less") : lang === "ro" ? "Vezi tot" : "More"}
          </button>
        ) : (
          <span className="text-[11px] text-transparent">—</span>
        )}
      </div>
      <div className="mt-3 space-y-2 rounded-2xl border border-[#F0E8E0] bg-[var(--omni-bg-paper)] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
          <span className={`rounded-full border px-2 py-0.5 ${snapshot.badge.cls}`}>{snapshot.badge.text}</span>
          <span>{lang === "ro" ? "Starea ta acum" : "Your current state"}</span>
        </div>
        <div className="space-y-1.5 text-[10px] text-[var(--omni-muted)] sm:text-[11px]">
          <div>
            <p className="font-semibold text-[var(--omni-ink)]">{lang === "ro" ? "Energia" : "Energy"}</p>
            {makeBar(snapshot.energy / 10, "#F7B267")}
          </div>
          <div>
            <p className="font-semibold text-[var(--omni-ink)]">{lang === "ro" ? "Echilibrul emoțional" : "Emotional balance"}</p>
            {makeBar((10 - snapshot.stress) / 10, "#C27BA0")}
          </div>
          <div>
            <p className="font-semibold text-[var(--omni-ink)]">{lang === "ro" ? "Claritatea" : "Clarity"}</p>
            {makeBar(snapshot.clarity / 10, "#6A9FB5")}
          </div>
        </div>
        <div className="rounded-2xl border border-[#EADFD4] bg-[var(--omni-surface-card)] px-3 py-2 text-[11px] text-[#4D3F36] sm:text-xs">
          <p className="text-[11px] font-semibold text-[var(--omni-ink)] sm:text-xs">{lang === "ro" ? "De ce această recomandare" : "Why this recommendation"}</p>
          <p>{snapshot.why}</p>
        </div>
      </div>
    </Card>
  );
}

function AchievementBanner({ lang, setAchvDismissed }: { lang: string; setAchvDismissed: Dispatch<SetStateAction<boolean>> }) {
  return (
    <div className="mt-1 rounded-xl border border-[var(--omni-success)] bg-[var(--omni-success-soft)] p-2 text-sm text-[var(--omni-ink-soft)] sm:mt-2 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
        <p className="text-[13px] font-medium sm:text-sm">{lang === "ro" ? "Prima treaptă atinsă: Claritate mentală" : "First milestone reached: Clarity"}</p>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/antrenament" className="rounded border border-[var(--omni-ink-soft)] px-1.5 py-0.5 text-[10px] hover:bg-[var(--omni-ink-soft)] hover:text-white sm:px-2 sm:text-[11px]" aria-label="Go to Training">
            {lang === "ro" ? "Începe antrenamentul" : "Go to Training"}
          </Link>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.localStorage.setItem("omni_onboarding_achv_dismissed", "1");
              setAchvDismissed(true);
            }}
            className="rounded border border-[var(--omni-ink-soft)] px-1.5 py-0.5 text-[10px] sm:px-2 sm:text-[11px]"
            aria-label="Dismiss achievement"
          >
            {lang === "ro" ? "OK" : "OK"}
          </button>
        </div>
      </div>
      <p className="mt-0.5 text-[12px] text-[var(--omni-ink-soft)] sm:mt-1 sm:text-[12px]">
        {lang === "ro" ? "Ai trecut prin primele două etape. Continuă cu exercițiile scurte pentru a stabiliza progresul." : "You’ve completed the first two steps. Continue with short exercises to stabilize progress."}
      </p>
    </div>
  );
}

function SimulatedInsightsCard({ lang, t, insights }: { lang: string; t: ReturnType<typeof useI18n>["t"]; insights: string[] }) {
  return (
    <Card className="rounded-xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-2 shadow-sm sm:p-3">
      <h3 className="mb-1 text-xs font-semibold text-[var(--omni-muted)] sm:mb-2 sm:text-sm">{getString(t, "dashboard.initialInsights", lang === "ro" ? "Insight-uri inițiale" : "Initial insights")}</h3>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {insights.map((tag, i) => (
          <span key={`${tag}-${i}`} className="rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2 py-0.5 text-[10px] text-[var(--omni-ink)] sm:px-2.5 sm:text-[11px]">
            {tag}
          </span>
        ))}
      </div>
    </Card>
  );
}
