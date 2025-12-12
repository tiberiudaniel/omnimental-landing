import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import type { OmniKunoModuleConfig } from "@/config/omniKunoLessons";
import { computeLessonsStatus } from "@/components/omniKuno/useKunoTimeline";
import type { KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { getModuleLabel, type OmniKunoModuleId } from "@/config/omniKunoModules";
import { HoneyHex } from "@/components/mission-map/HoneyHex";
import { designTokens } from "@/config/designTokens";
import { KunoCtaButton } from "@/components/ui/cta/KunoCtaButton";
import { adjustLightness, withAlpha } from "@/lib/colorUtils";

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

const kunoTone = designTokens.module.kuno;

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
  const lessonAccent = kunoTone.accent;
  const quizAccent = designTokens.brand.terracotta;
  const activeAccent = activeLesson?.type === "quiz" ? quizAccent : lessonAccent;
  const nextStepBorderColor = withAlpha(kunoTone.accent, 0.35);
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
    progressPercent,
    accentColor: lessonAccent,
    textColor: kunoTone.textMain,
    textSecondary: kunoTone.textSecondary,
  };

  return (
    <motion.div variants={fadeDelayed(0.12)} {...hoverScale}>
      <div
        className="rounded-card border px-4 py-5 shadow-card sm:px-6"
        style={{
          borderRadius: designTokens.components.card.radius,
          backgroundColor: designTokens.brand.cream,
          borderColor: withAlpha(kunoTone.accent, 0.18),
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.06)",
          color: kunoTone.textMain,
          minHeight: "400px",
        }}
      >
        <KunoMissionSummary {...summaryProps} />
        {moduleCompleted ? (
          <div
            className="mt-6 rounded-card border px-3 py-3 text-sm"
            style={{
              borderRadius: designTokens.components.card.radius,
              borderColor: withAlpha(kunoTone.accent, 0.2),
              backgroundColor: designTokens.ui.surface,
              color: kunoTone.textMain,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: kunoTone.textSecondary }}>
              {lang === "ro" ? "Modul finalizat" : "Module completed"}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                {lang === "ro"
                  ? `Ai parcurs toate lecțiile pentru ${moduleLabel ?? "acest modul"}.`
                  : `You completed every lesson for ${moduleLabel ?? "this module"}.`}
              </p>
              {nextModuleLabel ? (
                <>
                  <p className="text-[13px] font-semibold">
                    {lang === "ro"
                      ? `Următorul parcurs recomandat: ${nextModuleLabel}.`
                      : `Next suggested path: ${nextModuleLabel}.`}
                  </p>
                  <p className="text-[12px]" style={{ color: kunoTone.textSecondary }}>
                    {lang === "ro"
                      ? "Pornește când ești gata — progresul tău se mută automat pe noul modul."
                      : "Start when you’re ready — your progress switches automatically to the new module."}
                  </p>
                </>
              ) : (
                <p className="text-[12px]" style={{ color: kunoTone.textSecondary }}>
                  {lang === "ro"
                    ? "Poți alege alt modul OmniKuno sau poți relua lecțiile preferate din aplicație."
                    : "Pick another OmniKuno module or revisit any lesson you want from the app."}
                </p>
              )}
            </div>
          </div>
        ) : activeLesson ? (
          <Link
            href={ctaHref}
            className="mt-6 block rounded-card border px-3 py-3 transition hover:-translate-y-0.5"
            style={{
              borderRadius: designTokens.components.card.radius,
              borderColor: nextStepBorderColor,
              borderWidth: "1px",
              backgroundColor: designTokens.brand.beigeLight,
            }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: withAlpha(kunoTone.textSecondary, 0.9) }}>
              {lang === "ro" ? "Următorul pas" : "Next step"}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: activeAccent,
                  backgroundColor: withAlpha(activeAccent, 0.12),
                }}
                aria-hidden="true"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke={activeAccent} strokeWidth="1.5" fill="none" />
                  <path
                    d="M8 6.5L14 10L8 13.5V6.5Z"
                    fill={activeAccent}
                    stroke={activeAccent}
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div>
                <span className="text-[13px] uppercase tracking-[0.18em]" style={{ color: kunoTone.textSecondary }}>
                  {lang === "ro"
                    ? activeLessonOrder
                      ? `${activeLessonOrder}. Lecție`
                      : "Lecție"
                    : activeLessonOrder
                      ? `Lesson ${activeLessonOrder}`
                      : "Lesson"}
                </span>
                <p className="mt-1.5 text-base font-bold leading-tight tracking-[0.01em]">{activeLesson.title}</p>
                <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: kunoTone.textSecondary }}>
                  {activeLesson.type === "quiz" ? (lang === "ro" ? "Quiz" : "Quiz") : ""}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div
            className="mt-6 rounded-card border px-3 py-3"
            style={{
              borderRadius: designTokens.components.card.radius,
              borderColor: withAlpha(kunoTone.accent, 0.2),
              backgroundColor: designTokens.ui.surface,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: kunoTone.textSecondary }}>
              {lang === "ro" ? "Următorul pas" : "Next step"}
            </p>
            <p className="mt-2 text-[12px]" style={{ color: kunoTone.textSecondary }}>
              {lang === "ro" ? "Nu avem momentan un pas activ." : "No active step right now."}
            </p>
          </div>
        )}

        <div className="mt-4 flex">
          <div className="w-[88%] max-w-sm">
            <KunoCtaButton
              onClick={() => router.push(ctaHref)}
              style={{
                backgroundImage: "none",
                backgroundColor: adjustLightness(kunoTone.accent, -6),
                color: designTokens.brand.cream,
                paddingTop: "14px",
                paddingBottom: "14px",
              }}
              className="rounded-[32px] px-8 py-3 text-[14px] font-medium tracking-wide"
            >
              {ctaLabel}
            </KunoCtaButton>
          </div>
        </div>
      </div>
      <div className="mt-2 pl-1">
        <Link
          href={`/omni-kuno?area=${encodeURIComponent(missionData?.areaKey ?? "calm")}&module=${encodeURIComponent(missionData?.module.moduleId ?? "")}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.18em] transition hover:text-kunoAccent"
          style={{ color: withAlpha(kunoTone.accent, 0.8) }}
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
  progressPercent?: number | null;
  accentColor?: string;
  textColor?: string;
  textSecondary?: string;
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
  progressPercent,
  accentColor,
  textColor,
  textSecondary,
}: KunoMissionSummaryProps) {
  const focusPrefix = lang === "ro" ? "Acumulează cunoaștere în " : "Build knowledge in ";
  const focusName = focusLabel;
  const microBenefit =
    lang === "ro"
      ? "Cunoașterea îți dă direcție clară. De aici încolo e mai ușor."
      : "Knowledge gives you clarity. From here, every step gets easier.";
  const detailLine =
    lang === "ro"
      ? `+${xp} XP estimate · ${durationCopy ?? "~5 min"}`
      : `+${xp} XP estimate · ${durationCopy ?? "~5 min"}`;
  const accent = accentColor ?? designTokens.module.kuno.accent;
  const textPrimary = textColor ?? designTokens.ui.text.primary;
  const secondaryColor = textSecondary ?? designTokens.ui.text.secondary;
  const mutedColor = withAlpha(textPrimary, 0.55);
  const positiveColor = designTokens.brand.oliveSoft;
  const negativeColor = designTokens.brand.terracotta;
  return (
    <div className="space-y-2.5" style={{ color: textPrimary }}>
      <div className="flex items-start justify-between gap-3 sm:gap-4" style={{ marginTop: "-6px" }}>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-textMuted">Omni-Kuno</p>
          <p className="pb-3 text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: mutedColor }}>
            {lang === "ro" ? "Misiunea de azi" : "Your mission today"}
          </p>
          <div>
            <h3
              className="font-bold"
              style={{ fontSize: designTokens.typography.size.xl, fontWeight: 700, lineHeight: 1.2, color: textPrimary }}
            >
              {focusPrefix}
              <span style={{ color: accent }}>{focusName}</span>
            </h3>
            <p className="mt-3 text-[15px] font-normal leading-relaxed text-textSecondary" style={{ color: secondaryColor, width: "100%", maxWidth: "620px" }}>
              {microBenefit}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: withAlpha(accent, 0.7) }}>
              {detailLine}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 pt-2 sm:pr-1" style={{ minWidth: "78px" }}>
          <div className="flex items-baseline gap-1 text-right">
            <p className="text-sm font-semibold leading-none" style={{ color: withAlpha(accent, 0.85) }}>
              {omniCunoScore}
              {scoreDelta ? (
                <span
                  className="ml-1 text-[11px]"
                  style={{ color: scoreDelta.startsWith("+") ? positiveColor : negativeColor }}
                >
                  {scoreDelta}
                </span>
              ) : null}
            </p>
            <p className="text-[9px] font-medium uppercase tracking-[0.3em]" style={{ color: withAlpha(textPrimary, 0.6) }}>
              XP
            </p>
          </div>
          {typeof progressPercent === "number" ? (
            <div className="hidden sm:flex pt-1">
              <HoneyHex label="Kuno" value={Math.round(progressPercent)} size={66} id="kuno-mission-summary" />
            </div>
          ) : null}
        </div>
      </div>
      {moduleCompleted ? (
        <p className="text-[12px]" style={{ color: secondaryColor }}>
          {nextModuleLabel
            ? lang === "ro"
              ? `Următorul modul recomandat: ${nextModuleLabel}.`
              : `Next suggested module: ${nextModuleLabel}.`
            : lang === "ro"
              ? "Poți alege un nou modul OmniKuno pentru a continua ritmul."
              : "Pick another OmniKuno module to keep the cadence."}
        </p>
      ) : null}
    </div>
  );
}
