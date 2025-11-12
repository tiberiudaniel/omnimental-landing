"use client";

import { useMemo, useState } from "react";
import TypewriterText from "./TypewriterText";
import CardOption from "./CardOption";
import { useI18n } from "./I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { RecommendationSummary } from "@/components/RecommendationSummary";
import { buildIndicatorSummary, INDICATOR_CHART_KEYS } from "@/lib/indicators";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { getRecommendationReasonCopy } from "@/lib/recommendationCopy";
import CTAButton from "./CTAButton";
import { useProfile } from "./ProfileProvider";
import { useProgressFacts } from "./useProgressFacts";
import { recordRecommendationProgressFact } from "@/lib/progressFacts";
import { areWritesDisabled } from "@/lib/firebase";
import { serverTimestamp } from "firebase/firestore";
import Toast from "./Toast";
import type {
  BudgetPreference,
  ResolutionSpeed,
  GoalType,
  EmotionalState,
  FormatPreference,
} from "../lib/evaluation";
import { determineLoadLevel, type LoadLevel } from "../lib/loadLevel";
import type { DimensionScores } from "@/lib/scoring";

export type RecommendationCardChoice = "individual" | "group";

type Props = {
  // unified recommendation object (preferred)
  recommendation?: {
    path: "group" | "individual";
    reasonKey: string;
    badgeLabel?: string;
    formatPreference?: "online" | "hybrid";
    dimensionScores?: DimensionScores;
    algoVersion: string;
  };
  profile: { id: string } | null;
  showAccountPrompt: boolean;
  onAccountRequest: () => void;
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
  recommendationReasonKey: string;
  initialStatement?: string | null;
  // New wiring props
  dimensionScores?: DimensionScores;
  algoVersion?: string;
};

const paceLabel = (lang: string, speed: ResolutionSpeed) => {
  if (speed === "days") {
    return lang === "ro" ? "câteva zile" : "a few days";
  }
  if (speed === "weeks") {
    return lang === "ro" ? "câteva săptămâni" : "a few weeks";
  }
  return lang === "ro" ? "câteva luni" : "a few months";
};

const budgetLabel = (lang: string, budget: BudgetPreference) => {
  if (budget === "low") {
    return lang === "ro" ? "minim" : "minimal";
  }
  if (budget === "medium") {
    return lang === "ro" ? "mediu" : "medium";
  }
  return lang === "ro" ? "maxim" : "maximum";
};

const buildSummaryMessage = ({
  lang,
  mainArea,
  urgency,
  pace,
  budget,
  themes,
}: {
  lang: string;
  mainArea: string;
  urgency: number;
  pace: string;
  budget: string;
  themes: string[];
}) => {
  const themesText =
    themes.length > 1
      ? themes.join(lang === "ro" ? " și " : " & ")
      : themes[0] ?? (lang === "ro" ? "temele selectate" : "selected themes");
  if (lang === "ro") {
    return `Aria principală importantă pentru tine acum este ${mainArea}, simți o urgență de ${urgency}/10 și vrei să lucrezi în ${pace} cu un buget ${budget}, în timp ce temele ${themesText} susțin această direcție.`;
  }
  return `Your main focus right now is ${mainArea}; you feel an urgency of ${urgency}/10 and want to work over ${pace} with a ${budget} budget, while ${themesText} support this direction.`;
};

