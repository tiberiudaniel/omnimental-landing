import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import type { OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import { computeLessonsStatus } from "@/components/omniKuno/useKunoTimeline";
import type { KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { getModuleLabel, type OmniKunoModuleId } from "@/config/omniKunoModules";
import { HoneyHex } from "@/components/mission-map/HoneyHex";

export type KunoMissionCardData = {
  areaKey: string;
  module: OmniKunoModuleConfig;
  completedIds: readonly string[];
  xp: number;
  performance?: KunoPerformanceSnapshot;
};

export type KunoNextModuleSuggestion = {
  moduleId: OmniKunoModuleId;
  firstLessonId?: string | null;
};

type KunoMissionCardProps = {
  lang: string;
  focusAreaLabel?: string | null;
  omniCunoScore: number;
  kunoDelta: number | null;
  missionData: KunoMissionCardData | null;
  nextModuleSuggestion?: KunoNextModuleSuggestion | null;
  progressPercent?: number | null;
};

export default function KunoMissionCard({
  lang,
  focusAreaLabel,
  omniCunoScore,
  kunoDelta,
  missionData,
  nextModuleSuggestion,
  progressPercent,
}: KunoMissionCardProps) {
  const router = useRouter();
  const timeline = useMemo(() => {
    if (!missionData) return [];
    return computeLessonsStatus(missionData.module.lessons, missionData.completedIds);
  }, [missionData]);
  const completedCount = timeline.filter((item) => item.status === "done").length;
  const totalLessons = missionData?.module.lessons.length ?? 0;
  const xp = Math.max(0, missionData?.xp ?? 0);
  const missionModuleId = missionData?.module.moduleId as OmniKunoModuleId | undefined;
  const moduleLabel = missionModuleId ? getModuleLabel(missionModuleId, lang === "ro" ? "ro" : "en") : null;
  const focusLabel = focusAreaLabel ?? moduleLabel ?? (lang === "ro" ? "focusul tău" : "your focus theme");
  const moduleCompleted = timeline.length > 0 && timeline.every((item) => item.status === "done");
  const pendingLesson = timeline.find((item) => item.status !== "done");
  const activeLesson =
    timeline.find((item) => item.status === "active") ??
    (!moduleCompleted ? pendingLesson : null);
  const activeLessonOrder = activeLesson
    ? typeof activeLesson.order === "number"
      ? activeLesson.order
      : timeline.findIndex((item) => item.id === activeLesson.id) + 1
    : null;
  const areaParam = missionData ? encodeURIComponent(missionData.areaKey) : "calm";
  const moduleQuery = missionData ? `&module=${encodeURIComponent(missionData.module.moduleId)}` : "";
  const lessonQuery = activeLesson ? `&lesson=${encodeURIComponent(activeLesson.id)}` : "";
  const nextModuleLabel = nextModuleSuggestion
    ? getModuleLabel(nextModuleSuggestion.moduleId, lang === "ro" ? "ro" : "en")
    : null;
  const nextLessonQuery =
    nextModuleSuggestion?.firstLessonId && nextModuleSuggestion.firstLessonId.length
      ? `&lesson=${encodeURIComponent(nextModuleSuggestion.firstLessonId)}`
      : "";
  const nextModuleHref = nextModuleSuggestion
    ? `/omni-kuno?area=${encodeURIComponent(nextModuleSuggestion.moduleId)}&module=${encodeURIComponent(
        nextModuleSuggestion.moduleId,
      )}${nextLessonQuery}`
    : "/omni-kuno";
  const defaultLessonHref =
    !missionData || moduleCompleted
      ? "/omni-kuno"
      : `/omni-kuno?area=${areaParam}${moduleQuery}${lessonQuery}`;
  const ctaHref = moduleCompleted ? nextModuleHref : defaultLessonHref;
  const scoreDelta =
    kunoDelta != null && Number.isFinite(kunoDelta)
      ? `${kunoDelta >= 0 ? "+" : ""}${Math.round(kunoDelta)}`
      : null;
  const ctaLabel = (() => {
    if (moduleCompleted) {
      if (nextModuleLabel) {
        return lang === "ro" ? `Începe ${nextModuleLabel}` : `Start ${nextModuleLabel}`;
      }
      return lang === "ro" ? "Vezi alte module" : "Browse more modules";
    }
    return lang === "ro" ? "Continuă misiunea" : "Continue mission";
  })();

  const activeAccent =
    activeLesson?.type === "quiz" ? "var(--accent-main)" : "var(--accent-strong)";
  const activeBg = `color-mix(in srgb, ${activeAccent ?? "var(--accent-main)"} 12%, var(--bg-card))`;
  const durationCopy = (() => {
    if (!activeLesson) return null;
    if (typeof activeLesson.durationMin === "number" && activeLesson.durationMin > 0) {
      const rounded = Math.max(1, Math.round(activeLesson.durationMin));
      return lang === "ro" ? `~${rounded} min` : `~${rounded} min`;
    }
    if (activeLesson.type === "quiz") {
      return lang === "ro" ? "~3 min · mini-test" : "~3 min · mini-quiz";
    }
    return lang === "ro" ? "~6 min · lecție" : "~6 min · lesson";
  })();

  const summaryProps: KunoMissionSummaryProps = {
    lang,
    focusLabel,
    omniCunoScore,
    scoreDelta,
    moduleCompleted,
    nextModuleLabel,
    xp,
    durationCopy,
    completedCount,
    totalLessons,
    progressPercent,
  };

  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <DashboardCard className="px-4 py-3.5 sm:px-4 sm:py-4 max-w-[720px]" title={null} subtitle={null} footer={null}>
        <KunoMissionSummary {...summaryProps} />
        <div className="mt-2 rounded-2xl border px-3 py-3 text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A8578]">
            {moduleCompleted
              ? lang === "ro"
                ? "Modul finalizat"
                : "Module completed"
              : lang === "ro"
                ? "Următorul pas"
                : "Next step"}
          </p>
          {moduleCompleted ? (
            <div className="mt-3 space-y-2 text-sm theme-text-main">
              <p>
                {lang === "ro"
                  ? `Ai parcurs toate lecțiile pentru ${moduleLabel ?? "acest modul"}.`
                  : `You completed every lesson for ${moduleLabel ?? "this module"}.`}
              </p>
              {nextModuleLabel ? (
                <>
                  <p className="text-[13px] font-semibold theme-text-main">
                    {lang === "ro"
                      ? `Următorul parcurs recomandat: ${nextModuleLabel}.`
                      : `Next suggested path: ${nextModuleLabel}.`}
                  </p>
                  <p className="text-[12px] theme-text-muted">
                    {lang === "ro"
                      ? "Pornește când ești gata — progresul tău se mută automat pe noul modul."
                      : "Start when you’re ready — your progress switches automatically to the new module."}
                  </p>
                </>
              ) : (
                <p className="text-[12px] theme-text-muted">
                  {lang === "ro"
                    ? "Poți alege alt modul OmniKuno sau poți relua lecțiile preferate din aplicație."
                    : "Pick another OmniKuno module or revisit any lesson you want from the app."}
                </p>
              )}
            </div>
          ) : activeLesson ? (
            <Link
              href={ctaHref}
              className="mt-3 flex items-center gap-3 rounded-2xl border px-2 py-2 transition hover:border-[var(--accent-main)] hover:bg-[color-mix(in_srgb,var(--accent-main)_10%,var(--bg-card))] hover:-translate-y-0.5"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                style={{
                  borderColor: activeAccent ?? "var(--accent-main)",
                  backgroundColor: activeBg,
                  color: activeAccent ?? "var(--accent-main)",
                }}
              >
                ▶
              </span>
              <div>
                <span className="text-[13px] uppercase tracking-[0.18em] text-[var(--omni-muted)]">
                  {lang === "ro"
                    ? activeLessonOrder
                      ? `${activeLessonOrder}. Lecție`
                      : "Lecție"
                    : activeLessonOrder
                      ? `Lesson ${activeLessonOrder}`
                      : "Lesson"}
                </span>
                <p className="mt-1.5 text-base font-bold text-[var(--omni-ink)] leading-tight tracking-[0.01em]">
                  {activeLesson.title}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] theme-text-soft">
                  {activeLesson.type === "quiz" ? (lang === "ro" ? "Quiz" : "Quiz") : ""}
                </p>
              </div>
            </Link>
          ) : (
            <p className="mt-2 text-[12px] theme-text-muted">
              {lang === "ro" ? "Nu avem momentan un pas activ." : "No active step right now."}
            </p>
          )}
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => router.push(ctaHref)}
            className="w-full rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] transition-all duration-200 ease-out transform hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(242,151,84,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--omni-energy)]"
            style={{
              borderColor: "color-mix(in srgb, var(--omni-energy) 78%, var(--omni-border-soft) 22%)",
              color: "color-mix(in srgb, var(--omni-energy) 92%, #5a2c06 8%)",
              backgroundImage:
                "linear-gradient(120deg, color-mix(in srgb, var(--omni-energy) 18%, transparent) 0%, color-mix(in srgb, var(--omni-energy) 5%, transparent) 100%)",
              boxShadow: "0 12px 28px rgba(242, 151, 84, 0.2)",
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </DashboardCard>
      <div className="mt-2 pl-1">
        <Link
          href={`/omni-kuno?area=${encodeURIComponent(missionData?.areaKey ?? "calm")}&module=${encodeURIComponent(missionData?.module.moduleId ?? "")}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.18em] text-[color-mix(in_srgb,var(--omni-muted)_70%,var(--accent-main)_30%)] transition hover:text-[var(--accent-main)]"
        >
          <span>{lang === "ro" ? "Vezi toate misiunile" : "View all missions"}</span>
          <svg viewBox="0 0 14 14" className="h-3 w-3">
            <path d="M4 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

type KunoMissionSummaryProps = {
  lang: string;
  focusLabel: string;
  omniCunoScore: number;
  scoreDelta: string | null;
  moduleCompleted: boolean;
  nextModuleLabel: string | null;
  xp: number;
  durationCopy: string | null;
  completedCount: number;
  totalLessons: number;
  progressPercent?: number | null;
};

function KunoMissionSummary({
  lang,
  focusLabel,
  omniCunoScore,
  scoreDelta,
  moduleCompleted,
  nextModuleLabel,
  xp,
  durationCopy,
  completedCount,
  totalLessons,
  progressPercent,
}: KunoMissionSummaryProps) {
  const focusHeadline =
    lang === "ro"
      ? `Acumulează cunoaștere în ${focusLabel}`
      : `Build knowledge in ${focusLabel}`;
  return (
    <div className="space-y-3 text-[var(--omni-ink)]">
      <div className="flex items-center justify-between gap-4 sm:gap-5" style={{ marginTop: "-10px" }}>
        <div className="flex-1">
          <p className="text-[8px] font-semibold uppercase tracking-[0.42em] text-[color-mix(in_srgb,var(--omni-muted)_55%,var(--omni-energy)_45%)]">
            Omni-Kuno
          </p>
          <p className="pb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {lang === "ro" ? "Misiunea de azi" : "Your mission today"}
          </p>
          <h3 className="text-base font-semibold text-[var(--omni-ink)] leading-tight">
            {focusHeadline}
          </h3>
        </div>
        <div className="ml-1 flex flex-col items-end gap-3 text-right" style={{ marginTop: "-10px", width: "96px" }}>
          <div className="flex items-baseline gap-1 text-right">
            <p className="text-sm font-semibold text-[color-mix(in_srgb,var(--omni-energy)_70%,var(--omni-ink)_30%)] leading-none">
              {omniCunoScore}
              {scoreDelta ? (
                <span className={`ml-1 text-[11px] ${scoreDelta.startsWith("+") ? "text-[#1F7A43]" : "text-[#B82B4F]"}`}>{scoreDelta}</span>
              ) : null}
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--omni-muted)_80%,var(--omni-ink-soft)_20%)]">XP</p>
          </div>
          {typeof progressPercent === "number" ? (
            <div className="hidden sm:flex pt-1" style={{ paddingTop: "10px" }}>
              <HoneyHex label="Kuno" value={Math.round(progressPercent)} size={72} />
            </div>
          ) : null}
        </div>
      </div>
      <p className="text-[12px] text-[var(--omni-muted)]">
        {moduleCompleted
          ? nextModuleLabel
            ? lang === "ro"
              ? `Următorul modul recomandat: ${nextModuleLabel}.`
              : `Next suggested module: ${nextModuleLabel}.`
            : lang === "ro"
              ? "Poți alege un nou modul OmniKuno pentru a continua ritmul."
              : "Pick another OmniKuno module to keep the cadence."
          : lang === "ro"
            ? `+${xp} XP estimate · ${durationCopy ?? "~5 min"}`
            : `+${xp} XP estimated · ${durationCopy ?? "~5 min"}`}
      </p>
    </div>
  );
}
