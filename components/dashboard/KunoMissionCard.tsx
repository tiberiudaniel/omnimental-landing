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
};

export default function KunoMissionCard({
  lang,
  focusAreaLabel,
  omniCunoScore,
  kunoDelta,
  missionData,
  nextModuleSuggestion,
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

  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <DashboardCard
        className="px-4 py-3.5 sm:px-4 sm:py-4 max-w-[720px]"
        title={
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#F5EAE0] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B4634D]">
              OMNI-KUNO
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.25em] text-[#4D3F36]">
              {lang === "ro" ? "Misiunea ta de azi" : "Your mission today"}
            </span>
          </div>
        }
        subtitle={null}
        footer={
          <div className="flex flex-col gap-2">
            <div
              className="rounded-2xl border px-3 py-2 text-[11px]"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}
            >
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A8578]">
                    {lang === "ro" ? "Progres" : "Progress"}
                  </p>
                  <p className="text-[13px] font-semibold text-[var(--omni-ink)]">
                    {completedCount}/{totalLessons || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A8578]">XP</p>
                  <p className="text-[13px] font-semibold text-[var(--omni-ink)]">{xp}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A8578]">
                    {lang === "ro" ? "Scor" : "Score"}
                  </p>
                  <p className="text-[13px] font-semibold text-[var(--omni-ink)]">
                    {omniCunoScore}
                    {scoreDelta ? (
                      <span className={`ml-1 text-[11px] ${kunoDelta !== null && kunoDelta >= 0 ? "text-[#1F7A43]" : "text-[#B82B4F]"}`}>
                        {scoreDelta}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(ctaHref)}
              className="w-full rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition hover:translate-y-[-2px] hover:border-[var(--accent-main)] hover:bg-[color-mix(in_srgb,var(--accent-main)_18%,transparent)]"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--accent-main)",
                backgroundColor: "color-mix(in srgb, var(--accent-main) 10%, transparent)",
              }}
            >
              {ctaLabel}
            </button>
            {moduleCompleted ? (
              <p className="mt-2 text-[11px] text-[var(--omni-muted)]">
                {lang === "ro"
                  ? "Păstrează ritmul: completarea unui nou modul îți aduce un bonus suplimentar de XP."
                  : "Keep the cadence going—finishing another module unlocks a fresh XP bonus."}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-[var(--omni-muted)]">
                {lang === "ro"
                  ? `+${xp} XP estimate · ${durationCopy ?? "~5 min"}`
                  : `+${xp} XP estimated · ${durationCopy ?? "~5 min"}`}
              </p>
            )}
          </div>
        }
      >
        <div data-testid="dashboard-kuno-card">
          <div
            className="mt-2 space-y-1 rounded-2xl border bg-[var(--omni-surface-card)] px-3 py-2 shadow-sm"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9A8578]">
              {lang === "ro" ? "Acumulează cunoaștere pe" : "Build knowledge on"}
            </p>
            <p className="text-[15px] font-semibold leading-tight text-[var(--omni-ink)] sm:text-[16px]">
              {focusLabel}
            </p>
          </div>
        </div>
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
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--omni-muted)]">
                  {lang === "ro"
                    ? activeLessonOrder
                      ? `${activeLessonOrder}. Lecție`
                      : "Lecție"
                    : activeLessonOrder
                      ? `Lesson ${activeLessonOrder}`
                      : "Lesson"}
                </span>
                <p className="text-base font-semibold theme-text-main leading-tight">{activeLesson.title}</p>
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

        <div className="mt-1 flex flex-col items-center gap-2">
          <div className="w-full text-right">
            <Link
              href={`/omni-kuno?area=${encodeURIComponent(missionData?.areaKey ?? "calm")}&module=${encodeURIComponent(missionData?.module.moduleId ?? "")}`}
              className="inline-flex items-center text-[11px] font-semibold underline-offset-2 transition theme-link hover:underline"
            >
              {lang === "ro" ? "Vezi toate misiunile" : "View all missions"}
            </Link>
          </div>
        </div>
      </DashboardCard>
    </motion.div>
  );
}
