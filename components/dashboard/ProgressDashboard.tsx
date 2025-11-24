"use client";
import { Card } from "@/components/ui/card";
import type { ProgressFact, RecentEntry } from "@/lib/progressFacts";
import { adaptProgressFacts } from "@/lib/progressAdapter";
import { getDailyInsight } from "@/lib/insights";
import { getAreasForScript } from "@/lib/quests";
import type { OmniBlock } from "@/lib/omniIntel";
import { motion } from "framer-motion";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useProfile } from "@/components/ProfileProvider";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { computeKunoComposite, computeOmniScope, computeOmniFlex } from "@/lib/dashboardMetrics";
import {
  extractSessions,
  computeWeeklyBuckets,
  computeWeeklyCounts,
  computeMonthlyDailyMinutes,
  computeMonthlyDailyCounts,
} from "@/lib/progressAnalytics";
import { toMsLocal, getCurrentFocusTag } from "@/lib/dashboard/progressSelectors";
import {
  OMNIKUNO_MODULES as OMNIKUNO_LESSON_MODULES,
  type OmniKunoModuleConfig,
} from "@/config/omniKunoLessons";
import {
  getLegacyModuleKeyById,
  getModuleLabel,
  resolveModuleId,
  OMNIKUNO_MODULES as OMNIKUNO_META,
} from "@/config/omniKunoModules";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { normalizePerformance } from "@/lib/omniKunoAdaptive";
import InternalKpiCard from "@/components/dashboard/InternalKpiCard";
import ActionTrendsCard from "@/components/dashboard/ActionTrendsCard";
import MotivationCard from "@/components/dashboard/MotivationCard";
import ProfileIndicesCard from "@/components/dashboard/ProfileIndicesCard";
import CenterColumnCards, { type FocusThemeInfo } from "@/components/dashboard/CenterColumnCards";
import SidebarCards from "@/components/dashboard/SidebarCards";
import type { KunoMissionCardData, KunoNextModuleSuggestion } from "@/components/dashboard/KunoMissionCard";
import { normalizeKunoFacts } from "@/lib/kunoFacts";
import { RecentEntriesCard } from "@/components/dashboard/RecentEntriesCard";

