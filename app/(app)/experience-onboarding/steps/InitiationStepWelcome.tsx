"use client";

import { useMemo } from "react";
import Image from "next/image";
import Typewriter from "@/components/onboarding/Typewriter";
import { useI18n } from "@/components/I18nProvider";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import onboardingHero from "@/public/assets/onboarding-init-hero.jpg";

const ROADMAP_MARKERS = [
  { label: "Omni-Scop", left: "74%", top: "105%", scale: 1.2, fade: 0.65 },
  { label: "Omni-Kuno", left: "98%", top: "86%", scale: 1.1, fade: 0.58 },
  { label: "Omni-Abil", left: "85%", top: "66%", scale: 0.95, fade: 0.48 },
  { label: "Omni-Flex", left: "92%", top: "38%", scale: 0.78, fade: 0.35 },
  { label: "Omni-Intel", left: "84%", top: "22%", scale: 0.62, fade: 0.25 },
] as const;

function formatFocusLabel(raw: string, lang: "ro" | "en"): string {
  const lower = raw.trim().toLowerCase();
  const mapping: Record<string, keyof typeof CATEGORY_LABELS> = {
    claritate: "claritate",
    relatii: "relatii",
    relații: "relatii",
    stres: "stres",
    calm: "stres",
    "emotional balance": "stres",
    "emotional_balance": "stres",
    "echilibru emotional": "stres",
    incredere: "incredere",
    încredere: "incredere",
    echilibru: "echilibru",
  };
  const match = mapping[lower];
  if (match) {
    return lang === "ro" ? CATEGORY_LABELS[match].name.ro : CATEGORY_LABELS[match].name.en;
  }
  const cleaned = raw.replace(/[_-]+/g, " ").trim();
  return cleaned.length ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : raw;
}

function getFocusTheme(facts: ReturnType<typeof useProgressFacts>["data"], lang: "ro" | "en"): string {
  const fallback = lang === "ro" ? "tema ta în focus" : "your focus theme";
  const formatMaybe = (value?: string | null) => (value ? formatFocusLabel(value, lang) : undefined);

  const evalBlock = facts?.evaluation as { focusLabel?: string; mainAreaLabel?: string } | undefined;
  const recBlock = facts?.recommendation as { primaryAreaLabel?: string } | undefined;

  const fromEvaluation = formatMaybe(evalBlock?.focusLabel) ?? formatMaybe(evalBlock?.mainAreaLabel);
  if (fromEvaluation) return fromEvaluation;

  const fromRecommendation = formatMaybe(recBlock?.primaryAreaLabel);
  if (fromRecommendation) return fromRecommendation;

  const categories = facts?.intent?.categories;
  if (categories && categories.length > 0 && categories[0]?.category) {
    return formatFocusLabel(categories[0].category, lang);
  }
  const tags = facts?.intent?.tags;
  if (tags && tags.length > 0) return formatFocusLabel(tags[0], lang);
  const first = facts?.intent?.firstExpression;
  if (first && first.length > 0) return formatFocusLabel(first, lang);
  return fallback;
}

function getTooltipCopy(label: string, theme: string, lang: "ro" | "en"): string {
  const isRo = lang === "ro";
  switch (label) {
    case "Omni-Scop":
      return isRo
        ? `Se pare că ți-ai ales deja direcția-obiectivul: "${theme}".`
        : `You already clarified the direction: "${theme}".`;
    case "Omni-Kuno":
      return isRo
        ? `Acesta este următorul tău pas. Acumulează cât mai multe cunoștințe despre "${theme}".`
        : `This is your next step. Gather as much knowledge as you can about "${theme}".`;
    case "Omni-Abil":
      return isRo
        ? "În curând vei aplica cunoștințele pe care le vei dobândi."
        : "Soon you’ll apply the knowledge you’re collecting.";
    default:
      return isRo ? "Vei avea acces pe măsură ce progresezi." : "You’ll unlock these as you progress.";
  }
}

