"use client";

import { Card } from "@/components/ui/card";
import { useProgressFacts } from "@/components/useProgressFacts";
import type { ProgressFact } from "@/lib/progressFacts";
import { adaptProgressFacts } from "@/lib/progressAdapter";
import { getDailyInsight } from "@/lib/insights";
import type { OmniBlock } from "@/lib/omniIntel";

import { motion, type Variants } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useProfile } from "@/components/ProfileProvider";
import { useMemo, useState } from "react";
import WeeklyTrendsChart from "@/components/charts/WeeklyTrendsChart";
import { extractSessions, computeWeeklyBuckets, computeTodayBucket, computeWeeklyCounts, computeTodayCounts } from "@/lib/progressAnalytics";

// ------------------------------------------------------
// Animations
// ------------------------------------------------------
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const fadeDelayed = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, delay } },
});

const hoverScale = {
  whileHover: { scale: 1.015, transition: { duration: 0.12 } },
};

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------
function toMsLocal(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof (ts as { toDate?: () => Date })?.toDate === "function") {
    return (ts as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

// ------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------
export default function ProgressDashboard({
  profileId,
  demoFacts,
}: {
  profileId: string;
  demoFacts?: ProgressFact;
}) {
  const { data: liveFacts, loading: liveLoading } = useProgressFacts(profileId);
  const { profile } = useProfile();
  const facts = demoFacts ?? liveFacts;
  const loading = demoFacts ? false : liveLoading;
  const { t, lang } = useI18n();
  // Hooks must be declared before any early returns
  const [timeframe, setTimeframe] = useState<"day" | "week">("week");
  const [metric, setMetric] = useState<"min" | "count">("min");
  const [achvDismissed, setAchvDismissed] = useState(false);
  const showAchv = useMemo(() => {
    if (typeof window === "undefined") return false;
    const omni = (facts?.omni as OmniBlock | undefined) ?? undefined;
    const score = (omni?.kuno?.averagePercent ?? omni?.kuno?.knowledgeIndex ?? 0) as number;
    const hasInsights = Array.isArray(profile?.simulatedInsights) && (profile?.simulatedInsights?.length ?? 0) > 0;
    const dismissed = window.localStorage.getItem("omni_onboarding_achv_dismissed") === "1";
    return score > 0 && hasInsights && !dismissed && !achvDismissed;
  }, [facts, profile?.simulatedInsights, achvDismissed]);

  // Loading state
  if (loading) {
    return (
      <section className="w-full bg-[#FDFCF9] px-3 py-5 lg:px-5">
        <h1 className="mb-3 text-lg font-bold text-[#2C2C2C] lg:mb-4 lg:text-2xl">
          OmniMental Progress
        </h1>
        <Card className="rounded-2xl border border-[#E4DAD1] bg-white/90 px-4 py-6 text-sm text-[#6A6A6A] shadow-sm">
          Se încarcă datele...
        </Card>
      </section>
    );
  }

  // Empty-state: ai nevoie de cel puțin intenții + o evaluare
  const hasEvaluation = Boolean(facts?.evaluation);
  const hasIntent = Boolean(facts?.intent);
  if (!hasEvaluation || !hasIntent) {
    const missing: string[] = [];
    if (!hasIntent) missing.push("intenții");
    if (!hasEvaluation) missing.push("evaluare");
    return (
      <section className="w-full bg-[#FDFCF9] px-3 py-5 lg:px-5">
        <h1 className="mb-3 text-lg font-bold text-[#2C2C2C] lg:mb-4 lg:text-2xl">
          OmniMental Progress
        </h1>
        <Card className="rounded-2xl border border-[#E4DAD1] bg-white/90 px-4 py-6 text-sm text-[#6A6A6A] shadow-sm">
          Nu avem încă suficiente date salvate pentru a construi dashboard-ul.
          Completează cel puțin o evaluare și o sesiune de intenții pentru a
          vedea progresul aici.
          {!!missing.length && (
            <p className="mt-2 text-xs text-[#A08F82]">
              Lipsesc: {missing.join(", ")}
            </p>
          )}
        </Card>
      </section>
    );
  }

  const prog = adaptProgressFacts(facts);
  const insight = getDailyInsight(prog.strengths.dominantTheme);
  const sessions = extractSessions(facts ?? null);

  const refMs =
    (facts?.updatedAt instanceof Date ? facts.updatedAt.getTime() : 0) ||
    Math.max(0, ...sessions.map((s: { startedAt?: unknown }) => toMsLocal(s.startedAt))) ||
    1;

  const weekly = computeWeeklyBuckets(sessions, refMs);
  const weeklyCounts = computeWeeklyCounts(sessions, refMs);
  const today = computeTodayBucket(sessions, refMs);
  const todayCounts = computeTodayCounts(sessions, refMs);

  // ---- Profile indices from Omni block ----
  const omni: OmniBlock | undefined = facts?.omni as OmniBlock | undefined;
  const omniIntelScore =
    (omni?.omniIntelScore as number | undefined) ??
    Math.round((prog.indices.clarity + prog.indices.calm + prog.indices.energy) / 3);
  const omniCunoScore = (omni?.kuno?.averagePercent ?? omni?.kuno?.knowledgeIndex ?? 0) as number;
  const motivationIdx = (omni?.scope?.motivationIndex ?? omni?.scope?.directionMotivationIndex ?? 0) as number;
  const omniAbilScore = (omni?.abil?.practiceIndex ?? omni?.abil?.skillsIndex ?? 0) as number;
  const omniFlowScore = (omni?.flow?.flowIndex ?? omni?.intel?.consistencyIndex ?? 0) as number;

  const quest = (() => {
    const q = facts?.quests?.items?.[0] as { title?: string; body?: string } | undefined;
    const fallbackTitle = getString(t, "dashboard.todayQuest", lang === "ro" ? "Provocarea de azi" : "Today’s quest");
    if (q) {
      const title = q.title && q.title.trim().length ? q.title : fallbackTitle;
      const text = q.body ?? "";
      return { title, text };
    }
    return {
      title: fallbackTitle,
      text:
        "Alege un moment concret din următoarele 24 de ore în care să aplici o tehnică de respirație sau de focus și notează ce observi în corp și în minte.",
    };
  })();

  // Onboarding achievement banner state handled above to satisfy hooks rules

  return (
    <motion.section
      initial="hidden"
      animate="show"
      className="w-full bg-[#FDFCF9] px-2 py-4 lg:px-4 lg:py-5"
    >
      <motion.h1
        variants={fadeUp}
        className="mb-3 text-lg font-bold text-[#2C2C2C] lg:mb-4 lg:text-2xl"
      >
        OmniMental Progress
      </motion.h1>

      {/* CARD CONTAINER – tot dashboard-ul într-un singur card */}
      <Card className="rounded-2xl border border-[#E4DAD1] bg-white/90 px-3 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)] lg:px-4 lg:py-5">
        {/* GRID PRINCIPAL: 3 coloane */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.05fr_1.25fr_0.8fr] lg:gap-4">
          {/* --------------------------------------------------------
              LEFT COLUMN – pie chart + weekly
          -------------------------------------------------------- */}
          <div className="order-2 space-y-3 lg:order-1">
            {/* Internal indices – PIE CHART */}
            <motion.div variants={fadeDelayed(0.05)} {...hoverScale}>
              <Card className="flex items-center gap-3 rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm">
                <div className="flex-1">
                  <h3 className="mb-1.5 text-sm font-semibold text-[#2C2C2C]">
                    Indicatori interni
                  </h3>
                  <p className="mb-2 text-[11px] text-[#7B6B60]">
                    Claritate, calm și energie în ultima perioadă.
                  </p>
                  <InternalPie
                    clarity={prog.indices.clarity}
                    calm={prog.indices.calm}
                    energy={prog.indices.energy}
                  />
                </div>
                <div className="w-[40%] space-y-1.5 text-[11px]">
                  <LegendRow
                    label="Claritate"
                    color="#7A6455"
                    value={prog.indices.clarity}
                  />
                  <LegendRow
                    label="Calm"
                    color="#4D3F36"
                    value={prog.indices.calm}
                  />
                  <LegendRow
                    label="Energie"
                    color="#C07963"
                    value={prog.indices.energy}
                  />
                </div>
              </Card>
            </motion.div>

            {/* Weekly Trends – toggle Day/Week and Minutes/Sessions */}
            <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
              <Card className="rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-[#2C2C2C]">
                  {getString(t, "dashboard.trendsTitle", lang === "ro" ? "Trend săptămânal" : "Weekly trends")} — {timeframe === "day" ? getString(t, "dashboard.trendsToggle.day", lang === "ro" ? "Azi" : "Today") : getString(t, "dashboard.trendsToggle.week", lang === "ro" ? "Săptămână" : "Week")} • {metric === "min" ? getString(t, "dashboard.trendsToggle.minutes", lang === "ro" ? "Minute" : "Minutes") : getString(t, "dashboard.trendsToggle.sessions", lang === "ro" ? "Sesiuni" : "Sessions")}
                </h3>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[11px] text-[#7B6B60]">{lang === "ro" ? "Evoluția activităților" : "Activities evolution"}</p>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setTimeframe("day")}
                        className={`px-2 py-0.5 rounded ${timeframe === "day" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                        data-testid="trend-toggle-day"
                      >
                        {getString(t, "dashboard.trendsToggle.day", lang === "ro" ? "Azi" : "Today")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeframe("week")}
                        className={`px-2 py-0.5 rounded ${timeframe === "week" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                        data-testid="trend-toggle-week"
                      >
                        {getString(t, "dashboard.trendsToggle.week", lang === "ro" ? "Săptămână" : "Week")}
                      </button>
                    </div>
                    <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setMetric("min")}
                        className={`px-2 py-0.5 rounded ${metric === "min" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                        data-testid="trend-toggle-minutes"
                      >
                        {getString(t, "dashboard.trendsToggle.minutes", lang === "ro" ? "Minute" : "Minutes")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetric("count")}
                        className={`px-2 py-0.5 rounded ${metric === "count" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                        data-testid="trend-toggle-sessions"
                      >
                        {getString(t, "dashboard.trendsToggle.sessions", lang === "ro" ? "Sesiuni" : "Sessions")}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-[135px]" data-testid="trends-chart">
                  <WeeklyTrendsChart
                    data={
                      timeframe === "day"
                        ? metric === "min"
                          ? today
                          : todayCounts
                        : metric === "min"
                        ? weekly
                        : weeklyCounts
                    }
                  />
                </div>
                <p className="mt-1 text-[10px] text-[#7B6B60]">
                  {metric === "min"
                    ? getString(t, "dashboard.trendsToggle.minutes", lang === "ro" ? "Minute" : "Minutes")
                    : getString(t, "dashboard.trendsToggle.sessions", lang === "ro" ? "Sesiuni" : "Sessions")}
                </p>
              </Card>
            </motion.div>
          </div>

          {/* --------------------------------------------------------
              CENTER COLUMN – welcome + Omni-Intel + insight + quest
          -------------------------------------------------------- */}
          <div className="order-1 space-y-3 lg:order-2">
            {/* Row 1: Welcome + Omni-Intel Score */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <motion.div variants={fadeDelayed(0.08)} {...hoverScale}>
                <Card className="rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm">
                  <h2 className="mb-1 text-sm font-semibold text-[#2C2C2C] lg:text-base">
                    {getString(t, "dashboard.welcomeBack", lang === "ro" ? "Bine ai revenit" : "Welcome back")}
                  </h2>
                  <p className="text-xs text-[#6A6A6A]">
                    Ultima evaluare:{" "}
                    {(() => {
                      const ms = toMsLocal(
                        facts?.evaluation?.updatedAt ?? facts?.updatedAt,
                      );
                      return ms ? new Date(ms).toLocaleString() : "—";
                    })()}
                  </p>
                </Card>
              </motion.div>

              <motion.div variants={fadeDelayed(0.1)} {...hoverScale}>
                <Card className="flex h-full flex-col items-center justify-center rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-3 shadow-sm">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#7B6B60]">
                    Omni-Intel
                  </p>
                  <p className="text-2xl font-bold text-[#C24B17]">
                    {omniIntelScore}
                  </p>
                  <p className="mt-1 text-center text-[11px] text-[#7B6B60]">
                    Indice general de claritate, calm și energie.
                  </p>
                </Card>
              </motion.div>
            </div>

            {/* Row 2: Insight of the Day + Quest of the Day */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Insight of the Day */}
              <motion.div variants={fadeDelayed(0.16)} {...hoverScale}>
                <Card className="flex h-full flex-col justify-between rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm lg:p-4">
                  <motion.h3
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mb-2 text-sm font-semibold text-[#2C2C2C]"
                  >
                    {getString(t, "dashboard.insightTitle", lang === "ro" ? "Insightul zilei" : "Insight of the Day")}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.45 }}
                    className="text-sm leading-relaxed text-[#3A3A3A]"
                  >
                    {insight.text}
                  </motion.p>

                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#A08F82]">
                    {getString(t, 'dashboard.themeLabel', lang === 'ro' ? 'Temă' : 'Theme')}: {insight.theme}
                  </p>
                </Card>
              </motion.div>

              {/* Quest of the Day */}
              <motion.div variants={fadeDelayed(0.2)} {...hoverScale}>
                <Card className="flex h-full flex-col justify-between rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-3 shadow-sm lg:p-4">
                  <h3 className="mb-2 text-sm font-semibold text-[#2C2C2C]">
                    {getString(t, "dashboard.todayQuest", lang === "ro" ? "Provocarea de azi" : "Today’s quest")}
                  </h3>
                  {quest.title && (
                    <p className="mb-1 text-xs font-semibold text-[#7B6B60]">
                      {quest.title}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed text-[#3A3A3A]">
                    {quest.text}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#A08F82]">
                    {lang === "ro" ? "Aplică azi, în viața reală." : "Apply today, in real life."}
                  </p>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* --------------------------------------------------------
              RIGHT COLUMN – compact KPIs + recent entries
          -------------------------------------------------------- */}
          <div className="order-3 ml-auto space-y-2.5 lg:order-3 lg:max-w-[250px] xl:max-w-[280px]">
            {/* KPIs într-un singur card, grid 2x2 – titlul jos */}
            <motion.div variants={fadeDelayed(0.18)} {...hoverScale}>
              <Card className="flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Metric label="Reflections" value={prog.reflectionCount} />
                  <Metric label="Breathing min" value={prog.breathingCount} />
                  <Metric label="Focus drills" value={prog.drillsCount} />
                  <Metric label="Energy idx" value={prog.indices.energy} />
                </div>
                <h4 className="mt-1 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7B6B60]">
                  Practice snapshot
                </h4>
              </Card>
            </motion.div>

            {/* RECENT ENTRIES */}
            <motion.div variants={fadeDelayed(0.24)} {...hoverScale}>
              <Card className="rounded-xl border border-[#E4DAD1] bg-white p-3.5 shadow-sm">
                <h4 className="mb-2 text-sm font-semibold text-[#2C2C2C]">
                  Recent Entries
                </h4>

                {!facts?.recentEntries?.length && (
                  <p className="text-xs text-[#6A6A6A]">No entries yet.</p>
                )}

                {facts?.recentEntries
                  ?.slice(0, 3)
                  .map(
                    (
                      entry: { text?: string; timestamp?: unknown },
                      i: number,
                    ) => (
                      <div
                        key={i}
                        className="mb-2.5 border-b border-[#F0E8E0] pb-2 last:border-b-0 last:pb-0"
                      >
                        <p className="text-xs text-[#2C2C2C]">
                          {entry.text ?? "—"}
                        </p>
                        <p className="mt-1 text-[10px] text-[#A08F82]">
                          {(() => {
                            const v = entry.timestamp;
                            if (!v) return "";
                            const ms = toMsLocal(v);
                            if (ms) return new Date(ms).toLocaleString();
                            return String(v);
                          })()}
                        </p>
                      </div>
                    ),
                  )}
              </Card>
            </motion.div>
          </div>
        </div>

        {/* --------------------------------------------------------
            ROW SEPARAT – PROFILE INDICES, FULL-WIDTH SUB GRID
        -------------------------------------------------------- */}
        <motion.div
          variants={fadeDelayed(0.28)}
          {...hoverScale}
          className="mt-4"
        >
          <Card className="rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-[#2C2C2C]">{lang === "ro" ? "Profile indices" : "Profile indices"}</h3>
            <p className="mb-2 text-[11px] text-[#7B6B60]">
              Patru axe principale: cunoaștere, motivație, abilități și
              adaptare (flow).
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Metric label="Omni-Cuno" value={omniCunoScore} />
              <Metric label="Motivare IDX" value={motivationIdx} />
              <Metric label="Omni-Abil" value={omniAbilScore} />
              <Metric label="Omni-Flow" value={omniFlowScore} />
            </div>
          </Card>
        </motion.div>

        {showAchv ? (
          <div className="mt-3 rounded-xl border border-[#CBE8D7] bg-[#F3FFF8] p-3 text-sm text-[#1F3C2F]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{lang === "ro" ? "Prima treaptă atinsă: Claritate" : "First milestone reached: Clarity"}</p>
              <div className="flex items-center gap-2">
                <a
                  href="/antrenament"
                  className="rounded border border-[#1F3C2F] px-2 py-0.5 text-[11px] hover:bg-[#1F3C2F] hover:text-white"
                >
                  {lang === "ro" ? "Începe antrenamentul" : "Go to Training"}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") window.localStorage.setItem("omni_onboarding_achv_dismissed", "1");
                    setAchvDismissed(true);
                  }}
                  className="rounded border border-[#1F3C2F] px-2 py-0.5 text-[11px]"
                >
                  {lang === "ro" ? "OK" : "OK"}
                </button>
              </div>
            </div>
            <p className="mt-1 text-[12px] text-[#1F3C2F]">
              {lang === "ro"
                ? "Ai trecut prin primele două etape. Continuă cu exercițiile scurte pentru a stabiliza progresul."
                : "You’ve completed the first two steps. Continue with short exercises to stabilize progress."}
            </p>
          </div>
        ) : null}

        {Array.isArray(profile?.simulatedInsights) && profile!.simulatedInsights!.length > 0 ? (
          <motion.div variants={fadeDelayed(0.3)} {...hoverScale} className="mt-3">
            <Card className="rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-[#2C2C2C]">{getString(t, "dashboard.initialInsights", lang === "ro" ? "Insight‑uri inițiale" : "Initial insights")}</h3>
              <div className="flex flex-wrap gap-2">
                {profile!.simulatedInsights!.map((tag, i) => (
                  <span key={`${tag}-${i}`} className="rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2.5 py-0.5 text-[11px] text-[#2C2C2C]">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          </motion.div>
        ) : null}
      </Card>
    </motion.section>
  );
}

// ------------------------------------------------------
// INTERNAL PIE (donut)
// ------------------------------------------------------
function InternalPie({
  clarity,
  calm,
  energy,
}: {
  clarity: number;
  calm: number;
  energy: number;
}) {
  const total = Math.max(1, clarity + calm + energy);
  const cPct = (clarity / total) * 100;
  const calmPct = (calm / total) * 100;

  const bg = `conic-gradient(
    #7A6455 0 ${cPct}%,
    #4D3F36 ${cPct}% ${cPct + calmPct}%,
    #C07963 ${cPct + calmPct}% 100%
  )`;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="h-20 w-20 rounded-full lg:h-24 lg:w-24"
        style={{ background: bg }}
      />
      <div className="absolute h-11 w-11 rounded-full bg-white shadow-inner lg:h-13 lg:w-13" />
    </div>
  );
}

function LegendRow({
  label,
  color,
  value,
}: {
  label: string;
  color: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] text-[#5C4F45]">{label}</span>
      </div>
      <span className="text-[11px] font-semibold text-[#2C2C2C]">
        {Math.round(value)}%
      </span>
    </div>
  );
}

// ------------------------------------------------------
// METRIC TILE
// ------------------------------------------------------
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#EFE3D7] bg-[#FCF7F1] px-2 py-1.5 text-left">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#7B6B60]">
        {label}
      </p>
      <p className="text-base font-bold text-[#C24B17]">{value}</p>
    </div>
  );
}
