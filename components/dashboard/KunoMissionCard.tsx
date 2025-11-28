import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import InfoTooltip from "@/components/InfoTooltip";
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

  const statusLine = lang === "ro"
    ? `Lecții finalizate: ${completedCount}/${totalLessons}`
    : `Lessons completed: ${completedCount}/${totalLessons}`;

  const activeAccent =
    activeLesson?.type === "quiz" ? "var(--accent-main)" : "var(--accent-strong)";
  const activeBg = `color-mix(in srgb, ${activeAccent ?? "var(--accent-main)"} 12%, var(--bg-card))`;

  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <DashboardCard
        title="OmniKuno"
        subtitle={lang === "ro" ? "Misiunea ta de azi" : "Your mission today"}
        footer={
          <div className="flex flex-col gap-2">
            <span>{lang === "ro" ? statusLine : statusLine}</span>
            <button
              type="button"
              onClick={() => router.push(ctaHref)}
              className="w-full rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--accent-main)",
                backgroundColor: "color-mix(in srgb, var(--accent-main) 10%, transparent)",
              }}
            >
              {ctaLabel}
            </button>
          </div>
        }
      >
        <div data-testid="dashboard-kuno-card">
        <header
          className="rounded-2xl border px-3 py-3"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
        >
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--text-muted)" }}>
            <span
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: "color-mix(in srgb, var(--accent-main) 12%, var(--bg-card))", color: "var(--accent-main)" }}
            >
              OmniKuno
            </span>
            <span>{lang === "ro" ? "Misiunea ta de azi" : "Your mission today"}</span>
          </div>
          <p className="mt-2 text-[14px] font-semibold sm:text-base" style={{ color: "var(--text-main)" }}>
            {lang === "ro" ? "Acumulează cunoaștere pe tema" : "Accumulate knowledge on"}{" "}
            <span style={{ color: "var(--accent-main)" }}>· {focusLabel}</span>
          </p>
        </header>

        <div className="mt-3 rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", color: "var(--text-main)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] theme-text-muted">
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
              className="mt-3 flex items-center gap-3 rounded-2xl border px-2 py-2 transition"
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
                <p className="text-base font-semibold theme-text-main leading-tight">{activeLesson.title}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] theme-text-soft">
                  {activeLesson.type === "quiz" ? (lang === "ro" ? "Quiz" : "Quiz") : lang === "ro" ? "Lecție" : "Lesson"}
                </p>
              </div>
            </Link>
          ) : (
            <p className="mt-2 text-[12px] theme-text-muted">
              {lang === "ro" ? "Nu avem momentan un pas activ." : "No active step right now."}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Link
            href="/omni-kuno"
            className="inline-flex items-center text-[11px] font-semibold underline-offset-2 transition theme-link hover:underline"
          >
            {lang === "ro" ? "Vezi toate misiunile" : "View all missions"}
          </Link>
        </div>
        <div
          className="mt-5 rounded-2xl border px-4 py-3 text-sm theme-text-main"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] theme-text-muted">
                {lang === "ro" ? "Indicatori recenți" : "Recent indicators"}
              </p>
              <InfoTooltip
                items={[
                  lang === "ro"
                    ? "XP arată câți pași (lecții + quiz-uri) ai finalizat recent, iar scorul adaptiv arată calitatea și ritmul ultimelor sesiuni."
                    : "XP shows how many steps (lessons + quizzes) you completed recently, while the adaptive score reflects the quality and rhythm of your latest sessions.",
                ]}
                label={lang === "ro" ? "Detalii indicatori" : "Indicator details"}
              />
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[12px] theme-text-main">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold theme-text-muted">
                {lang === "ro" ? "XP (Pași finalizați)" : "XP (Steps completed)"}
              </p>
              <p className="text-[13px] font-semibold">{xp}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold theme-text-muted">
                {lang === "ro" ? "Scor adaptiv" : "Adaptive score"}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-[13px] font-semibold">{omniCunoScore}</p>
                {scoreDelta ? (
                  <p
                    className="text-[11px] font-semibold"
                    style={{ color: Number(kunoDelta) >= 0 ? "var(--success)" : "var(--danger)" }}
                  >
                    {lang === "ro" ? "Progres: " : "Progress: "}
                    {scoreDelta}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pb-5" />
        </div>
      </DashboardCard>
    </motion.div>
  );
}
