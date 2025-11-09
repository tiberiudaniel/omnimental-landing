"use client";

import { useMemo } from "react";
import TypewriterText from "./TypewriterText";
import CardOption from "./CardOption";
import { useI18n } from "./I18nProvider";
import type {
  BudgetPreference,
  ResolutionSpeed,
  GoalType,
  EmotionalState,
  FormatPreference,
} from "../lib/evaluation";
import type { DimensionScores } from "../lib/scoring";
import { determineLoadLevel, type LoadLevel } from "../lib/loadLevel";

export type RecommendationCardChoice = "individual" | "group";

type Props = {
  profile: { id: string } | null;
  showAccountPrompt: boolean;
  onAccountRequest: () => void;
  recommendationText: string;
  cardsHeadline: string;
  chooseOptionText: string;
  recommendedPath: RecommendationCardChoice;
  recommendedBadgeLabel?: string;
  onCardSelect: (type: RecommendationCardChoice) => Promise<void> | void;
  accountPromptMessage: string;
  accountPromptButton: string;
  cardLabels: Record<RecommendationCardChoice, string>;
  isSavingChoice: boolean;
  savingChoiceType: RecommendationCardChoice | null;
  errorMessage: string | null;
  savingLabel: string;
  categoryLabels: Record<string, string>;
  categories: Array<{ category: string; count: number }>;
  intentUrgency: number;
  resolutionSpeed: ResolutionSpeed;
  determination: number;
  timeCommitmentHours: number;
  budgetPreference: BudgetPreference;
  goalType: GoalType;
  emotionalState: EmotionalState;
  groupComfort: number;
  learnFromOthers: number;
  scheduleFit: number;
  formatPreference: FormatPreference;
  dimensionScores: DimensionScores;
  recommendationReasonKey: string;
};

const reasonLookup = {
  reason_high_urgency: {
    ro: "Este un context presant, iar progresul rapid cere atenție individuală.",
    en: "The situation feels urgent, so the fastest progress comes with individual focus.",
  },
  reason_relationships: {
    ro: "Subiectele de relații și limite se lucrează mai eficient într-o sesiune 1-la-1.",
    en: "Relationship and boundaries themes benefit from a 1:1 container.",
  },
  reason_performance_group: {
    ro: "Tema dominantă este performanța, iar grupul oferă ritm și responsabilitate.",
    en: "Performance is dominant and the group adds rhythm plus accountability.",
  },
  reason_low_urgency: {
    ro: "Nu e o urgență mare, așa că grupul oferă spațiu sigur și constant.",
    en: "There’s no high urgency, so the group provides steady support.",
  },
  reason_default: {
    ro: "Ținem cont de urgență, resurse și confort pentru a calibra recomandarea.",
    en: "We balance urgency, resources, and comfort to tune the recommendation.",
  },
} as const;

