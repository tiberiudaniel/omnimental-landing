"use client";
import { Card } from "@/components/ui/card";
import { useProgressFacts } from "@/components/useProgressFacts";
import type { ProgressFact } from "@/lib/progressFacts";
import { adaptProgressFacts } from "@/lib/progressAdapter";
import { getDailyInsight } from "@/lib/insights";
import { getAreasForScript } from "@/lib/quests";
import type { OmniBlock } from "@/lib/omniIntel";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import InfoTooltip from "@/components/InfoTooltip";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useProfile } from "@/components/ProfileProvider";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import WeeklyTrendsChart from "@/components/charts/WeeklyTrendsChart";
import { computeKunoComposite, computeOmniScope, computeOmniFlex } from "@/lib/dashboardMetrics";
import {
  extractSessions,
  computeWeeklyBuckets,
  computeTodayBucket,
  computeWeeklyCounts,
  computeTodayCounts,
  computeMonthlyDailyMinutes,
  computeMonthlyDailyCounts,
  filterSessionsByType,
} from "@/lib/progressAnalytics";
import { formatUtcShort } from "@/lib/format";
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
// Animations
// ------------------------------------------------------
const fadeDelayed = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, delay } },
});
const hoverScale = {
  whileHover: { scale: 1.015, transition: { duration: 0.12 } },
};
// ------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------
export default function ProgressDashboard({
  profileId,
  demoFacts,
  debugGrid,
}: {
  profileId: string;
  demoFacts?: ProgressFact;
  debugGrid?: boolean;
}) {
  const { data: liveFacts, loading: liveLoading } = useProgressFacts(profileId);
  const { profile } = useProfile();
  const facts = demoFacts ?? liveFacts;
  const loading = demoFacts ? false : liveLoading;
  const { t, lang } = useI18n();
  // Read debug flag from URL early to keep hook order stable across renders
  const search = useSearchParams();
  const debugMode = (search?.get('debug') === '1');
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");
  const [metric, setMetric] = useState<"min" | "count" | "score">("min");
  const [weighted] = useState(false);
  const [achvDismissed, setAchvDismissed] = useState(false);
  const { omniIntelDelta, motivationDelta, kunoDelta } = useMemo(() => {
    if (typeof window === "undefined" || loading) {
      return {
        omniIntelDelta: null as number | null,
        motivationDelta: null as number | null,
        kunoDelta: null as number | null,
      };
    }
    try {
      const pid = profileId || "guest";
      const currentOmni =
        (facts?.omni?.omniIntelScore as number | undefined) ?? 0;
      const currentMotivation =
        (facts?.omni?.scope?.motivationIndex as number | undefined) ??
        (facts?.omni?.scope?.directionMotivationIndex as number | undefined) ??
        0;
      const currentKuno =
        (facts?.omni?.kuno?.averagePercent as number | undefined) ??
        (facts?.omni?.kuno?.knowledgeIndex as number | undefined) ??
        0;
      const prevO = window.localStorage.getItem(`omni_intel_prev_${pid}`);
      const prevM = window.localStorage.getItem(`motivation_idx_prev_${pid}`);
      const prevK = window.localStorage.getItem(`omni_kuno_prev_${pid}`);
      const dO = prevO != null ? currentOmni - Number(prevO) : null;
      const dM =
        prevM != null
          ? Math.round(currentMotivation - Number(prevM))
          : null;
      const dK = prevK != null ? Math.round(currentKuno - Number(prevK)) : null;
      return { omniIntelDelta: dO, motivationDelta: dM, kunoDelta: dK };
    } catch {
      return { omniIntelDelta: null, motivationDelta: null, kunoDelta: null };
    }
  }, [loading, profileId, facts?.omni]);
  const [insightExpanded] = useState(false);
  const [questExpanded, setQuestExpanded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setShowWelcome(false), 2600);
    return () => window.clearTimeout(id);
  }, []);
  const showAchv = useMemo(() => {
    if (typeof window === "undefined") return false;
    const omni = (facts?.omni as OmniBlock | undefined) ?? undefined;
    const score = (omni?.kuno?.averagePercent ??
      omni?.kuno?.knowledgeIndex ??
      0) as number;
    const hasInsights =
      Array.isArray(profile?.simulatedInsights) &&
      (profile?.simulatedInsights?.length ?? 0) > 0;
    const dismissed =
      window.localStorage.getItem("omni_onboarding_achv_dismissed") === "1";
    return score > 0 && hasInsights && !dismissed && !achvDismissed;
  }, [facts, profile?.simulatedInsights, achvDismissed]);
  // Persist current snapshot for next visit (no setState inside effect)
  useEffect(() => {
    if (typeof window === "undefined" || loading) return;
    try {
      const pid = profileId || "guest";
      const currentOmni =
        (facts?.omni?.omniIntelScore as number | undefined) ?? 0;
      const currentMotivation =
        (facts?.omni?.scope?.motivationIndex as number | undefined) ??
        (facts?.omni?.scope?.directionMotivationIndex as number | undefined) ??
        0;
      const currentKuno =
        (facts?.omni?.kuno?.averagePercent as number | undefined) ??
        (facts?.omni?.kuno?.knowledgeIndex as number | undefined) ??
        0;
      window.localStorage.setItem(
        `omni_intel_prev_${pid}`,
        String(currentOmni),
      );
      window.localStorage.setItem(
        `motivation_idx_prev_${pid}`,
        String(currentMotivation),
      );
      window.localStorage.setItem(
        `omni_kuno_prev_${pid}`,
        String(currentKuno),
      );
    } catch {}
  }, [loading, profileId, facts?.omni]);
  // Loading state
  if (loading) {
    return (
      <section className="w-full bg-[#FDFCF9] px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">
        <h1 className="mb-3 text-lg font-bold text-[#2C2C2C] lg:mb-4 lg:text-2xl">
          OmniMental Progress
        </h1>
        <Card className="rounded-2xl border border-[#E4DAD1] bg-white/90 px-3 py-5 text-sm text-[#6A6A6A] shadow-sm sm:px-4">
          Se încarcă datele...
        </Card>
      </section>
    );
  }
  // No hard gating: safe fallbacks (no hooks here to avoid order changes with loading early return)
  const prog = adaptProgressFacts(facts);
  const insight = getDailyInsight(prog.strengths.dominantTheme);
  const sessions = extractSessions(facts ?? null);
  const refMs =
    (facts?.updatedAt instanceof Date ? facts.updatedAt.getTime() : 0) ||
    Math.max(
      0,
      ...sessions.map((s: { startedAt?: unknown }) => toMsLocal(s.startedAt)),
    ) ||
    1;
  const weekly = computeWeeklyBuckets(sessions, refMs, lang);
  const weeklyCounts = computeWeeklyCounts(sessions, refMs, lang);
  const today = computeTodayBucket(sessions, refMs);
  const todayCounts = computeTodayCounts(sessions, refMs);
  const monthDays = computeMonthlyDailyMinutes(sessions, refMs, lang);
  const monthCounts = computeMonthlyDailyCounts(sessions, refMs, lang);

  // Weighted minutes by practice type (breathing/drill weigh more than reflection)
  const WEIGHTS = { reflection: 1.0, breathing: 1.4, drill: 1.2 } as const;
  // Weekly weighted minutes
  const refW_week = computeWeeklyBuckets(filterSessionsByType(sessions, 'reflection'), refMs, lang);
  const breW_week = computeWeeklyBuckets(filterSessionsByType(sessions, 'breathing'), refMs, lang);
  const drlW_week = computeWeeklyBuckets(filterSessionsByType(sessions, 'drill'), refMs, lang);
  const weeklyWeighted = refW_week.map((b, i) => ({
    day: b.day,
    label: b.label,
    totalMin: Math.max(0, Math.round(
      (refW_week[i]?.totalMin ?? 0) * WEIGHTS.reflection +
      (breW_week[i]?.totalMin ?? 0) * WEIGHTS.breathing +
      (drlW_week[i]?.totalMin ?? 0) * WEIGHTS.drill
    )),
  }));
  // Today weighted minutes (single bucket array)
  const refW_today = computeTodayBucket(filterSessionsByType(sessions, 'reflection'), refMs);
  const breW_today = computeTodayBucket(filterSessionsByType(sessions, 'breathing'), refMs);
  const drlW_today = computeTodayBucket(filterSessionsByType(sessions, 'drill'), refMs);
  const todayWeighted = [{
    day: refW_today[0]?.day ?? today[0]?.day ?? refMs,
    label: refW_today[0]?.label ?? (lang === 'ro' ? 'Azi' : 'Today'),
    totalMin: Math.max(0, Math.round(
      (refW_today[0]?.totalMin ?? 0) * WEIGHTS.reflection +
      (breW_today[0]?.totalMin ?? 0) * WEIGHTS.breathing +
      (drlW_today[0]?.totalMin ?? 0) * WEIGHTS.drill
    )),
  }];
  // Monthly weighted minutes (per day rows)
  const refW_month = computeMonthlyDailyMinutes(filterSessionsByType(sessions, 'reflection'), refMs, lang);
  const breW_month = computeMonthlyDailyMinutes(filterSessionsByType(sessions, 'breathing'), refMs, lang);
  const drlW_month = computeMonthlyDailyMinutes(filterSessionsByType(sessions, 'drill'), refMs, lang);
  const monthWeighted = refW_month.map((b, i) => ({
    day: b.day,
    label: b.label,
    totalMin: Math.max(0, Math.round(
      (refW_month[i]?.totalMin ?? 0) * WEIGHTS.reflection +
      (breW_month[i]?.totalMin ?? 0) * WEIGHTS.breathing +
      (drlW_month[i]?.totalMin ?? 0) * WEIGHTS.drill
    )),
  }));

  // Activity Score (0–100) derived from weighted minutes vs. a daily target
  const DAILY_TARGET_MIN = 20; // reaching ~20 weighted minutes ≈ score 100
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const toScore = (mins: number) => Math.round(clamp01(mins / DAILY_TARGET_MIN) * 100);
  const weeklyScore = weeklyWeighted.map((b) => ({ day: b.day, label: b.label, totalMin: toScore(b.totalMin) }));
  const todayScore = todayWeighted.map((b) => ({ day: b.day, label: b.label, totalMin: toScore(b.totalMin) }));
  const monthScore = monthWeighted.map((b) => ({ day: b.day, label: b.label, totalMin: toScore(b.totalMin) }));
  const formatRelative = (ms: number) => {
    const now = Date.now();
    const diff = Math.max(0, now - ms);
    const min = Math.floor(diff / 60000);
    if (min < 1) return lang === 'ro' ? 'acum' : 'just now';
    if (min < 60) return `${min} ${lang === 'ro' ? 'min' : 'min'}`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ${lang === 'ro' ? 'h' : 'h'}`;
    const d = Math.floor(h / 24);
    return `${d} ${lang === 'ro' ? 'zile' : 'd'}`;
  };
  // debugMode declared earlier near top to keep hook order stable
  // ---- Profile indices from Omni block ----
  const omni: OmniBlock | undefined = facts?.omni as OmniBlock | undefined;
  const omniIntelScore =
    (omni?.omniIntelScore as number | undefined) ??
    Math.round(
      (prog.indices.clarity + prog.indices.calm + prog.indices.energy) / 3,
    );
  let omniCunoScore = ((omni?.kuno as unknown as { generalIndex?: number })?.generalIndex ??
    omni?.kuno?.averagePercent ??
    omni?.kuno?.knowledgeIndex ??
    0) as number;
  if (!omniCunoScore) {
    try {
      const k = (omni?.kuno as unknown as { knowledgeIndex?: number; averagePercent?: number; masteryByCategory?: Record<string, number>; lessonsCompletedCount?: number } | undefined);
      const percents: number[] = [];
      if (typeof k?.averagePercent === 'number' && k.averagePercent > 0) percents.push(Math.round(k.averagePercent));
      if (typeof k?.knowledgeIndex === 'number' && k.knowledgeIndex > 0) percents.push(Math.round(k.knowledgeIndex));
      const comp = computeKunoComposite({
        percents,
        masteryByCategory: k?.masteryByCategory ?? null,
        lessonsCompleted: Number(k?.lessonsCompletedCount ?? 0),
      });
      if (comp.generalIndex > 0) omniCunoScore = comp.generalIndex;
    } catch {}
  }
  // Build dynamic tooltip for Omni Kuno components if data is available
  const omniKunoTooltipDynamic = (() => {
    try {
      const k = (omni?.kuno as unknown as { knowledgeIndex?: number; averagePercent?: number; masteryByCategory?: Record<string, number>; lessonsCompletedCount?: number } | undefined);
      const percents: number[] = [];
      if (typeof k?.averagePercent === 'number' && k.averagePercent > 0) percents.push(Math.round(k.averagePercent));
      if (typeof k?.knowledgeIndex === 'number' && k.knowledgeIndex > 0) percents.push(Math.round(k.knowledgeIndex));
      const comp = computeKunoComposite({
        percents,
        masteryByCategory: k?.masteryByCategory ?? null,
        lessonsCompleted: Number(k?.lessonsCompletedCount ?? 0),
      });
      const masteryMean = (() => {
        const m = k?.masteryByCategory ? Object.values(k.masteryByCategory).filter((v) => Number.isFinite(v)) as number[] : [];
        return m.length ? Math.round(m.reduce((a,b)=>a+b,0)/m.length) : 0;
      })();
      const lessons = Number(k?.lessonsCompletedCount ?? 0);
      return lang === 'ro'
        ? [
            `70% EWMA/medie teste: ${comp.components.ewma || (percents[0] ?? 0)}%`,
            `25% Măiestrie medie: ${masteryMean}%`,
            `5% Lecții terminate: ${lessons}`,
          ]
        : [
            `70% EWMA/mean quizzes: ${comp.components.ewma || (percents[0] ?? 0)}%`,
            `25% Mastery mean: ${masteryMean}%`,
            `5% Lessons completed: ${lessons}`,
          ];
    } catch {
      return undefined;
    }
  })();
  // Build tiny debug badge text when ?debug=1
  const omniKunoDebugBadge = (() => {
    if (!debugMode) return undefined;
    try {
      const k = (omni?.kuno as unknown as { knowledgeIndex?: number; averagePercent?: number; masteryByCategory?: Record<string, number>; lessonsCompletedCount?: number } | undefined);
      const percents: number[] = [];
      if (typeof k?.averagePercent === 'number' && k.averagePercent > 0) percents.push(Math.round(k.averagePercent));
      if (typeof k?.knowledgeIndex === 'number' && k.knowledgeIndex > 0) percents.push(Math.round(k.knowledgeIndex));
      const comp = computeKunoComposite({
        percents,
        masteryByCategory: k?.masteryByCategory ?? null,
        lessonsCompleted: Number(k?.lessonsCompletedCount ?? 0),
      });
      const masteryMean = (() => {
        const m = k?.masteryByCategory ? Object.values(k.masteryByCategory).filter((v) => Number.isFinite(v)) as number[] : [];
        return m.length ? Math.round(m.reduce((a,b)=>a+b,0)/m.length) : 0;
      })();
      const lessons = Number(k?.lessonsCompletedCount ?? 0);
      const ew = comp.components.ewma || (percents[0] ?? 0);
      return `e:${ew}% m:${masteryMean}% l:${lessons}`;
    } catch {
      return undefined;
    }
  })();
  if (!omniCunoScore && typeof window !== "undefined") {
    try {
      const v = window.localStorage.getItem("omnimental_kuno_guest_percent");
      const n = v ? Number(v) : 0;
      if (Number.isFinite(n) && n > 0) omniCunoScore = Math.round(n);
    } catch {}
  }
  const omniScopeComp = computeOmniScope(facts as unknown as Record<string, unknown>);
  const omniScopeScore = omniScopeComp.score;
  const omniAbilScore = (omni?.abil?.practiceIndex ??
    omni?.abil?.skillsIndex ??
    0) as number;
  const omniFlexComp = computeOmniFlex(facts as unknown as Record<string, unknown>);
  const omniFlexScore = omniFlexComp.score;
  const quest = (() => {
    // Prefer item whose script areas match user's main focus area
    const items = Array.isArray(facts?.quests?.items) ? (facts!.quests!.items as Array<{ title?: string; body?: string; scriptId?: string }>) : [];
    const fallbackTitle = getString(
      t,
      "dashboard.todayQuest",
      lang === "ro" ? "Provocarea de azi" : "Today’s quest",
    );
    if (items.length) {
      const topCat = (() => {
        // reuse focusTheme after it's computed below? compute lightweight here from facts.intent
        const intent = (facts?.intent as { firstCategory?: string | null } | undefined);
        return (intent?.firstCategory || "").toString().toLowerCase();
      })();
      const sorted = items
        .map((it) => ({ it, match: topCat && it.scriptId ? (getAreasForScript(String(it.scriptId)).includes(topCat) ? 1 : 0) : 0 }))
        .sort((a, b) => b.match - a.match);
      const best = sorted[0]?.it ?? items[0];
      const title = best.title && best.title.trim().length ? best.title : fallbackTitle;
      const text = best.body ?? "";
      return { title, text };
    }
    return {
      title: fallbackTitle,
      text:
        "Alege un moment concret din următoarele 24 de ore în care să aplici o tehnică de respirație sau de focus și notează ce observi în corp și în minte.",
    };
  })();
  const focusTheme = (() => {
    type EvalBlock = {
      mainAreaLabel?: string;
      focusLabel?: string;
      summary?: string;
      mainObjective?: string;
    };
    type RecBlock = {
      primaryAreaLabel?: string;
      summary?: string;
    };
    const ev = facts?.evaluation as EvalBlock | undefined;
    const rec = facts?.recommendation as RecBlock | undefined;
    type Cat = { category: string; count: number };
    const intent = facts?.intent as
      | { firstCategory?: string | null; categories?: Cat[] }
      | undefined;
    let topCategory: string | undefined = intent?.firstCategory ?? undefined;
    if (
      !topCategory &&
      Array.isArray(intent?.categories) &&
      intent!.categories!.length
    ) {
      let max: Cat | undefined;
      for (const c of intent!.categories!) {
        if (!max || (Number(c.count) || 0) > (Number(max.count) || 0)) max = c;
      }
      topCategory = max?.category;
    }
    const catLabelMap: Record<string, string> = {
      clarity: lang === "ro" ? "Claritate" : "Clarity",
      focus: lang === "ro" ? "Claritate" : "Clarity",
      calm: lang === "ro" ? "Calm" : "Calm",
      energy: lang === "ro" ? "Energie" : "Energy",
      relationships: lang === "ro" ? "Relații" : "Relationships",
      performance: lang === "ro" ? "Performanță" : "Performance",
      health: lang === "ro" ? "Sănătate" : "Health",
      identity: lang === "ro" ? "Identitate" : "Identity",
      anxiety: lang === "ro" ? "Anxietate" : "Anxiety",
      stress: lang === "ro" ? "Stres" : "Stress",
    };
    const areaFromIntent = topCategory
      ? catLabelMap[topCategory] ?? topCategory
      : undefined;
    const area =
      areaFromIntent ||
      ev?.focusLabel ||
      ev?.mainAreaLabel ||
      rec?.primaryAreaLabel ||
      (lang === "ro"
        ? "Tema principală acum"
        : "Main focus right now");
    const desc =
      ev?.summary ||
      ev?.mainObjective ||
      rec?.summary ||
      (lang === "ro"
        ? "Este directia prioritara pe care lucrezi acum."
        : "This is the main theme you’re working on right now.");
    return { area, desc };
  })();
  const trendsTitle = (() => {
    if (lang === "ro") {
      return timeframe === "day"
        ? "Trend zilnic"
        : timeframe === "week"
        ? "Trend săptămânal"
        : "Trend lunar";
    }
    const tfEn = timeframe === "day" ? "Daily trend" : timeframe === "week" ? "Weekly trend" : "Monthly trend";
    return tfEn;
  })();
  return (
    <motion.section
      initial="hidden"
      animate="show"
      className="w-full bg-[#FDFCF9] px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
    >
      <Card className="mx-auto max-w-6xl rounded-2xl border border-[#E4DAD1] bg-white/90 px-3 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)] sm:px-4 sm:py-5">
        {/* WRAPPER: MAIN AREA (stânga+centru) + SIDEBAR (dreapta independentă) */}
        <div
          className="flex flex-col gap-2 md:gap-3 lg:flex-row lg:gap-4"
          style={
            debugGrid
              ? {
                  backgroundImage:
                    "repeating-linear-gradient(to right, rgba(194,75,23,0.12) 0 1px, transparent 1px 12px), repeating-linear-gradient(to bottom, rgba(194,75,23,0.12) 0 1px, transparent 1px 12px)",
                  backgroundSize: "12px 12px",
                }
              : undefined
          }
        >
          {/* MAIN AREA: grid în 2 coloane (stânga + centru) */}
          <div className="flex-1 grid grid-cols-1 gap-2 md:grid-cols-[0.95fr_1.05fr] md:gap-3 lg:grid-cols-[0.94fr_1.06fr] lg:gap-4">
            {/* LEFT COLUMN – pie + weekly */}
            <div
              className={`order-2 mt-2 sm:mt-3 lg:mt-4 flex h-full min-w-0 flex-col gap-2 md:col-span-1 md:order-1 md:gap-3 lg:gap-4 ${
                debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""
              }`}
            >
              <h2 className="mt-0 mb-1.5 text-base font-bold text-[#7A6455] sm:mt-0 sm:text-lg lg:mt-0 lg:text-xl">
                OmniMental Progress
              </h2>
              {/* Internal indices – PIE CHART */}
              <motion.div variants={fadeDelayed(0.05)} {...hoverScale}>
                <Card className="flex items-center gap-2 rounded-xl border border-[#E4DAD1] bg-white p-1.5 shadow-sm sm:gap-3 sm:p-2.5">
                  <div className="flex-1">
                    <h3 className="mb-0.5 text-xs font-semibold text-[#2C2C2C] sm:mb-1 sm:text-sm">
                      Indicatori interni
                    </h3>
                    <p className="mb-1 text-[10px] text-[#7B6B60] sm:mb-1.5 sm:text-[11px]">
                      Claritate, calm și energie în ultima perioadă.
                    </p>
                    <InternalPie
                      clarity={prog.indices.clarity}
                      calm={prog.indices.calm}
                      energy={prog.indices.energy}
                    />
                  </div>
                  <div className="w-[40%] space-y-1 text-[10px] sm:space-y-1 sm:text-[11px]">
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
              {/* Weekly Trends */}
              <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
                <Card className="h-[200px] overflow-hidden rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm sm:h-[240px] sm:p-4 lg:h-[280px]">
                  <h3 className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#2C2C2C] sm:mb-2 sm:text-sm">
                    <span>
                      {trendsTitle}
                      {" — "}
                      {timeframe === 'day' ? (lang === 'ro' ? 'Azi' : 'Today') : timeframe === 'week' ? (lang === 'ro' ? 'Săptămâna' : 'Week') : (lang === 'ro' ? 'Luna' : 'Month')}
                      {" • "}
                      {metric === 'min' ? (lang === 'ro' ? 'Minute' : 'Minutes') : metric === 'count' ? (lang === 'ro' ? 'Sesiuni' : 'Sessions') : (lang === 'ro' ? 'Scor' : 'Score')}
                    </span>
                    <InfoTooltip
                      label={lang === 'ro' ? 'Despre trend' : 'About trends'}
                      items={lang === 'ro'
                        ? [
                            'Alege intervalul: Azi / Săptămână / Lună',
                            'Alege metrica: Minute / Sesiuni / Scor',
                            weighted
                              ? 'Ponderi: minutele pentru Respirație/Drill cântăresc mai mult'
                              : 'Minute: valori brute pe activități',
                            'Scor activitate: 0–100 pe bază de minute ponderate',
                          ]
                        : [
                            'Pick range: Today / Week / Month',
                            'Pick metric: Minutes / Sessions / Score',
                            weighted
                              ? 'Weighted: minutes for Breathing/Drill weigh more'
                              : 'Minutes: raw values across activities',
                            'Activity Score: 0–100 from weighted minutes',
                          ]}
                    />
                  </h3>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-[10px] text-[#7B6B60] sm:text-[11px]">
                      {metric === 'score'
                        ? (lang === 'ro' ? 'Scor activitate (0–100)' : 'Activity score (0–100)')
                        : (lang === 'ro' ? 'Evoluția activităților' : 'Activities evolution')}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[10px] sm:text-[11px]">
                        <button
                          type="button"
                          onClick={() => setTimeframe("day")}
                          className={`rounded px-1.5 py-0.5 transition ${
                            timeframe === "day"
                              ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold"
                              : "text-[#5C4F45]"
                          }`}
                          aria-label="Toggle to day view"
                          data-testid="trend-toggle-day"
                        >
                          {getString(
                            t,
                            "dashboard.trendsToggle.day",
                            lang === "ro" ? "Azi" : "Today",
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimeframe("week")}
                          className={`rounded px-1.5 py-0.5 transition ${
                            timeframe === "week"
                              ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold"
                              : "text-[#5C4F45]"
                          }`}
                          aria-label="Toggle to week view"
                          data-testid="trend-toggle-week"
                        >
                          {getString(
                            t,
                            "dashboard.trendsToggle.week",
                            lang === "ro" ? "Săptămână" : "Week",
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimeframe("month")}
                          className={`rounded px-1.5 py-0.5 transition ${
                            timeframe === "month"
                              ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold"
                              : "text-[#5C4F45]"
                          }`}
                          aria-label="Toggle to month view"
                          data-testid="trend-toggle-month"
                        >
                          {getString(
                            t,
                            "dashboard.trendsToggle.month",
                            lang === "ro" ? "Lună" : "Month",
                          )}
                        </button>
                      </div>
                      <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[10px] sm:text-[11px]">
                        <button
                          type="button"
                          onClick={() => setMetric("min")}
                          className={`rounded px-1.5 py-0.5 transition ${
                            metric === "min"
                              ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold"
                              : "text-[#5C4F45]"
                          }`}
                          aria-label="Toggle to minutes"
                          data-testid="trend-toggle-minutes"
                        >
                          {getString(
                            t,
                            "dashboard.trendsToggle.minutes",
                            lang === "ro" ? "Minute" : "Minutes",
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMetric("count")}
                          className={`rounded px-1.5 py-0.5 transition ${
                            metric === "count"
                              ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold"
                              : "text-[#5C4F45]"
                          }`}
                          aria-label="Toggle to sessions"
                          data-testid="trend-toggle-sessions"
                        >
                          {getString(
                            t,
                            "dashboard.trendsToggle.sessions",
                            lang === "ro" ? "Sesiuni" : "Sessions",
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMetric("score")}
                          className={`rounded px-1.5 py-0.5 transition ${
                            metric === "score"
                              ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold"
                              : "text-[#5C4F45]"
                          }`}
                          aria-label="Toggle to activity score"
                          data-testid="trend-toggle-score"
                        >
                          {lang === 'ro' ? 'Scor' : 'Score'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-3 h-[100px] border-t border-[#F0E8E0] pt-2 sm:mt-4 sm:h-[120px] sm:pt-3 lg:mt-5 lg:h-[140px] lg:pt-4"
                    data-testid="trends-chart"
                  >
                    <WeeklyTrendsChart
                      data={(() => {
                        if (metric === 'score') {
                          return timeframe === 'day' ? todayScore : timeframe === 'week' ? weeklyScore : monthScore;
                        }
                        if (metric === 'min') {
                          return timeframe === 'day' ? today : timeframe === 'week' ? weekly : monthDays;
                        }
                        // sessions count
                        return timeframe === 'day' ? todayCounts : timeframe === 'week' ? weeklyCounts : monthCounts;
                      })()}
                      ariaLabel={
                        lang === "ro"
                          ? timeframe === "month"
                            ? metric === "min"
                              ? "Trend lunar minute"
                              : metric === 'count' ? "Trend lunar sesiuni" : "Trend lunar scor"
                            : metric === "min"
                            ? "Trend săptămânal minute"
                            : metric === 'count' ? "Trend săptămânal sesiuni" : "Trend săptămânal scor"
                          : timeframe === "month"
                          ? metric === "min"
                            ? "Monthly trend minutes"
                            : metric === 'count' ? "Monthly trend sessions" : "Monthly trend score"
                          : metric === "min"
                            ? "Weekly trend minutes"
                            : metric === 'count' ? "Weekly trend sessions" : "Weekly trend score"
                      }
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-[#7B6B60] sm:text-[10px]">
                    {metric === "min"
                      ? getString(
                          t,
                          "dashboard.trendsToggle.minutes",
                          lang === "ro" ? "Minute" : "Minutes",
                        )
                      : getString(
                          t,
                          "dashboard.trendsToggle.sessions",
                          lang === "ro" ? "Sesiuni" : "Sessions",
                        )}
                  </p>
                </Card>
              </motion.div>
            </div>

            {/* Profile indices – directly under Trends (span left + center) */}
            <motion.div
              variants={fadeDelayed(0.22)}
              {...hoverScale}
              className={`order-3 md:order-3 md:col-span-2 ${debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""}`}
            >
              <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
                <h3 className="mb-1 text-xs font-semibold text-[#2C2C2C] sm:mb-2 sm:text-sm">
                  {lang === "ro" ? "Profile indices" : "Profile indices"}
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-3">
                <Metric
                  label="Omni-Scop"
                  value={omniScopeScore}
                  tooltipItems={(() => {
                    const c = omniScopeComp.components;
                    return lang === 'ro'
                      ? [
                          `45% Motivație: ${c.motivation}%`,
                          `25% Potrivire intenție (claritate + bogăție): ${c.intent}%`,
                          `20% Pregătire/plan (note + recență): ${c.prepared}%`,
                          `5% Cunoștințe (Kuno): ${c.knowledge}%`,
                          `5% Consistență (7 zile): ${c.consistency}%`,
                        ]
                      : [
                          `45% Motivation: ${c.motivation}%`,
                          `25% Intent fit (clarity + richness): ${c.intent}%`,
                          `20% Preparedness/plan (notes + recency): ${c.prepared}%`,
                          `5% Knowledge (Kuno): ${c.knowledge}%`,
                          `5% Consistency (7 days): ${c.consistency}%`,
                        ];
                  })()}
                />
                  <Metric
                    label="Omni Kuno"
                    value={omniCunoScore}
                    testId="metric-omni-cuno"
                    testIdValue="metric-omni-cuno-value"
                    debugBadge={omniKunoDebugBadge}
                    tooltipItems={omniKunoTooltipDynamic || (
                      lang === 'ro'
                        ? [
                            '70% Media ponderată (EWMA) a testelor de cunoștințe',
                            '25% Măiestrie pe categorii (medie)',
                            '5% Lecții terminate',
                          ]
                        : [
                            '70% EWMA of knowledge quiz scores',
                            '25% Category mastery mean',
                            '5% Lessons completed',
                          ]
                    )}
                  />
                  <Metric
                    label="Omni-Abil"
                    value={omniAbilScore}
                    tooltipItems={
                      lang === 'ro'
                        ? [
                            '70% Media evaluărilor de abilități',
                            '30% Practică efectivă (exerciții)',
                          ]
                        : [
                            '70% Ability assessments mean',
                            '30% Practice signal (exercises)',
                          ]
                    }
                  />
                  <Metric
                    label="Omni-Flex"
                    value={omniFlexScore}
                    tooltipItems={(() => {
                      const c = omniFlexComp.components;
                      return lang === 'ro'
                        ? [
                            `25% Flex cognitiv (Kuno + bogăție intenții): ${c.cognitive}%`,
                            `25% Flex comportamental (varietate practici): ${c.behavioral}%`,
                            `25% Adaptare/actualizare plan: ${c.adaptation}%`,
                            `25% Deschidere/vointă (sprijin + potrivire): ${c.openness}%`,
                          ]
                        : [
                            `25% Cognitive (mastery breadth + intent richness): ${c.cognitive}%`,
                            `25% Behavioral (variety across practices): ${c.behavioral}%`,
                            `25% Adaptation/plan recency: ${c.adaptation}%`,
                            `25% Openness (learn from others + schedule fit): ${c.openness}%`,
                          ];
                    })()}
                  />
                </div>
                {/* Omni Kuno mastery micro-bars */}
                {(() => {
                  try {
                    const mastery = (omni?.kuno as unknown as { masteryByCategory?: Record<string, number> } | undefined)?.masteryByCategory;
                    const entries = mastery ? Object.entries(mastery) : [];
                    if (!entries.length) return null;
                    const top = entries
                      .map(([k, v]) => [k, Number(v)] as const)
                      .filter(([, v]) => Number.isFinite(v))
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4);
                    const labelMap: Record<string, string> = {
                      clarity: lang === 'ro' ? 'Claritate' : 'Clarity',
                      calm: lang === 'ro' ? 'Calm' : 'Calm',
                      energy: lang === 'ro' ? 'Energie' : 'Energy',
                      relationships: lang === 'ro' ? 'Relații' : 'Relationships',
                      performance: lang === 'ro' ? 'Performanță' : 'Performance',
                      health: lang === 'ro' ? 'Sănătate' : 'Health',
                      general: lang === 'ro' ? 'General' : 'General',
                    };
                    return (
                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
                        {top.map(([k, v]) => (
                          <div key={k} className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-[#7B6B60]">
                              <span>{labelMap[k] ?? k}</span>
                              <span>{Math.round(v)}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded bg-[#EFE5DA]">
                              <div className="h-full bg-[#C07963]" style={{ width: `${Math.max(0, Math.min(100, Math.round(v)))}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </Card>
            </motion.div>

            {/* CENTER COLUMN – welcome + focus + insight + quest */}
            <div
              className={`order-1 flex h-full flex-col gap-2 md:col-span-1 md:order-2 md:gap-3 lg:gap-4 ${
                debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""
              }`}
            >
              {/* Welcome + OmniIntel + Focus + Motivation */}
              <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-2 lg:gap-3">
                {/* Welcome: animate only the words “Bine ai revenit”, then hide them */}
                <motion.div variants={fadeDelayed(0.08)} {...hoverScale} className="h-full">
                  <Card className="flex h-full flex-col rounded-xl border border-[#E4DAD1] bg-white p-2 shadow-sm sm:p-3">
                    <AnimatePresence>
                      {showWelcome ? (
                        <motion.h2
                          key="welcome-text"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
                          exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
                          className="mb-0.5 text-xs font-semibold text-[#2C2C2C] sm:mb-1 sm:text-sm"
                        >
                          {getString(
                            t,
                            "dashboard.welcomeBack",
                            lang === "ro" ? "Bine ai revenit" : "Welcome back",
                          )}
                        </motion.h2>
                      ) : null}
                    </AnimatePresence>
                    <p className="text-[11px] text-[#6A6A6A] sm:text-xs">
                      Ultima evaluare:{" "}
                      <span suppressHydrationWarning>
                        {formatUtcShort(
                          toMsLocal(
                            facts?.evaluation?.updatedAt ?? facts?.updatedAt,
                          ),
                        )}
                      </span>
                    </p>
                  </Card>
                </motion.div>
                {/* Omni-Intel */}
                <motion.div
                  variants={fadeDelayed(0.1)}
                  {...hoverScale}
                  className="h-full"
                >
                  <Card className="flex h-full flex-col items-center justify-center rounded-xl border border-[#E4DAD1] bg-white p-2 shadow-sm sm:p-3">
                    <p className="mb-0.5 text-[9px] font-medium tracking-[0.16em] text-[#7B6B60] sm:mb-1 sm:text-[10px]">
                      {getString(
                        t,
                        "dashboard.omniIntel.small",
                        "Omni-Intel",
                      )}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold text-[#C24B17] sm:text-2xl">
                        {omniIntelScore}
                      </p>
                      {omniIntelDelta != null &&
                      Number.isFinite(omniIntelDelta) ? (
                        <span
                          className={`text-[10px] font-semibold ${
                            omniIntelDelta >= 0
                              ? "text-[#1F7A43]"
                              : "text-[#B8000E]"
                          }`}
                          title={getString(
                            t,
                            "dashboard.delta.vsLast",
                            lang === "ro"
                              ? "față de ultima vizită"
                              : "vs last visit",
                          )}
                        >
                          {omniIntelDelta >= 0 ? "+" : ""}
                          {Math.round(omniIntelDelta)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-center text-[10px] text-[#7B6B60] sm:mt-1 sm:text-[11px]">
                      {getString(
                        t,
                        "dashboard.omniIntel.small",
                        "Omni-Intel",
                      )}
                    </p>
                  </Card>
                </motion.div>
                {/* Focus theme */}
                <motion.div
                  variants={fadeDelayed(0.09)}
                  {...hoverScale}
                  className="h-full"
                >
                  <Card className="flex h-full flex-col justify-between rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-2 shadow-sm sm:p-2">
                    <h2 className="mb-1 text-[11px] font-semibold text-[#2C2C2C] sm:mb-1.5 sm:text-[12px]">
                      {lang === "ro" ? "Tematica în focus" : "Focus theme"}
                    </h2>
                    <p className="text-[13px] font-bold text-[#2C2C2C] sm:text-sm">
                      {focusTheme.area}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#7B6B60] sm:mt-1 sm:text-[11px]">
                      {focusTheme.desc}
                    </p>
                    <div className="mt-1.5 flex items-center justify-end">
                      <Link
                        href="/wizard?step=intent"
                        className="text-[10px] text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline"
                      >
                        {lang === "ro" ? "Schimbă" : "Change"}
                      </Link>
                    </div>
                  </Card>
                </motion.div>
                {/* Motivation / Resources */}
                <motion.div
                  variants={fadeDelayed(0.11)}
                  {...hoverScale}
                  className="h-full"
                >
                  <Card className="flex h-full flex-col justify-between rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-2 shadow-sm sm:p-2">
                    <h2
                      className="mb-1 whitespace-nowrap text-[11px] font-semibold text-[#2C2C2C] sm:mb-1.5 sm:text-[12px]"
                      title={
                        lang === "ro"
                          ? "Motivație / Resurse"
                          : "Motivation / Resources"
                      }
                    >
                      {lang === "ro"
                        ? "Motivație / Resurse"
                        : "Motivation / Resources"}
                    </h2>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] text-[#7B6B60] sm:text-xs">
                          {getString(
                            t,
                            "dashboard.motivation.index",
                            lang === "ro"
                              ? "Indice motivație"
                              : "Motivation index",
                          )}
                        </span>
                        {(() => {
                          const val = Math.max(
                            0,
                            Math.min(100, Math.round(omniScopeScore)),
                          );
                          return (
                            <span className="flex items-baseline gap-1 text-sm font-bold text-[#2C2C2C] sm:text-base">
                              {val}
                              {motivationDelta != null &&
                              Number.isFinite(motivationDelta) ? (
                                <span
                                  className={`text-[10px] font-semibold ${
                                    motivationDelta >= 0
                                      ? "text-[#1F7A43]"
                                      : "text-[#B8000E]"
                                  }`}
                                  title={getString(
                                    t,
                                    "dashboard.delta.vsLast",
                                    lang === "ro"
                                      ? "față de ultima vizită"
                                      : "vs last visit",
                                  )}
                                >
                                  {motivationDelta >= 0 ? "+" : ""}
                                  {Math.round(motivationDelta)}
                                </span>
                              ) : null}
                            </span>
                          );
                        })()}
                      </div>
                      <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.max(
                          0,
                          Math.min(100, Math.round(omniScopeScore)),
                        )}
                        className="h-2 w-full rounded bg-[#F1EAE3]"
                      >
                        <div
                          className="h-2 rounded bg-[#C07963]"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, Math.round(omniScopeScore)),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-1.5 sm:mt-2">
                      {(() => {
                        const m = (facts?.motivation ?? {}) as Record<
                          string,
                          unknown
                        >;
                        const hours = Number(m.hoursPerWeek ?? 0);
                        const tz = String(m.timeHorizon ?? "");
                        const budget = String(m.budgetLevel ?? "");
                        const mapBudget: Record<string, string> = {
                          low: getString(
                            t,
                            "dashboard.budget.low",
                            lang === "ro"
                              ? "Buget minim"
                              : "Low budget",
                          ),
                          medium: getString(
                            t,
                            "dashboard.budget.medium",
                            lang === "ro"
                              ? "Buget mediu"
                              : "Medium budget",
                          ),
                          high: getString(
                            t,
                            "dashboard.budget.high",
                            lang === "ro"
                              ? "Buget maxim"
                              : "High budget",
                          ),
                        };
                        const mapTz: Record<string, string> = {
                          days: getString(
                            t,
                            "dashboard.tz.days",
                            lang === "ro" ? "Zile" : "Days",
                          ),
                          weeks: getString(
                            t,
                            "dashboard.tz.weeks",
                            lang === "ro"
                              ? "Săptămâni"
                              : "Weeks",
                          ),
                          months: getString(
                            t,
                            "dashboard.tz.months",
                            lang === "ro" ? "Luni" : "Months",
                          ),
                        };
                        const chips: string[] = [];
                        if (hours && Number.isFinite(hours))
                          chips.push(`${hours}h/săpt`);
                        if (budget) chips.push(mapBudget[budget] ?? budget);
                        if (tz) chips.push(mapTz[tz] ?? tz);
                        if (!chips.length) {
                          return (
                            <span
                              className="rounded-[10px] border border-[#E4DAD1] bg-white px-2 py-0.5 text-[10px] text-[#7B6B60]"
                              title={getString(
                                t,
                                "dashboard.motivation.completeTooltip",
                                lang === "ro"
                                  ? "Completează motivația pentru detalii."
                                  : "Complete motivation for details.",
                              )}
                            >
                              {getString(
                                t,
                                "dashboard.motivation.complete",
                                lang === "ro"
                                  ? "Completează motivația pentru detalii."
                                  : "Complete motivation for details.",
                              )}
                            </span>
                          );
                        }
                        return (
                          <p className="text-[10px] text-[#7B6B60]">
                            {chips.join(" · ")}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="mt-2 flex items-center justify-end">
                      <Link
                        href="/wizard?step=intentSummary"
                        className="text-[10px] text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline"
                      >
                        {lang === "ro" ? "Schimbă" : "Change"}
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              </div>
              {/* Insight full-width in center column */}
              <div className="grid grid-cols-1 items-stretch gap-2 md:gap-3 lg:gap-3">
                {/* Insight of the Day */}
                <motion.div
                  variants={fadeDelayed(0.16)}
                  {...hoverScale}
                >
                  <Card
                    className={`flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-3 shadow-sm sm:p-4 ${
                      insightExpanded ? "h-auto" : "h-[180px] sm:h-[220px] lg:h-[260px]"
                    }`}
                  >
                    <motion.h3
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mb-1 text-xs font-semibold text-[#2C2C2C] sm:mb-2 sm:text-sm"
                    >
                      {getString(
                        t,
                        "dashboard.insightTitle",
                        lang === "ro"
                          ? "Revelația zilei"
                          : "Insight of the Day",
                      )}
                    </motion.h3>
                    <div className="relative overflow-auto">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.45 }}
                        className="text-[11px] leading-relaxed text-[#2C2C2C] sm:text-xs"
                      >
                        {insight.text}
                      </motion.p>
                    </div>
                    <div className="mt-1 flex items-center justify-between sm:mt-2">
                      <p className="text-[9px] uppercase tracking-[0.16em] text-[#A08F82] sm:text-[10px]">
                        {getString(
                          t,
                          "dashboard.themeLabel",
                          lang === "ro" ? "Temă" : "Theme",
                        )}
                        : {insight.theme}
                      </p>
                      {/* Expanded by default; toggle removed per request */}
                    </div>
                  </Card>
                </motion.div>
                
              </div>
            </div>
          {/* Profile indices moved under Trends */}
          </div>
          {/* SIDEBAR DREAPTA – independent, coloană unică cu stack de carduri */}
          <div
            className={`mt-2 flex flex-col gap-2 md:mt-3 lg:mt-0 lg:w-[320px] lg:flex-none ${
              debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""
            }`}
          >
            {/* Omni-Kuno recap moved below Recent entries */}
            {/* Profile indices recap removed from sidebar per request */}
            {/* Quest of the Day (moved to sidebar, above Practice) */}
            <motion.div variants={fadeDelayed(0.24)} {...hoverScale}>
              <Card
                className={`flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] px-3 py-2 shadow-sm sm:px-4 sm:py-3 ${
                  questExpanded ? "h-auto" : "h-[120px] sm:h-[140px] lg:h-[160px]"
                }`}
              >
                <h3 className="mb-1 text-xs font-semibold text-[#2C2C2C] sm:mb-2 sm:text-sm">
                  {getString(
                    t,
                    "dashboard.todayQuest",
                    lang === "ro" ? "Provocarea de azi" : "Today’s quest",
                  )}
                </h3>
                {quest.title && (
                  <p className="mb-0.5 text-[11px] font-semibold text-[#7B6B60] sm:mb-1 sm:text-xs">{quest.title}</p>
                )}
                <div className={`relative ${questExpanded ? "" : "overflow-hidden"}`}>
                  <p className="text-[11px] leading-relaxed text-[#2C2C2C] sm:text-xs">{quest.text}</p>
                  {!questExpanded ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#FCF7F1] to-transparent" />
                  ) : null}
                </div>
                <div className="mt-1 flex items-center justify-between sm:mt-2">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[#A08F82] sm:text-[10px]">
                    {lang === "ro" ? "Aplică azi, în viața reală." : "Apply today, in real life."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuestExpanded((v) => !v)}
                    className="text-[11px] font-semibold text-[#7B6B60] underline hover:text-[#2C2C2C]"
                  >
                    {questExpanded ? (lang === "ro" ? "Mai puțin" : "Less") : lang === "ro" ? "Vezi tot" : "More"}
                  </button>
                </div>
              </Card>
            </motion.div>
            {/* Practice snapshot */}
            <motion.div
              variants={fadeDelayed(0.26)}
              {...hoverScale}
            >
              <Card className="flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
                <h4 className="mb-1 text-xs font-semibold text-[#2C2C2C] sm:mb-2 sm:text-sm">
                  Practice snapshot
                </h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Metric
                    label="Reflections"
                    value={prog.reflectionCount}
                    testId="metric-reflections"
                  />
                  <Metric
                    label="Breathing min"
                    value={prog.breathingCount}
                  />
                  <Metric
                    label="Focus drills"
                    value={prog.drillsCount}
                  />
                  <Metric
                    label="Energy idx"
                    value={prog.indices.energy}
                  />
                </div>
                
              </Card>
            </motion.div>
            {/* Recent entries */}
            <motion.div
              variants={fadeDelayed(0.28)}
              {...hoverScale}
            >
              <Card className="min-w-0 rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3.5">
                <div className="mb-1 flex items-center justify-between sm:mb-2">
                  <h4 className="text-xs font-semibold text-[#2C2C2C] sm:text-sm">
                    {lang === "ro"
                      ? "Însemnări recente"
                      : "Recent Entries"}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Link
                      href={{
                        pathname: "/progress",
                        query: { open: "journal" },
                      }}
                      className="rounded-[10px] border border-[#2C2C2C] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] sm:px-2 sm:text-[10px]"
                      aria-label="Open journal"
                    >
                      {lang === "ro" ? "Jurnal" : "Journal"}
                    </Link>
                  </div>
                </div>
                {!facts?.recentEntries?.length ? (
                  <p className="rounded-[10px] border border-[#F0E8E0] bg-[#FFFBF7] px-2 py-1.5 text-[11px] text-[#6A6A6A] sm:px-2.5 sm:py-2 sm:text-xs">
                    {lang === "ro"
                      ? "Nimic deocamdată. Scrie un jurnal sau finalizează un exercițiu."
                      : "Nothing yet. Add a journal entry or complete a practice."}
                  </p>
                ) : (
                  (() => {
                    const all = (facts!.recentEntries as Array<{ text?: string; timestamp?: unknown; tabId?: string }>) || [];
                    const sorted = all
                      .map((e) => ({ ...e, _ms: toMsLocal(e.timestamp), _text: String(e.text ?? '').trim() }))
                      .sort((a, b) => b._ms - a._ms);
                    // Strong UI dedupe: keep only newest per normalized text
                    const dedup: Array<typeof sorted[number]> = [];
                    const seen = new Set<string>();
                    for (const e of sorted) {
                      const key = e._text;
                      if (key && !seen.has(key)) {
                        seen.add(key);
                        dedup.push(e);
                      }
                    }
                    const items = dedup.slice(0, 2);
                    const groups: Record<string, Array<{ text: string; ms: number; tab?: string }>> = {};
                    const fmtDay = (ms: number) => {
                      try {
                        return new Date(ms).toLocaleDateString(
                          lang === 'ro' ? 'ro-RO' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' },
                        );
                      } catch {
                        return String(ms);
                      }
                    };
                    const fmtTime = (ms: number) => {
                      try {
                        return new Date(ms).toLocaleTimeString(
                          lang === 'ro' ? 'ro-RO' : 'en-US',
                          { hour: '2-digit', minute: '2-digit' },
                        );
                      } catch {
                        return formatUtcShort(ms);
                      }
                    };
                    items.forEach((e) => {
                      const ms = e._ms as number;
                      const day = fmtDay(ms);
                      (groups[day] ||= []).push({ text: String(e.text ?? '—'), ms, tab: e.tabId });
                    });
                    const orderedDays = Object.keys(groups);
                    return (
                      <div className="max-h-40 overflow-auto pr-1" data-testid="recent-entries">
                        <div className="space-y-1.5 sm:space-y-2.5">
                          {orderedDays.map((day) => (
                            <div key={day}>
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A08F82] sm:text-[11px]">
                                {day}
                              </p>
                              {groups[day].map((it, idx) => {
                                const tab = typeof it.tab === 'string' && it.tab ? it.tab : 'OBSERVATII_EVALUARE';
                                const href = { pathname: '/progress', query: { open: 'journal', tab } } as const;
                                const full = String(it.text);
                                const MAX_PREVIEW = 60;
                                const short = full.length > MAX_PREVIEW ? full.slice(0, MAX_PREVIEW).trimEnd() + "…" : full;
                                return (
                                  <div
                                    key={`${day}-${idx}`}
                                    className="mb-1.5 border-b border-[#F0E8E0] pb-1.5 last:border-b-0 last:pb-0 sm:mb-2.5 sm:pb-2"
                                  >
                                    <Link href={href} className="block truncate text-[11px] text-[#2C2C2C] underline-offset-2 hover:underline sm:text-xs" title={full}>
                                      {short}
                                    </Link>
                                    <p className="mt-0.5 text-[9px] text-[#A08F82] sm:mt-1 sm:text-[10px]" suppressHydrationWarning>
                                      {fmtTime(it.ms)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                )}
                <div className="mt-1 flex items-center justify-end sm:mt-2">
                  <Link
                    href={{
                      pathname: "/progress",
                      query: { open: "journal" },
                    }}
                    className="text-[10px] text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline"
                  >
                    {lang === "ro" ? "Vezi tot" : "See all"}
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Omni Kuno Edu (moved below Recent entries) */}
            <motion.div variants={fadeDelayed(0.30)} {...hoverScale}>
              <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
                <div className="mb-1 flex items-center justify-between sm:mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-[#2C2C2C] sm:text-sm">
                      {lang === "ro" ? "Omni Kuno Edu" : "Omni Kuno Edu"}
                    </h4>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-[#C24B17] sm:text-xl">
                        {Math.max(0, Math.min(100, Math.round(omniCunoScore)))}
                      </span>
                      {kunoDelta != null && Number.isFinite(kunoDelta) ? (
                        <span
                          className={`text-[10px] font-semibold ${kunoDelta >= 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}`}
                          title={lang === "ro" ? "față de ultima vizită" : "vs last visit"}
                        >
                          {kunoDelta >= 0 ? "+" : ""}
                          {Math.round(kunoDelta)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const ms = (() => {
                        const f = facts as unknown as { updatedAt?: unknown };
                        const t = toMsLocal(f?.updatedAt);
                        return t || refMs || Date.now();
                      })();
                      return (
                        <span className="rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#7B6B60]" title={lang === 'ro' ? 'Actualizat' : 'Updated'}>
                          {lang === 'ro' ? 'Actualizat' : 'Updated'}: {formatRelative(ms)}
                        </span>
                      );
                    })()}
                  </div>
                  {(() => {
                    type KunoLite = { readinessIndex?: number } | undefined;
                    const kunoObj = omni?.kuno as KunoLite;
                    const r = kunoObj?.readinessIndex as number | undefined;
                    if (typeof r !== "number") return null;
                    return (
                      <span
                        className="rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#7B6B60]"
                        title={lang === "ro" ? "Disponibilitate pentru învățare azi" : "Learning readiness today"}
                      >
                        {lang === "ro" ? "Readiness" : "Readiness"}: {Math.round(Math.max(0, Math.min(100, r)))}
                      </span>
                    );
                  })()}
                </div>
                {(() => {
                  type MasteryMap = Record<string, number>;
                  const kuno = omni?.kuno as
                    | { masteryByCategory?: MasteryMap; lastLessons?: string[]; signals?: { lastLessonsCsv?: string } }
                    | undefined;
                  let mastery: MasteryMap | undefined = kuno?.masteryByCategory;
                  if ((!mastery || Object.keys(mastery).length === 0) && typeof window !== "undefined") {
                    try {
                      const raw = window.localStorage.getItem("omnimental_kuno_guest_mastery");
                      if (raw) mastery = JSON.parse(raw) as MasteryMap;
                    } catch {}
                  }
                  let masteryPrev: MasteryMap | undefined;
                  if (typeof window !== "undefined") {
                    try {
                      const rawPrev = window.localStorage.getItem("omnimental_kuno_guest_mastery_prev");
                      if (rawPrev) masteryPrev = JSON.parse(rawPrev) as MasteryMap;
                      if (mastery && Object.keys(mastery).length) window.localStorage.setItem("omnimental_kuno_guest_mastery_prev", JSON.stringify(mastery));
                    } catch {}
                  }
                  const catLabel: Record<string, string> = {
                    clarity: lang === "ro" ? "Claritate" : "Clarity",
                    calm: lang === "ro" ? "Calm" : "Calm",
                    energy: lang === "ro" ? "Energie" : "Energy",
                    relationships: lang === "ro" ? "Relații" : "Relationships",
                    performance: lang === "ro" ? "Performanță" : "Performance",
                    health: lang === "ro" ? "Sănătate" : "Health",
                  };
                  const items: Array<{ key: string; label: string; value: number }> = [];
                  if (mastery && Object.keys(mastery).length) {
                    const sorted = Object.entries(mastery)
                      .filter(([, v]) => typeof v === "number")
                      .sort((a, b) => Number(b[1]) - Number(a[1]))
                      .slice(0, 3);
                    sorted.forEach(([k, v]) => items.push({ key: k, label: catLabel[k] ?? k, value: Math.round(Number(v)) }));
                  }
                  const list: ReactNode[] = [];
                  if (items.length) {
                    list.push(
                      <div key="mk" className="mt-1 space-y-1.5">
                        {items.map((it, i) => (
                          <div key={`${it.key}-${i}`} className="flex items-center gap-2">
                            <span className="w-24 truncate text-[11px] text-[#7B6B60]">{it.label}</span>
                            <div className="relative h-2 w-full rounded bg-[#F1EAE3]">
                              <div className="absolute left-0 top-0 h-2 rounded bg-[#C07963]" style={{ width: `${Math.max(0, Math.min(100, it.value))}%` }} />
                            </div>
                            <span className="w-12 text-right text-[11px] text-[#7B6B60]">
                              {Math.max(0, Math.min(100, it.value))}%
                              {(() => {
                                const prev = masteryPrev?.[it.key];
                                if (typeof prev !== "number") return null;
                                const d = Math.round(Number(it.value) - Number(prev));
                                if (!Number.isFinite(d) || d === 0) return null;
                                return <span className={`ml-1 text-[10px] ${d > 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}`}>{d > 0 ? "↑" : "↓"}{Math.abs(d)}</span>;
                              })()}
                            </span>
                          </div>
                        ))}
                      </div>,
                    );
                  }
                  let lessons: string[] = Array.isArray(kuno?.lastLessons) ? (kuno!.lastLessons as string[]) : [];
                  if (!lessons.length) {
                    const csv = kuno?.signals?.lastLessonsCsv;
                    if (typeof csv === "string") lessons = csv.split("|").map((s) => s.trim()).filter(Boolean);
                  }
                  if (lessons.length) {
                    list.push(
                      <div key="ll" className="mt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {lessons.slice(0, 4).map((l, i) => (
                            <span key={`${l}-${i}`} className="rounded-[10px] border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#7B6B60]">{l}</span>
                          ))}
                        </div>
                      </div>,
                    );
                  }
                  if (!list.length) {
                    list.push(
                      <p key="empty" className="rounded-[10px] border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-1.5 text-[11px] text-[#7B6B60]">
                        {lang === "ro" ? "Începe cu lecțiile Omni-Kuno pentru a vedea progresul aici." : "Start Omni-Kuno lessons to see progress here."}
                      </p>,
                    );
                  }
                  return <>{list}</>;
                })()}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href="/kuno" className="rounded-[10px] border border-[#2C2C2C] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2C2C2C] transition hover:border-[#C24B17] hover:text-[#C24B17]">
                      {lang === "ro" ? "Exersează 3 min" : "Practice 3 min"}
                    </Link>
                    <Link href="/kuno/learn" className="rounded-[10px] border border-[#2C2C2C] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2C2C2C] transition hover:border-[#C24B17] hover:text-[#C24B17]">
                      {lang === "ro" ? "Învață 1 lecție" : "Learn 1 lesson"}
                    </Link>
                  </div>
                  <Link href="/kuno/learn" className="text-[10px] text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline">
                    {lang === "ro" ? "Continuă" : "Continue"}
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Achievement banner + initial insights – tot în coloană dreapta */}
            {showAchv ? (
              <div className="mt-1 rounded-xl border border-[#CBE8D7] bg-[#F3FFF8] p-2 text-sm text-[#1F3C2F] sm:mt-2 sm:p-3">
                <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                  <p className="text-[13px] font-medium sm:text-sm">
                    {lang === "ro"
                      ? "Prima treaptă atinsă: Claritate"
                      : "First milestone reached: Clarity"}
                  </p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link
                      href="/antrenament"
                      className="rounded border border-[#1F3C2F] px-1.5 py-0.5 text-[10px] hover:bg-[#1F3C2F] hover:text-white sm:px-2 sm:text-[11px]"
                      aria-label="Go to Training"
                    >
                      {lang === "ro"
                        ? "Începe antrenamentul"
                        : "Go to Training"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined")
                          window.localStorage.setItem(
                            "omni_onboarding_achv_dismissed",
                            "1",
                          );
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
                  {lang === "ro"
                    ? "Ai trecut prin primele două etape. Continuă cu exercițiile scurte pentru a stabiliza progresul."
                    : "You’ve completed the first two steps. Continue with short exercises to stabilize progress."}
                </p>
              </div>
            ) : null}
            {Array.isArray(profile?.simulatedInsights) &&
            profile!.simulatedInsights!.length > 0 ? (
              <motion.div
                variants={fadeDelayed(0.3)}
                {...hoverScale}
                className="mt-1 sm:mt-2"
              >
                <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2 shadow-sm sm:p-3">
                  <h3 className="mb-1 text-xs font-semibold text-[#2C2C2C] sm:mb-2 sm:text-sm">
                    {getString(
                      t,
                      "dashboard.initialInsights",
                      lang === "ro"
                        ? "Insight-uri inițiale"
                        : "Initial insights",
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {profile!.simulatedInsights!.map(
                      (tag, i) => (
                        <span
                          key={`${tag}-${i}`}
                          className="rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#2C2C2C] sm:px-2.5 sm:text-[11px]"
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </div>
        </div>
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
  const bg = `conic-gradient(#7A6455 0 ${cPct}%, #4D3F36 ${cPct}% ${
    cPct + calmPct
  }%, #C07963 ${cPct + calmPct}% 100%)`;
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="h-14 w-14 rounded-full sm:h-18 sm:w-18 lg:h-22 lg:w-22"
        style={{ background: bg }}
      />
      <div className="absolute h-8 w-8 rounded-full bg-white shadow-inner sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
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
      <div className="flex items-center gap-1">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"
          style={{ backgroundColor: color }}
        />
        <span className="text-[10px] text-[#5C4F45] sm:text-[11px]">
          {label}
        </span>
      </div>
      <span className="text-[10px] font-semibold text-[#2C2C2C] sm:text-[11px]">
        {Math.round(value)}%
      </span>
    </div>
  );
}
// ------------------------------------------------------
// METRIC TILE
// ------------------------------------------------------
function Metric({
  label,
  value,
  badge,
  testId,
  tooltipItems,
  debugBadge,
  testIdValue,
}: {
  label: string;
  value: number;
  badge?: string;
  testId?: string;
  tooltipItems?: string[];
  debugBadge?: string;
  testIdValue?: string;
}) {
  return (
    <div data-testid={testId} className="relative rounded-lg border border-[#EFE3D7] bg-[#FCF7F1] px-1.5 py-1 text-left sm:px-2 sm:py-1.5">
      {Array.isArray(tooltipItems) && tooltipItems.length > 0 ? (
        <div className="absolute right-1 top-1 z-10 sm:right-1.5 sm:top-1.5">
          <InfoTooltip items={tooltipItems} label={label} />
        </div>
      ) : null}
      {badge ? (
        <span className="absolute -right-1 -top-1 rounded-full border border-[#E4DAD1] bg-white px-1 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[#C07963] sm:px-1.5 sm:text-[9px]">
          {badge}
        </span>
      ) : null}
      <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#7B6B60] sm:text-[10px]">
        <span>{label}</span>
        {debugBadge ? (
          <span className="ml-1 rounded bg-[#EDE6DE] px-1 py-0.5 text-[8px] font-semibold normal-case tracking-normal text-[#7B6B60]">
            {debugBadge}
          </span>
        ) : null}
      </p>
      <p className="text-[14px] font-bold text-[#C24B17] sm:text-base" data-testid={testIdValue}>
        {value}
      </p>
    </div>
  );
}
