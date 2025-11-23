import { motion } from "framer-motion";
import type { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import InfoTooltip from "@/components/InfoTooltip";
import WeeklyTrendsChart from "@/components/charts/WeeklyTrendsChart";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import { recordActivityEvent } from "@/lib/progressFacts";
import { computeActionTrend, type ActivityEvent } from "@/lib/progressAnalytics";
import { toMsLocal } from "@/lib/dashboard/progressSelectors";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import type { useI18n } from "@/components/I18nProvider";
import { resolveModuleId } from "@/config/omniKunoModules";

type SessionsData = Array<{ startedAt?: unknown; durationSec?: number | null; type: string }>;

type ActionTrendsCardProps = {
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  timeframe: "day" | "week" | "month";
  setTimeframe: (tf: "day" | "week" | "month") => void;
  metric: "min" | "count" | "score";
  setMetric: (metric: "min" | "count" | "score") => void;
  weighted: boolean;
  sessions: SessionsData;
  facts: ProgressFact | null;
  weeklyWithEvents: { day: number; totalMin: number; label: string }[];
  monthWithEvents: { day: number; totalMin: number; label: string }[];
  weeklyCountsWithEvents: { day: number; totalMin: number; label: string }[];
  monthCountsWithEvents: { day: number; totalMin: number; label: string }[];
  refMs: number;
  nowAnchor: number;
  currentFocusTag?: string;
  qaOpen: boolean;
  setQaOpen: (open: boolean) => void;
  qaCategory: "practice" | "reflection" | "knowledge";
  setQaCategory: (cat: "practice" | "reflection" | "knowledge") => void;
  qaMinutes: number;
  setQaMinutes: (minutes: number) => void;
  qaBusy: boolean;
  setQaBusy: (busy: boolean) => void;
  qaSelectedDays: number[];
  setQaSelectedDays: Dispatch<SetStateAction<number[]>>;
  profileId: string;
};

export default function ActionTrendsCard({
  lang,
  t,
  timeframe,
  setTimeframe,
  metric,
  setMetric,
  weighted,
  sessions,
  facts,
  weeklyWithEvents,
  monthWithEvents,
  weeklyCountsWithEvents,
  monthCountsWithEvents,
  refMs,
  nowAnchor,
  currentFocusTag,
  qaOpen,
  setQaOpen,
  qaCategory,
  setQaCategory,
  qaMinutes,
  setQaMinutes,
  qaBusy,
  setQaBusy,
  qaSelectedDays,
  setQaSelectedDays,
  profileId,
}: ActionTrendsCardProps) {
  const buildEventsArray = () => {
    const evs: ActivityEvent[] = sessions.map((s) => ({
      startedAt: (() => {
        const v = (s as { startedAt?: unknown })?.startedAt;
        if (typeof v === "number" || v instanceof Date || typeof v === "string") return v as number | string | Date;
        return nowAnchor;
      })(),
      durationMin: Math.max(0, Math.round((s.durationSec ?? 0) / 60)),
      units: 1,
      source: s.type === "breathing" ? "breathing" : s.type === "drill" ? "drill" : "journal",
      category: s.type === "reflection" ? "reflection" : "practice",
    }));
    try {
      type RawAE = { startedAt?: unknown; source?: string; category?: "knowledge" | "practice" | "reflection"; units?: number; durationMin?: number; focusTag?: string | null };
      const raws = (facts as { activityEvents?: RawAE[] } | undefined)?.activityEvents ?? [];
      raws.forEach((r) => {
        if (!r.category) return;
        const started: number | string | Date =
          typeof r.startedAt === "number" || r.startedAt instanceof Date || typeof r.startedAt === "string"
            ? (r.startedAt as number | string | Date)
            : nowAnchor;
        const src: ActivityEvent["source"] = (() => {
          const s = r.source || "other";
          return ["omnikuno", "omniabil", "breathing", "journal", "drill", "slider", "other"].includes(s) ? (s as ActivityEvent["source"]) : "other";
        })();
        evs.push({
          startedAt: started,
          durationMin: typeof r.durationMin === "number" ? r.durationMin : undefined,
          units: typeof r.units === "number" ? r.units : 1,
          source: src,
          category: r.category,
          focusTag: r.focusTag ?? undefined,
        });
      });
    } catch {}
    return evs;
  };

  const buildChartData = () => {
    if (metric === "score") {
      const evs = buildEventsArray();
      const now = refMs;
      const days = (() => {
        if (timeframe === "day") return 1;
        if (timeframe === "week") return 7;
        const d = new Date(now);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      })();
      return computeActionTrend(evs, now, lang, days, currentFocusTag);
    }
    if (metric === "min") {
      if (timeframe === "day") return weeklyWithEvents.slice(-1);
      return timeframe === "week" ? weeklyWithEvents : monthWithEvents;
    }
    if (timeframe === "day") return weeklyCountsWithEvents.slice(-1);
    return timeframe === "week" ? weeklyCountsWithEvents : monthCountsWithEvents;
  };

  const quickAddBlock = () => {
    try {
      const evs = buildEventsArray();
      const last7 = computeActionTrend(evs, refMs, lang, 7, currentFocusTag);
      const gaps = last7.filter((d) => (d.totalMin || 0) === 0).map((d) => d.day);
      const hasGaps = gaps.length > 0;
      let wK = 0;
      let wP = 0;
      let wR = 0;
      const now7 = refMs - 6 * 24 * 60 * 60 * 1000;
      evs.forEach((e) => {
        const ms = toMsLocal(e.startedAt);
        if (ms < now7) return;
        const base =
          typeof e.durationMin === "number" && Number.isFinite(e.durationMin)
            ? Math.max(0, e.durationMin)
            : Math.max(0, (e.units || 1) * (e.category === "knowledge" ? 6 : e.category === "practice" ? 8 : 4));
        const w = e.category === "knowledge" ? 0.8 : e.category === "practice" ? 1.5 : 1.1;
        const normalizedCurrent = resolveModuleId(currentFocusTag ?? undefined);
        const eventTag = resolveModuleId(e.focusTag ?? undefined);
        const weightFactor = normalizedCurrent && eventTag ? (eventTag === normalizedCurrent ? 1 : 0.5) : 1;
        const v = base * w * weightFactor;
        if (e.category === "knowledge") wK += v;
        else if (e.category === "practice") wP += v;
        else wR += v;
      });
      const tot = wK + wP + wR || 1;
      const pct = (x: number) => Math.round((x / tot) * 100);
      return (
        <div className="mt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#7B6B60]">
            <span>
              {lang === "ro"
                ? `Pondere (ultimele 7 zile): ${pct(wP)}% practică, ${pct(wK)}% cunoștințe, ${pct(wR)}% reflecție.`
                : `Share (last 7 days): ${pct(wP)}% practice, ${pct(wK)}% knowledge, ${pct(wR)}% reflection.`}
            </span>
            {hasGaps ? (
              <button
                type="button"
                className="text-[#2C2C2C] underline hover:text-[#C07963]"
                onClick={() => {
                  setQaOpen(!qaOpen);
                  if (!qaSelectedDays.length) setQaSelectedDays([gaps[0]!]);
                }}
                data-testid="trend-quick-add"
              >
                {lang === "ro" ? "Adaugă acțiune rapidă" : "Add quick action"}
              </button>
            ) : null}
          </div>
          {qaOpen && hasGaps ? (
            <div className="mt-2 rounded-[8px] border border-[#E4DAD1] bg-[#FFFBF7] p-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] text-[#7B6B60]">
                  <span>{lang === "ro" ? "Zile fără acțiuni:" : "Gap days:"}</span>
                  {gaps.map((g) => {
                    const d = new Date(g);
                    const lbl = d.getDate();
                    const checked = qaSelectedDays.includes(g);
                    return (
                      <label key={g} className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setQaSelectedDays((prev) => (e.target.checked ? Array.from(new Set([...prev, g])) : prev.filter((x) => x !== g)));
                          }}
                        />
                        <span>{lbl}</span>
                      </label>
                    );
                  })}
                </div>
                <label className="text-[10px] text-[#7B6B60]">
                  {lang === "ro" ? "Categorie" : "Category"}
                  <select value={qaCategory} onChange={(e) => setQaCategory(e.target.value as "practice" | "reflection" | "knowledge")} className="ml-1 rounded border border-[#E4DAD1] bg-white px-1 py-0.5 text-[10px]">
                    <option value="practice">{lang === "ro" ? "Practică" : "Practice"}</option>
                    <option value="knowledge">{lang === "ro" ? "Cunoaștere" : "Knowledge"}</option>
                    <option value="reflection">{lang === "ro" ? "Reflecție" : "Reflection"}</option>
                  </select>
                </label>
                <label className="text-[10px] text-[#7B6B60]">
                  {lang === "ro" ? "Minute" : "Minutes"}
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={qaMinutes}
                    onChange={(e) => setQaMinutes(Number(e.target.value) || 0)}
                    className="ml-1 w-16 rounded border border-[#E4DAD1] bg-white px-1 py-0.5 text-[10px]"
                  />
                </label>
                <button
                  type="button"
                  disabled={qaBusy || !qaSelectedDays.length || qaMinutes <= 0}
                  onClick={async () => {
                    setQaBusy(true);
                    try {
                      const promises = qaSelectedDays.map(async (dayMs) => {
                        const ts = dayMs + 12 * 60 * 60 * 1000;
                        await recordActivityEvent(
                          {
                            startedAtMs: ts,
                            source: qaCategory === "knowledge" ? "omnikuno" : "other",
                            category: qaCategory,
                            durationMin: qaMinutes,
                            units: 1,
                            focusTag: currentFocusTag ?? null,
                          },
                          profileId,
                        );
                      });
                      await Promise.all(promises);
                      setQaOpen(false);
                      setQaSelectedDays([]);
                    } catch (error) {
                      console.warn("quick-add failed", error);
                    } finally {
                      setQaBusy(false);
                    }
                  }}
                  className="rounded border border-[#2C2C2C] px-2 py-0.5 text-[10px] font-semibold text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                >
                  {qaBusy ? (lang === "ro" ? "Se salvează…" : "Saving…") : lang === "ro" ? "Salvează" : "Save"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      );
    } catch {
      return null;
    }
  };

  const trendTitle =
    timeframe === "day"
      ? lang === "ro"
        ? "Trend zilnic"
        : "Daily trend"
      : timeframe === "week"
        ? getString(t, "dashboard.trendsTitle", lang === "ro" ? "Trend săptămânal" : "Weekly trends")
        : lang === "ro"
          ? "Trend lunar"
          : "Monthly trend";

  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <div id="actions-trend">
        <Card className="h-[200px] overflow-hidden rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm sm:h-[240px] sm:p-4 lg:h-[280px]">
          <h3 className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#7B6B60] sm:mb-2 sm:text-sm">
            <span>{trendTitle}</span>
            <InfoTooltip
              label={lang === "ro" ? "Despre trend" : "About trends"}
              items={
                lang === "ro"
                  ? [
                      "Alege intervalul: Săptămână / Lună",
                      "Alege metrica: Minute / Sesiuni / Scor",
                      weighted ? "Ponderi: minutele pentru Respirație/Drill cântăresc mai mult" : "Minute: valori brute pe activități",
                      "Scor activitate: 0–100 pe bază de minute ponderate",
                    ]
                  : [
                      "Pick range: Week / Month",
                      "Pick metric: Minutes / Sessions / Score",
                      weighted ? "Weighted: minutes for Breathing/Drill weigh more" : "Minutes: raw values across activities",
                      "Activity Score: 0–100 from weighted minutes",
                    ]
              }
            />
          </h3>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-[#8C7C70] sm:text-[11px]">
              {metric === "score"
                ? lang === "ro"
                  ? "Scor activitate (0–100)"
                  : "Activity score (0–100)"
                : lang === "ro"
                ? "Evoluția activităților"
                : "Activities evolution"}
            </p>
            <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto sm:gap-2">
              <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[10px] sm:text-[11px]">
                <button
                  type="button"
                  onClick={() => setTimeframe("day")}
                  className={`rounded px-1.5 py-0.5 transition ${timeframe === "day" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                  aria-label="Toggle to day view"
                  data-testid="trend-toggle-day"
                >
                  {lang === "ro" ? "Azi" : "Day"}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe("week")}
                  className={`rounded px-1.5 py-0.5 transition ${timeframe === "week" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                  aria-label="Toggle to week view"
                  data-testid="trend-toggle-week"
                >
                  {getString(t, "dashboard.trendsToggle.week", lang === "ro" ? "Săptămână" : "Week")}
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe("month")}
                  className={`rounded px-1.5 py-0.5 transition ${timeframe === "month" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                  aria-label="Toggle to month view"
                  data-testid="trend-toggle-month"
                >
                  {getString(t, "dashboard.trendsToggle.month", lang === "ro" ? "Lună" : "Month")}
                </button>
              </div>
              <div className="inline-flex rounded-md border border-[#E4DAD1] bg-[#FFFBF7] p-0.5 text-[10px] sm:text-[11px]">
                <button
                  type="button"
                  onClick={() => setMetric("min")}
                  className={`rounded px-1.5 py-0.5 transition ${metric === "min" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                  aria-label="Toggle to minutes"
                  data-testid="trend-toggle-minutes"
                >
                  {getString(t, "dashboard.trendsToggle.minutes", lang === "ro" ? "Minute" : "Minutes")}
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("count")}
                  className={`rounded px-1.5 py-0.5 transition ${metric === "count" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                  aria-label="Toggle to sessions"
                  data-testid="trend-toggle-sessions"
                >
                  {getString(t, "dashboard.trendsToggle.sessions", lang === "ro" ? "Sesiuni" : "Sessions")}
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("score")}
                  className={`rounded px-1.5 py-0.5 transition ${metric === "score" ? "bg-white border border-[#E4DAD1] text-[#2C2C2C] font-semibold" : "text-[#5C4F45]"}`}
                  aria-label="Toggle to activity score"
                  data-testid="trend-toggle-score"
                >
                  {lang === "ro" ? "Scor" : "Score"}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 h-[100px] border-t border-[#F0E8E0] pt-2 sm:mt-4 sm:h-[120px] sm:pt-3 lg:mt-5 lg:h-[140px] lg:pt-4" data-testid="trends-chart">
            <WeeklyTrendsChart
              data={buildChartData()}
              showBars={metric === "score" || metric === "count" || metric === "min"}
              showValues={true}
              yAxisWidth={24}
              ariaLabel={
                lang === "ro"
                  ? timeframe === "month"
                    ? metric === "min"
                      ? "Trend lunar minute"
                      : metric === "count"
                      ? "Trend lunar sesiuni"
                      : "Trend lunar scor"
                    : metric === "min"
                    ? "Trend săptămânal minute"
                    : metric === "count"
                    ? "Trend săptămânal sesiuni"
                    : "Trend săptămânal scor"
                  : timeframe === "month"
                  ? metric === "min"
                    ? "Monthly trend minutes"
                    : metric === "count"
                    ? "Monthly trend sessions"
                    : "Monthly trend score"
                  : metric === "min"
                  ? "Weekly trend minutes"
                  : metric === "count"
                  ? "Weekly trend sessions"
                  : "Weekly trend score"
              }
            />
          </div>
          {metric !== "min" ? (
            <p className="mt-1 text-[9px] text-[#7B6B60] sm:text-[10px]">
              {getString(t, metric === "count" ? "dashboard.trendsToggle.sessions" : "dashboard.trendsToggle.score", metric === "count" ? (lang === "ro" ? "Sesiuni" : "Sessions") : lang === "ro" ? "Scor" : "Score")}
            </p>
          ) : null}
          {quickAddBlock()}
        </Card>
      </div>
    </motion.div>
  );
}
