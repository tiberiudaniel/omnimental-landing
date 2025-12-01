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
import KunoMissionCard, { type KunoMissionCardData, type KunoNextModuleSuggestion } from "./KunoMissionCard";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import type { MissionSummary } from "@/lib/hooks/useMissionPerspective";
import { useEffect, useState } from "react";
import { OmniAbilCard } from "./OmniAbilCard";
import { SeasonCard } from "./SeasonCard";
import { buildOmniGuidance, type OmniDailySnapshot, type OmniGuidance } from "@/lib/omniState";
import { MissionPerspectiveCard } from "./MissionPerspectiveCard";
import { ReplayRecommendationCard } from "./ReplayRecommendationCard";
import { useReplayRecommendation } from "@/lib/hooks/useReplayRecommendation";
import { FEATURE_REPLAY_INTELLIGENCE } from "@/lib/featureFlags";

export type FocusThemeInfo = {
  area?: string | null;
  desc?: string | null;
  categoryKey?: string | null;
  moduleId?: OmniKunoModuleId | null;
};

type CenterColumnCardsProps = {
  showWelcome: boolean;
  hideOmniIntel?: boolean;
  debugGrid?: boolean;
  lang: string;
  t: ReturnType<typeof useI18n>["t"];
  facts: ProgressFact | null;
  omniIntelScore: number;
  omniIntelDelta: number | null;
  focusTheme: FocusThemeInfo;
  omniCunoScore: number;
  kunoDelta: number | null;
  kunoMissionData: KunoMissionCardData | null;
  kunoNextModuleSuggestion?: KunoNextModuleSuggestion | null;
  mission?: MissionSummary | null;
};

export default function CenterColumnCards({
  showWelcome,
  hideOmniIntel,
  debugGrid,
  lang,
  t,
  facts,
  omniIntelScore,
  omniIntelDelta,
  focusTheme,
  omniCunoScore,
  kunoDelta,
  kunoMissionData,
  kunoNextModuleSuggestion,
  mission,
}: CenterColumnCardsProps) {
  const [showFocusCard, setShowFocusCard] = useState(true);
  const langCode: "ro" | "en" = lang === "ro" ? "ro" : "en";
  const showReplayCard = FEATURE_REPLAY_INTELLIGENCE.enabled && FEATURE_REPLAY_INTELLIGENCE.recommendationCard;
  const { recommendation, loading: replayLoading, error: replayError } = useReplayRecommendation(showReplayCard);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowFocusCard(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div
      className={`order-1 flex h-full flex-col gap-2 md:col-span-1 md:order-2 md:gap-3 lg:gap-4 ${
        debugGrid ? "outline outline-1 outline-[var(--omni-energy-soft)]/40" : ""
      }`}
    >
      <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 md:gap-3 lg:grid-cols-2 lg:gap-3">
        {showWelcome ? <WelcomeCard lang={lang} t={t} facts={facts} /> : null}
        {hideOmniIntel ? null : (
          <OmniIntelCard lang={lang} t={t} omniIntelScore={omniIntelScore} omniIntelDelta={omniIntelDelta} />
        )}
        {showFocusCard ? <FocusThemeCard lang={lang} focusTheme={focusTheme} /> : null}
      </div>
      <div className="grid grid-cols-1 items-stretch gap-2 md:gap-3 lg:gap-3">
        {showReplayCard ? (
          <ReplayRecommendationCard
            lang={langCode}
            recommendation={recommendation}
            loading={replayLoading}
            error={replayError}
          />
        ) : null}
        <KunoMissionCard
          lang={lang}
          focusAreaLabel={focusTheme.area}
          omniCunoScore={omniCunoScore}
          kunoDelta={kunoDelta}
          missionData={kunoMissionData}
          nextModuleSuggestion={kunoNextModuleSuggestion}
        />
        <MissionPerspectiveCard mission={mission ?? null} />
        <OmniAbilCard lang={lang} />
        <SeasonCard lang={lang} facts={facts} />
      </div>
    </div>
  );
}

