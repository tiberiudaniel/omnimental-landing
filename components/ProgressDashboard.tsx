"use client";

import { Card } from "@/components/ui/card";
import { adaptProgressFacts } from "@/lib/progressAdapter";
import { useInsightOfTheDay } from "./useInsightOfTheDay";
import { useProgressFacts } from "@/components/useProgressFacts";
import type { ProgressFact } from "@/lib/progressFacts";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useRouter } from "next/navigation";
import { recordEvaluationTabChange } from "@/lib/progressFacts";
import { useEffect, useRef, useState } from "react";
import IndexCard from "@/components/IndexCard";
import WeeklyTrendsChart from "@/components/charts/WeeklyTrendsChart";
import ActivitiesDonut from "@/components/charts/ActivitiesDonut";
import { computeWeeklyBuckets, computeWeeklyCounts, computeDistribution, extractSessions, computeStreak, filterSessionsByType } from "@/lib/progressAnalytics";

// Bar component removed after compact redesign

export default function ProgressDashboard({ profileId }: { profileId: string }) {
  const { data: facts } = useProgressFacts(profileId);
  const prog = adaptProgressFacts(facts);
  const { item: insight } = useInsightOfTheDay(
    prog.strengths.dominantTheme,
  );
  const { t, lang } = useI18n();
  const router = useRouter();
  const axClarity = getString(t, "axes.clarity", lang === "ro" ? "Claritate" : "Clarity");
  const axCalm = getString(t, "axes.calm", lang === "ro" ? "Calm" : "Calm");
  const axEnergy = getString(t, "axes.energy", lang === "ro" ? "Energie" : "Energy");
  const titleTrends = getString(t, "dashboard.trendsTitle", lang === "ro" ? "Tendințe săptămânale" : "Weekly trends");
  const titleDistribution = getString(t, "dashboard.distributionTitle", lang === "ro" ? "Distribuția activităților" : "Activities distribution");
  const toggleMinutes = getString(t, "dashboard.trendsToggle.minutes", lang === "ro" ? "Minute" : "Minutes");
  const toggleSessions = getString(t, "dashboard.trendsToggle.sessions", lang === "ro" ? "Sesiuni" : "Sessions");
  const titleInsight = getString(t, "dashboard.insightTitle", "Insight of the Day");
  const ctaLearnMore = getString(t, "dashboard.learnMore", lang === "ro" ? "Află mai mult" : "Learn more");
  const titleActivity = getString(t, "dashboard.activity", lang === "ro" ? "Activitate" : "Activity");
  const titleLast = getString(t, "dashboard.lastSession", lang === "ro" ? "Ultima sesiune" : "Last session");
  const titleWeek = getString(t, "dashboard.thisWeek", lang === "ro" ? "Săptămâna aceasta" : "This week");
  const labelReflections = getString(t, "dashboard.reflections", lang === "ro" ? "Reflecții" : "Reflections");
  const labelBreathing = getString(t, "dashboard.breathing", lang === "ro" ? "Respirație" : "Breathing");
  const labelDrills = getString(t, "dashboard.drills", lang === "ro" ? "Drills focus" : "Focus drills");
  const typeReflection = getString(t, "dashboard.type.reflection", lang === "ro" ? "Reflecție" : "Reflection");
  const typeBreathing = getString(t, "dashboard.type.breathing", lang === "ro" ? "Respirație" : "Breathing");
  const typeDrill = getString(t, "dashboard.type.drill", lang === "ro" ? "Drill" : "Drill");
  const labelDetails = getString(t, "dashboard.details", lang === "ro" ? "Vezi detalii" : "View details");
  const labelClose = getString(t, "dashboard.close", lang === "ro" ? "Închide" : "Close");
  const labelNoneYet = getString(t, "dashboard.noneYet", lang === "ro" ? "— niciuna încă" : "— none yet");
  const suffixMin = getString(t, "dashboard.minutesShort", "min");
  const titleStrengths = getString(t, "dashboard.strengths", lang === "ro" ? "Puncte tari" : "Strengths");
  const titleWeaknesses = getString(t, "dashboard.weaknesses", lang === "ro" ? "Zone de lucru" : "Areas to improve");
  const titlePractice = getString(t, "dashboard.practiceDist", lang === "ro" ? "Distribuția practicii" : "Practice distribution");
  const ctaReflect = getString(t, "dashboard.cta.reflect", lang === "ro" ? "Reia reflecția" : "Resume reflection");
  const ctaBreathe = getString(t, "dashboard.cta.breathe", lang === "ro" ? "Respiră 3 minute" : "Breathe 3 minutes");
  const ctaInsight = getString(t, "dashboard.cta.insight", lang === "ro" ? "Citește insightul zilei" : "Read today’s insight");
  // tooltips removed in compact layout

  const totalPractice = Math.max(0, (prog.reflectionCount ?? 0) + (prog.breathingCount ?? 0) + (prog.drillsCount ?? 0));
  const share = (n: number) => (totalPractice > 0 ? Math.max(0, Math.min(100, Math.round((n / totalPractice) * 100))) : 0);
  const shareRef = share(prog.reflectionCount);
  const shareBreath = share(prog.breathingCount);
  const shareDrills = share(prog.drillsCount);
  const isPlaceholder = !facts;
  const dominantLabel = prog.strengths.dominantTheme === "Clarity" ? axClarity : prog.strengths.dominantTheme === "Energy" ? axEnergy : axCalm;

  // Practice sessions – compute last session and weekly totals
  const sessions = extractSessions(facts as ProgressFact);
  const isTimestamp = (v: unknown): v is { toDate: () => Date } =>
    Boolean(v) && typeof (v as { toDate?: () => Date }).toDate === "function";
  const toMs = (ts: unknown): number => {
    if (!ts) return 0;
    if (typeof ts === "number") return ts;
    if (ts instanceof Date) return ts.getTime();
    if (isTimestamp(ts)) return ts.toDate().getTime();
    return 0;
  };
  const fmtMin = (sec: number) => Math.max(0, Math.round(sec / 60));
  const last = sessions
    .slice()
    .sort((a, b) => toMs(b.endedAt || b.startedAt) - toMs(a.endedAt || a.startedAt))[0];
  const referenceNow =
    toMs((facts as ProgressFact | null | undefined)?.updatedAt as unknown) ||
    toMs((last?.endedAt as unknown) || (last?.startedAt as unknown));
  const weekAgo = referenceNow - 7 * 24 * 60 * 60 * 1000;
  const weeklySessions = sessions.filter((s) => toMs(s.startedAt) >= weekAgo);
  const sumBy = (type: "reflection" | "breathing" | "drill") =>
    weeklySessions
      .filter((s) => s.type === type)
      .reduce((acc, s) => acc + Math.max(0, Math.floor((s.durationSec ?? 0))), 0);
  const weekRef = sumBy("reflection");
  const weekBre = sumBy("breathing");
  const weekDr = sumBy("drill");
  const weekTotal = Math.max(0, weekRef + weekBre + weekDr);
  const safeRefMs = referenceNow || toMs((last?.endedAt as unknown) || (last?.startedAt as unknown)) || 1;
  const weeklyBuckets = computeWeeklyBuckets(sessions, safeRefMs);
  const weeklyCountBuckets = computeWeeklyCounts(sessions, safeRefMs);
  const clarityBuckets = computeWeeklyBuckets(filterSessionsByType(sessions, "reflection"), safeRefMs);
  const calmBuckets = computeWeeklyBuckets(filterSessionsByType(sessions, "breathing"), safeRefMs);
  const energyBuckets = computeWeeklyBuckets(filterSessionsByType(sessions, "drill"), safeRefMs);
  const dist = computeDistribution(sessions);
  const streak = computeStreak(sessions, safeRefMs);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [trendsMode, setTrendsMode] = useState<"min" | "count">("min");
  const detailsBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const sessionsSorted = sessions
    .slice()
    .sort((a, b) => toMs(b.endedAt || b.startedAt) - toMs(a.endedAt || a.startedAt))
    .slice(0, 10);

  // Scroll lock when details drawer open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    if (detailsOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailsOpen]);

  // Close on Escape when details open
  useEffect(() => {
    if (!detailsOpen || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDetailsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailsOpen]);

  // Focus management: move focus into dialog on open; restore on close
  useEffect(() => {
    if (detailsOpen) {
      const id = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => detailsBtnRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [detailsOpen]);

  return (
    <div className="mt-4 w-full px-4">
      <h2 className="mx-1 mb-2 text-xs uppercase tracking-[0.28em] text-[#A08F82]">
        {getString(t, "dashboard.title", lang === "ro" ? "Progres" : "Progress")}
      </h2>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-4">
        {/* Row 1: left compact KPIs stack */}
        <div className="flex flex-col gap-3 md:row-span-2">
          <IndexCard title={axClarity} value={prog.indices.clarity} unit="%" spark={clarityBuckets.map((d) => d.totalMin)} accent="#7A6455" />
          <IndexCard title={axCalm} value={prog.indices.calm} unit="%" spark={calmBuckets.map((d) => d.totalMin)} accent="#4D3F36" />
          <IndexCard title={axEnergy} value={prog.indices.energy} unit="%" spark={energyBuckets.map((d) => d.totalMin)} accent="#C07963" />
        </div>

        {/* Row 1 continued: Trends + Distribution + Insight mini */}
        <Card className="rounded-xl border border-[#E4D8CE] bg-white p-6 shadow min-h-[300px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1F1F1F]">{titleTrends}</h3>
            <div className="inline-flex rounded-md border border-[#E4D8CE] bg-[#FFFBF7] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setTrendsMode("min")}
                className={`px-2 py-0.5 rounded ${trendsMode === "min" ? "bg-white border border-[#E4D8CE] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
              >
                {toggleMinutes}
              </button>
              <button
                type="button"
                onClick={() => setTrendsMode("count")}
                className={`px-2 py-0.5 rounded ${trendsMode === "count" ? "bg-white border border-[#E4D8CE] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
              >
                {toggleSessions}
              </button>
            </div>
          </div>
          <WeeklyTrendsChart data={trendsMode === "min" ? weeklyBuckets : weeklyCountBuckets} />
          <p className="mt-2 text-[11px] text-[#7A6455]">{getString(t, "dashboard.trendsLegend", lang === "ro" ? "Linie: evoluție • Bare: volum" : "Line: trend • Bars: volume")}</p>
        </Card>
        <Card className="rounded-xl border border-[#E4D8CE] bg-white p-6 shadow min-h-[300px]">
          <h3 className="mb-3 text-lg font-semibold text-[#1F1F1F]">{titleDistribution}</h3>
          <ActivitiesDonut
            reflectionMin={dist.reflection}
            breathingMin={dist.breathing}
            drillMin={dist.drill}
            labelReflection={typeReflection}
            labelBreathing={typeBreathing}
            labelDrill={typeDrill}
          />
        </Card>
        {/* Insight mini tile (title + icon with hover/click popover) */}
        <Card className="relative flex items-center justify-between rounded-xl border border-[#E4D8CE] bg-white p-4 shadow min-h-[120px]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#1F1F1F]">{titleInsight}</h3>
            <span className="rounded-full bg-[#F6EDE2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7A6455]">
              {dominantLabel}
            </span>
          </div>
          <div className="group relative">
            <button
              type="button"
              aria-haspopup="dialog"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#E4D8CE] bg-[#FFFBF7] text-[#7A6455] hover:bg-[#F6F2EE]"
              onClick={() => setDetailsOpen(true)}
              title={lang === "ro" ? "Arată insightul zilei" : "Show insight"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 3a6 6 0 0 0-6 6c0 3.8 3 4.9 3 7h6c0-2.1 3-3.2 3-7a6 6 0 0 0-6-6Z" stroke="#7A6455" strokeWidth="1.6"/>
                <circle cx="12" cy="20" r="1" fill="#7A6455"/>
              </svg>
            </button>
            <div className="pointer-events-none absolute right-0 top-11 z-30 hidden w-[260px] rounded-lg border border-[#E4D8CE] bg-white p-3 text-sm text-[#2C2C2C] shadow-lg group-hover:block">
              <p className="leading-relaxed">{insight.text}</p>
              <button
                disabled={dist.total === 0}
                className="mt-3 rounded-lg border px-3 py-1 text-[11px] uppercase tracking-wider hover:bg-[#F8F5F1] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  const qs = new URLSearchParams({ tab: "oc", source: "progress" }).toString();
                  router.push(`/antrenament?${qs}`);
                }}
              >
                {ctaLearnMore}
              </button>
            </div>
          </div>
        </Card>
      
      {/* Row 3: card consolidat Activitate + lists */}
      <Card className="rounded-xl border border-[#E4D8CE] bg-white p-6 shadow min-h-[360px] flex flex-col md:col-span-3">
        <h3 className="mb-4 text-lg font-semibold text-[#1F1F1F]">{titleActivity}</h3>
        <div className={`grid grid-cols-3 gap-2 rounded-lg border border-[#F0E6DB] bg-[#FFFBF7] p-3 ${isPlaceholder ? "animate-pulse" : ""}`}>
          <div className="text-center">
            <p className="text-[11px] text-[#7A6455]">{labelReflections}</p>
            <p className="text-base font-semibold text-[#1F1F1F]">{prog.reflectionCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-[#7A6455]">{labelBreathing}</p>
            <p className="text-base font-semibold text-[#1F1F1F]">{prog.breathingCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-[#7A6455]">{labelDrills}</p>
            <p className="text-base font-semibold text-[#1F1F1F]">{prog.drillsCount}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-[#F0E6DB] bg-[#FFFBF7] p-3 text-center">
            <p className="text-[11px] text-[#7A6455]">{getString(t, "dashboard.kpi.streak", lang === "ro" ? "Streak" : "Streak")}</p>
            <p className="text-base font-semibold text-[#1F1F1F]">{streak.current} <span className="text-[12px] text-[#7A6455]">{getString(t, "dashboard.kpi.days", lang === "ro" ? "zile" : "days")}</span></p>
          </div>
          <div className="rounded-lg border border-[#F0E6DB] bg-[#FFFBF7] p-3 text-center">
            <p className="text-[11px] text-[#7A6455]">{getString(t, "dashboard.kpi.bestStreak", lang === "ro" ? "Cel mai bun" : "Best streak")}</p>
            <p className="text-base font-semibold text-[#1F1F1F]">{streak.best} <span className="text-[12px] text-[#7A6455]">{getString(t, "dashboard.kpi.days", lang === "ro" ? "zile" : "days")}</span></p>
          </div>
          <div className="rounded-lg border border-[#F0E6DB] bg-[#FFFBF7] p-3 text-center">
            <p className="text-[11px] text-[#7A6455]">{getString(t, "dashboard.kpi.weeklyMinutes", lang === "ro" ? "Minute săptămânale" : "Weekly minutes")}</p>
            <p className="text-base font-semibold text-[#1F1F1F]">{fmtMin(weekTotal)} <span className="text-[12px] text-[#7A6455]">{suffixMin}</span></p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#EFE6DA] bg-[#FFFBF7] p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1F1F1F]">{titleLast}</p>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              ref={detailsBtnRef}
              className="rounded-[8px] border border-[#2C2C2C] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
            >
              {labelDetails}
            </button>
          </div>
          {last ? (
            <p className="text-sm text-[#2C2C2C]">
              {last.type === "reflection" ? typeReflection : last.type === "breathing" ? typeBreathing : typeDrill}
              {": "}
              <strong>{fmtMin(last.durationSec ?? 0)} {suffixMin}</strong>
            </p>
          ) : (
            <p className="text-sm text-[#7A6455]">{labelNoneYet}</p>
          )}
        </div>

        <div className="mt-3 rounded-lg border border-[#EFE6DA] bg-[#FFFBF7] p-3">
          <p className="text-sm font-semibold text-[#1F1F1F]">{titleWeek}</p>
          <p className="text-xs text-[#2C2C2C]">
            {typeReflection}: <strong>{fmtMin(weekRef)}</strong> {suffixMin} · {typeBreathing}: <strong>{fmtMin(weekBre)}</strong> {suffixMin} · {typeDrill}: <strong>{fmtMin(weekDr)}</strong> {suffixMin}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#EFE6DA]" aria-label={titleWeek} role="img">
            <div className="h-2" title={`${typeReflection}: ${fmtMin(weekRef)} ${suffixMin}`} style={{ width: `${weekTotal ? Math.round((weekRef / weekTotal) * 100) : 0}%`, backgroundColor: '#7A6455' }} />
            <div className="h-2" title={`${typeBreathing}: ${fmtMin(weekBre)} ${suffixMin}`} style={{ width: `${weekTotal ? Math.round((weekBre / weekTotal) * 100) : 0}%`, backgroundColor: '#4D3F36' }} />
            <div className="h-2" title={`${typeDrill}: ${fmtMin(weekDr)} ${suffixMin}`} style={{ width: `${weekTotal ? Math.round((weekDr / weekTotal) * 100) : 0}%`, backgroundColor: '#CDB7A9' }} />
          </div>
          <p className="mt-1 text-[11px] text-[#5C4F45]">{getString(t, "dashboard.total", lang === "ro" ? "Total" : "Total")}: <strong>{fmtMin(weekTotal)} {suffixMin}</strong></p>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-[#5C4F45]">
            <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#7A6455' }} />{typeReflection}</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#4D3F36' }} />{typeBreathing}</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: '#CDB7A9' }} />{typeDrill}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-[#1F1F1F]">{titlePractice}</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFE6DA]">
            <div className="h-2" style={{ width: `${shareRef}%`, backgroundColor: '#7A6455' }} />
            <div className="h-2" style={{ width: `${shareBreath}%`, backgroundColor: '#4D3F36' }} />
            <div className="h-2" style={{ width: `${shareDrills}%`, backgroundColor: '#CDB7A9' }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#5C4F45]">
            <span>{labelReflections}: {shareRef}%</span>
            <span>{labelBreathing}: {shareBreath}%</span>
            <span>{labelDrills}: {shareDrills}%</span>
          </div>
        </div>

        <h4 className="mt-4 font-semibold text-[#1F1F1F]">{titleStrengths}</h4>
        <ul className="ml-5 list-disc text-sm text-[#2C2C2C]">
          {prog.strengths.strengths.map((s, i) => (
            <li key={`s-${i}`}>{s}</li>
          ))}
        </ul>

        <h4 className="mt-4 font-semibold text-[#1F1F1F]">{titleWeaknesses}</h4>
        <ul className="ml-5 list-disc text-sm text-[#2C2C2C]">
          {prog.strengths.weaknesses.map((w, i) => (
            <li key={`w-${i}`}>{w}</li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const qs = new URLSearchParams({ tab: "os", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
            className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
          >
            {ctaReflect}
          </button>
          <button
            type="button"
            onClick={() => {
              void recordEvaluationTabChange("oa");
              const qs = new URLSearchParams({ tab: "oa", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
            className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
          >
            {ctaBreathe}
          </button>
          <button
            type="button"
            onClick={() => {
              void recordEvaluationTabChange("oc");
              const qs = new URLSearchParams({ tab: "oc", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
            className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
          >
            {ctaInsight}
          </button>
        </div>
      </Card>
      {detailsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sess-details-title"
          onClick={(e) => {
            if (e.currentTarget === e.target) setDetailsOpen(false);
          }}
        >
          <div
            className="w-full md:max-w-xl rounded-t-2xl md:rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 id="sess-details-title" className="text-sm font-semibold text-[#1F1F1F]">{labelDetails}</h4>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                ref={closeBtnRef}
                className="rounded-[8px] border border-[#2C2C2C] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
              >
                {labelClose}
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-4 py-3">
              {sessionsSorted.length === 0 ? (
                <p className="text-sm text-[#7A6455]">{labelNoneYet}</p>
              ) : (
                <ul className="divide-y">
                  {sessionsSorted.map((s, i) => {
                    const ms = toMs(s.startedAt);
                    const when = ms ? new Date(ms).toLocaleString(lang === "ro" ? "ro-RO" : "en-US", { hour12: false }) : "";
                    const typeLabel = s.type === "reflection" ? typeReflection : s.type === "breathing" ? typeBreathing : typeDrill;
                    return (
                      <li key={`sess-${i}`} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-[#2C2C2C]">
                          {typeLabel}
                          <span className="ml-2 text-[#7A6455]">{when}</span>
                        </span>
                        <span className="font-semibold text-[#1F1F1F]">{fmtMin(s.durationSec ?? 0)} {suffixMin}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
