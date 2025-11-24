import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
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

  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <Card
        className="rounded-2xl border border-[#E4DAD1] bg-[#FFFBF7] px-3 py-3 shadow-sm sm:px-4 sm:py-4"
        data-testid="dashboard-kuno-card"
      >
        <header className="rounded-2xl border border-[#F0E8E0] bg-white/85 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B08A78]">
            <span className="rounded-full bg-[#FFF3EC] px-2 py-0.5 text-[#C07963]">OmniKuno</span>
            <span>{lang === "ro" ? "Misiunea ta de azi" : "Your mission today"}</span>
          </div>
          <p className="mt-2 text-[14px] font-semibold text-[#2C2C2C] sm:text-base">
            {lang === "ro" ? "Acumulează cunoaștere pe tema" : "Accumulate knowledge on"}{" "}
            <span className="text-[#C07963]">· {focusLabel}</span>
          </p>
        </header>

        <div className="mt-1 text-right text-[12px] font-semibold text-[#7B6B60]">{statusLine}</div>
        <div className="mt-3 rounded-2xl border border-[#E4DAD1] bg-white px-4 py-4 text-sm text-[#4D3F36]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B08A78]">
            {moduleCompleted
              ? lang === "ro"
                ? "Modul finalizat"
                : "Module completed"
              : lang === "ro"
                ? "Următorul pas"
                : "Next step"}
          </p>
          {moduleCompleted ? (
            <div className="mt-3 space-y-2 text-sm text-[#4D3F36]">
              <p>
                {lang === "ro"
                  ? `Ai parcurs toate lecțiile pentru ${moduleLabel ?? "acest modul"}.`
                  : `You completed every lesson for ${moduleLabel ?? "this module"}.`}
              </p>
              {nextModuleLabel ? (
                <>
                  <p className="text-[13px] font-semibold text-[#2C2C2C]">
                    {lang === "ro"
                      ? `Următorul parcurs recomandat: ${nextModuleLabel}.`
                      : `Next suggested path: ${nextModuleLabel}.`}
                  </p>
                  <p className="text-[12px] text-[#7B6B60]">
                    {lang === "ro"
                      ? "Pornește când ești gata — progresul tău se mută automat pe noul modul."
                      : "Start when you’re ready — your progress switches automatically to the new module."}
                  </p>
                </>
              ) : (
                <p className="text-[12px] text-[#7B6B60]">
                  {lang === "ro"
                    ? "Poți alege alt modul OmniKuno sau poți relua lecțiile preferate din aplicație."
                    : "Pick another OmniKuno module or revisit any lesson you want from the app."}
                </p>
              )}
            </div>
          ) : activeLesson ? (
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                  activeLesson.type === "quiz"
                    ? "border-[#C07963] bg-[#FFF3EC] text-[#C07963]"
                    : "border-[#1F7A43] bg-[#ECF8F0] text-[#1F7A43]"
                }`}
              >
                ▶
              </span>
              <div>
                <p className="text-base font-semibold text-[#2C2C2C] leading-tight">{activeLesson.title}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#A08F82]">
                  {activeLesson.type === "quiz" ? (lang === "ro" ? "Quiz" : "Quiz") : lang === "ro" ? "Lecție" : "Lesson"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-[#7B6B60]">
              {lang === "ro" ? "Nu avem momentan un pas activ." : "No active step right now."}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Link
            href={ctaHref}
            className="inline-flex w-full max-w-sm items-center justify-start rounded-full bg-gradient-to-b from-[#C07963] to-[#B36654] px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_20px_rgba(192,121,99,0.3)] transition text-left hover:brightness-110 hover:shadow-[0_10px_22px_rgba(192,121,99,0.35)] active:translate-y-[1px]"
          >
            {ctaLabel}
          </Link>
          <Link
            href="/omni-kuno"
            className="inline-flex items-center text-[11px] font-semibold text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline"
          >
            {lang === "ro" ? "Vezi toate misiunile" : "View all missions"}
          </Link>
        </div>
        <div className="mt-5 rounded-2xl border border-[#E4DAD1] bg-white px-4 py-3 text-sm text-[#4D3F36]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B08A78]">
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
          <div className="mt-3 space-y-2 text-[12px] text-[#2C2C2C]">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-[#7B6B60]">
                {lang === "ro" ? "XP (Pași finalizați)" : "XP (Steps completed)"}
              </p>
              <p className="text-[13px] font-semibold">{xp}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold text-[#7B6B60]">
                {lang === "ro" ? "Scor adaptiv" : "Adaptive score"}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-[13px] font-semibold">{omniCunoScore}</p>
                {scoreDelta ? (
                  <p className={`text-[11px] font-semibold ${Number(kunoDelta) >= 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}`}>
                    {lang === "ro" ? "Progres: " : "Progress: "}
                    {scoreDelta}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pb-5" />
      </Card>
    </motion.div>
  );
}
