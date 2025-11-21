import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import InfoTooltip from "@/components/InfoTooltip";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import type { useI18n } from "@/components/I18nProvider";
import { formatUtcShort } from "@/lib/format";
import { toMsLocal } from "@/lib/dashboard/progressSelectors";
import { computeActionTrend, type ActivityEvent, type extractSessions } from "@/lib/progressAnalytics";
import type { OmniKunoLesson } from "@/config/omniKunoLessons";

export type LessonStatus = "done" | "active" | "upNext" | "locked";

export type FocusThemeInfo = {
  area?: string | null;
  desc?: string | null;
  categoryKey?: string | null;
};

type CenterColumnCardsProps = {
  showWelcome: boolean;
  hideOmniIntel?: boolean;
  debugGrid?: boolean;
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  facts: ProgressFact | null;
  sessions: ReturnType<typeof extractSessions>;
  refMs: number;
  currentFocusTag?: string;
  nowAnchor: number;
  omniIntelScore: number;
  omniIntelDelta: number | null;
  focusTheme: FocusThemeInfo;
  omniCunoScore: number;
  kunoDelta: number | null;
  kunoReadiness: number | null;
  kunoUpdatedText: string | null;
  kunoLessons: Array<OmniKunoLesson & { status: LessonStatus }>;
  onCompleteLesson?: (lessonId: string) => void;
  completingLessonId?: string | null;
};

export default function CenterColumnCards({
  showWelcome,
  hideOmniIntel,
  debugGrid,
  lang,
  t,
  facts,
  sessions,
  refMs,
  currentFocusTag,
  nowAnchor,
  omniIntelScore,
  omniIntelDelta,
  focusTheme,
  omniCunoScore,
  kunoDelta,
  kunoReadiness,
  kunoUpdatedText,
  kunoLessons,
  onCompleteLesson,
  completingLessonId,
}: CenterColumnCardsProps) {
  return (
    <div
      className={`order-1 flex h-full flex-col gap-2 md:col-span-1 md:order-2 md:gap-3 lg:gap-4 ${
        debugGrid ? "outline outline-1 outline-[#C24B17]/40" : ""
      }`}
    >
      <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-2 lg:gap-3">
        {showWelcome ? <WelcomeCard lang={lang} t={t} facts={facts} /> : null}
        {hideOmniIntel ? null : (
          <OmniIntelCard lang={lang} t={t} omniIntelScore={omniIntelScore} omniIntelDelta={omniIntelDelta} />
        )}
        <FocusThemeCard lang={lang} focusTheme={focusTheme} />
      </div>
      <div className="grid grid-cols-1 items-stretch gap-2 md:gap-3 lg:gap-3">
        <KunoMissionCard
          lang={lang}
          focusTheme={focusTheme}
          omniCunoScore={omniCunoScore}
          kunoDelta={kunoDelta}
          kunoReadiness={kunoReadiness}
          kunoUpdatedText={kunoUpdatedText}
          kunoLessons={kunoLessons}
          onCompleteLesson={onCompleteLesson}
          completingLessonId={completingLessonId}
        />
      </div>
      <TodayGuidanceCard
        lang={lang}
        facts={facts}
        sessions={sessions}
        refMs={refMs}
        currentFocusTag={currentFocusTag}
        nowAnchor={nowAnchor}
      />
    </div>
  );
}

function WelcomeCard({ lang, t, facts }: { lang: string; t: ReturnType<typeof useI18n>["t"]; facts: ProgressFact | null }) {
  return (
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
            {formatUtcShort(toMsLocal(facts?.evaluation?.updatedAt ?? facts?.updatedAt))}
          </span>
        </p>
      </Card>
    </motion.div>
  );
}

