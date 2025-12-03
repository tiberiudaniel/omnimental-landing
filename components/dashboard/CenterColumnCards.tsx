import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
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
import { designTokens } from "@/config/designTokens";
import { AbilButton } from "@/components/ui/CTA/AbilButton";
import { adjustLightness, withAlpha } from "@/lib/colorUtils";
import { useRouter } from "next/navigation";
import { OmniAbilCard } from "./OmniAbilCard";
import { SeasonCard } from "./SeasonCard";
import { buildOmniGuidance, type OmniDailySnapshot } from "@/lib/omniState";
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
        debugGrid ? "outline outline-1 outline-kuno/40" : ""
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
      <Card className="flex h-full flex-col border border-border bg-surface p-2 sm:p-3">
        <motion.h2
          key="welcome-text"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
          className="mb-0.5 text-xs font-semibold text-textMuted sm:mb-1 sm:text-sm"
        >
          {getString(
            t,
            "dashboard.welcomeBack",
            lang === "ro" ? "Bine ai revenit" : "Welcome back",
          )}
        </motion.h2>
        <p className="text-[11px] text-textSecondary sm:text-xs">
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
  const accentColor = designTokens.brand.goldSoft;
  const positiveColor = designTokens.brand.oliveSoft;
  const negativeColor = designTokens.brand.terracotta;
  return (
    <motion.div variants={fadeDelayed(0.1)} {...hoverScale} className="h-full">
      <Card className="flex h-full flex-col items-center justify-center border border-border bg-surface p-2 sm:p-3">
        <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-textMuted sm:mb-1 sm:text-[10px]">
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
          <p className="text-xl font-bold sm:text-2xl" style={{ color: accentColor }}>
            {omniIntelScore}
          </p>
          {omniIntelDelta != null && Number.isFinite(omniIntelDelta) ? (
            <span
              className="text-[10px] font-semibold"
              style={{ color: omniIntelDelta >= 0 ? positiveColor : negativeColor }}
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
        <p className="mt-0.5 text-center text-[10px] text-textSecondary sm:mt-1 sm:text-[11px]">
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
  const chipBg = designTokens.brand.sand;
  const chipText = designTokens.brand.brownDark;
  return (
    <motion.div variants={fadeDelayed(0.11)} {...hoverScale} className="h-full md:col-span-2">
      <Card className="flex h-full flex-col gap-3 border border-border bg-surface/90 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-textMuted">
          <span
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: chipBg, color: chipText }}
          >
            {lang === "ro" ? "Tematica" : "Theme"}
          </span>
          <span>{lang === "ro" ? "în focus" : "in focus"}</span>
        </div>
        <div>
          <p className="text-[14px] font-semibold text-textMain sm:text-base">
            {focusTheme.area || (lang === "ro" ? "Nespecificat" : "Not set")}
          </p>
          <p className="mt-1 text-[11px] text-textSecondary sm:text-[13px]">
            {focusTheme.desc || (lang === "ro" ? "Alege o direcție prioritară pentru recomandări." : "Choose a priority focus to tailor recommendations.")}
          </p>
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
  const router = useRouter();
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
  const seeAllLink = altLinks[0];
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
  const abilTone = designTokens.module.abil;
  const textPrimary = abilTone.textMain;
  const textSecondary = abilTone.textSecondary;
  const textMuted = withAlpha(textPrimary, 0.65);
  const accentColor = abilTone.accent;
  const cardBackground = designTokens.brand.cream;
  const cardBorder = withAlpha(accentColor, 0.18);
  const capsuleBorder = withAlpha(accentColor, 0.18);
  const capsuleBg = designTokens.ui.surface;
  const badgeBg = withAlpha(accentColor, 0.12);
  const badgeBorder = withAlpha(accentColor, 0.3);
  const quickLinkBorder = withAlpha(accentColor, 0.22);
  const ctaHref = (() => {
    if (!guidance.ctaHref) return "/progress";
    if (typeof guidance.ctaHref === "string") return guidance.ctaHref;
    const params = new URLSearchParams();
    Object.entries(guidance.ctaHref.query ?? {}).forEach(([key, value]) => {
      if (value == null) return;
      params.set(key, String(value));
    });
    const qs = params.toString();
    return qs.length ? `${guidance.ctaHref.pathname}?${qs}` : guidance.ctaHref.pathname;
  })();
  return (
    <motion.div variants={fadeDelayed(0.2)} {...hoverScale}>
      <div
        className="flex h-full flex-col rounded-card border px-8 py-5 shadow-soft"
        style={{
          borderRadius: designTokens.components.card.radius,
          backgroundColor: cardBackground,
          borderColor: cardBorder,
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.06)",
          color: textPrimary,
          minHeight: "400px",
        }}
      >
        <div className="flex flex-1 flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-textMuted">
                {lang === "ro" ? "OMNI-ABIL" : "Omni-Abil"}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: textMuted }}>
                {lang === "ro" ? "GHIDAJ DE AZI" : "TODAY GUIDANCE"}
              </p>
              <div className="mt-3 space-y-2">
                <h3
                  className="font-bold"
                  style={{ fontSize: designTokens.typography.size.xl, fontWeight: 700, lineHeight: 1.2 }}
                >
                  {lang === "ro" ? "Practică: Re-energizarea" : "Practice: Re-energize"}
                </h3>
                <p className="text-[15px] font-normal leading-relaxed text-textSecondary" style={{ color: textSecondary }}>
                  {lang === "ro"
                    ? "Revitalizează-ți energia cu un reset scurt și ghidat."
                    : "Boost your energy with a quick guided reset."}
                </p>
                {typeof guidance.xpEstimate === "number" ? (
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: withAlpha(accentColor, 0.85) }}>
                    {lang === "ro" ? `+${guidance.xpEstimate} XP estimat` : `+${guidance.xpEstimate} XP estimate`}
                  </p>
                ) : null}
              </div>
            </div>
            {typeof xpScore === "number" || typeof honeyValue === "number" ? (
              <div className="ml-2 flex flex-shrink-0 flex-col items-start gap-3 pt-2 sm:ml-0">
                {typeof xpScore === "number" ? (
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-semibold" style={{ color: withAlpha(accentColor, 0.9) }}>
                      {xpScore}
                    </p>
                    <p className="text-[9px] font-medium uppercase tracking-[0.3em]" style={{ color: textMuted }}>
                      XP
                    </p>
                  </div>
                ) : null}
                {typeof honeyValue === "number" ? (
                  <div className="hidden pt-1 sm:flex">
                    <HoneyHex label="Abil" value={Math.max(0, Math.min(100, honeyValue))} size={66} id="abil-guidance" />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className="mt-4 flex flex-col gap-2 rounded-card border px-3 py-3"
            style={{
              borderRadius: designTokens.components.card.radius,
              borderColor: capsuleBorder,
              backgroundColor: capsuleBg,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border"
                style={{ borderColor: badgeBorder, backgroundColor: badgeBg }}
                aria-hidden="true"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 8c1.5-1.5 2.5-1.5 4 0s2.5 1.5 4 0 2.5-1.5 4 0"
                    stroke={accentColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 12c1.5 1.5 2.5 1.5 4 0s2.5-1.5 4 0 2.5 1.5 4 0"
                    stroke={accentColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: textMuted }}>
                  {lang === "ro" ? "Recomandarea ta" : "Your recommendation"}
                </span>
                <p className="mt-1 text-base font-semibold leading-tight">{guidance.title}</p>
              </div>
            </div>
            <p className="text-[13px]" style={{ color: textSecondary }}>
              {guidance.description}
            </p>
          </div>

          <div className="pt-1">
            <AbilButton
              onClick={() => router.push(ctaHref)}
              className="rounded-[32px] px-8 py-3 text-[14px] font-medium tracking-wide"
              style={{
                backgroundImage: "none",
                backgroundColor: adjustLightness(abilTone.accent, -6),
                color: designTokens.brand.cream,
              }}
            >
              {lang === "ro" ? "Pornește exercițiul" : "Start exercise"}
            </AbilButton>
          </div>

          <div className="pt-2">
            <div
              className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: withAlpha(textPrimary, 0.75) }}
            >
              <span>{lang === "ro" ? "Variante rapide" : "Quick options"}</span>
              {seeAllLink ? (
                <Link
                  href={seeAllLink.href}
                  className="inline-flex items-center gap-1 transition hover:-translate-y-0.5"
                  style={{ color: withAlpha(accentColor, 0.85) }}
                >
                  <span>{lang === "ro" ? "Vezi toate" : "See all"}</span>
                  <svg viewBox="0 0 14 14" className="h-3 w-3">
                    <path d="M4 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {altLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-cta border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:-translate-y-0.5"
                  style={{
                    borderColor: quickLinkBorder,
                    color: withAlpha(accentColor, 0.85),
                    backgroundColor: designTokens.ui.surface,
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
