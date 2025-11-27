"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FirstOfferPanel from "./recommendations/FirstOfferPanel";
import { choosePrimaryProduct } from "@/lib/primaryProduct";
import { useSearchParams } from "next/navigation";
import TypewriterText from "./TypewriterText";
import { useI18n } from "./I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { buildIndicatorSummary, INDICATOR_CHART_KEYS, INDICATOR_LABELS } from "@/lib/indicators";
import RadarIndicators from "./RadarIndicators";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
// removed detailed copy mapping for minimalist UI
import CTAButton from "./CTAButton";
import { useProfile } from "./ProfileProvider";
import { useProgressFacts } from "./useProgressFacts";
import { recordRecentEntry } from "@/lib/progressFacts";
import Toast from "./Toast";
import type {
  BudgetPreference,
  ResolutionSpeed,
  GoalType,
  EmotionalState,
  FormatPreference,
} from "../lib/evaluation";
// import { determineLoadLevel, type LoadLevel } from "../lib/loadLevel";
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


export function RecommendationStep(props: Props) {
  const {
    recommendation,
    showAccountPrompt,
    onAccountRequest,
    recommendedPath: recommendedPathProp,
    // recommendedBadgeLabel: recommendedBadgeLabelProp,
    onCardSelect,
    isSavingChoice,
    // savingChoiceType,
    errorMessage,
    savingLabel,
    categoryLabels,
    categories,
    intentUrgency,
    resolutionSpeed,
    // determination,
    // timeCommitmentHours,
    budgetPreference,
    // goalType,
    // emotionalState,
    // groupComfort,
    // learnFromOthers,
    // scheduleFit,
    // formatPreference,
    initialStatement,
  } = props;

  const { t, lang } = useI18n();
  const { profile: currentProfile } = useProfile();
  const { data: progressFacts } = useProgressFacts(currentProfile?.id);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const getCopy = (key: string, fallback: string) => getString(t, key, fallback);
  // Prefer unified recommendation object when provided
  const effectiveRecommendedPath = recommendation?.path ?? recommendedPathProp;
  // const effectiveReasonKey = recommendation?.reasonKey ?? recommendationReasonKeyProp;
  // badge not shown in this minimalist panel

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


  // Detailed copy now removed for minimal presentation
  const indicatorSummary = useMemo(() => buildIndicatorSummary(categories), [categories]);
  const summaryIndicators = indicatorSummary.shares;
  // chart and selection counts not shown in minimalist UI
  const topReflection = useMemo(() => {
    const pairs = INDICATOR_CHART_KEYS.map((k) => [k, Number(summaryIndicators[k] ?? 0)] as const);
    pairs.sort((a, b) => b[1] - a[1]);
    const top = pairs[0]?.[0];
    if (!top) return null;
    const mapToRoKey: Record<string, keyof typeof CATEGORY_LABELS> = {
      focus_clarity: "claritate",
      relationships_communication: "relatii",
      emotional_balance: "stres",
      energy_body: "echilibru",
      decision_discernment: "incredere",
      self_trust: "incredere",
      willpower_perseverance: "disciplina",
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

  // Friendlier recap copy
  const numberToWordsRO = (n: number) => {
    const map = ['unu','doi','trei','patru','cinci','șase','șapte','opt','nouă','zece'];
    return map[n - 1] ?? String(n);
  };
  const themesForText = summaryThemes.filter((t) => t && t !== mainAreaLabel);
  const pathLong = effectiveRecommendedPath === 'individual'
    ? (lang === 'ro' ? 'ședințe individuale' : 'individual sessions')
    : (lang === 'ro' ? 'grupul online' : 'the online group');
  const otherPath = effectiveRecommendedPath === 'individual'
    ? (lang === 'ro' ? 'grupul online' : 'the online group')
    : (lang === 'ro' ? 'ședințe individuale' : 'individual sessions');
  const summaryMessage: React.ReactNode = (() => {
    if (lang === 'ro') {
      const isPlural = effectiveRecommendedPath === 'individual';
      const verb = isPlural ? 'sunt' : 'e';
      const adj = isPlural ? 'potrivite' : 'potrivit';
      return (
        <>
          Se pare că prioritatea ta acum este <strong className="font-semibold text-[#2C2C2C]">{mainAreaLabel}</strong>.{' '}
          Simți o urgență de {numberToWordsRO(Math.max(1, Math.min(10, Math.round(intentUrgency))))} din zece să te ocupi de ea.{' '}
          Țintești rezultate în {pacePhrase}, cu un buget {budgetPhrase}.{' '}
          {themesForText.length ? (
            <>
              Direcția e susținută de {themesForText.join(' și ')}.{' '}
            </>
          ) : null}
          Potrivit ritmului și preferințelor tale, <strong className="font-semibold text-[#2C2C2C]">{pathLong}</strong> {verb} mai {adj} decât {otherPath}.
        </>
      );
    }
    // EN fallback
    return (
      <>
        Your priority now is <strong className="font-semibold text-[#2C2C2C]">{mainAreaLabel}</strong>.{' '}
        You feel a {Math.round(intentUrgency)}/10 urgency to address it.{' '}
        You aim for progress in {pacePhrase}, with a {budgetPhrase} budget.{' '}
        {themesForText.length ? (
          <>
            This direction is supported by {themesForText.join(' & ')}.{' '}
          </>
        ) : null}
        Given your pace and preferences, <strong className="font-semibold text-[#2C2C2C]">{pathLong}</strong> fits better than {otherPath}.
      </>
    );
  })();

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

  const cardsRef = useRef<HTMLDivElement | null>(null);
  const search = useSearchParams();
  const e2e = search?.get('e2e') === '1';
  // Quick clarity note (optional)
  const noteKey = 'omnimental_quick_clarity_note';
  const [quickNote, setQuickNote] = useState<string>('');
  const [noteSavedAt, setNoteSavedAt] = useState<number | null>(null);
  const [noteServerSaved, setNoteServerSaved] = useState(false);

  // Initial load is handled after mount; schedule state set to avoid sync setState in effect
  useEffect(() => {
    let tid: number | null = null;
    try {
      if (typeof window !== 'undefined') {
        const v = window.localStorage.getItem(noteKey);
        if (v) {
          tid = window.setTimeout(() => setQuickNote(v), 0);
        }
      }
    } catch {}
    return () => { if (tid) window.clearTimeout(tid); };
  }, []);

  const placeholderNote = lang === 'ro'
    ? 'Aș adăuga că …'
    : 'I’d add that …';
  useEffect(() => {
    if (e2e && cardsRef.current) {
      try {
        cardsRef.current.scrollIntoView({ behavior: 'instant', block: 'center' as ScrollLogicalPosition });
      } catch {}
    }
  }, [e2e]);

  // Local autosave for quick note (debounced)
  useEffect(() => {
    const h = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(noteKey, quickNote);
          setNoteSavedAt(Date.now());
        }
      } catch {}
    }, 500);
    return () => clearTimeout(h);
  }, [quickNote]);

  const handleAccountRequestClick = () => {
    console.log("[wizard] onAccountRequest clicked from RecommendationStep");
    onAccountRequest();
  };

  return (
    <section className="bg-[#FDFCF9] px-4 py-8" data-testid="recommendation-step">
      <div className="mx-auto max-w-5xl rounded-[20px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-4xl flex-col gap-5 text-center">
          {showAccountPrompt ? (
            <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-5 py-4 text-left text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
              <p className="text-base font-semibold text-[#1F1F1F]">
                {lang === "ro" ? "Salvează-ți progresul" : "Save your progress"}
              </p>
              <p className="mt-2 text-sm text-[#2C2C2C]/90">
                {lang === "ro"
                  ? "Ca să păstrăm testele și recomandările tale, ai nevoie de un cont OmniMental. Poți continua în trei moduri:"
                  : "To keep your tests and recommendations, you need an OmniMental account. You can continue in three ways:"}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#2C2C2C]">
                {lang === "ro" ? (
                  <>
                    <li>Conectare rapidă cu Google.</li>
                    <li>Primești un cod pe email și îl introduci în pagină (poate fi citit de pe orice device).</li>
                    <li>Email + parolă, dacă preferi această variantă.</li>
                  </>
                ) : (
                  <>
                    <li>Quick sign-in with Google.</li>
                    <li>Receive a code by email and type it here (you can read it from any device).</li>
                    <li>Email + password if you prefer the classic option.</li>
                  </>
                )}
              </ul>
              <button
                type="button"
                onClick={handleAccountRequestClick}
                className="mt-3 inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
              >
                {lang === "ro" ? "Mergi la autentificare" : "Go to sign-in"}
              </button>
            </div>
          ) : null}
          <div className="w-full flex justify-center">
            <div className="max-w-xl w-full text-left">
              <TypewriterText
                key={`summary-${lang}`}
                text={typewriterMessage}
                speed={96}
                enableSound
              />
            </div>
          </div>
          {(() => {
            const fromFacts = (progressFacts?.intent as unknown as { firstExpression?: string | null } | undefined)?.firstExpression ?? null;
            const visibleInitial = (initialStatement && initialStatement.trim()) || (fromFacts && String(fromFacts).trim()) || '';
            return visibleInitial ? (
            <p className="text-sm text-[#4A3A30]/80">
              {lang === "ro"
                ? `Ai început spunând: „${visibleInitial}”.`
                : `You opened by sharing: “${visibleInitial}.”`}
            </p>
            ) : null;
          })()}
          {/* Summary + Radar side by side */}
          <div className="mx-auto flex w-full max-w-4xl items-start gap-4 md:grid md:grid-cols-[220px_minmax(0,56ch)]">
            <div className="mx-auto w-[200px] md:w-[220px] shrink-0">
              <RadarIndicators
                data={INDICATOR_CHART_KEYS.map((k) => ({
                  key: k,
                  label: INDICATOR_LABELS[k][lang === 'en' ? 'en' : 'ro'],
                  value: Number(summaryIndicators[k] ?? 0),
                }))}
                maxValue={1}
                size="sm"
                showValues={false}
              />
            </div>
            <div className="w-full max-w-[56ch] rounded-[10px] border border-[#F5E7DA] bg-[#FFFBF7] px-4 py-3 text-left text-[14px] sm:text-[15px] leading-relaxed text-[#4A3A30]">
              {summaryMessage}
            </div>
          </div>

          {/* Optional quick clarity note (non-blocking) */}
          <p className="mx-auto w-full max-w-[60ch] text-[12px] text-[#7B6B60] mb-1">
            {lang === "ro"
              ? "Eu îți sugerez direcția; tu alegi pasul următor."
              : "I suggest the direction; you choose the next step."}
          </p>
          <div className="mx-auto mt-2 w-full max-w-[56ch] rounded-[12px] border border-[#E4D8CE] bg-white px-3 py-2 text-left">
            <textarea
              data-testid="quick-clarity-note"
              value={quickNote}
              onChange={(e) => {
                const v = e.target.value.slice(0, 200);
                setQuickNote(v);
                setNoteServerSaved(false);
              }}
              onBlur={async () => {
                const text = quickNote.trim();
                if (!text) return;
                // Save one lightweight entry for logged-in users
                try {
                  if (currentProfile?.id) {
                    await recordRecentEntry({
                      text,
                      timestamp: new Date(),
                      theme: 'clarity',
                      sourceBlock: 'quick_note',
                    });
                    setNoteServerSaved(true);
                    setToastMessage(lang === 'ro' ? 'Gata, am salvat ideea ta.' : 'Saved your note.');
                  }
                } catch {}
                if (!currentProfile?.id) {
                  setToastMessage(lang === 'ro' ? 'Salvat local.' : 'Saved locally.');
                }
              }}
              rows={2}
              placeholder={placeholderNote}
              className="w-full resize-none rounded-[10px] border border-[#E4D8CE] px-3 py-2 text-sm text-[#2C2C2C] placeholder:text-[#9F8E84] focus:border-[#C07963] focus:outline-none"
              maxLength={200}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#7B6B60]">
              <span>{quickNote.length}/200</span>
              <span>
                {noteServerSaved
                  ? (lang === 'ro' ? 'Salvat' : 'Saved')
                  : noteSavedAt
                  ? (lang === 'ro' ? 'Salvat local' : 'Saved locally')
                  : ''}
              </span>
            </div>
          </div>
          <div ref={cardsRef} className="mt-2">
            {(() => {
              const budget = budgetPreference; // already normalized enum
              const urgencyVal = intentUrgency;
              const primary = choosePrimaryProduct({ budget, urgency: urgencyVal });
              return <FirstOfferPanel primaryProduct={primary} lang={lang} />;
            })()}
          </div>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => { void onCardSelect(effectiveRecommendedPath); }}
              disabled={isSavingChoice}
              className="inline-flex items-center justify-center rounded-[12px] border border-[#2C2C2C] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
              data-testid="wizard-save-path"
            >
              {lang === "ro" ? "Salvează traseul și începe" : "Save this path and start"}
            </button>
          </div>
          {isSavingChoice ? (
            <p className="text-xs text-[#2C2C2C]">{savingLabel}</p>
          ) : null}
          {errorMessage ? (
            <p className="text-xs text-[#B8000E]">{errorMessage}</p>
          ) : null}

          {/* CTA către hub-ul de recomandări */}
          <div className="mt-2 flex justify-center">
            <Link
              href="/recommendation"
              className="text-[11px] text-[#7B6B60] underline hover:text-[#2C2C2C]"
              data-testid="wizard-to-recommendation-cta"
            >
              {lang === 'ro' ? 'Vezi hub‑ul tău de recomandări' : 'Open your recommendations hub'}
            </Link>
          </div>

          {topReflection ? (
            <div className="mx-auto mt-2 max-w-4xl rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-2.5 text-left text-[13px] text-[#2C2C2C]">
              {topReflection}
            </div>
          ) : null}
          <div className="mt-8 rounded-[18px] border border-[#E4D8CE] bg-[#FFFBF7] px-5 py-4.5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
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