function OmniIntelCard({ lang, t, omniIntelScore, omniIntelDelta }: { lang: string; t: ReturnType<typeof useI18n>["t"]; omniIntelScore: number; omniIntelDelta: number | null }) {
  return (
    <motion.div variants={fadeDelayed(0.1)} {...hoverScale} className="h-full">
      <Card className="flex h-full flex-col items-center justify-center rounded-xl border border-[#E4DAD1] bg-white p-2 shadow-sm sm:p-3">
        <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#7B6B60] sm:mb-1 sm:text-[10px]">
          {getString(
            t,
            "dashboard.omniIntel.small",
            "Omni-Intel",
          )}
          <InfoTooltip
            items={[
              lang === "ro"
                ? "Index compus din inteligența minții din cap, a minții din inimă, a minții din intestin."
                : "Composite index from the head mind, heart mind, and gut mind intelligence.",
            ]}
            label={lang === "ro" ? "Detalii Omni‑Intel" : "Omni‑Intel details"}
          />
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-bold text-[#C24B17] sm:text-2xl">{omniIntelScore}</p>
          {omniIntelDelta != null && Number.isFinite(omniIntelDelta) ? (
            <span
              className={`text-[10px] font-semibold ${omniIntelDelta >= 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}`}
              title={getString(
                t,
                "dashboard.delta.vsLast",
                lang === "ro" ? "față de ultima vizită" : "vs last visit",
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
            lang === "ro" ? "Nivel de Omni‑Inteligență" : "Omni‑Intelligence level",
          )}
        </p>
      </Card>
    </motion.div>
  );
}

function FocusThemeCard({ lang, focusTheme }: { lang: string; focusTheme: FocusThemeInfo }) {
  return (
    <motion.div variants={fadeDelayed(0.11)} {...hoverScale} className="h-full md:col-span-2">
      <Card className="flex h-full flex-col justify-between rounded-xl border border-[#E4DAD1] bg-[#FCF7F1] p-2 shadow-sm sm:p-2">
        <h2 className="mb-1 text-[12px] font-semibold text-[#2C2C2C] sm:mb-1.5 sm:text-[13px]">
          {lang === "ro" ? "Tematica în focus" : "Focus theme"}
        </h2>
        <p className="text-[13px] font-bold text-[#2C2C2C] sm:text-sm">{focusTheme.area}</p>
        <p className="mt-0.5 text-[10px] text-[#7B6B60] sm:mt-1 sm:text-[11px]">{focusTheme.desc}</p>
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
  );
}

type KunoMissionLesson = OmniKunoLesson & { status: LessonStatus };

type KunoMissionCardProps = {
  lang: string;
  focusTheme: FocusThemeInfo;
  omniCunoScore: number;
  kunoDelta: number | null;
  kunoReadiness: number | null;
  kunoUpdatedText: string | null;
  kunoLessons: KunoMissionLesson[];
  onCompleteLesson?: (lessonId: string) => void;
  completingLessonId?: string | null;
};

const kunoLessonStatusStyles: Record<LessonStatus, { wrapper: string; titleColor: string; statusTag: string; node: string }> = {
  done: {
    wrapper: "border border-[#E4DAD1] bg-white",
    titleColor: "text-[#4D3F36]",
    statusTag: "bg-[#ECF8F0] text-[#1F7A43]",
    node: "border-[#1F7A43] text-[#1F7A43]",
  },
  active: {
    wrapper: "border border-[#C07963] bg-white shadow-[0_10px_24px_rgba(192,121,99,0.16)]",
    titleColor: "text-[#2C2C2C]",
    statusTag: "bg-[#FFF3EC] text-[#B44B1F]",
    node: "border-[#C07963] text-[#C07963]",
  },
  upNext: {
    wrapper: "border border-dashed border-[#E4DAD1] bg-white",
    titleColor: "text-[#2C2C2C]",
    statusTag: "bg-[#F8F1EA] text-[#A08F82]",
    node: "border-[#D8C7B9] text-[#A08F82]",
  },
  locked: {
    wrapper: "border border-dashed border-[#E4DAD1] bg-white opacity-80",
    titleColor: "text-[#A08F82]",
    statusTag: "bg-[#F3EEE8] text-[#A08F82]",
    node: "border-[#D8C7B9] text-[#A08F82]",
  },
};

function KunoMissionCard({
  lang,
  focusTheme,
  omniCunoScore,
  kunoDelta,
  kunoReadiness,
  kunoUpdatedText,
  kunoLessons,
  onCompleteLesson,
  completingLessonId,
}: KunoMissionCardProps) {
  const completedCount = kunoLessons.filter((lesson) => lesson.status === "done").length;
  const totalLessons = kunoLessons.length;
  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <Card className="rounded-2xl border border-[#E4DAD1] bg-[#FFFBF7] px-3 py-3 shadow-sm sm:px-4 sm:py-4">
        <div className="flex flex-col gap-2 md:flex-row md:gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#7B6B60] sm:text-sm">OmniKuno · {lang === "ro" ? "Echilibru emoțional" : "Emotional balance"}</p>
            <p className="mt-0.5 text-sm font-bold text-[#2C2C2C] sm:text-base">
              {lang === "ro" ? "Misiunea: acumulează cunoștințe." : "Mission: accumulate knowledge."}
            </p>
            <p className="text-[11px] text-[#6A6A6A] sm:text-[12px]">
              {completedCount} / {totalLessons} {lang === "ro" ? "lecții finalizate" : "lessons completed"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#7B6B60] sm:text-[11px]">
              <span className="rounded-full border border-[#C07963]/30 px-2 py-0.5 text-[#C07963]">
                {lang === "ro" ? "Pregătire" : "Readiness"}: {kunoReadiness != null ? `${Math.round(kunoReadiness)}%` : "—"}
              </span>
              <span className="rounded-full border border-[#C07963]/30 px-2 py-0.5 text-[#C07963]">
                {lang === "ro" ? "Scor Kuno" : "Kuno score"}: {omniCunoScore}
                {kunoDelta != null && Number.isFinite(kunoDelta) ? (
                  <span className={`ml-1 font-semibold ${kunoDelta >= 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}`}>
                    {kunoDelta >= 0 ? "+" : ""}
                    {Math.round(kunoDelta)}
                  </span>
                ) : null}
              </span>
              {kunoUpdatedText ? <span className="text-[#A08F82]">{kunoUpdatedText}</span> : null}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-2.5">
          {kunoLessons.map((lesson, idx) => {
            const styles = kunoLessonStatusStyles[lesson.status] ?? kunoLessonStatusStyles.locked;
            const isActive = lesson.status === "active";
            const icon = lesson.status === "done" ? "✓" : lesson.status === "locked" ? "🔒" : null;
            return (
              <div key={lesson.id} className="flex flex-col items-stretch">
                {idx !== 0 ? <span className="mx-auto mb-2 h-4 w-px rounded-full bg-[#E4DAD1]" aria-hidden="true" /> : null}
                <div className={`w-full rounded-2xl px-3 py-2.5 transition ${styles.wrapper}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-[16px] ${styles.node}`}>
                        {icon ? icon : <span className="h-2 w-2 rounded-full bg-[#C07963]" aria-hidden />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`text-[12px] font-semibold sm:text-[13px] ${styles.titleColor}`}>
                        <span className="mr-1 text-[#C07963]">0{lesson.order}</span>
                        {lesson.title}
                      </p>
                      <p className="text-[11px] text-[#5B4C44] sm:text-[12px]">{lesson.shortDescription}</p>
                      <div className="mt-1 h-px bg-[#E4DAD1]" />
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => onCompleteLesson?.(lesson.id)}
                          disabled={!onCompleteLesson || completingLessonId === lesson.id}
                          className="mt-2 inline-flex items-center rounded-full border border-[#C07963] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white disabled:cursor-not-allowed disabled:border-[#E4DAD1] disabled:text-[#B9A598]"
                        >
                          {completingLessonId === lesson.id
                            ? lang === "ro"
                              ? "Se salvează..."
                              : "Saving..."
                            : lang === "ro"
                              ? "Începe lecția"
                              : "Start lesson"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

function TodayGuidanceCard({
  lang,
  facts,
  sessions,
  refMs,
  currentFocusTag,
  nowAnchor,
}: {
  lang: string;
  facts: ProgressFact | null;
  sessions: ReturnType<typeof extractSessions>;
  refMs: number;
  currentFocusTag?: string;
  nowAnchor: number;
}) {
  return (
    <motion.div variants={fadeDelayed(0.2)} {...hoverScale}>
      {(() => {
        const last = (facts?.quickAssessment ?? null) as
          | { energy?: number; stress?: number; clarity?: number; confidence?: number; focus?: number; updatedAt?: unknown }
          | null;
        const energyQA = Math.max(0, Math.min(10, Number(last?.energy ?? 0)));
        const stressQA = Math.max(0, Math.min(10, Number(last?.stress ?? 0)));
        const clarityQA = Math.max(0, Math.min(10, Number(last?.clarity ?? 0)));
        type ScopeHist = Record<string, { clarity?: number; calm?: number; energy?: number; updatedAt?: unknown }>;
        const scopeHist = ((facts as { omni?: { scope?: { history?: ScopeHist } } } | undefined)?.omni?.scope?.history ?? {}) as ScopeHist;
        const lastKeys = Object.keys(scopeHist)
          .filter((k) => /^d\d{8}$/.test(k))
          .sort()
          .slice(-3);
        const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
        const energy3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.energy ?? 0)));
        const clarity3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.clarity ?? 0)));
        const calm3 = avg(lastKeys.map((k) => Number(scopeHist[k]?.calm ?? 0)));
        const toMs = (v: unknown) => {
          try {
            if (!v) return 0;
            if (typeof v === "number") return v;
            if (v instanceof Date) return v.getTime();
            const ts = v as { toDate?: () => Date };
            return typeof ts?.toDate === "function" ? ts.toDate().getTime() : 0;
          } catch {
            return 0;
          }
        };
        const qaMs = toMs(last?.updatedAt);
        const histMs = (() => {
          const lastKey = lastKeys[lastKeys.length - 1];
          const u = lastKey ? scopeHist[lastKey]?.updatedAt : undefined;
          return toMs(u);
        })();
        const preferQA = qaMs && (!histMs || qaMs >= histMs);
        const evs: ActivityEvent[] = (() => {
          const base: ActivityEvent[] = sessions.map((s) => ({
            startedAt: ((): number | string | Date => {
              const v = (s as { startedAt?: unknown })?.startedAt;
              if (typeof v === "number" || v instanceof Date || typeof v === "string") return v as number | string | Date;
              return nowAnchor;
            })(),
            durationMin: Math.max(0, Math.round((s.durationSec ?? 0) / 60)),
            units: 1,
            source: (s.type === "breathing" ? "breathing" : s.type === "drill" ? "drill" : "journal") as ActivityEvent["source"],
            category: (s.type === "reflection" ? "reflection" : "practice") as ActivityEvent["category"],
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
              base.push({
                startedAt: started,
                durationMin: typeof r.durationMin === "number" ? r.durationMin : undefined,
                units: typeof r.units === "number" ? r.units : 1,
                source: src,
                category: r.category,
                focusTag: r.focusTag ?? undefined,
              });
            });
          } catch {}
          return base;
        })();
        const todayScore = computeActionTrend(evs, refMs, lang, 1, currentFocusTag)[0]?.totalMin ?? 0;
        const makeBar = (val01: number, accent: string) => (
          <div className="h-2 w-full rounded-full bg-[#E8DED4]">
            <div className="h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, Math.round(val01 * 10)))}%`, background: accent }} />
          </div>
        );
        const energy = preferQA ? energyQA : energy3;
        const stress = preferQA ? stressQA : 10 - calm3;
        const clarity = preferQA ? clarityQA : clarity3;
        const state: "low" | "tense" | "ready" =
          energy <= 4 ? "low" : (10 - stressQA <= 3 && preferQA ? "tense" : (preferQA ? 10 - stressQA : calm3) <= 4 ? "tense" : "ready");
        const badge = (() => {
          if (state === "low") return { text: lang === "ro" ? "ENERGIE SCĂZUTĂ" : "LOW ENERGY", cls: "bg-[#FFF1ED] text-[#B8472B] border-[#F3D3C6]" };
          if (state === "tense") return { text: lang === "ro" ? "STARE TENSIONATĂ" : "TENSE STATE", cls: "bg-[#FFEFF3] text-[#B82B4F] border-[#F6D0DA]" };
          return { text: lang === "ro" ? "PREGĂTIT" : "READY", cls: "bg-[#ECF8F0] text-[#1F7A43] border-[#CFEBDD]" };
        })();
        const primary = (() => {
          if (state === "low") return { title: lang === "ro" ? "Respirație 5 minute pentru reset" : "5‑min breath reset", href: { pathname: "/antrenament", query: { tab: "ose" } }, dur: "~5 min" } as const;
          if (state === "tense")
            return {
              title: lang === "ro" ? "Jurnal ghidat: descarcă emoțiile (5 min)" : "Guided journal: release tension (5 min)",
              href: { pathname: "/progress", query: { open: "journal", tab: "NOTE_LIBERE" } },
              dur: "~5 min",
            } as const;
          return {
            title: lang === "ro" ? "Mini‑lecție OmniKuno pe tema ta" : "OmniKuno micro‑lesson on your theme",
            href: { pathname: "/antrenament", query: { tab: "oc" } },
            dur: lang === "ro" ? "3–7 min" : "3–7 min",
          } as const;
        })();
        const primaryDesc = (() => {
          if (state === "tense") {
            return lang === "ro"
              ? "Scrie 2–3 rânduri despre ce te apasă acum. Nu analiza — doar descarcă tensiunea; va ușura claritatea."
              : "Write 2–3 lines about what feels heavy right now. Don’t analyze — just offload the tension to regain clarity.";
          }
          if (state === "low") {
            return lang === "ro"
              ? "Ritm simplu 4–4 (sau 4–6): inspiră 4s, ține 4s, expiră 4s, ține 4s. 3–5 cicluri, cu atenția pe expirație."
              : "Simple 4–4 (or 4–6) rhythm: inhale 4s, hold 4s, exhale 4s, hold 4s. Do 3–5 cycles, focus on the exhale.";
          }
          return lang === "ro"
            ? "3–7 minute: parcurgi o idee-cheie aplicată pe tema ta din focus. 1 concept + 1 exemplu concret."
            : "3–7 minutes: review a key idea applied to your focus theme. 1 concept + 1 concrete example.";
        })();
        const alt1 = lang === "ro" ? "Somn: checklist scurt (2 min)" : "Sleep: short checklist (2 min)";
        const alt2 = lang === "ro" ? "Jurnal: o notă rapidă" : "Journal: a quick note";
        const why = (() => {
          const e = Math.round((energy3 || energy) * 10) / 10;
          const c = Math.round((10 - stress) * 10) / 10;
          const a = todayScore;
          if (lang === "ro") return `Îți recomandăm asta pentru că, în ultimele zile, energia ta a fost ~${e}/10, echilibrul emoțional ~${c}/10, iar scorul de acțiune azi este ${a}/100.`;
          return `We recommend this because, in recent days, your energy was ~${e}/10, emotional balance ~${c}/10, and today’s action score is ${a}/100.`;
        })();
        return (
          <Card className="rounded-xl border border-[#E4DAD1] bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${badge.cls}`}>{badge.text}</span>
                  <span className="text-[11px] text-[#7B6B60] sm:text-xs">{lang === "ro" ? "Ghidare pentru azi" : "Guidance for today"}</span>
                </div>
                <div className="space-y-1.5 text-[10px] text-[#7B6B60] sm:text-[11px]">
                  <div>
                    <p className="font-semibold text-[#2C2C2C]">{lang === "ro" ? "Energia" : "Energy"}</p>
                    {makeBar(energy / 10, "#F7B267")}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2C2C2C]">{lang === "ro" ? "Echilibrul emoțional" : "Emotional balance"}</p>
                    {makeBar((10 - stress) / 10, "#C27BA0")}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2C2C2C]">{lang === "ro" ? "Claritatea" : "Clarity"}</p>
                    {makeBar(clarity / 10, "#6A9FB5")}
                  </div>
                </div>
                <div className="mt-2 rounded-[12px] border border-[#F0E8E0] bg-[#FFFBF7] p-2 text-[11px] text-[#2C2C2C] sm:text-xs">
                  <p className="font-semibold">{lang === "ro" ? "De ce această recomandare" : "Why this recommendation"}</p>
                  <p className="text-[11px] text-[#2C2C2C] sm:text-xs">{why}</p>
                </div>
              </div>
              <div className="flex flex-col justify-between sm:border-l sm:border-[#E8DACE] sm:pl-4">
                <div>
                  <p className="mb-1 text-[12px] font-semibold text-[#2C2C2C] sm:text-sm">{lang === "ro" ? "Pasul principal" : "Primary step"}</p>
                  <p className="mb-1 text-[13px] font-bold leading-snug text-[#2C2C2C] sm:text-[14px]">{primary.title}</p>
                  <p className="mb-2 text-[11px] text-[#7B6B60] sm:text-[12px]">{primaryDesc}</p>
                  <Link href={primary.href} className="group inline-flex w-full items-center justify-between rounded-[12px] border border-[#D3C1B2] bg-[#EADCCC] px-4 py-3 text-[#2C2C2C] shadow-sm transition hover:border-[#C9B8A8]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-[12px]">{lang === "ro" ? "Începe acum" : "Start now"}</span>
                    <span className="text-[10px] text-[#7B6B60]">{primary.dur}</span>
                  </Link>
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex items-baseline justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A08F82]">{lang === "ro" ? "Variante light" : "Light options"}</p>
                    <span className="text-[10px] text-[#7B6B60]">— 5 min</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={{ pathname: "/antrenament", query: { tab: "oc" } }} className="text-[11px] text-[#2C2C2C] underline-offset-2 hover:text-[#C07963] hover:underline sm:text-xs">
                      • {alt1}
                    </Link>
                    <Link href={{ pathname: "/progress", query: { open: "journal", tab: "NOTE_LIBERE" } }} className="text-[11px] text-[#2C2C2C] underline-offset-2 hover:text-[#C07963] hover:underline sm:text-xs">
                      • {alt2}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}
    </motion.div>
  );
}
