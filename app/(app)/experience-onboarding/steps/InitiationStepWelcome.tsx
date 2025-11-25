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
  { label: "Omni-Scop", left: "54%", top: "105%", scale: 1.2, fade: 0.65 },
  { label: "Omni-Kuno", left: "78%", top: "86%", scale: 1.1, fade: 0.58 },
  { label: "Omni-Abil", left: "65%", top: "66%", scale: 0.95, fade: 0.48 },
  { label: "Omni-Flex", left: "72%", top: "38%", scale: 0.78, fade: 0.35 },
  { label: "Omni-Intel", left: "64%", top: "22%", scale: 0.62, fade: 0.25 },
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
    <section className="px-6 pt-4 pb-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <div className="relative inline-block rounded-[26px] border border-[#E6D7C8] bg-white p-2 shadow-[0_30px_90px_rgba(15,10,4,0.25)]">
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
                className={`peer pointer-events-auto flex items-center justify-center rounded-[10px] border border-black/30 bg-white/55 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#29160D] shadow-[0_10px_25px_rgba(8,5,3,0.3)] transition duration-200 hover:bg-white/80 hover:shadow-[0_0_28px_rgba(255,255,255,0.95)] ${marker.label === "Omni-Kuno" ? "shadow-[0_15px_35px_rgba(0,0,0,0.45)] ring-2 ring-[#FCE2D4]" : ""}`}
              >
                {marker.label}
              </div>
                  {marker.label === "Omni-Flex" || marker.label === "Omni-Intel" ? null : (
                    <div className="pointer-events-none mt-2 w-60 rounded-[12px] border border-black/20 bg-[#120806]/90 px-4 py-3 text-[12px] font-medium leading-snug text-white opacity-0 transition duration-200 peer-hover:opacity-100 peer-focus-visible:opacity-100">
                      {tooltip}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.45em] text-[#96705B]">
            {lang === "ro" ? "Inițiere OmniMental" : "OmniMental Initiation"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-snug text-[#2A140A] md:text-4xl">
            {lang === "ro" ? "Respiră, observă, începe." : "Breathe, observe, begin."}
          </h1>
          <div className="mt-4">
            <Typewriter
              className="text-base leading-relaxed text-[#3D1C10] md:text-lg"
              text={
                lang === "ro"
                  ? "Înainte de mini‑test și exerciții, intri într-un spațiu de focus. Îți arătăm pașii și ce urmează, apoi pornești în ritmul tău."
                  : "Before the mini-quiz and exercises, settle into a focused space. We’ll outline the path ahead and let you start at your own pace."
              }
            />
          </div>
          <div className="mt-6 flex flex-col items-center gap-4 md:flex-row md:justify-center">
            <button
              type="button"
              onClick={onBegin}
              className="inline-flex items-center justify-center rounded-full border border-[#C0937D] bg-white/90 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#5C2D1A] shadow-[0_10px_24px_rgba(92,45,26,0.25)] transition hover:bg-white hover:text-[#8A4B2E]"
            >
              {lang === "ro" ? "Intră în inițiere" : "Enter initiation"}
            </button>
            <p className="text-sm text-[#6A4A3A] md:ml-4">
              {lang === "ro"
                ? "10 pași ghidați · aproximativ 12–15 minute."
                : "10 guided steps · about 12–15 minutes."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
