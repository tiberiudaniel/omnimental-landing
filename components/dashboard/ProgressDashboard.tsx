"use client";
import { Card } from "@/components/ui/card";
import { useProgressFacts } from "@/components/useProgressFacts";
import type { ProgressFact } from "@/lib/progressFacts";
import { adaptProgressFacts } from "@/lib/progressAdapter";
import { getDailyInsight } from "@/lib/insights";
import { getAreasForScript } from "@/lib/quests";
import type { OmniBlock } from "@/lib/omniIntel";
import { motion, type Variants } from "framer-motion";
import InfoTooltip from "@/components/InfoTooltip";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useProfile } from "@/components/ProfileProvider";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import WeeklyTrendsChart from "@/components/charts/WeeklyTrendsChart";
import { INDICATORS } from "@/lib/indicators";
import { computeKunoComposite, computeOmniScope, computeOmniFlex } from "@/lib/dashboardMetrics";
import {
  extractSessions,
  computeWeeklyBuckets,
  computeWeeklyCounts,
  computeMonthlyDailyMinutes,
  computeMonthlyDailyCounts,
  computeActionTrend,
  type ActivityEvent,
} from "@/lib/progressAnalytics";
import { recordActivityEvent } from "@/lib/progressFacts";
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
  hideOmniIntel,
}: {
  profileId: string;
  demoFacts?: ProgressFact;
  debugGrid?: boolean;
  hideOmniIntel?: boolean;
}) {
  const { data: liveFacts, loading: liveLoading } = useProgressFacts(profileId);
  const { profile } = useProfile();
  const facts = demoFacts ?? liveFacts;
  const loading = demoFacts ? false : liveLoading;
  const { t, lang } = useI18n();
  // Read debug flag from URL early to keep hook order stable across renders
  const search = useSearchParams();
  const debugMode = (search?.get('debug') === '1');
  const [timeframe, setTimeframe] = useState<"week" | "month">("week");
  const [qaOpen, setQaOpen] = useState(false);
  const [qaCategory, setQaCategory] = useState<'practice' | 'reflection' | 'knowledge'>('practice');
  const [qaMinutes, setQaMinutes] = useState<number>(10);
  const [qaBusy, setQaBusy] = useState(false);
  const [qaSelectedDays, setQaSelectedDays] = useState<number[]>([]); // timestamps (start of day)
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
  // const [insightExpanded] = useState(false);
  const [questExpanded, setQuestExpanded] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  useEffect(() => {
    // Keep the greeting long enough to be read comfortably (~2s total including enter animation)
    const id = window.setTimeout(() => setShowWelcome(false), 2000);
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
  // Loading state handled inline in render to keep hooks order stable
  // No hard gating: safe fallbacks (no hooks here to avoid order changes with loading early return)
  const prog = adaptProgressFacts(facts);
  const insight = getDailyInsight(prog.strengths.dominantTheme);
  const sessions = extractSessions(facts ?? null);
  // Current focus tag (top category from intent)
  const currentFocusTag = useMemo(() => {
    try {
      const cats = (facts as { intent?: { categories?: Array<{ category: string; count: number }> } } | undefined)?.intent?.categories || [];
      if (!cats.length) return undefined;
      const top = [...cats].sort((a,b)=> (b.count||0)-(a.count||0))[0]?.category?.toLowerCase() || '';
      const map: Record<string,string> = {
        relatii: 'relationships', relatie: 'relationships',
        calm: 'calm', stres: 'calm',
        claritate: 'clarity', identitate: 'clarity', focus: 'clarity',
        energie: 'energy', energy: 'energy',
        performanta: 'performance',
        sanatate: 'health', health: 'health',
        obiceiuri: 'general', sens: 'general', general: 'general',
      };
      const key = Object.keys(map).find(k=> top.includes(k));
      return key ? map[key] : undefined;
    } catch { return undefined; }
  }, [facts]);
  const refMs =
    (facts?.updatedAt instanceof Date ? facts.updatedAt.getTime() : 0) ||
    Math.max(
      0,
      ...sessions.map((s: { startedAt?: unknown }) => toMsLocal(s.startedAt)),
    ) ||
    1;
  // Anchor weekly/monthly windows to 'today' so charts include AZI + ultimele zile
  const nowMs = Date.now();
  const weekly = computeWeeklyBuckets(sessions, nowMs, lang);
  const weeklyCounts = computeWeeklyCounts(sessions, nowMs, lang);
  // const today = computeTodayBucket(sessions, refMs, lang);
  // const todayCounts = computeTodayCounts(sessions, refMs, lang); // unused
  const monthDays = computeMonthlyDailyMinutes(sessions, nowMs);
  const monthCounts = computeMonthlyDailyCounts(sessions, nowMs);

  // Merge explicit activityEvents (knowledge/practice/reflection) into Minutes and Sessions trends
  type RawAE = { startedAt?: unknown; source?: string; category?: 'knowledge'|'practice'|'reflection'; units?: number; durationMin?: number; focusTag?: string | null };
  const rawEvents: RawAE[] = (facts as { activityEvents?: RawAE[] } | undefined)?.activityEvents ?? [];
  const getMs = (v: unknown): number => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'string') { const t = Date.parse(v); return Number.isFinite(t) ? t : 0; }
    if ((v as { toDate?: () => Date })?.toDate) {
      try { return ((v as { toDate: () => Date }).toDate()).getTime(); } catch { return 0; }
    }
    return 0;
  };
  const startOfDayLocal = (ms: number) => { const d = new Date(ms); d.setHours(0,0,0,0); return d.getTime(); };
  const DAY = 24*60*60*1000;
  const DEFAULT_MIN_PER_UNIT: Record<'knowledge'|'practice'|'reflection', number> = { knowledge: 6, practice: 8, reflection: 4 };

  // Helper to add events to an array of day buckets
  const addEventsToBuckets = (buckets: { day: number; totalMin: number; label: string }[], startMs: number, days: number) => {
    rawEvents.forEach((r) => {
      if (!r.category) return;
      const ms = getMs(r.startedAt);
      if (!ms) return;
      const sod = startOfDayLocal(ms);
      const endMs = startMs + days * DAY - 1;
      if (sod < startMs || sod > endMs) return;
      const idx = Math.floor((sod - startMs) / DAY);
      if (idx < 0 || idx >= buckets.length) return;
      const addMin = typeof r.durationMin === 'number' && Number.isFinite(r.durationMin)
        ? Math.max(0, Math.round(r.durationMin))
        : Math.max(0, (r.units ?? 1) * DEFAULT_MIN_PER_UNIT[r.category]);
      buckets[idx].totalMin += addMin;
    });
    return buckets;
  };
  const addEventsToCounts = (buckets: { day: number; totalMin: number; label: string }[], startMs: number, days: number) => {
    rawEvents.forEach((r) => {
      if (!r.category) return;
      const ms = getMs(r.startedAt);
      if (!ms) return;
      const sod = startOfDayLocal(ms);
      const endMs = startMs + days * DAY - 1;
      if (sod < startMs || sod > endMs) return;
      const idx = Math.floor((sod - startMs) / DAY);
      if (idx < 0 || idx >= buckets.length) return;
      buckets[idx].totalMin += 1; // count each activity event as a session unit
    });
    return buckets;
  };

  // Build merged weekly/minute and weekly/count buckets
  const weekStart = startOfDayLocal(nowMs - 6 * DAY);
  const weeklyWithEvents = addEventsToBuckets(weekly.map(x => ({...x})), weekStart, 7);
  const weeklyCountsWithEvents = addEventsToCounts(weeklyCounts.map(x => ({...x})), weekStart, 7);

  // Build merged month/minute and month/count buckets (month-to-date)
  const monthStart = ((): number => { const d = new Date(nowMs); d.setDate(1); d.setHours(0,0,0,0); return d.getTime(); })();
  const daysInMonth = ((): number => { const d = new Date(nowMs); return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); })();
  // Align events merge with monthly buckets start (rolling window end today)
  const monthBucketsStart = (monthDays[0]?.day as number | undefined) ?? monthStart;
  const monthBucketsLen = monthDays.length || daysInMonth;
  const monthWithEvents = addEventsToBuckets(monthDays.map(x => ({...x})), monthBucketsStart, monthBucketsLen);
  const monthCountsWithEvents = addEventsToCounts(monthCounts.map(x => ({...x})), monthBucketsStart, monthBucketsLen);

  // (legacy weighted minutes scaffolding removed — we now rely on action trend scoring)
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
  const questPreview = useMemo(() => {
    const txt = (quest?.text || "").trim();
    if (!txt) return "";
    const limit = 140; // short, clean preview that fits collapsed card
    if (txt.length <= limit) return txt;
    const slice = txt.slice(0, limit);
    // avoid cutting mid-word
    const lastSpace = slice.lastIndexOf(" ");
    return (lastSpace > 60 ? slice.slice(0, lastSpace) : slice).trimEnd() + "…";
  }, [quest?.text]);
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
      clarity: lang === "ro" ? "Claritate mentală" : "Clarity",
      focus: lang === "ro" ? "Claritate mentală" : "Clarity",
      calm: lang === "ro" ? "Echilibru emoțional" : "Calm",
      energy: lang === "ro" ? "Energie fizică" : "Energy",
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
      return timeframe === "week" ? "Trendul acțiunilor / săptămână" : "Trendul acțiunilor / lună";
    }
    return timeframe === "week" ? "Actions trend / week" : "Actions trend / month";
  })();
  return (
    <motion.section
      initial="hidden"
      animate="show"
      className="w-full bg-[#FDFCF9] px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
    >
      <Card className="mx-auto max-w-6xl rounded-2xl border border-[#E4DAD1] bg-white/90 px-3 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)] sm:px-4 sm:py-5">
        {/* WRAPPER: MAIN AREA (stânga+centru) + SIDEBAR (dreapta independentă) */}
        {loading ? (
          <div className="text-sm text-[#6A6A6A]">{lang==='ro'?'Se încarcă datele…':'Loading data…'}</div>
        ) : null}
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
              <h2 className="mt-0 mb-1.5 text-base font-bold text-[#A08F82] sm:mt-0 sm:text-lg lg:mt-0 lg:text-xl">
                OmniMental Progress
              </h2>
              {/* Internal indices – PIE CHART */}
              <motion.div variants={fadeDelayed(0.05)} {...hoverScale}>
                <Card className="flex items-center gap-2 rounded-xl border border-[#E4DAD1] bg-white p-1.5 shadow-sm sm:gap-3 sm:p-2.5">
                  <div className="flex-1">
                    <div className="mb-0.5 flex items-center justify-between sm:mb-1">
                      <h3 className="text-[13px] font-semibold tracking-[0.02em] text-[#6E5F55] sm:text-[14px]">
                        {lang === 'ro' ? 'KPI — Gândire • Emoție • Energie' : 'KPI — Thinking • Emotion • Energy'}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-[#8C7C70] sm:text-[11px]">
                        {lang === 'ro' ? 'Evoluția indicatorilor interni în timp.' : 'Evolution of internal indicators over time.'}
                      </p>
                    </div>
                    {/* Row: Week/Month toggle, aligned like in trend card */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[9px] sm:text-[10px]">
                        <button
                          type="button"
                          onClick={() => setTimeframe('week')}
                          className={`rounded px-1.5 py-0.5 transition ${timeframe === 'week' ? 'bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold' : 'text-[#5C4F45]'}`}
                          aria-label="Toggle KPI to week"
                          data-testid="kpi-toggle-week"
                        >
                          {getString(t, 'dashboard.trendsToggle.week', lang === 'ro' ? 'Săptămână' : 'Week')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimeframe('month')}
                          className={`rounded px-1.5 py-0.5 transition ${timeframe === 'month' ? 'bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold' : 'text-[#5C4F45]'}`}
                          aria-label="Toggle KPI to month"
                          data-testid="kpi-toggle-month"
                        >
                          {getString(t, 'dashboard.trendsToggle.month', lang === 'ro' ? 'Lună' : 'Month')}
                        </button>
                      </div>
                    </div>
                    {/* Donut removed; focus on linear evolution + legend */}
                    {(() => {
                      try {
                        type HistRec = Record<string, { clarity?: number; calm?: number; energy?: number; updatedAt?: unknown }>;
                        const hist: HistRec = (
                          (facts as { omni?: { scope?: { history?: HistRec } } } | undefined)?.omni?.scope?.history ?? {}
                        );
                        const entries = Object.entries(hist);
                        if (!entries.length) {
                          return (
                            <div className="mt-2 border-t border-[#F0E8E0] pt-2 sm:pt-2.5 text-[11px] text-[#7B6B60]">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[11px] text-[#7B6B60]">
                                  {lang === 'ro' ? 'Nu avem încă istoric pentru indicatori. Completează rapid sliderele (1–10) ca să începem evoluția.' : 'No history yet. Do a quick 1–10 slider check to start your evolution.'}
                                </p>
                                <div className="flex items-center gap-3">
                                  <a href="/experience-onboarding?flow=initiation&step=daily-state" className="text-[#2C2C2C] underline hover:text-[#C07963]" data-testid="internal-cta-sliders">
                                    {lang === 'ro' ? 'Actualizează (1–10)' : 'Update (1–10)'}
                                  </a>
                                  <a href="/progress?open=journal&tab=NOTE_LIBERE" className="text-[#2C2C2C] underline hover:text-[#C07963]" data-testid="internal-cta-journal">
                                    {lang === 'ro' ? 'Adaugă o notă rapidă' : 'Add a quick note'}
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        const byDay = entries
                          .map(([k, v]) => {
                            const ts = (() => {
                              const y = Number(k.slice(1,5));
                              const m = Number(k.slice(5,7)) - 1;
                              const d = Number(k.slice(7,9));
                              const dt = new Date(y, m, d).getTime();
                              return Number.isFinite(dt) ? dt : 0;
                            })();
                            return { ts, clarity: Number(v.clarity)||0, calm: Number(v.calm)||0, energy: Number(v.energy)||0 };
                          })
                          .filter((e) => e.ts > 0)
                          .sort((a, b) => a.ts - b.ts);
                        const limit = timeframe === 'week' ? 7 : 30;
                        const take = byDay.slice(-limit);
                        const data = take.map((e) => ({ day: e.ts, totalMin: e.clarity, label: new Date(e.ts).getDate().toString() }));
                        const series = [
                          { data: take.map((e) => ({ day: e.ts, totalMin: e.clarity, label: new Date(e.ts).getDate().toString() })), accent: '#7A6455', strokeWidth: 2 },
                          { data: take.map((e) => ({ day: e.ts, totalMin: e.calm, label: new Date(e.ts).getDate().toString() })), accent: '#4D3F36', strokeWidth: 2 },
                          { data: take.map((e) => ({ day: e.ts, totalMin: e.energy, label: new Date(e.ts).getDate().toString() })), accent: '#C07963', strokeWidth: 2 },
                        ];
                        return (
                          <div className="mt-1.5 border-t border-[#F0E8E0] pt-1.5 sm:pt-2">
                            {/* Legend removed — chips below show labels + values + delta */}
                            <div className="h-[100px] sm:h-[110px]">
                              <WeeklyTrendsChart
                                data={data}
                                series={series}
                                showBars={false}
                                showValues={false}
                                showXAxisBaseline={false}
                                yAxisWidth={14}
                                ariaLabel={lang === 'ro' ? 'Evoluție indicatori interni' : 'Internal indicators evolution'}
                              />
                            </div>
                            {(() => {
                              try {
                                const last = take[take.length - 1] || { clarity: 0, calm: 0, energy: 0 } as unknown as { clarity: number; calm: number; energy: number };
                                const prev = take.length >= 2 ? (take[take.length - 2] as { clarity: number; calm: number; energy: number }) : last;
                                const Delta = ({ d }: { d: number }) => {
                                  const col = d > 0 ? '#1F7A53' : d < 0 ? '#8C2B2F' : '#7B6B60';
                                  const arrow = d > 0 ? '▲' : d < 0 ? '▼' : '•';
                                  const sign = d > 0 ? '+' : '';
                                  return <span className="ml-1 text-[10px]" style={{ color: col }}>{arrow} {sign}{Math.round(d)}</span>;
                                };
                                const Chip = ({ color, label, value, delta }: { color: string; label: string; value: number; delta: number }) => (
                                  <span className="inline-flex items-center gap-1 rounded-[10px] border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-[2px] text-[10px] text-[#6E5F55]">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                                    <span>{label}</span>
                                    <span className="font-semibold text-[#5A4C43]">{Math.round(value)}</span>
                                    <Delta d={delta} />
                                  </span>
                                );
                                return (
                                  <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Chip color="#9A8578" label={INDICATORS.mental_clarity.label} value={last.clarity} delta={last.clarity - prev.clarity} />
                                      <Chip color="#766659" label={INDICATORS.emotional_balance.label} value={last.calm} delta={last.calm - prev.calm} />
                                      <Chip color="#B98C7C" label={INDICATORS.physical_energy.label} value={last.energy} delta={last.energy - prev.energy} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <a href="/experience-onboarding?flow=initiation&step=daily-state" className="text-[9px] underline text-[#7B6B60] hover:text-[#2C2C2C]" data-testid="kpi-open-sliders">
                                        {lang === 'ro' ? 'Actualizează (1–10)' : 'Update (1–10)'}
                                      </a>
                                      <a href="/progress?open=journal&tab=NOTE_LIBERE" className="text-[9px] underline text-[#7B6B60] hover:text-[#2C2C2C]" data-testid="internal-link-quick-note">
                                        {lang === 'ro' ? 'Adaugă o notă rapidă' : 'Add a quick note'}
                                      </a>
                                    </div>
                                  </div>
                                );
                              } catch { return (
                                <div className="mt-1 flex justify-end">
                                  <a href="/progress?open=journal&tab=NOTE_LIBERE" className="text-[9px] underline text-[#7B6B60] hover:text-[#2C2C2C]" data-testid="internal-link-quick-note">
                                    {lang === 'ro' ? 'Adaugă o notă rapidă' : 'Add a quick note'}
                                  </a>
                                </div>
                              ); }
                            })()}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                  {/* Removed old side legend to keep KPI card clean */}
                </Card>
              </motion.div>
              {/* Weekly Trends */}
              <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
                <div id="actions-trend">
                <Card className="h-[200px] overflow-hidden rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm sm:h-[240px] sm:p-4 lg:h-[280px]">
                  <h3 className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
                    <span>{trendsTitle}</span>
                    <InfoTooltip
                      label={lang === 'ro' ? 'Despre trend' : 'About trends'}
                      items={lang === 'ro'
                        ? [
                            'Alege intervalul: Săptămână / Lună',
                            'Alege metrica: Minute / Sesiuni / Scor',
                            weighted
                              ? 'Ponderi: minutele pentru Respirație/Drill cântăresc mai mult'
                              : 'Minute: valori brute pe activități',
                            'Scor activitate: 0–100 pe bază de minute ponderate',
                          ]
                        : [
                            'Pick range: Week / Month',
                            'Pick metric: Minutes / Sessions / Score',
                            weighted
                              ? 'Weighted: minutes for Breathing/Drill weigh more'
                              : 'Minutes: raw values across activities',
                            'Activity Score: 0–100 from weighted minutes',
                          ]}
                    />
                  </h3>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] text-[#8C7C70] sm:text-[11px]">
                      {metric === 'score'
                        ? (lang === 'ro' ? 'Scor activitate (0–100)' : 'Activity score (0–100)')
                        : (lang === 'ro' ? 'Evoluția activităților' : 'Activities evolution')}
                    </p>
                    <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto sm:gap-2">
                      <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[10px] sm:text-[11px]">
                        {/* Day toggle removed per product decision: show only Week/Month */}
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
                          // Build action events from practiceSessions
                          const evs: ActivityEvent[] = sessions.map((s) => ({
                            startedAt: ((): number | string | Date => {
                              const v = (s as { startedAt?: unknown })?.startedAt;
                              if (typeof v === 'number' || v instanceof Date || typeof v === 'string') return v as number | string | Date;
                              return Date.now();
                            })(),
                            durationMin: Math.max(0, Math.round((s.durationSec ?? 0) / 60)),
                            units: 1,
                            source: s.type === 'breathing' ? 'breathing' : s.type === 'drill' ? 'drill' : 'journal',
                            category: s.type === 'reflection' ? 'reflection' : 'practice',
                          }));
                          // merge explicit activityEvents (knowledge etc.) if present
                          try {
                            type RawAE = { startedAt?: unknown; source?: string; category?: 'knowledge'|'practice'|'reflection'; units?: number; durationMin?: number; focusTag?: string | null };
                            const raws = (facts as { activityEvents?: RawAE[] } | undefined)?.activityEvents ?? [];
                            raws.forEach((r) => {
                              if (!r.category) return;
                              const started: number | string | Date = (typeof r.startedAt === 'number' || r.startedAt instanceof Date || typeof r.startedAt === 'string') ? (r.startedAt as number | string | Date) : Date.now();
                              const src: ActivityEvent['source'] = ((): ActivityEvent['source'] => {
                                const s = r.source || 'other';
                                return ['omnikuno','omniabil','breathing','journal','drill','slider','other'].includes(s) ? (s as ActivityEvent['source']) : 'other';
                              })();
                              evs.push({
                                startedAt: started,
                                durationMin: typeof r.durationMin === 'number' ? r.durationMin : undefined,
                                units: typeof r.units === 'number' ? r.units : 1,
                                source: src,
                                category: r.category,
                                focusTag: r.focusTag ?? undefined,
                              });
                            });
                          } catch {}
                          const now = Date.now();
                          const days = (() => {
                            if (timeframe === 'week') return 7;
                            const d = new Date(now);
                            // days in current month (28/29/30/31)
                            return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                          })();
                          // Use 'now' so chart ends with today; month uses month-to-date length
                          return computeActionTrend(evs, now, lang, days, currentFocusTag);
                        }
                        if (metric === 'min') {
                          return timeframe === 'week' ? weeklyWithEvents : monthWithEvents;
                        }
                        // sessions count
                        return timeframe === 'week' ? weeklyCountsWithEvents : monthCountsWithEvents;
                      })()}
                      showBars={metric === 'score' || metric === 'count' || metric === 'min'}
                      showValues={true}
                      yAxisWidth={24}
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
                  {metric !== 'min' ? (
                    <p className="mt-1 text-[9px] text-[#7B6B60] sm:text-[10px]">
                      {getString(
                        t,
                        metric === 'count' ? 'dashboard.trendsToggle.sessions' : 'dashboard.trendsToggle.score',
                        metric === 'count' ? (lang === 'ro' ? 'Sesiuni' : 'Sessions') : (lang === 'ro' ? 'Scor' : 'Score'),
                      )}
                    </p>
                  ) : null}
                  {(() => {
                    // After the chart: show split + quick add for gap days (only last 7)
                    try {
                      // rebuild events array (same as above)
                      const evs: ActivityEvent[] = sessions.map((s) => ({
                        startedAt: s.startedAt as number | string | Date,
                        durationMin: Math.max(0, Math.round((s.durationSec ?? 0) / 60)),
                        units: 1,
                        source: s.type === 'breathing' ? 'breathing' : s.type === 'drill' ? 'drill' : 'journal',
                        category: s.type === 'reflection' ? 'reflection' : 'practice',
                      }));
                      type RawAE = { startedAt?: unknown; source?: string; category?: 'knowledge'|'practice'|'reflection'; units?: number; durationMin?: number; focusTag?: string | null };
                      const raws = (facts as { activityEvents?: RawAE[] } | undefined)?.activityEvents ?? [];
                      raws.forEach((r) => {
                        if (!r.category) return;
                        const started: number | string | Date = (typeof r.startedAt === 'number' || r.startedAt instanceof Date || typeof r.startedAt === 'string') ? (r.startedAt as number | string | Date) : Date.now();
                        const src = ((): ActivityEvent['source'] => {
                          const s = r.source || 'other';
                          return ['omnikuno','omniabil','breathing','journal','drill','slider','other'].includes(s) ? (s as ActivityEvent['source']) : 'other';
                        })();
                        evs.push({ startedAt: started, durationMin: typeof r.durationMin==='number'?r.durationMin:undefined, units: typeof r.units==='number'?r.units:1, source: src, category: r.category, focusTag: r.focusTag ?? undefined });
                      });
                      const last7 = computeActionTrend(evs, Date.now(), lang, 7, currentFocusTag);
                      const gaps = last7.filter((d) => (d.totalMin || 0) === 0).map(d=> d.day);
                      const hasGaps = gaps.length > 0;
                      // rounding helper no longer needed
                      // compute split
                      let wK=0,wP=0,wR=0; const now7=refMs - 6*24*60*60*1000;
                      evs.forEach((e)=>{
                        const ms = toMsLocal(e.startedAt);
                        if (ms < now7) return;
                        const base = typeof e.durationMin==='number'&&Number.isFinite(e.durationMin)? Math.max(0,e.durationMin): Math.max(0,(e.units||1)*(e.category==='knowledge'?6:e.category==='practice'?8:4));
                        const w = e.category==='knowledge'?0.8:e.category==='practice'?1.5:1.1;
                        const v = base*w*(currentFocusTag && e.focusTag ? (e.focusTag===currentFocusTag?1.0:0.5):1.0);
                        if (e.category==='knowledge') wK+=v; else if (e.category==='practice') wP+=v; else wR+=v;
                      });
                      const tot = (wK+wP+wR)||1;
                      const pct = (x:number)=> Math.round((x/tot)*100);
                      return (
                        <div className="mt-2">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#7B6B60]">
                            <span>{lang==='ro'? 'Pondere (ultimele 7 zile):' : 'Share (last 7 days):'} {pct(wP)}% practice, {pct(wK)}% knowledge, {pct(wR)}% reflection.</span>
                            {hasGaps ? (
                              <button type="button" className="underline text-[#2C2C2C] hover:text-[#C07963]" onClick={() => { setQaOpen(!qaOpen); if (!qaSelectedDays.length) setQaSelectedDays([gaps[0]!]); }} data-testid="trend-quick-add">{lang==='ro'?'Adaugă acțiune rapidă':'Add quick action'}</button>
                            ) : null}
                          </div>
                          {qaOpen && hasGaps ? (
                            <div className="mt-2 rounded-[8px] border border-[#E4DAD1] bg-[#FFFBF7] p-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-[10px] text-[#7B6B60]">
                                  <span>{lang==='ro'?'Zile fără acțiuni:':'Gap days:'}</span>
                                  {gaps.map((g)=>{
                                    const d=new Date(g); const lbl = d.getDate();
                                    const checked = qaSelectedDays.includes(g);
                                    return (
                                      <label key={g} className="inline-flex items-center gap-1">
                                        <input type="checkbox" checked={checked} onChange={(e)=>{
                                          setQaSelectedDays(prev=> e.target.checked ? Array.from(new Set([...prev,g])) : prev.filter(x=>x!==g));
                                        }} />
                                        <span>{lbl}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <label className="text-[10px] text-[#7B6B60]">
                                  {lang==='ro'?'Categorie':'Category'}
                                  <select value={qaCategory} onChange={(e)=> setQaCategory(e.target.value as 'practice'|'reflection'|'knowledge')} className="ml-1 rounded border border-[#E4DAD1] bg-white px-1 py-0.5 text-[10px]">
                                    <option value="practice">{lang==='ro'?'Practică':'Practice'}</option>
                                    <option value="knowledge">{lang==='ro'?'Cunoaștere':'Knowledge'}</option>
                                    <option value="reflection">{lang==='ro'?'Reflecție':'Reflection'}</option>
                                  </select>
                                </label>
                                <label className="text-[10px] text-[#7B6B60]">
                                  {lang==='ro'?'Minute':'Minutes'}
                                  <input type="number" min={1} max={180} value={qaMinutes} onChange={(e)=> setQaMinutes(Number(e.target.value)||0)} className="ml-1 w-16 rounded border border-[#E4DAD1] bg-white px-1 py-0.5 text-[10px]" />
                                </label>
                                <button type="button" disabled={qaBusy || !qaSelectedDays.length || qaMinutes<=0} onClick={async()=>{
                                  setQaBusy(true);
                                  try {
                                    const promises = qaSelectedDays.map(async (dayMs)=>{
                                      const ts = dayMs + 12*60*60*1000; // noon
                                      await recordActivityEvent({ startedAtMs: ts, source: qaCategory==='knowledge'?'omnikuno':'other', category: qaCategory, durationMin: qaMinutes, units: 1, focusTag: currentFocusTag ?? null }, profileId);
                                    });
                                    await Promise.all(promises);
                                    setQaOpen(false); setQaSelectedDays([]);
                                  } catch(e) { console.warn('quick-add failed', e); } finally { setQaBusy(false); }
                                }} className="rounded border border-[#2C2C2C] px-2 py-0.5 text-[10px] font-semibold text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]">{qaBusy? (lang==='ro'?'Se salvează…':'Saving…') : (lang==='ro'?'Salvează':'Save')}</button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </Card>
                </div>
              </motion.div>
            </div>

            {/* Profile indices – directly under Trends (span left + center) */}
            <motion.div
              variants={fadeDelayed(0.22)}
              {...hoverScale}
              className={`order-3 md:order-3 md:col-span-2 ${debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""}`}
            >
              <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
                <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
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
                    label="Omni-Cuno"
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
                      clarity: lang === 'ro' ? 'Claritate mentală' : 'Clarity',
                      calm: lang === 'ro' ? 'Echilibru emoțional' : 'Calm',
                      energy: lang === 'ro' ? 'Energie fizică' : 'Energy',
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
                {showWelcome ? (
                  <motion.div variants={fadeDelayed(0.08)} {...hoverScale} className="h-full">
                    <Card className="flex h-full flex-col rounded-xl border border-[#E4DAD1] bg-white p-2 shadow-sm sm:p-3">
                      <motion.h2
                        key="welcome-text"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
                        exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
                        className="mb-0.5 text-xs font-semibold text-[#7B6B60] sm:mb-1 sm:text-sm"
                      >
                        {getString(
                          t,
                          "dashboard.welcomeBack",
                          lang === "ro" ? "Bine ai revenit" : "Welcome back",
                        )}
                      </motion.h2>
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
                ) : null}
                {/* Omni-Intel (optional here; can be moved near OmniPath) */}
                {hideOmniIntel ? null : (
                  <motion.div
                    variants={fadeDelayed(0.1)}
                    {...hoverScale}
                    className="h-full"
                  >
                  <Card className="flex h-full flex-col items-center justify-center rounded-xl border border-[#E4DAD1] bg-white p-2 shadow-sm sm:p-3">
                    <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#7B6B60] sm:mb-1 sm:text-[10px]">
                      {getString(
                        t,
                        "dashboard.omniIntel.small",
                        "Omni-Intel",
                      )}
                      <InfoTooltip
                        items={[
                          lang === 'ro'
                            ? 'Index compus din inteligența minții din cap, a minții din inimă, a minții din intestin.'
                            : 'Composite index from the head mind, heart mind, and gut mind intelligence.',
                        ]}
                        label={lang === 'ro' ? 'Detalii Omni‑Intel' : 'Omni‑Intel details'}
                      />
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
                        "dashboard.omniIntel.level",
                        lang === 'ro' ? 'Nivel de Omni‑Inteligență' : 'Omni‑Intelligence level',
                      )}
                    </p>
                    </Card>
                  </motion.div>
                )}
                {/* Focus theme */}
                <motion.div
                  variants={fadeDelayed(0.09)}
                  {...hoverScale}
                  className="h-full"
                >
                  <Card className="flex h-full flex-col justify-between rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-2 shadow-sm sm:p-2">
                    <h2 className="mb-1 text-[12px] font-semibold text-[#2C2C2C] sm:mb-1.5 sm:text-[13px]">
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
                      className="mb-1 whitespace-nowrap text-[12px] font-semibold text-[#2C2C2C] sm:mb-1.5 sm:text-[13px]"
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
                        className="h-1.5 w-full rounded bg-[#F7F2EC]"
                      >
                        <div
                          className="h-1.5 rounded bg-[#D8B6A3]"
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
                        href="/wizard?step=intentMotivation"
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
                {/* Guidance card (now primary center card) */}
                <motion.div variants={fadeDelayed(0.20)} {...hoverScale}>
                  {(() => {
                    const last = (facts?.quickAssessment ?? null) as
                      | { energy?: number; stress?: number; clarity?: number; confidence?: number; focus?: number; updatedAt?: unknown }
                      | null;
                    const energy = Math.max(0, Math.min(10, Number(last?.energy ?? 0)));
                    const stress = Math.max(0, Math.min(10, Number(last?.stress ?? 0)));
                    const clarity = Math.max(0, Math.min(10, Number(last?.clarity ?? 0)));
                    // Pull last 3 days scope.history for energy/clarity/calm if available
                    type ScopeHist = Record<string, { clarity?: number; calm?: number; energy?: number; updatedAt?: unknown }>;
                    const scopeHist = ((facts as { omni?: { scope?: { history?: ScopeHist } } } | undefined)?.omni?.scope?.history ?? {}) as ScopeHist;
                    const lastKeys = Object.keys(scopeHist)
                      .filter((k) => /^d\d{8}$/.test(k))
                      .sort()
                      .slice(-3);
                    const avg = (arr: number[]) => (arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0);
                    const energy3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.energy ?? 0)));
                    const clarity3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.clarity ?? 0)));
                    const calm3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.calm ?? 0)));
                    // Build action score today from events
                    const evs: ActivityEvent[] = (() => {
                      const base: ActivityEvent[] = sessions.map((s) => ({
                        startedAt: ((): number | string | Date => {
                          const v = (s as { startedAt?: unknown })?.startedAt;
                          if (typeof v === 'number' || v instanceof Date || typeof v === 'string') return v as number | string | Date;
                          return Date.now();
                        })(),
                        durationMin: Math.max(0, Math.round((s.durationSec ?? 0) / 60)),
                        units: 1,
                        source: (s.type === 'breathing' ? 'breathing' : s.type === 'drill' ? 'drill' : 'journal') as ActivityEvent['source'],
                        category: (s.type === 'reflection' ? 'reflection' : 'practice') as ActivityEvent['category'],
                      }));
                      try {
                        type RawAE = { startedAt?: unknown; source?: string; category?: 'knowledge'|'practice'|'reflection'; units?: number; durationMin?: number; focusTag?: string | null };
                        const raws = (facts as { activityEvents?: RawAE[] } | undefined)?.activityEvents ?? [];
                        raws.forEach((r) => {
                          if (!r.category) return;
                          const started: number | string | Date = (typeof r.startedAt === 'number' || r.startedAt instanceof Date || typeof r.startedAt === 'string') ? (r.startedAt as number | string | Date) : Date.now();
                          const src: ActivityEvent['source'] = ((): ActivityEvent['source'] => {
                            const s = r.source || 'other';
                            return ['omnikuno','omniabil','breathing','journal','drill','slider','other'].includes(s) ? (s as ActivityEvent['source']) : 'other';
                          })();
                          base.push({
                            startedAt: started,
                            durationMin: typeof r.durationMin === 'number' ? r.durationMin : undefined,
                            units: typeof r.units === 'number' ? r.units : 1,
                            source: src,
                            category: r.category,
                            focusTag: r.focusTag ?? undefined,
                          });
                        });
                      } catch {}
                      return base;
                    })();
                    const todayScore = computeActionTrend(evs, Date.now(), lang, 1, currentFocusTag)[0]?.totalMin ?? 0;
                    const makeBar = (val01: number, accent: string) => (
                      <div className="h-2 w-full rounded-full bg-[#E8DED4]">
                        <div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, Math.round(val01 * 10)))}%`, background: accent }} />
                      </div>
                    );
                    const state: 'low' | 'tense' | 'ready' = (energy <= 4 || energy3 <= 4) ? 'low' : ( (10 - stress) <= 3 || calm3 <= 4 ? 'tense' : 'ready');
                    const badge = (() => {
                      if (state === 'low') return { text: lang==='ro' ? 'ENERGIE SCĂZUTĂ' : 'LOW ENERGY', cls: 'bg-[#FFF1ED] text-[#B8472B] border-[#F3D3C6]' };
                      if (state === 'tense') return { text: lang==='ro' ? 'STARE TENSIONATĂ' : 'TENSE STATE', cls: 'bg-[#FFEFF3] text-[#B82B4F] border-[#F6D0DA]' };
                      return { text: lang==='ro' ? 'PREGĂTIT' : 'READY', cls: 'bg-[#ECF8F0] text-[#1F7A43] border-[#CFEBDD]' };
                    })();
                    const primary = (() => {
                      if (state === 'low') return { title: lang==='ro' ? 'Respirație 5 minute pentru reset' : '5‑min breath reset', href: { pathname: '/antrenament', query: { tab: 'ose' } }, dur: '~5 min' } as const;
                      if (state === 'tense') return { title: lang==='ro' ? 'Jurnal ghidat: descarcă emoțiile (5 min)' : 'Guided journal: release tension (5 min)', href: { pathname: '/progress', query: { open: 'journal', tab: 'NOTE_LIBERE' } }, dur: '~5 min' } as const;
                      return { title: lang==='ro' ? 'Mini‑lecție OmniKuno pe tema ta' : 'OmniKuno micro‑lesson on your theme', href: { pathname: '/antrenament', query: { tab: 'oc' } }, dur: lang==='ro' ? '3–7 min' : '3–7 min' } as const;
                    })();
                    const primaryDesc = (() => {
                      if (state === 'tense') {
                        return lang==='ro'
                          ? 'Scrie 2–3 rânduri despre ce te apasă acum. Nu analiza — doar descarcă tensiunea; va ușura claritatea.'
                          : 'Write 2–3 lines about what feels heavy right now. Don’t analyze — just offload the tension to regain clarity.';
                      }
                      if (state === 'low') {
                        return lang==='ro'
                          ? 'Ritm simplu 4–4 (sau 4–6): inspiră 4s, ține 4s, expiră 4s, ține 4s. 3–5 cicluri, cu atenția pe expirație.'
                          : 'Simple 4–4 (or 4–6) rhythm: inhale 4s, hold 4s, exhale 4s, hold 4s. Do 3–5 cycles, focus on the exhale.';
                      }
                      return lang==='ro'
                        ? '3–7 minute: parcurgi o idee-cheie aplicată pe tema ta din focus. 1 concept + 1 exemplu concret.'
                        : '3–7 minutes: review a key idea applied to your focus theme. 1 concept + 1 concrete example.';
                    })();
                    const alt1 = lang==='ro' ? 'Somn: checklist scurt (2 min)' : 'Sleep: short checklist (2 min)';
                    const alt2 = lang==='ro' ? 'Jurnal: o notă rapidă' : 'Journal: a quick note';
                    const why = (() => {
                      const e = Math.round((energy3 || energy) * 10) / 10;
                      const c = Math.round((10 - stress) * 10) / 10;
                      const a = todayScore;
                      if (lang==='ro') return `Îți recomandăm asta pentru că, în ultimele zile, energia ta a fost ~${e}/10, echilibrul emoțional ~${c}/10, iar scorul de acțiune azi este ${a}/100.`;
                      return `We recommend this because, in recent days, your energy was ~${e}/10, emotional balance ~${c}/10, and today’s action score is ${a}/100.`;
                    })();
                    return (
                      <Card className="min-h-[220px] rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-3 shadow-sm sm:min-h-[255px] sm:p-4 lg:min-h-[280px]">
                        <div className="mb-1 flex items-start justify-between sm:mb-2">
                          <div>
                            <h4 className="text-[13px] font-bold text-[#2C2C2C] sm:text-[15px]">
                              {lang==='ro' ? 'Antrenamentul tău de azi' : 'Today\'s guidance'}
                            </h4>
                            <div className="text-[9px] uppercase tracking-[0.16em] text-[#7B6B60] sm:text-[10px]">
                              {lang==='ro' ? 'Pași mici, impact real' : 'Small steps, real impact'}
                            </div>
                          </div>
                          <span className={`ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>
                            {badge.text}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] sm:gap-4">
                          {/* Left: internal indicators + why */}
                          <div>
                            <div className="mb-2">
                              <p className="mb-0.5 text-[10px] text-[#7B6B60]">{lang==='ro' ? 'Claritate mentală' : 'Mental clarity'}</p>
                              {makeBar(clarity3 || clarity, '#7A6455')}
                            </div>
                            <div className="mb-2">
                              <p className="mb-0.5 text-[10px] text-[#7B6B60]">{lang==='ro' ? 'Echilibru emoțional' : 'Emotional balance'}</p>
                              {makeBar((10 - stress) || (calm3 || 0), '#4D3F36')}
                            </div>
                            <div>
                              <p className="mb-0.5 text-[10px] text-[#7B6B60]">{lang==='ro' ? 'Energie fizică' : 'Physical energy'}</p>
                              {makeBar(energy3 || energy, '#5C4F45')}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded-[10px] border border-[#E4DAD1] bg-white px-2 py-0.5 text-[10px] text-[#7B6B60]">
                                {lang==='ro' ? 'Acțiuni azi' : 'Actions today'}: {todayScore}/100
                              </span>
                              {focusTheme?.area ? (
                                <span className="rounded-[10px] border border-[#E4DAD1] bg-white px-2 py-0.5 text-[10px] text-[#7B6B60]">
                                  {lang==='ro' ? 'Focus' : 'Focus'}: {focusTheme.area}
                                </span>
                              ) : null}
                            </div>
                            {/* Why section on left */}
                            <div className="mt-3">
                              <p className="mb-1 text-[11px] font-semibold text-[#2C2C2C] sm:text-xs">{lang==='ro' ? 'De ce asta?' : 'Why this?'}</p>
                              <p className="text-[11px] text-[#2C2C2C] sm:text-xs">{why}</p>
                            </div>
                          </div>
                          {/* Right: main step + light alternatives */}
                          <div className="flex flex-col justify-between sm:border-l sm:border-[#E8DACE] sm:pl-4">
                            <div>
                              <p className="mb-1 text-[12px] font-semibold text-[#2C2C2C] sm:text-sm">{lang==='ro' ? 'Pasul principal' : 'Primary step'}</p>
                              <p className="mb-1 text-[13px] font-bold leading-snug text-[#2C2C2C] sm:text-[14px]">{primary.title}</p>
                              <p className="mb-2 text-[11px] text-[#7B6B60] sm:text-[12px]">{primaryDesc}</p>
                              <Link href={primary.href} className="group inline-flex w-full items-center justify-between rounded-[12px] border border-[#D3C1B2] bg-[#EADCCC] px-4 py-3 text-[#2C2C2C] shadow-sm transition hover:border-[#C9B8A8]">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-[12px]">{lang==='ro' ? 'Începe acum' : 'Start now'}</span>
                                <span className="text-[10px] text-[#7B6B60]">{primary.dur}</span>
                              </Link>
                            </div>
                            <div className="mt-2">
                              <div className="mb-1 flex items-baseline justify-between">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A08F82]">{lang==='ro' ? 'Variante light' : 'Light options'}</p>
                                <span className="text-[10px] text-[#7B6B60]">— 5 min</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Link href={{ pathname: '/antrenament', query: { tab: 'oc' } }} className="text-[11px] text-[#2C2C2C] underline-offset-2 hover:text-[#C07963] hover:underline sm:text-xs">• {alt1}</Link>
                                <Link href={{ pathname: '/progress', query: { open: 'journal', tab: 'NOTE_LIBERE' } }} className="text-[11px] text-[#2C2C2C] underline-offset-2 hover:text-[#C07963] hover:underline sm:text-xs">• {alt2}</Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })()}
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
            {/* Insight of the Day (moved above Today’s quest) */}
            <motion.div variants={fadeDelayed(0.16)} {...hoverScale}>
              <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
                <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
                  {getString(
                    t,
                    "dashboard.insightTitle",
                    lang === "ro" ? "Revelația zilei" : "Insight of the Day",
                  )}
                </h3>
                <div className="relative">
                  <p className="text-[11px] leading-relaxed text-[#2C2C2C] sm:text-xs">{insight.text}</p>
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
                </div>
              </Card>
            </motion.div>
            {/* Omni-Kuno recap moved below Recent entries */}
            {/* Profile indices recap removed from sidebar per request */}
            
            {/* Recent entries */}
            <motion.div
              variants={fadeDelayed(0.28)}
              {...hoverScale}
            >
              <Card className="min-w-0 rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3.5">
                <div className="mb-1 flex items-center justify-between sm:mb-2">
                  <h4 className="text-xs font-semibold text-[#7B6B60] sm:text-sm">
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

            {/* Practice snapshot (moved below Recent entries) */}
            <motion.div
              variants={fadeDelayed(0.26)}
              {...hoverScale}
            >
              <Card className="flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
                <h4 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
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

            {/* Omni Kuno Edu (moved below Recent entries) */}
            <motion.div variants={fadeDelayed(0.30)} {...hoverScale}>
              <Card className="rounded-xl border border-[#E4DAD1] bg-white p-2.5 shadow-sm sm:p-3">
                <div className="mb-1 flex items-center justify-between sm:mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-[#7B6B60] sm:text-sm">
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
                    clarity: lang === "ro" ? "Claritate mentală" : "Clarity",
                    calm: lang === "ro" ? "Echilibru emoțional" : "Calm",
                    energy: lang === "ro" ? "Energie fizică" : "Energy",
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

            {/* Quest of the Day – moved last in sidebar */}
            <motion.div variants={fadeDelayed(0.32)} {...hoverScale}>
              <Card className="flex flex-col justify-between rounded-xl border border-[#E4DAD1] bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-3 h-auto">
                <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
                  {getString(
                    t,
                    "dashboard.todayQuest",
                    lang === "ro" ? "Provocarea de azi" : "Today’s quest",
                  )}
                </h3>
                <div className="relative">
                  <p className="text-[11px] leading-relaxed text-[#2C2C2C] sm:text-xs">
                    {questExpanded ? quest.text : questPreview}
                  </p>
                </div>
                <div className="mt-1 flex items-center justify-between sm:mt-2">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-[#A08F82] sm:text-[10px]">
                    {lang === "ro" ? "Aplică azi, în viața reală." : "Apply today, in real life."}
                  </p>
                  {(quest?.text || "").length > (questPreview?.length || 0) ? (
                    <button
                      type="button"
                      onClick={() => setQuestExpanded((v) => !v)}
                      className="text-[11px] font-semibold text-[#7B6B60] underline hover:text-[#2C2C2C]"
                    >
                      {questExpanded ? (lang === "ro" ? "Mai puțin" : "Less") : lang === "ro" ? "Vezi tot" : "More"}
                    </button>
                  ) : (
                    <span className="text-[11px] text-transparent">—</span>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Achievement banner + initial insights – tot în coloană dreapta */}
            {showAchv ? (
              <div className="mt-1 rounded-xl border border-[#CBE8D7] bg-[#F3FFF8] p-2 text-sm text-[#1F3C2F] sm:mt-2 sm:p-3">
                <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                  <p className="text-[13px] font-medium sm:text-sm">
                    {lang === "ro"
                      ? "Prima treaptă atinsă: Claritate mentală"
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
                  <h3 className="mb-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
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
// Donut removed — linear mini-chart is used instead
// Old legend row removed (no longer used)
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