function WelcomeCard({ lang, t, facts }: { lang: string; t: ReturnType<typeof useI18n>["t"]; facts: ProgressFact | null }) {
  return (
    <motion.div variants={fadeDelayed(0.08)} {...hoverScale} className="h-full">
      <Card className="flex h-full flex-col rounded-xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-2 shadow-sm sm:p-3">
        <motion.h2
          key="welcome-text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
          className="mb-0.5 text-xs font-semibold text-[var(--omni-muted)] sm:mb-1 sm:text-sm"
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
      <Card className="flex h-full flex-col items-center justify-center rounded-xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-2 shadow-sm sm:p-3">
        <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--omni-muted)] sm:mb-1 sm:text-[10px]">
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
          <p className="text-xl font-bold text-[var(--omni-energy-soft)] sm:text-2xl">{omniIntelScore}</p>
          {omniIntelDelta != null && Number.isFinite(omniIntelDelta) ? (
            <span
              className={`text-[10px] font-semibold ${omniIntelDelta >= 0 ? "text-[#1F7A43]" : "text-[var(--omni-danger)]"}`}
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
        <p className="mt-0.5 text-center text-[10px] text-[var(--omni-muted)] sm:mt-1 sm:text-[11px]">
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
      <Card className="flex h-full flex-col gap-3 rounded-2xl border border-[#F0E8E0] bg-[var(--omni-surface-card)]/85 p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          <span className="rounded-full bg-[var(--omni-energy-tint)] px-2 py-0.5 text-[var(--omni-energy)]">
            {lang === "ro" ? "Tematica" : "Theme"}
          </span>
          <span>{lang === "ro" ? "în focus" : "in focus"}</span>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[var(--omni-ink)] sm:text-base">{focusTheme.area || (lang === "ro" ? "Nespecificat" : "Not set")}</p>
          <p className="mt-1 text-[11px] text-[var(--omni-muted)] sm:text-[13px]">{focusTheme.desc || (lang === "ro" ? "Alege o direcție prioritară pentru recomandări." : "Choose a priority focus to tailor recommendations.")}</p>
        </div>
      </Card>
    </motion.div>
  );
}

export function TodayGuidanceCard({
  lang,
  snapshot,
  facts,
}: {
  lang: string;
  snapshot: OmniDailySnapshot | null;
  facts: ProgressFact | null;
}) {
  type ActivityShape = { activityEvents?: Array<Record<string, unknown>> };
  const events = ((facts as ActivityShape | null)?.activityEvents ?? []) as Array<Record<string, unknown>>;
  const guidance = buildOmniGuidance({
    lang: lang === "ro" ? "ro" : "en",
    daily: snapshot,
    activityEvents: events,
  });
  const badgeMap: Record<OmniGuidance["badge"], { ro: string; en: string; cls: string }> = {
    focus: { ro: "FOCUS", en: "FOCUS", cls: "bg-[#ECF8F0] text-[#1F7A43]" },
    recovery: { ro: "RESET", en: "RESET", cls: "bg-[#FFF1ED] text-[#B8472B]" },
    light: { ro: "LIGHT", en: "LIGHT", cls: "bg-[#FFF7E8] text-[#B0660D]" },
    normal: { ro: "RITUAL", en: "CADENCE", cls: "bg-[#E9E4FF] text-[#5A3998]" },
  };
  const badge = badgeMap[guidance.badge];
  const altLinks = [
    { label: lang === "ro" ? "Mini OmniKuno" : "Mini OmniKuno", href: { pathname: "/antrenament", query: { tab: "oc" } } },
    {
      label: lang === "ro" ? "Jurnal ghidat" : "Guided journal",
      href: { pathname: "/progress", query: { open: "journal", tab: "NOTE_LIBERE" } },
    },
  ];
  return (
    <motion.div variants={fadeDelayed(0.2)} {...hoverScale}>
      <Card className="rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-3 shadow-sm sm:p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            <span className={`rounded-full px-2 py-0.5 ${badge.cls}`}>{lang === "ro" ? badge.ro : badge.en}</span>
            <span>{lang === "ro" ? "ghidaj de azi" : "today guidance"}</span>
          </div>
          <div className="space-y-2 rounded-2xl border border-[#E7DED3] bg-[var(--omni-surface-card)]/70 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)] sm:text-xs">
              {lang === "ro" ? "Recomandarea ta" : "Your recommendation"}
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight text-[var(--omni-ink)] sm:text-base">{guidance.title}</p>
              <p className="mt-1 text-[11px] text-[var(--omni-muted)] sm:text-[12px]">{guidance.description}</p>
            </div>
            <Link
              href={guidance.ctaHref}
              className="group flex items-center justify-between rounded-full bg-[var(--omni-energy)] px-5 py-2.5 text-white shadow-sm transition hover:bg-[var(--omni-energy-soft)]"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-[12px]">
                {guidance.ctaLabel}
              </span>
              <span className="text-[10px] opacity-80">↗</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/80 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              <span>{lang === "ro" ? "Variante rapide" : "Quick options"}</span>
              <span>~5 min</span>
            </div>
            <div className="space-y-1 text-[11px] text-[var(--omni-ink)] sm:text-xs">
              {altLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block rounded-[10px] border border-transparent px-2 py-1 transition hover:border-[var(--omni-border-soft)] hover:bg-[var(--omni-bg-paper)]"
                >
                  • {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