export function RecommendationStep(props: Props) {
  const {
    recommendation,
    profile,
    showAccountPrompt,
    onAccountRequest,
    recommendedPath: recommendedPathProp,
    recommendedBadgeLabel: recommendedBadgeLabelProp,
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
    recommendationReasonKey: recommendationReasonKeyProp,
    initialStatement,
  } = props;

  const { t, lang } = useI18n();
  const { profile: currentProfile } = useProfile();
  const { data: progressFacts } = useProgressFacts(currentProfile?.id);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const getCopy = (key: string, fallback: string) => getString(t, key, fallback);
  // Prefer unified recommendation object when provided
  const effectiveRecommendedPath = recommendation?.path ?? recommendedPathProp;
  const effectiveReasonKey = recommendation?.reasonKey ?? recommendationReasonKeyProp;
  const effectiveBadge = recommendation?.badgeLabel ?? recommendedBadgeLabelProp;
  const loadLevelsValue = t("intentSummaryLoadLevels");
  const loadLevels =
    loadLevelsValue && typeof loadLevelsValue === "object"
      ? (loadLevelsValue as Record<LoadLevel, { label: string; recommendation: string }>)
      : undefined;

  const sortedCategories = [...categories]
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
  const primaryCategory = sortedCategories[0];
  const secondaryCategory = sortedCategories[1];
  const primaryLabel = primaryCategory ? categoryLabels[primaryCategory.category] ?? primaryCategory.category : "";
  const secondaryLabel = secondaryCategory ? categoryLabels[secondaryCategory.category] ?? secondaryCategory.category : "";
  const fallbackTheme = lang === "ro" ? "claritate și echilibru" : "clarity & balance";
  const summaryThemes =
    primaryLabel != null && primaryLabel.length > 0
      ? [primaryLabel, secondaryLabel].filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        )
      : [fallbackTheme];
  const mainAreaLabel = primaryLabel && primaryLabel.length > 0 ? primaryLabel : fallbackTheme;

  const loadLevel = determineLoadLevel(intentUrgency);
  const loadLevelContent = loadLevels?.[loadLevel];

  const recommendationHeadline = effectiveRecommendedPath === "individual"
    ? getCopy("recommendationHeadlineIndividual", lang === "ro" ? "Recomandare: sesiuni individuale 1-la-1." : "Recommendation: individual sessions.")
    : getCopy("recommendationHeadlineGroup", lang === "ro" ? "Recomandare: grupul online OmniMental." : "Recommendation: OmniMental group.");
  const recommendationBodyText =
    loadLevelContent?.recommendation ??
    (lang === "ro"
      ? "Continuă în ritmul tău și caută ghidaj când simți că ritmul devine neclar."
      : "Keep your current pace and lean on guidance when things feel unclear.");

  const primaryReason = getRecommendationReasonCopy(
    effectiveReasonKey,
    lang === "ro" ? "ro" : "en",
  );

  const localizedReasons = [
    primaryReason,
    getCopy(
      "recommendationFactorsNote",
      lang === "ro"
        ? "Datele de mai jos (ritm, timp, buget) completează imaginea."
        : "The factors below (pace, time, budget) complete the picture.",
    ),
  ];

  const goalTypeText =
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
      : "Broader re-organization";

  const emotionalStateText =
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
      : "Highly unstable";

  const budgetLevelForSummary: "min" | "medium" | "max" =
    budgetPreference === "low" ? "min" : budgetPreference === "medium" ? "medium" : "max";

  const prefersIndividual = formatPreference === "individual";
  const indicatorSummary = useMemo(() => buildIndicatorSummary(categories), [categories]);
  const summaryIndicators = indicatorSummary.shares;
  const summaryCounts = indicatorSummary.chart;
  const selectionTotal = useMemo(() => categories.reduce((s, e) => s + (Number(e.count) || 0), 0), [categories]);
  const topReflection = useMemo(() => {
    const pairs = INDICATOR_CHART_KEYS.map((k) => [k, Number(summaryIndicators[k] ?? 0)] as const);
    pairs.sort((a, b) => b[1] - a[1]);
    const top = pairs[0]?.[0];
    if (!top) return null;
    const mapToRoKey: Record<string, keyof typeof CATEGORY_LABELS> = {
      clarity: "claritate",
      relationships: "relatii",
      calm: "stres",
      energy: "echilibru",
      performance: "incredere",
    };
    const roKey = mapToRoKey[top];
    const item = roKey ? CATEGORY_LABELS[roKey] : undefined;
    if (!item) return null;
    const copy = lang === "ro" ? item.reflection?.ro : item.reflection?.en;
    return copy ?? null;
  }, [lang, summaryIndicators]);

  const pacePhrase = paceLabel(lang, resolutionSpeed);
  const budgetPhrase = budgetLabel(lang, budgetPreference);
  const typewriterMessage =
    lang === "ro"
      ? "Uite recomandarea mea, luând în calcul situația și dorințele tale."
      : "Here’s my recommendation, based on your situation and priorities.";

  const summaryMessage = buildSummaryMessage({
    lang,
    mainArea: mainAreaLabel,
    urgency: intentUrgency,
    pace: pacePhrase,
    budget: budgetPhrase,
    themes: summaryThemes,
  });

  const followUpTitle = getCopy(
    "recommendationFollowUpTitle",
    lang === "ro" ? "Primește rezumatul pe email" : "Get the recap via email",
  );
  const followUpBody = getCopy(
    "recommendationFollowUpBody",
    lang === "ro"
      ? "Îți trimitem recomandarea și un micro-plan pentru următoarele 24h."
      : "We’ll send the recommendation plus a micro plan for the next 24h.",
  );
  const followUpButton = getCopy(
    "recommendationFollowUpButton",
    lang === "ro" ? "Trimite-mi rezumatul" : "Email me the recap",
  );
  const followUpHint = getCopy(
    "recommendationFollowUpHint",
    lang === "ro"
      ? "Un singur email. Poți răspunde oricând."
      : "One email only. Reply whenever you need.",
  );
  const followUpDialogTitle = getCopy(
    "recommendationFollowUpDialogTitle",
    lang === "ro" ? "Trimite rezumatul pe email" : "Send me the recap",
  );
  const followUpDialogDescription = getCopy(
    "recommendationFollowUpDialogDescription",
    lang === "ro"
      ? "Primești rezumatul, indicatorii și următorii pași în câteva minute."
      : "Get the summary, indicators, and next steps in minutes.",
  );
  const followUpSuccess = getCopy(
    "recommendationFollowUpSuccess",
    lang === "ro"
      ? "Gata. Rezumatul ajunge în inbox imediat."
      : "Done. The recap is already on its way.",
  );
  const followUpSubmit = getCopy(
    "recommendationFollowUpSubmit",
    lang === "ro" ? "Trimite rezumatul" : "Send recap",
  );

  return (
    <section className="bg-[#FDFCF9] px-4 py-12">
      <div className="mx-auto max-w-5xl rounded-[20px] border border-[#E4D8CE] bg-white px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 text-center">
          {!profile && showAccountPrompt ? (
            <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
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
          <TypewriterText
            key={`summary-${lang}`}
            text={typewriterMessage}
            speed={96}
            enableSound
          />
          {initialStatement && initialStatement.trim().length > 0 ? (
            <p className="text-sm text-[#4A3A30]/80">
              {lang === "ro"
                ? `Ai început spunând: „${initialStatement.trim()}”.`
                : `You opened by sharing: “${initialStatement.trim()}.”`}
            </p>
          ) : null}
          {/* Summary sentence placed immediately after the initial statement */}
          <p className="text-sm text-[#4A3A30]">{summaryMessage}</p>
          <p className="text-sm text-[#4A3A30]">
            {lang === "ro"
              ? "Alege formatul cu care vrei să continui acum."
              : "Pick the format you want to continue with right now."}
          </p>
          <div className="mt-2 flex w-full flex-col items-center justify-center gap-6 md:flex-row md:items-stretch md:gap-8">
          {(["individual", "group"] as const).map((type) => (
            <div key={type} className="w-full max-w-sm md:max-w-none">
                  <CardOption
                    type={type}
                    title={cardLabels[type]}
                    onClick={() => {
                      const algo = props.algoVersion ?? "v1.2";
                    const dim: DimensionScores | undefined = recommendation?.dimensionScores ?? props.dimensionScores ?? undefined;
                    const fmt = recommendation?.formatPreference ?? props.formatPreference ?? undefined;
                      if (!areWritesDisabled()) {
                        void recordRecommendationProgressFact({
                          path: type,
                          reasonKey: effectiveReasonKey,
                          selectedPath: type,
                          dimensionScores: dim ?? null,
                          algoVersion: algo,
                          formatPreference: (fmt as string | null) ?? null,
                          badgeLabel: effectiveBadge ?? null,
                          selectedAt: serverTimestamp(),
                        });
                        setToastMessage(
                          typeof t("recommendation.choiceSaved") === "string"
                            ? (t("recommendation.choiceSaved") as string)
                            : lang === "ro"
                            ? "Alegerea a fost salvată."
                            : "Your choice has been saved.",
                        );
                      } else {
                        console.info("Writes disabled in development");
                        setToastMessage(
                          lang === "ro" ? "Mod demo: alegerea a fost reținută local." : "Demo mode: choice noted locally.",
                        );
                      }
                      void onCardSelect(type);
                    }}
                isRecommended={effectiveRecommendedPath === type}
                recommendedLabel={effectiveBadge}
                isSelected={progressFacts?.recommendation?.selectedPath === type}
                disabled={isSavingChoice}
                isLoading={isSavingChoice && savingChoiceType === type}
                loadingLabel={savingLabel}
              />
            </div>
            ))}
          </div>
          {isSavingChoice ? (
            <p className="text-xs text-[#2C2C2C]">{savingLabel}</p>
          ) : null}
          {errorMessage ? (
            <p className="text-xs text-[#B8000E]">{errorMessage}</p>
          ) : null}

          <RecommendationSummary
            variant="embedded"
            loadLevel={loadLevel}
            primaryThemes={summaryThemes}
            mainArea={mainAreaLabel}
            mainRecommendationTitle={recommendationHeadline}
            mainRecommendationText={recommendationBodyText}
            reasoningBullets={localizedReasons}
            indicators={summaryIndicators}
            indicatorCounts={summaryCounts}
            selectionTotal={selectionTotal}
            speed={resolutionSpeed}
            commitment={determination}
            weeklyTimeHours={timeCommitmentHours}
            budgetLevel={budgetLevelForSummary}
            goalType={goalTypeText}
            emotionalState={emotionalStateText}
            prefersIndividual={prefersIndividual}
            groupComfort={groupComfort}
            learnsFromOthers={learnFromOthers}
            programFit={scheduleFit}
            onBookCall={onAccountRequest}
            language={lang === "en" ? "en" : "ro"}
          />
          {topReflection ? (
            <div className="mx-auto mt-2 max-w-4xl rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-left text-[13px] text-[#2C2C2C]">
              {topReflection}
            </div>
          ) : null}
          <div className="mt-10 rounded-[18px] border border-[#E4D8CE] bg-[#FFFBF7] px-5 py-5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-[#2C2C2C]">{followUpTitle}</p>
                <p className="mt-1 text-sm text-[#4A3A30]/80">{followUpBody}</p>
              </div>
              <CTAButton
                text={followUpButton}
                dialogTitle={followUpDialogTitle}
                dialogDescription={followUpDialogDescription}
                successMessage={followUpSuccess}
                submitLabel={followUpSubmit}
              />
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
              {followUpHint}
            </p>
          </div>
        </div>
      </div>
      {toastMessage ? (
        <div className="pointer-events-none fixed left-0 right-0 bottom-4 z-50 mx-auto max-w-sm px-3">
          <Toast message={toastMessage} okLabel="OK" onClose={() => setToastMessage(null)} />
        </div>
      ) : null}
    </section>
  );

}

export default RecommendationStep;
