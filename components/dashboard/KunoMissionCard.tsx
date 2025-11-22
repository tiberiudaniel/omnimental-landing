import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
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

type KunoMissionCardProps = {
  lang: string;
  focusAreaLabel?: string | null;
  omniCunoScore: number;
  kunoDelta: number | null;
  missionData: KunoMissionCardData | null;
};

const XP_PER_LEVEL = 120;

export default function KunoMissionCard({ lang, focusAreaLabel, omniCunoScore, kunoDelta, missionData }: KunoMissionCardProps) {
  const timeline = useMemo(() => {
    if (!missionData) return [];
    return computeLessonsStatus(missionData.module.lessons, missionData.completedIds, missionData.performance);
  }, [missionData]);
  const completedCount = timeline.filter((item) => item.status === "done").length;
  const totalLessons = missionData?.module.lessons.length ?? 0;
  const xp = Math.max(0, missionData?.xp ?? 0);
  const missionModuleId = missionData?.module.moduleId as OmniKunoModuleId | undefined;
  const moduleLabel = missionModuleId ? getModuleLabel(missionModuleId, lang === "ro" ? "ro" : "en") : null;
  const focusLabel = focusAreaLabel ?? moduleLabel ?? (lang === "ro" ? "focusul tău" : "your focus theme");
  const activeLesson =
    timeline.find((item) => item.status === "active") ??
    timeline.find((item) => item.status !== "done") ??
    timeline[timeline.length - 1];
  const areaParam = missionData ? encodeURIComponent(missionData.areaKey) : "calm";
  const moduleQuery = missionData ? `&module=${encodeURIComponent(missionData.module.moduleId)}` : "";
  const lessonQuery = activeLesson ? `&lesson=${encodeURIComponent(activeLesson.id)}` : "";
  const ctaHref = missionData ? `/omni-kuno?area=${areaParam}${moduleQuery}${lessonQuery}` : "/omni-kuno";
  const startIndex = (() => {
    const idx = timeline.findIndex((item) => item.status !== "done");
    if (idx === -1) return Math.max(timeline.length - 3, 0);
    return Math.max(idx, 0);
  })();
  const missionsPreview = timeline.slice(startIndex, startIndex + 3);
  const scoreDelta =
    kunoDelta != null && Number.isFinite(kunoDelta)
      ? `${kunoDelta >= 0 ? "+" : ""}${Math.round(kunoDelta)}`
      : null;

  const statusLine = lang === "ro"
    ? `Lecții finalizate: ${completedCount}/${totalLessons} · XP: ${xp}`
    : `Lessons completed: ${completedCount}/${totalLessons} · XP: ${xp}`;

  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <Card
        className="rounded-2xl border border-[#E4DAD1] bg-[#FFFBF7] px-3 py-3 shadow-sm sm:px-4 sm:py-4"
        data-testid="dashboard-kuno-card"
      >
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold text-[#7B6B60] sm:text-sm">OmniKuno – {lang === "ro" ? "Misiunea ta de azi" : "Your mission today"}</p>
          <p className="text-sm font-semibold text-[#2C2C2C] sm:text-base">
            {lang === "ro" ? "Tema în focus" : "Focus theme"}: <span className="text-[#C07963]">· {focusLabel}</span>
          </p>
          <p className="text-[11px] text-[#6A6A6A] sm:text-[12px]">
            {lang === "ro"
              ? `Misiunea este să acumulezi cunoștințe pe ${moduleLabel ?? focusLabel}.`
              : `Your mission is to build knowledge on ${moduleLabel ?? focusLabel}.`}
          </p>
        </header>

        <div className="mt-3 rounded-2xl border border-dashed border-[#E4DAD1] bg-white/70 px-3 py-2 text-sm font-semibold text-[#2C2C2C]">
          {statusLine}
        </div>
        {activeLesson ? (
          <div className="mt-3 rounded-2xl border border-[#E4DAD1] bg-white px-3 py-2 text-sm text-[#4D3F36]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B08A78]">
              {lang === "ro" ? "Următorul pas recomandat" : "Next best step"}
            </p>
            <p className="mt-1 text-sm font-semibold text-[#2C2C2C]">{activeLesson.title}</p>
          </div>
        ) : null}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#7B6B60] sm:text-[12px]">
          <span>
            {lang === "ro" ? "Scor" : "Score"}: {omniCunoScore}
          </span>
          {scoreDelta ? (
            <span className={`font-semibold ${Number(kunoDelta) >= 0 ? "text-[#1F7A43]" : "text-[#B8000E]"}`}>{scoreDelta}</span>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          {missionsPreview.length ? (
            missionsPreview.map((mission) => (
              <div key={mission.id} className="flex items-start gap-3 rounded-2xl border border-[#F0E8E0] bg-white px-3 py-2">
                <span
                  className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                    mission.status === "done"
                      ? "border-[#1F7A43] bg-[#ECF8F0] text-[#1F7A43]"
                      : mission.status === "active"
                        ? "border-[#C07963] bg-[#FFF3EC] text-[#C07963]"
                        : "border-dashed border-[#D8C7B9] text-[#A08F82]"
                  }`}
                >
                  {mission.status === "done" ? "✓" : mission.status === "active" ? "▶" : "…"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2C2C2C]">{mission.title}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#A08F82]">
                    {mission.type === "quiz" ? (lang === "ro" ? "Quiz" : "Quiz") : lang === "ro" ? "Lecție" : "Lesson"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-[#7B6B60]">
              {lang === "ro" ? "Nu avem încă misiuni pentru această temă." : "No missions available for this focus yet."}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/omni-kuno"
            className="text-[11px] font-semibold text-[#7B6B60] underline-offset-2 transition hover:text-[#2C2C2C] hover:underline"
          >
            {lang === "ro" ? "Vezi toate misiunile" : "View all missions"}
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-[#2C2C2C] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#C07963]"
          >
            {lang === "ro" ? "Continuă misiunea OmniKuno" : "Continue OmniKuno mission"}
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
