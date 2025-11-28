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
import type { extractSessions } from "@/lib/progressAnalytics";
import KunoMissionCard, { type KunoMissionCardData, type KunoNextModuleSuggestion } from "./KunoMissionCard";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { buildOmniAbilSnapshot } from "./omniAbilSnapshot";
import { useEffect, useState } from "react";
import { OmniAbilCard } from "./OmniAbilCard";

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
}: CenterColumnCardsProps) {
  const [showFocusCard, setShowFocusCard] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowFocusCard(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);
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
        {showFocusCard ? <FocusThemeCard lang={lang} focusTheme={focusTheme} /> : null}
      </div>
      <div className="grid grid-cols-1 items-stretch gap-2 md:gap-3 lg:gap-3">
        <KunoMissionCard
          lang={lang}
          focusAreaLabel={focusTheme.area}
          omniCunoScore={omniCunoScore}
          kunoDelta={kunoDelta}
          missionData={kunoMissionData}
          nextModuleSuggestion={kunoNextModuleSuggestion}
        />
        <OmniAbilCard lang={lang} />
      </div>
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
      <Card className="flex h-full flex-col gap-3 rounded-2xl border border-[#F0E8E0] bg-white/85 p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B08A78]">
          <span className="rounded-full bg-[#FFF3EC] px-2 py-0.5 text-[#C07963]">
            {lang === "ro" ? "Tematica" : "Theme"}
          </span>
          <span>{lang === "ro" ? "în focus" : "in focus"}</span>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#2C2C2C] sm:text-base">{focusTheme.area || (lang === "ro" ? "Nespecificat" : "Not set")}</p>
          <p className="mt-1 text-[11px] text-[#7B6B60] sm:text-[13px]">{focusTheme.desc || (lang === "ro" ? "Alege o direcție prioritară pentru recomandări." : "Choose a priority focus to tailor recommendations.")}</p>
        </div>
      </Card>
    </motion.div>
  );
}

export function TodayGuidanceCard({
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
  const snapshot = buildOmniAbilSnapshot({ lang, facts, sessions, refMs, currentFocusTag, nowAnchor });
  return (
    <motion.div variants={fadeDelayed(0.2)} {...hoverScale}>
      <Card className="rounded-2xl border border-[#E4DAD1] bg-white p-3 shadow-sm sm:p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B08A78]">
            <span className="rounded-full bg-[#FFF3EC] px-2 py-0.5 text-[#C07963]">
              {lang === "ro" ? "Omni-Abil" : "Omni-Abil"}
            </span>
            <span>{lang === "ro" ? "acțiuni concrete" : "concrete actions"}</span>
          </div>
          <div className="space-y-2 rounded-2xl border border-[#E7DED3] bg-white/70 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B08A78] sm:text-xs">
              {lang === "ro" ? "Pasul principal" : "Primary step"}
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight text-[#2C2C2C] sm:text-base">{snapshot.primary.title}</p>
              <p className="mt-1 text-[11px] text-[#7B6B60] sm:text-[12px]">{snapshot.primaryDesc}</p>
            </div>
            <Link
              href={snapshot.primary.href}
              className="group flex items-center justify-between rounded-full bg-[#C07963] px-5 py-2.5 text-white shadow-sm transition hover:bg-[#A45E4F]"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-[12px]">
                {lang === "ro" ? "Începe acum" : "Start now"}
              </span>
              <span className="text-[10px] opacity-80">{snapshot.primary.dur}</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-dashed border-[#E4DAD1] bg-white/80 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A08F82]">
              <span>{lang === "ro" ? "Variante light" : "Light options"}</span>
              <span>~5 min</span>
            </div>
            <div className="space-y-1 text-[11px] text-[#2C2C2C] sm:text-xs">
              <Link
                href={{ pathname: "/antrenament", query: { tab: "oc" } }}
                className="block rounded-[10px] border border-transparent px-2 py-1 transition hover:border-[#E4DAD1] hover:bg-[#FFFBF7]"
              >
                • {snapshot.alt1}
              </Link>
              <Link
                href={{ pathname: "/progress", query: { open: "journal", tab: "NOTE_LIBERE" } }}
                className="block rounded-[10px] border border-transparent px-2 py-1 transition hover:border-[#E4DAD1] hover:bg-[#FFFBF7]"
              >
                • {snapshot.alt2}
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
