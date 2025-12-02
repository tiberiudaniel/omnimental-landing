import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { HoneyHex } from "@/components/mission-map/HoneyHex";
import InfoTooltip from "@/components/InfoTooltip";
import { fadeDelayed, hoverScale } from "@/components/dashboard/motionPresets";
import { getString } from "@/lib/i18nGetString";
import type { ProgressFact } from "@/lib/progressFacts";
import type { useI18n } from "@/components/I18nProvider";
import { formatUtcShort } from "@/lib/format";
import { toMsLocal } from "@/lib/dashboard/progressSelectors";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import type { MissionSummary } from "@/lib/hooks/useMissionPerspective";
import { useEffect, useState } from "react";
import { OmniAbilCard } from "./OmniAbilCard";
import { SeasonCard } from "./SeasonCard";
import { buildOmniGuidance, type OmniDailySnapshot, type OmniGuidance } from "@/lib/omniState";
import { MissionPerspectiveCard } from "./MissionPerspectiveCard";

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
  mission,
}: CenterColumnCardsProps) {
  const [showFocusCard, setShowFocusCard] = useState(true);
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
  const altLinks = [
    { label: lang === "ro" ? "Mini OmniKuno" : "Mini OmniKuno", href: { pathname: "/antrenament", query: { tab: "oc" } } },
    {
      label: lang === "ro" ? "Jurnal ghidat" : "Guided journal",
      href: { pathname: "/progress", query: { open: "journal", tab: "NOTE_LIBERE" } },
    },
  ];
  const xpScore = (() => {
    if (typeof guidance.xpEstimate === "number" && Number.isFinite(guidance.xpEstimate)) return guidance.xpEstimate;
    if (snapshot?.axes?.physicalEnergy != null) {
      return Math.round((snapshot.axes.physicalEnergy / 10) * 100);
    }
    return null;
  })();
  const honeyValue = (() => {
    if (snapshot?.axes?.emotionalBalance != null) {
      return Math.round((snapshot.axes.emotionalBalance / 10) * 100);
    }
    if (typeof xpScore === "number") {
      return xpScore;
    }
    return null;
  })();
  return (
    <motion.div variants={fadeDelayed(0.2)} {...hoverScale}>
      <DashboardCard className="h-full px-4 py-3.5 sm:px-4 sm:py-4" title={null} subtitle={null} footer={null} style={{ display: "flex", flexDirection: "column" }}>
        <div className="space-y-3 text-[var(--omni-ink)] flex-1">
          <div className="flex items-center justify-between gap-4 sm:gap-5" style={{ marginTop: "-10px" }}>
            <div className="flex-1">
              <p className="text-[8px] font-semibold uppercase tracking-[0.42em] text-[color-mix(in_srgb,var(--omni-muted)_55%,var(--omni-energy)_45%)]">
                {lang === "ro" ? "OMNI-ABIL" : "Omni-Abil"}
              </p>
              <p className="pb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {lang === "ro" ? "GHIDAJ DE AZI" : "TODAY GUIDANCE"}
              </p>
              <h3 className="text-base font-semibold text-[var(--omni-ink)] leading-tight">
                {lang === "ro" ? "Practică: Re-energizarea" : "Practice: Re-energize"}
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--omni-muted)]">{guidance.description}</p>
            </div>
            {typeof xpScore === "number" || typeof honeyValue === "number" ? (
              <div className="ml-1 flex flex-col items-end gap-3 text-right" style={{ marginTop: "-42px", width: "96px" }}>
                {typeof xpScore === "number" ? (
                  <div className="flex items-baseline gap-1 text-right">
                    <p className="text-sm font-semibold text-[color-mix(in_srgb,var(--omni-energy)_70%,var(--omni-ink)_30%)] leading-none">{xpScore}</p>
                    <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--omni-muted)_80%,var(--omni-ink-soft)_20%)]">XP</p>
                  </div>
                ) : null}
                {typeof honeyValue === "number" ? (
                  <div className="hidden sm:flex pt-1" style={{ paddingTop: "10px" }}>
                    <HoneyHex label="Abil" value={Math.max(0, Math.min(100, honeyValue))} size={72} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className="flex items-center gap-3 rounded-2xl border px-2 py-2"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)", minHeight: "76px" }}
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-lg font-semibold"
              style={{
                borderColor: "var(--accent-main)",
                backgroundColor: "color-mix(in srgb, var(--accent-main) 12%, transparent)",
                color: "var(--accent-main)",
              }}
              aria-hidden="true"
            >
              ≈
            </span>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
                {lang === "ro" ? "Recomandarea ta" : "Your recommendation"}
              </span>
              <p className="mt-1 text-base font-semibold text-[var(--omni-ink)] leading-tight">{guidance.title}</p>
            </div>
          </div>

          <Link
            href={guidance.ctaHref}
            className="inline-flex w-full items-center justify-center rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] transition-all duration-200 ease-out transform hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(242,151,84,0.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--omni-energy)]"
            style={{
              borderColor: "color-mix(in srgb, var(--omni-energy) 78%, var(--omni-border-soft) 22%)",
              color: "color-mix(in srgb, var(--omni-energy) 92%, #5a2c06 8%)",
              backgroundImage:
                "linear-gradient(120deg, color-mix(in srgb, var(--omni-energy) 18%, transparent) 0%, color-mix(in srgb, var(--omni-energy) 5%, transparent) 100%)",
              boxShadow: "0 12px 28px rgba(242, 151, 84, 0.2)",
            }}
          >
            {lang === "ro" ? "Pornește exercițiul" : "Start exercise"}
          </Link>

          <div className="rounded-2xl border border-dashed border-[color-mix(in srgb,var(--omni-border-soft)_70%,transparent)] bg-[var(--omni-surface-card)]/85 px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              <span>{lang === "ro" ? "Variante rapide" : "Quick options"}</span>
              <span>~5 min</span>
            </div>
            <div className="space-y-0.5 text-[12px] leading-snug text-[var(--omni-ink)]">
              {altLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block rounded-[12px] border border-transparent px-2 py-1 transition hover:border-[var(--omni-border-soft)] hover:bg-[var(--omni-bg-paper)]"
                >
                  • {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </DashboardCard>
    </motion.div>
  );
}