export default function ProgressDashboard({
  profileId,
  demoFacts,
  facts: factsProp,
  loading: loadingProp,
  debugGrid,
  hideOmniIntel,
}: {
  profileId: string;
  demoFacts?: ProgressFact;
  facts?: ProgressFact | null;
  loading?: boolean;
  debugGrid?: boolean;
  hideOmniIntel?: boolean;
}) {
  const { profile } = useProfile();
  const baseFacts = demoFacts ?? factsProp ?? null;
  const loading = demoFacts ? false : Boolean(loadingProp);
  const { t, lang } = useI18n();
  const [lastKunoModulePref, setLastKunoModulePref] = useState<{
    moduleId: OmniKunoModuleId | null;
    lessonId: string | null;
    updatedAt: number | null;
  } | null>(null);
  // Read debug flag from URL early to keep hook order stable across renders
  const search = useSearchParams();
  const debugMode = (search?.get('debug') === '1');
  const [localRecentEntries, setLocalRecentEntries] = useState<RecentEntry[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `omnimental_recent_entries_${profileId}`;
    const load = () => {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
          setLocalRecentEntries([]);
          return;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          setLocalRecentEntries([]);
          return;
        }
        const normalized = parsed
          .map((entry) => ({
            text: String(entry?.text ?? ""),
            timestamp: entry?.timestamp ?? Date.now(),
            tabId: entry?.tabId ? String(entry.tabId) : undefined,
          }))
          .filter((entry) => entry.text.trim().length > 0);
        setLocalRecentEntries(normalized);
      } catch {
        setLocalRecentEntries([]);
      }
    };
    load();
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId === profileId) {
        load();
      }
    };
    window.addEventListener("journal:recent-entry", handler as EventListener);
    return () => {
      window.removeEventListener("journal:recent-entry", handler as EventListener);
    };
  }, [profileId]);

  const facts = useMemo(() => {
    if (!localRecentEntries.length) {
      return baseFacts;
    }
    const normalizedEntries: RecentEntry[] = localRecentEntries.map((entry) => ({
      text: entry.text,
      timestamp: entry.timestamp,
      tabId: entry.tabId,
    }));
    if (!baseFacts) {
      return { recentEntries: normalizedEntries } as ProgressFact;
    }
    return {
      ...baseFacts,
      recentEntries: [...(baseFacts.recentEntries ?? []), ...normalizedEntries],
    };
  }, [baseFacts, localRecentEntries]);
  const kunoFacts = useMemo(() => normalizeKunoFacts(facts?.omni?.kuno), [facts?.omni?.kuno]);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");
  const [qaOpen, setQaOpen] = useState(false);
  const [qaCategory, setQaCategory] = useState<'practice' | 'reflection' | 'knowledge'>('practice');
  const [qaMinutes, setQaMinutes] = useState<number>(10);
  const [qaBusy, setQaBusy] = useState(false);
  const [qaSelectedDays, setQaSelectedDays] = useState<number[]>([]); // timestamps (start of day)
  const [metric, setMetric] = useState<"min" | "count" | "score">("min");
  const [weighted] = useState(false);
  const [achvDismissed, setAchvDismissed] = useState(false);
  const [nowAnchor] = useState(() => Date.now());
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
      const currentKuno = typeof kunoFacts.primaryScore === "number" ? kunoFacts.primaryScore : 0;
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
  }, [facts?.omni, kunoFacts.primaryScore, loading, profileId]);
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
    const score = typeof kunoFacts.primaryScore === "number" ? kunoFacts.primaryScore : 0;
    const hasInsights =
      Array.isArray(profile?.simulatedInsights) &&
      (profile?.simulatedInsights?.length ?? 0) > 0;
    const dismissed =
      window.localStorage.getItem("omni_onboarding_achv_dismissed") === "1";
    return score > 0 && hasInsights && !dismissed && !achvDismissed;
  }, [achvDismissed, kunoFacts.primaryScore, profile?.simulatedInsights]);
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
      const currentKuno = typeof kunoFacts.primaryScore === "number" ? kunoFacts.primaryScore : 0;
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
  }, [facts?.omni, kunoFacts.primaryScore, loading, profileId]);
  // Loading state handled inline in render to keep hooks order stable
  // No hard gating: safe fallbacks (no hooks here to avoid order changes with loading early return)
  const prog = adaptProgressFacts(facts);
  const insight = getDailyInsight(prog.strengths.dominantTheme);
  const sessions = extractSessions(facts ?? null);
  // Current focus tag (top category from intent)
  const currentFocusTag = useMemo(() => getCurrentFocusTag(facts), [facts]);
  const refMs =
    (facts?.updatedAt instanceof Date ? facts.updatedAt.getTime() : 0) ||
    Math.max(
      0,
      ...sessions.map((s: { startedAt?: unknown }) => toMsLocal(s.startedAt)),
    ) ||
    nowAnchor;
  // Anchor weekly/monthly windows to refMs derived from facts/sessions
  const nowMs = refMs; // anchor to latest data reference, not always Date.now()
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

  // debugMode declared earlier near top to keep hook order stable
  // ---- Profile indices from Omni block ----
  const omni: OmniBlock | undefined = facts?.omni as OmniBlock | undefined;
  const omniIntelScore =
    (omni?.omniIntelScore as number | undefined) ??
    Math.round(
      (prog.indices.clarity + prog.indices.calm + prog.indices.energy) / 3,
    );
  const kunoPercents: number[] = [];
  const primaryPercent = typeof kunoFacts.primaryScore === "number" ? Math.round(kunoFacts.primaryScore) : null;
  if (primaryPercent && primaryPercent > 0) kunoPercents.push(primaryPercent);
  const avgPercent =
    typeof kunoFacts.legacyScores.averagePercent === "number" ? Math.round(kunoFacts.legacyScores.averagePercent) : null;
  if (avgPercent && avgPercent > 0) kunoPercents.push(avgPercent);
  const legacyIndex =
    typeof kunoFacts.legacyScores.knowledgeIndex === "number" ? Math.round(kunoFacts.legacyScores.knowledgeIndex) : null;
  if (legacyIndex && legacyIndex > 0) kunoPercents.push(legacyIndex);
  const kunoComposite = computeKunoComposite({
    percents: kunoPercents,
    masteryByCategory: kunoFacts.masteryByCategory ?? null,
    lessonsCompleted: kunoFacts.completedLessonsCount,
  });
  let omniCunoScore = kunoComposite.generalIndex;
  if (!omniCunoScore) {
    omniCunoScore = primaryPercent ?? kunoPercents[0] ?? 0;
  }
  // Build dynamic tooltip for Omni Kuno components if data is available
  const omniKunoTooltipDynamic = (() => {
    try {
      const ew = kunoComposite.components.ewma || (kunoPercents[0] ?? 0);
      const masteryMean = kunoComposite.components.masteryMean;
      const lessons = kunoFacts.completedLessonsCount;
      if (!ew && !masteryMean && !lessons) {
        return null;
      }
      const tooltipItems = lang === 'ro'
        ? [
            `70% EWMA/medie teste: ${ew}%`,
            `25% Măiestrie medie: ${masteryMean}%`,
            `5% Lecții terminate: ${lessons}`,
          ]
        : [
            `70% EWMA/mean quizzes: ${ew}%`,
            `25% Category mastery mean: ${masteryMean}%`,
            `5% Lessons completed: ${lessons}`,
          ];
      return tooltipItems;
    } catch {
      return null;
    }
  })();
  // Build tiny debug badge text when ?debug=1
  const omniKunoDebugBadge = (() => {
    if (!debugMode) return undefined;
    try {
      const ew = kunoComposite.components.ewma || (kunoPercents[0] ?? 0);
      const masteryMean = kunoComposite.components.masteryMean;
      const lessons = kunoFacts.completedLessonsCount;
      if (!ew && !masteryMean && !lessons) return undefined;
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
        const intent = facts?.intent as { firstCategory?: string | null } | undefined;
        const raw = typeof intent?.firstCategory === "string" ? intent.firstCategory : null;
        return raw ? resolveModuleId(raw) : null;
      })();
      const sorted = items
        .map((it) => ({
          it,
          match: topCat && it.scriptId ? (getAreasForScript(String(it.scriptId)).includes(topCat) ? 1 : 0) : 0,
        }))
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
  const focusTheme: FocusThemeInfo = useMemo(() => {
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
    if (!topCategory && Array.isArray(intent?.categories) && intent!.categories!.length) {
      let max: Cat | undefined;
      for (const c of intent!.categories!) {
        if (!max || (Number(c.count) || 0) > (Number(max.count) || 0)) max = c;
      }
      topCategory = max?.category;
    }
    const catLabelMap: Record<string, string> = {
      clarity: lang === "ro" ? "Claritate mentală" : "Clarity",
      focus: lang === "ro" ? "Claritate mentală" : "Clarity",
      calm: lang === "ro" ? "Echilibru emoțional" : "Emotional balance",
      energy: lang === "ro" ? "Energie fizică" : "Energy",
      relationships: lang === "ro" ? "Relații" : "Relationships",
      performance: lang === "ro" ? "Performanță" : "Performance",
      health: lang === "ro" ? "Sănătate" : "Health",
      identity: lang === "ro" ? "Identitate" : "Identity",
      anxiety: lang === "ro" ? "Anxietate" : "Anxiety",
      stress: lang === "ro" ? "Stres" : "Stress",
      balance: lang === "ro" ? "Echilibru emoțional" : "Emotional balance",
    };
    const normalizedCategory = topCategory ? topCategory.toLowerCase() : undefined;
    const resolvedModuleId = resolveModuleId(normalizedCategory);
    const areaFromIntent =
      (resolvedModuleId ? getModuleLabel(resolvedModuleId, lang === "ro" ? "ro" : "en") : undefined) ||
      (normalizedCategory ? catLabelMap[normalizedCategory] : undefined) ||
      (topCategory ? catLabelMap[topCategory] ?? topCategory : undefined);
    const area =
      areaFromIntent ||
      ev?.focusLabel ||
      ev?.mainAreaLabel ||
      rec?.primaryAreaLabel ||
      (lang === "ro" ? "Tema principală acum" : "Main focus right now");
    const horizon = facts?.motivation?.timeHorizon ?? null;
    const horizonSuffix = (() => {
      if (!horizon) return null;
      const mapRo: Record<string, string> = { days: "zile", weeks: "săptămâni", months: "luni" };
      const mapEn: Record<string, string> = { days: "days", weeks: "weeks", months: "months" };
      return lang === "ro" ? mapRo[horizon] ?? null : mapEn[horizon] ?? null;
    })();
    const desc =
      ev?.summary ||
      ev?.mainObjective ||
      rec?.summary ||
      (lang === "ro"
        ? `Este direcția prioritară pe care lucrezi acum${horizonSuffix ? ` pentru următoarele ${horizonSuffix}` : ""}.`
        : `This is the main theme you’re working on${horizonSuffix ? ` for the next ${horizonSuffix}` : ""}.`);
    return { area, desc, categoryKey: normalizedCategory, moduleId: resolvedModuleId };
  }, [facts, lang]);
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
  const kunoMissionData: KunoMissionCardData | null = useMemo(() => {
    const moduleEntries = Object.entries(OMNIKUNO_LESSON_MODULES) as Array<[OmniKunoModuleId, OmniKunoModuleConfig]>;
    const resolveCandidateId = (value?: string | null) => {
      if (!value) return null;
      return resolveModuleId(value);
    };
    const pushCandidate = (
      list: Array<[OmniKunoModuleId, OmniKunoModuleConfig]>,
      value?: string | null,
    ) => {
      const normalized = resolveCandidateId(value);
      if (!normalized) return;
      if (!OMNIKUNO_LESSON_MODULES[normalized]) return;
      if (list.some(([key]) => key === normalized)) return;
      list.push([normalized, OMNIKUNO_LESSON_MODULES[normalized]]);
    };
    const candidates: Array<[OmniKunoModuleId, OmniKunoModuleConfig]> = [];
    if (lastKunoModulePref?.moduleId) {
      pushCandidate(candidates, lastKunoModulePref.moduleId);
    }
    pushCandidate(candidates, kunoFacts.recommendedModuleId ?? null);
    pushCandidate(candidates, kunoFacts.recommendedArea ?? null);
    const inProgressModules = moduleEntries
      .map(([areaKey, module]) => {
        const snapshot = kunoFacts.modules[module.moduleId];
        const completedCount = Array.isArray(snapshot?.completedIds) ? snapshot!.completedIds!.length : 0;
        const totalLessons = module.lessons.length;
        const hasProgress = totalLessons > 0 && completedCount > 0 && completedCount < totalLessons;
        const lastUpdated =
          typeof snapshot?.lastUpdated === "number" ? snapshot.lastUpdated : 0;
        return { areaKey, module, hasProgress, lastUpdated };
      })
      .filter((entry) => entry.hasProgress)
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
    inProgressModules.forEach((entry) => {
      pushCandidate(candidates, entry.areaKey);
    });
    const fallbackArea = (() => {
      const focusModuleId =
        focusTheme.moduleId ?? resolveModuleId(focusTheme.categoryKey ?? undefined) ?? "emotional_balance";
      if (OMNIKUNO_LESSON_MODULES[focusModuleId as OmniKunoModuleId]) {
        return focusModuleId as OmniKunoModuleId;
      }
      const legacyKey = getLegacyModuleKeyById(focusModuleId);
      if (legacyKey) {
        const mapped = resolveModuleId(legacyKey);
        if (mapped && OMNIKUNO_LESSON_MODULES[mapped as OmniKunoModuleId]) {
          return mapped as OmniKunoModuleId;
        }
      }
      return "emotional_balance";
    })();
    pushCandidate(candidates, fallbackArea);
    if (!candidates.length) {
      pushCandidate(candidates, "emotional_balance");
    }
    const [areaKey, module] = candidates[0] ?? [];
    if (!areaKey || !module) return null;
    const moduleSnapshot = kunoFacts.modules[module.moduleId];
    const completedIds = moduleSnapshot?.completedIds ?? [];
    const xp = Number((kunoFacts.gamification as { xp?: number } | null)?.xp ?? 0);
    return {
      areaKey,
      module,
      completedIds,
      xp: Number.isFinite(xp) ? xp : 0,
      performance: normalizePerformance(
        (moduleSnapshot?.performance as Partial<{ recentScores: number[]; recentTimeSpent: number[]; difficultyBias: number }> | null) ?? null,
      ),
    };
  }, [focusTheme.categoryKey, focusTheme.moduleId, kunoFacts, lastKunoModulePref?.moduleId]);
  const kunoNextModuleSuggestion: KunoNextModuleSuggestion | null = useMemo(() => {
    if (!kunoMissionData?.module?.moduleId) return null;
    const currentModuleId = kunoMissionData.module.moduleId as OmniKunoModuleId;
    const ordered: OmniKunoModuleId[] = [];
    const seen = new Set<OmniKunoModuleId>();
    const pushCandidate = (value?: string | null) => {
      if (!value) return;
      const normalized = resolveModuleId(value);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        ordered.push(normalized);
      }
    };
    pushCandidate(kunoFacts.recommendedModuleId ?? null);
    pushCandidate(kunoFacts.recommendedArea ?? null);
    pushCandidate(focusTheme.moduleId ?? null);
    type IntentCat = { category?: string | null; count?: number | null };
    const intentBlock = facts?.intent as { categories?: IntentCat[] } | undefined;
    if (Array.isArray(intentBlock?.categories)) {
      const sorted = intentBlock.categories
        .slice()
        .sort((a, b) => (Number(b?.count) || 0) - (Number(a?.count) || 0));
      sorted.forEach((entry) => pushCandidate(entry?.category ?? null));
    }
    OMNIKUNO_META.forEach((meta) => {
      if (!seen.has(meta.id)) {
        seen.add(meta.id);
        ordered.push(meta.id);
      }
    });
    const nextModuleId = ordered.find((id) => id !== currentModuleId);
    if (!nextModuleId) return null;
    const nextModule = OMNIKUNO_LESSON_MODULES[nextModuleId];
    if (!nextModule) return null;
    const firstLessonId =
      nextModule.lessons
        .slice()
        .sort((a, b) => a.order - b.order)[0]?.id ?? null;
    return { moduleId: nextModuleId, firstLessonId };
  }, [facts?.intent, focusTheme.moduleId, kunoFacts, kunoMissionData?.module?.moduleId]);
  // Optional: emit compact debug JSON for E2E when ?debug=1
  const debugJson = (() => {
    try {
      if (!(typeof window !== 'undefined' && (new URL(window.location.href).searchParams.get('debug') === '1'))) return null;
      const out: Record<string, unknown> = {};
      if (facts?.intent) out.intent = { categories: (facts.intent.categories || []).length, lang: (facts.intent.lang || 'ro') };
      if (facts?.evaluation) out.evaluation = { stage: (facts.evaluation.stageValue || 't0') };
      if (facts?.quickAssessment) {
        const qaUpd = (facts.quickAssessment as { updatedAt?: unknown } | undefined)?.updatedAt;
        out.quickAssessment = { updated: Boolean(qaUpd) };
      }
      const sess = Array.isArray(facts?.practiceSessions) ? (facts!.practiceSessions as Array<{ startedAt?: unknown }>).length : 0;
      out.sessions = sess;
      type AE = { activityEvents?: unknown[] };
      const evs = Array.isArray((facts as AE | undefined)?.activityEvents) ? ((facts as AE).activityEvents as unknown[]).length : 0;
      out.events = evs;
      return JSON.stringify(out);
    } catch { return null; }
  })();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsePref = () => {
      try {
        const raw = window.localStorage.getItem("omnikuno_last_module");
        if (!raw) {
          setLastKunoModulePref(null);
          return;
        }
        const parsed = JSON.parse(raw) as {
          moduleId?: string | null;
          areaKey?: string | null;
          lessonId?: string | null;
          updatedAt?: number;
        };
        const normalized =
          resolveModuleId(parsed?.moduleId ?? undefined) ?? resolveModuleId(parsed?.areaKey ?? undefined);
        if (!normalized || !OMNIKUNO_LESSON_MODULES[normalized]) {
          setLastKunoModulePref(null);
          return;
        }
        setLastKunoModulePref({
          moduleId: normalized,
          lessonId: typeof parsed?.lessonId === "string" ? parsed!.lessonId! : null,
          updatedAt: typeof parsed?.updatedAt === "number" ? parsed!.updatedAt! : null,
        });
      } catch {
        setLastKunoModulePref(null);
      }
    };
    parsePref();
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "omnikuno_last_module") return;
      parsePref();
    };
    const handleCustom = () => parsePref();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("omnikuno:last-module", handleCustom as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("omnikuno:last-module", handleCustom as EventListener);
    };
  }, []);
  return (
    <motion.section
      initial="hidden"
      animate="show"
      className="w-full bg-[#FDFCF9] px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5"
    >
      <Card className="mx-auto max-w-6xl rounded-2xl border border-[#E4DAD1] bg-white/90 px-3 py-4 shadow-[0_4px_18px_rgba(0,0,0,0.04)] sm:px-4 sm:py-5">
        {debugJson ? (
          <pre data-testid="debug-progress-facts" style={{ display: 'none' }}>{debugJson}</pre>
        ) : null}
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
              <InternalKpiCard
                lang={lang}
                t={t}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                facts={facts}
              />
              <ActionTrendsCard
                lang={lang}
                t={t}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                metric={metric}
                setMetric={setMetric}
              weighted={weighted}
              sessions={sessions}
              facts={facts}
              weeklyWithEvents={weeklyWithEvents}
              monthWithEvents={monthWithEvents}
              weeklyCountsWithEvents={weeklyCountsWithEvents}
              monthCountsWithEvents={monthCountsWithEvents}
              refMs={refMs}
              nowAnchor={nowAnchor}
              currentFocusTag={currentFocusTag}
                qaOpen={qaOpen}
                setQaOpen={setQaOpen}
                qaCategory={qaCategory}
                setQaCategory={setQaCategory}
                qaMinutes={qaMinutes}
                setQaMinutes={setQaMinutes}
                qaBusy={qaBusy}
                setQaBusy={setQaBusy}
                qaSelectedDays={qaSelectedDays}
                setQaSelectedDays={setQaSelectedDays}
                profileId={profileId}
              />
              <MotivationCard
                lang={lang}
                t={t}
                omniScopeScore={omniScopeScore}
                motivationDelta={motivationDelta}
                facts={facts}
              />
              <RecentEntriesCard lang={lang} facts={facts} />
            </div>

            <ProfileIndicesCard
              lang={lang}
              debugGrid={debugGrid}
              omniScopeScore={omniScopeScore}
              omniScopeComp={omniScopeComp}
              omniCunoScore={omniCunoScore}
              omniKunoDebugBadge={omniKunoDebugBadge}
              omniKunoTooltipDynamic={omniKunoTooltipDynamic}
              omniAbilScore={omniAbilScore}
              omniFlexScore={omniFlexScore}
              omniFlexComp={omniFlexComp}
              omni={omni}
            />

            <CenterColumnCards
              showWelcome={showWelcome}
              hideOmniIntel={hideOmniIntel}
              debugGrid={debugGrid}
              lang={lang}
              t={t}
              facts={facts}
              omniIntelScore={omniIntelScore}
              omniIntelDelta={omniIntelDelta}
              focusTheme={focusTheme}
              omniCunoScore={omniCunoScore}
              kunoDelta={kunoDelta}
              kunoMissionData={kunoMissionData}
              kunoNextModuleSuggestion={kunoNextModuleSuggestion}
            />
          </div>
          <SidebarCards
            debugGrid={debugGrid}
            lang={lang}
            t={t}
            facts={facts}
            profile={profile}
            quest={quest}
            questPreview={questPreview}
            questExpanded={questExpanded}
            setQuestExpanded={setQuestExpanded}
            showAchv={showAchv}
            setAchvDismissed={setAchvDismissed}
            insight={insight}
            prog={prog}
            sessions={sessions}
            refMs={refMs}
            currentFocusTag={currentFocusTag}
            nowAnchor={nowAnchor}
          />
        </div>
      </Card>
    </motion.section>
  );
}