export default function InitiationStepWelcome({ onBegin }: { onBegin: () => void }) {
  const { lang } = useI18n();
  const normalizedLang: "ro" | "en" = lang === "en" ? "en" : "ro";
  const { profile } = useProfile();
  const { data: progressFacts } = useProgressFacts(profile?.id);
  const focusTheme = useMemo(() => getFocusTheme(progressFacts, normalizedLang), [progressFacts, normalizedLang]);
  return (
    <section className="px-4 py-6 md:px-8">
      <div className="w-full max-w-5xl mx-auto px-4">
        <div className="omni-card rounded-3xl p-6 md:p-8 mb-8 flex flex-col gap-8 text-center md:flex-row md:items-center md:text-left">
          <div className="order-1 flex flex-1 flex-col items-center text-center md:order-2 md:items-start md:text-left">
            <p
              className="text-xs uppercase tracking-[0.3em]"
              style={{ color: "var(--text-soft)" }}
            >
              {lang === "ro" ? "Inițiere OmniMental" : "OmniMental Initiation"}
            </p>
            <h1
              className="mt-3 text-3xl font-semibold leading-snug md:text-4xl"
              style={{ color: "var(--text-main)" }}
            >
              {lang === "ro" ? "Respiră, observă, începe." : "Breathe, observe, begin."}
            </h1>
            <div className="mt-4 min-h-[120px] max-w-xl" style={{ color: "var(--text-main)" }}>
              <Typewriter
                className="text-base leading-relaxed md:text-lg"
                text={
                  lang === "ro"
                    ? "Înainte de mini‑test și exerciții, intri într-un spațiu de focus. Îți arătăm pașii și ce urmează, apoi pornești în ritmul tău."
                    : "Before the mini-quiz and exercises, settle into a focused space. We’ll outline the path ahead and let you start at your own pace."
                }
              />
            </div>
            <div className="mt-6 flex flex-col items-center gap-4 md:flex-row md:justify-start">
              <button
                onClick={onBegin}
                data-testid="init-welcome-begin"
                className="omni-btn-ghost text-[12px] font-semibold uppercase tracking-[0.25em]"
              >
                {lang === "ro" ? "Intră în inițiere" : "Enter initiation"}
              </button>
              <p
                className="text-sm md:ml-4"
                style={{ color: "var(--text-muted)" }}
              >
                {lang === "ro"
                  ? "9 pași ghidați · aproximativ 12–15 minute."
                  : "9 guided steps · about 12–15 minutes."}
              </p>
            </div>
          </div>
          <div
            className="order-2 relative mx-auto inline-block max-w-[520px] rounded-[26px] border p-2 shadow-[0_30px_90px_rgba(15,10,4,0.25)] md:order-1"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
          >
          <Image
            src={onboardingHero}
            alt={lang === "ro" ? "Drum ilustrat spre soare" : "Illustrated path toward the sun"}
            width={1152}
            height={768}
            priority
            className="block rounded-[22px] object-contain"
            style={{ maxHeight: "80vh", width: "auto", height: "auto" }}
          />
          <div className="pointer-events-none absolute inset-4 overflow-visible">
            {ROADMAP_MARKERS.map((marker) => {
              const tooltip = getTooltipCopy(marker.label, focusTheme, normalizedLang);
              return (
                <div
                  key={marker.label}
                  className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{
                    left: marker.left,
                    top: marker.top,
                    opacity: marker.fade,
                    transform: `translate(-50%, -50%) scale(${marker.scale})`,
                  }}
                >
                  <div
                    className="peer pointer-events-auto flex items-center justify-center rounded-[10px] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] transition duration-200"
                    style={{
                      borderColor: "var(--border-strong)",
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-main)",
                      boxShadow:
                        marker.label === "Omni-Kuno"
                          ? "0 15px 35px rgba(0,0,0,0.45)"
                          : "0 10px 25px rgba(8,5,3,0.3)",
                      outline:
                        marker.label === "Omni-Kuno" ? `2px solid var(--accent-soft)` : undefined,
                    }}
                  >
                    {marker.label}
                  </div>
                  {marker.label === "Omni-Flex" || marker.label === "Omni-Intel" ? null : (
                    <div
                      className="pointer-events-none mt-2 w-60 rounded-[12px] border px-4 py-3 text-[12px] font-medium leading-snug opacity-0 transition duration-200 peer-hover:opacity-100 peer-focus-visible:opacity-100"
                      style={{
                        borderColor: "var(--border-strong)",
                        backgroundColor: "var(--bg-deep)",
                        color: "var(--text-on-deep)",
                      }}
                    >
                      {tooltip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </section>
  );
}