export function RecommendationStep(props: Props) {
  const {
    profile,
    showAccountPrompt,
    onAccountRequest,
    recommendationText,
    cardsHeadline,
    chooseOptionText,
    recommendedPath,
    recommendedBadgeLabel,
    onCardSelect,
    accountPromptMessage,
    accountPromptButton,
    cardLabels,
    isSavingChoice,
    savingChoiceType,
    errorMessage,
    savingLabel,
    categoryLabels,
    categories,
    intentUrgency,
    resolutionSpeed,
    determination,
    timeCommitmentHours,
    budgetPreference,
    goalType,
    emotionalState,
    groupComfort,
    learnFromOthers,
    scheduleFit,
    formatPreference,
    dimensionScores,
    recommendationReasonKey,
  } = props;

  const { t, lang } = useI18n();
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return typeof value === "string" ? value : fallback;
  };
  const summaryTitle = translate("intentSummaryResultTitle", "Rezumatul tău");
  const recommendationTitle = translate("intentSummaryResultSubtitle", "Recomandarea mea");
  const loadLevelsValue = t("intentSummaryLoadLevels");
  const loadLevels =
    loadLevelsValue && typeof loadLevelsValue === "object"
      ? (loadLevelsValue as Record<LoadLevel, { label: string; recommendation: string }>)
      : undefined;
  const primaryCta = translate(
    "intentSummaryPrimaryCta",
    lang === "ro" ? "Programează un call de 20 min" : "Book a 20-min call",
  );
  const secondaryCta = translate(
    "intentSummarySecondaryCta",
    lang === "ro" ? "Vezi detalii program OmniMental" : "See OmniMental program details",
  );
  const tertiaryCta = translate(
    "intentSummaryTertiaryCta",
    lang === "ro" ? "Prefer sesiuni individuale" : "I prefer individual sessions",
  );
  const benefitRow = translate(
    "intentSummaryBenefitRow",
    lang === "ro"
      ? "• plan clar • practici simple • progres măsurat la 3 săptămâni"
      : "• clear plan • simple practices • progress check at 3 weeks",
  );
  const disclaimer = translate(
    "intentSummaryDisclaimer",
    lang === "ro"
      ? "OmniMental este coaching, nu înlocuiește evaluarea medicală."
      : "OmniMental is coaching, not a medical replacement.",
  );

  const sortedCategories = [...categories]
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
  const primaryCategory = sortedCategories[0];
  const secondaryCategory = sortedCategories[1];
  const primaryLabel = primaryCategory ? categoryLabels[primaryCategory.category] ?? primaryCategory.category : "";
  const secondaryLabel = secondaryCategory ? categoryLabels[secondaryCategory.category] ?? secondaryCategory.category : "";

  const summaryIntro = lang === "ro" ? "Cele mai prezente teme:" : "Leading themes:";
  const labelJoiner = lang === "ro" ? " și " : " & ";
  const scoreSummary = primaryLabel
    ? `${summaryIntro} ${secondaryLabel ? `${primaryLabel}${labelJoiner}${secondaryLabel}` : primaryLabel}`
    : lang === "ro"
    ? "Completează selecțiile ca să vezi rezumatul."
    : "Select a few options to unlock the summary.";
  const insightFallback = translate(
    "intentSummaryInsightFallback",
    lang === "ro"
      ? "Recalibrează-ți ritmul intern și observă semnalele corpului înainte să apară blocajele."
      : "Stay close to your inner tempo and notice body cues before friction builds up.",
  );
  const insightsValue = t("intentSummaryCategoryInsights");
  const insights =
    insightsValue && typeof insightsValue === "object"
      ? (insightsValue as Record<string, string>)
      : {};
  const oneLiner = primaryCategory ? insights[primaryCategory.category] ?? insightFallback : insightFallback;

  const loadLevel = determineLoadLevel(intentUrgency);
  const loadLevelContent = loadLevels?.[loadLevel];
  const loadLevelLabel =
    loadLevelContent?.label ??
    (loadLevel === "high"
      ? lang === "ro"
        ? "Nivel de încărcare: Ridicat"
        : "Load level: High"
      : loadLevel === "low"
      ? lang === "ro"
        ? "Nivel de încărcare: Scăzut"
        : "Load level: Low"
      : lang === "ro"
      ? "Nivel de încărcare: Moderat"
      : "Load level: Moderate");

  const recommendationHeadline =
    recommendedPath === "individual"
      ? lang === "ro"
        ? "Recomandare: sesiuni individuale 1-la-1."
        : "Recommendation: individual sessions."
      : lang === "ro"
      ? "Recomandare: grupul online OmniMental."
      : "Recommendation: OmniMental group.";

  const primaryReason =
    reasonLookup[recommendationReasonKey as keyof typeof reasonLookup]?.[
      lang === "ro" ? "ro" : "en"
    ] ??
    (lang === "ro"
      ? "Ținem cont de urgență, resurse și confort pentru a ajusta formatul."
      : "We balance urgency, resources, and comfort to tailor the plan.");

  const localizedReasons = [
    primaryReason,
    lang === "ro"
      ? "Datele de mai jos (ritm, timp, buget) completează imaginea."
      : "The factors below (pace, time, budget) complete the picture.",
  ];

  const formatPreferenceLabel =
    formatPreference === "individual"
      ? lang === "ro"
        ? "Prefer individual"
        : "Prefers individual"
      : formatPreference === "group"
      ? lang === "ro"
        ? "Prefer grup"
        : "Prefers group"
      : lang === "ro"
      ? "Deschis(ă) la ambele"
      : "Open to both";

  const insightExtras = [
    `${lang === "ro" ? "Ritm dorit" : "Desired pace"}: ${
      resolutionSpeed === "days"
        ? lang === "ro"
          ? "zile"
          : "days"
        : resolutionSpeed === "weeks"
        ? lang === "ro"
          ? "săptămâni"
          : "weeks"
        : lang === "ro"
        ? "luni"
        : "months"
    }`,
    `${lang === "ro" ? "Hotărâre" : "Determination"}: ${determination}/5`,
    `${lang === "ro" ? "Timp săptămânal" : "Weekly time"}: ${timeCommitmentHours}h`,
    `${lang === "ro" ? "Buget" : "Budget"}: ${
      budgetPreference === "low"
        ? lang === "ro"
          ? "minim"
          : "minimal"
        : budgetPreference === "medium"
        ? lang === "ro"
          ? "mediu"
          : "medium"
        : lang === "ro"
        ? "maxim"
        : "maximum"
    }`,
    `${lang === "ro" ? "Tip obiectiv" : "Focus type"}: ${
      goalType === "single"
        ? lang === "ro"
          ? "O temă concretă"
          : "Single focus"
        : goalType === "few"
        ? lang === "ro"
          ? "2–3 zone legate"
          : "2–3 linked areas"
        : lang === "ro"
        ? "Reorganizare amplă"
        : "Broader re-organization"
    }`,
    `${lang === "ro" ? "Stare emoțională" : "Emotional state"}: ${
      emotionalState === "stable"
        ? lang === "ro"
          ? "Relativ stabilă"
          : "Fairly stable"
        : emotionalState === "fluctuating"
        ? lang === "ro"
          ? "Fluctuantă"
          : "Fluctuating"
        : lang === "ro"
        ? "Foarte instabilă"
        : "Highly unstable"
    }`,
    `${lang === "ro" ? "Preferință declarată" : "Stated preference"}: ${formatPreferenceLabel}`,
    `${lang === "ro" ? "Confort în grup" : "Group comfort"}: ${groupComfort}/10`,
    `${lang === "ro" ? "Învăț din alții" : "Learns from others"}: ${learnFromOthers}/10`,
    `${lang === "ro" ? "Potrivire program" : "Schedule fit"}: ${scheduleFit}/10`,
  ];

  const dimensionLabels: Record<keyof DimensionScores, { ro: string; en: string }> = {
    calm: { ro: "Calm", en: "Calm" },
    focus: { ro: "Claritate & focus", en: "Clarity & focus" },
    energy: { ro: "Energie", en: "Energy" },
    relationships: { ro: "Relații", en: "Relationships" },
    performance: { ro: "Performanță", en: "Performance" },
    health: { ro: "Corp & obiceiuri", en: "Body & habits" },
  };

  const dimensionEntries = useMemo(() => {
    const pairs = Object.entries(dimensionScores) as Array<[keyof DimensionScores, number]>;
    return pairs.sort((a, b) => b[1] - a[1]);
  }, [dimensionScores]);

  const maxDimensionValue = Math.max(
    1,
    ...dimensionEntries.map(([, value]) => value),
  );
  const hasDimensionData = dimensionEntries.some(([, value]) => value > 0);
  const dimensionTitle =
    lang === "ro" ? "Indicatori principali" : "Key indicators";
  const dimensionEmpty =
    lang === "ro"
      ? "Completează selecțiile pentru a vedea scorurile principale."
      : "Complete a few answers to see the main scores.";

  return (
    <section className="bg-[#FDFCF9] px-4 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{loadLevelLabel}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1F1F1F]">{summaryTitle}</h2>
          <p className="mt-1 text-sm text-[#5C4F45]">{scoreSummary}</p>
          {primaryLabel ? (
            <p className="mt-1 text-sm text-[#5C4F45]">
              {lang === "ro" ? "Aria principală:" : "Primary area:"} <strong>{primaryLabel}</strong>
            </p>
          ) : null}
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
            {recommendationTitle}
          </p>
          <p className="mt-2 text-base font-medium text-[#2C2C2C]">{recommendationHeadline}</p>
          <p className="mt-1 text-sm italic text-[#5C4F45]">{oneLiner}</p>
          <p className="mt-3 text-sm text-[#2C2C2C]">
            {loadLevelContent?.recommendation ??
              (lang === "ro"
                ? "Continuă în ritmul tău și caută ghidaj când simți că ritmul devine neclar."
                : "Keep your current pace and lean on guidance when things feel unclear.")}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-[#5C4F45]">
            {localizedReasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
              {dimensionTitle}
            </p>
            {hasDimensionData ? (
              <div className="mt-3 space-y-3">
                {dimensionEntries.map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#2C2C2C]">
                      <span>{dimensionLabels[key][lang === "ro" ? "ro" : "en"]}</span>
                      <span>{value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[#F2E8DF]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#2C2C2C] via-[#C24B17] to-[#E60012]"
                        style={{ width: `${Math.min(100, (value / maxDimensionValue) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#5C4F45]">{dimensionEmpty}</p>
            )}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 text-sm text-[#5C4F45] md:grid-cols-2">
            {insightExtras.map((item) => (
              <div key={item} className="rounded-[10px] bg-[#FDF1EF] px-3 py-2 text-xs font-medium text-[#2C2C2C]">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 text-center sm:flex-row sm:justify-start">
            <button
              type="button"
              onClick={onAccountRequest}
              className="inline-flex w-full max-w-[220px] items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
            >
              {primaryCta}
            </button>
            <a
              href="#sessions"
              className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:text-[#E60012]"
            >
              {secondaryCta}
            </a>
            <a
              href="#individual"
              className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82] transition hover:text-[#E60012]"
            >
              {tertiaryCta}
            </a>
          </div>
          <p className="mt-3 text-xs text-[#5C4F45]">{benefitRow}</p>
          <p className="mt-4 text-[11px] text-[#A08F82]">{disclaimer}</p>
        </div>

        <div className="flex-1 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 text-center shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
          {!profile && showAccountPrompt ? (
            <div className="mb-6 rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
              <p className="mb-3">{accountPromptMessage}</p>
              <button
                type="button"
                onClick={onAccountRequest}
                className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
              >
                {accountPromptButton}
              </button>
            </div>
          ) : null}
          {recommendationText ? (
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]">
              {recommendationText}
            </p>
          ) : null}
          <TypewriterText
            key={`choose-${cardsHeadline || "option"}`}
            text={cardsHeadline || chooseOptionText}
            speed={96}
            enableSound
          />

          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-4 md:flex-row md:gap-6">
            {(["individual", "group"] as const).map((type) => (
              <CardOption
                key={type}
                type={type}
                title={cardLabels[type]}
                onClick={() => {
                  void onCardSelect(type);
                }}
                isRecommended={recommendedPath === type}
                recommendedLabel={recommendedBadgeLabel}
                disabled={isSavingChoice}
                isLoading={isSavingChoice && savingChoiceType === type}
                loadingLabel={savingLabel}
              />
            ))}
          </div>
          {isSavingChoice ? (
            <p className="mt-4 text-xs text-[#2C2C2C]">{savingLabel}</p>
          ) : null}
          {errorMessage ? (
            <p className="mt-2 text-xs text-[#B8000E]">{errorMessage}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default RecommendationStep;
