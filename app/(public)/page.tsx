"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// removed unused local step components
import { useI18n } from "@/components/I18nProvider";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import type { IntentCloudResult } from "@/components/IntentCloud";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useWizardSteps, type WizardStepId } from "@/components/useWizardSteps";
import { useWizardData } from "@/components/useWizardData";
import { WizardProgress } from "@/components/WizardProgress";
import WizardRouter from "@/components/WizardRouter";
import { clearWizardState } from "@/components/wizardStorage";
import { areWritesDisabled, getDb } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import Toast from "@/components/Toast";
import { recordWizardReset, recordWizardResetCanceled, recordWizardResetNoticeDismissed } from "@/lib/progressFacts";
import { useProgressFacts } from "@/components/useProgressFacts";
// Types imported previously for local step wrappers; no longer needed here
// import type { GoalType, EmotionalState, ResolutionSpeed, BudgetPreference } from "@/lib/evaluation";
// import type { IntentPrimaryCategory } from "@/lib/intentExpressions";
import { computeDimensionScores } from "@/lib/scoring";
import type { DimensionScores } from "@/lib/scoring";
import { recommendSession, type SessionType } from "@/lib/recommendation";
import { saveRecommendationCache, readRecommendationCache, updateSelectedPath } from "@/lib/recommendationCache";
// duplicate import cleanup
import { generateAdaptiveIntentCloudWords } from "@/lib/intentExpressions";
import { CATEGORY_LABELS } from "@/lib/categoryLabels";
import { useWindowWidth } from "@/lib/useWindowSize";
import { useTStrings } from "@/components/useTStrings";
// import { getString as i18nGetString } from "@/lib/i18nGetString";

const MIN_INTENT_SELECTIONS = 5;
const MAX_INTENT_SELECTIONS = 7;

function computeResumeStep(progress: ReturnType<typeof useProgressFacts>["data"] | null): WizardStepId {
  if (!progress) return "firstInput";
  const hasIntent = Boolean(progress.intent && progress.intent.firstExpression);
  const hasCloud =
    Boolean(progress.intent && Array.isArray(progress.intent.categories) && progress.intent.categories.length > 0);
  const hasMotivation = Boolean(progress.motivation);
  const hasChoice = Boolean(progress.recommendation && (progress.recommendation.selectedPath || progress.recommendation.suggestedPath));

  if (!hasIntent) return "firstInput";
  if (!hasCloud) return "intent";
  if (!hasMotivation) return "intentMotivation";
  if (!hasChoice) return "cards";
  return "details";
}

function PageContent() {
  const { t, lang } = useI18n();
  const { s } = useTStrings();
  const { profile } = useProfile();
  const { step, goToStep } = useWizardSteps();
  const [menuOpen, setMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const returnTo = searchParams?.get("returnTo");
  const { data: progress } = useProgressFacts(profile?.id);

  const {
    journalEntry,
    firstIntentCategory,
    firstIntentExpression,
    intentCategories,
    intentUrgency,
    setIntentUrgency,
    selectedCard,
    showAccountPrompt,
    saveError,
    isSavingIntentSnapshot,
    isSavingJourney,
    journeySavingChoice,
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
    handleFirstInputSubmit: submitFirstInput,
    handleIntentComplete: recordIntentSelection,
    handleIntentSummaryComplete: persistIntentSnapshot,
    handleCardSelect: persistJourneyChoice,
    dismissAccountPrompt,
    resetError,
    setResolutionSpeed,
    setDetermination,
    setTimeCommitmentHours,
    setBudgetPreference,
    setGoalType,
    setEmotionalState,
    setGroupComfort,
    setLearnFromOthers,
    setScheduleFit,
  } = useWizardData({ lang, profileId: profile?.id ?? null });

  const cachedReco = useMemo(() => {
    try {
      const stepParam = searchParams?.get('step');
      if (stepParam === 'cards') return readRecommendationCache();
    } catch {}
    return null;
  }, [searchParams]);
  const [dimensionScores, setDimensionScores] = useState<DimensionScores>(() => (
    (cachedReco?.dimensionScores as DimensionScores | undefined) ?? {
      calm: 0,
      focus: 0,
      energy: 0,
      relationships: 0,
      performance: 0,
      health: 0,
    }
  ));
  const [recommendedPath, setRecommendedPath] = useState<SessionType>(() => (cachedReco?.recommendation?.path as SessionType | undefined) ?? "group");
  const [recommendationReasonKey, setRecommendationReasonKey] =
    useState<string>(() => cachedReco?.recommendation?.reasonKey ?? "reason_default");
  const viewportWidth = useWindowWidth();
  const cloudWordCount = useMemo(() => {
    if (viewportWidth === 0) return 25;
    if (viewportWidth < 640) return 18;
    if (viewportWidth < 1024) return 22;
    return 25;
  }, [viewportWidth]);

  const adaptiveCloudWords = useMemo(
    () =>
      generateAdaptiveIntentCloudWords({
        locale: lang === "en" ? "en" : "ro",
        primaryCategory: firstIntentCategory ?? undefined,
        total: cloudWordCount,
        // Exclude the exact curated expression id if present so it doesn't reappear in cloud
        excludeIds: firstIntentExpression ? [firstIntentExpression] : [],
      }),
    [cloudWordCount, firstIntentCategory, firstIntentExpression, lang],
  );

  const adaptiveCloudKey = useMemo(
    () => adaptiveCloudWords.map((word) => word.id).join("|"),
    [adaptiveCloudWords],
  );

  // No set-state-in-effect for cache restore: initialize state lazily above

  useEffect(() => {
    if (!progress) return;
    const completed =
      Boolean(progress.intent) &&
      Boolean(progress.evaluation) &&
      Boolean(progress.recommendation && (progress.recommendation.selectedPath || progress.recommendation.suggestedPath));
    if (completed) {
      router.replace("/omniscop");
    }
  }, [progress, router]);

  useEffect(() => {
    if (searchParams?.get("resume") !== "1") return;
    const resumeStep = computeResumeStep(progress ?? null);
    if (resumeStep && resumeStep !== step) {
      goToStep(resumeStep);
    }
  }, [progress, searchParams, step, goToStep]);

  useEffect(() => {
    if ((step === "cards" || step === "details") && intentCategories.length === 0) {
      // Allow direct access if we have a cached recommendation snapshot
      try {
        const cached = readRecommendationCache();
        if (!cached) {
          goToStep("firstInput");
          return;
        }
      } catch {
        goToStep("firstInput");
        return;
      }
    }
    if (step === "intentMotivation" && intentCategories.length === 0) {
      goToStep("intent");
    }
  }, [goToStep, intentCategories.length, step]);

  const handleReturnToOrigin = useCallback(() => {
    if (!returnTo) return;
    router.push(returnTo);
  }, [returnTo, router]);

  const categoryLabels = useMemo(() => {
    const fromI18n = t("intentCategoryLabels");
    const base: Record<string, string> =
      fromI18n && typeof fromI18n === "object" ? (fromI18n as Record<string, string>) : {};
    // Fallbacks from CATEGORY_LABELS when i18n is missing
    const isRO = lang !== "en";
    const ensure = (key: string, roKey: keyof typeof CATEGORY_LABELS) => {
      if (!base[key] || typeof base[key] !== "string") {
        base[key] = isRO ? CATEGORY_LABELS[roKey].name.ro : CATEGORY_LABELS[roKey].name.en;
      }
    };
    ensure("clarity", "claritate");
    ensure("relationships", "relatii");
    ensure("stress", "stres");
    ensure("confidence", "incredere");
    ensure("balance", "echilibru");
    return base;
  }, [t, lang]);
  const recommendedBadgeValue = s("cardsRecommendedLabel", "");
  const recommendedBadgeLabel = recommendedBadgeValue || undefined;
  const reflectionOneLines = useMemo(() => {
    return ["reflectionOneLine1", "reflectionOneLine2"]
      .map((key) => s(key, ""))
      .filter((line) => line.length > 0);
  }, [s]);

  const reflectionSummaryLines = useMemo(() => {
    const introValue = s("reflectionTwoIntro", "");
    const bodyValue = s("reflectionTwoBody", "");
    const connector = lang === "ro" ? " și " : " & ";
    const summaryNames = intentCategories
      .filter((entry) => entry.count > 0)
      .slice(0, 2)
      .map((entry) => {
        const label = categoryLabels[entry.category];
        return typeof label === "string" && label.length > 0 ? label : entry.category;
      });
    const summaryText =
      summaryNames.length === 0
        ? lang === "ro"
          ? "temele tale principale"
          : "your main themes"
        : summaryNames.length === 1
        ? summaryNames[0]
        : `${summaryNames[0]}${connector}${summaryNames[1]}`;
    const introLine =
      introValue.length > 0
        ? introValue.replace("{{categorySummary}}", summaryText)
        : lang === "ro"
        ? `Pare că vrei să lucrezi la ${summaryText}.`
        : `Looks like you want to work on ${summaryText}.`;
    const bodyLine =
      bodyValue.length > 0
        ? bodyValue
        : lang === "ro"
        ? "Există două moduri prin care poți continua."
        : "There are two ways you can continue.";
    const lines = [introLine, bodyLine];
    const trimmedEntry = journalEntry?.trim();
    if (trimmedEntry && trimmedEntry.length > 0) {
      lines.push(
        lang === "ro"
          ? `Ai menționat că te preocupă: „${trimmedEntry}”.`
          : `You shared that you're working through: “${trimmedEntry}.”`,
      );
    }
    return lines;
  }, [intentCategories, categoryLabels, journalEntry, lang, s]);

  const navigateToStep = useCallback(
    (nextStep: WizardStepId) => {
      goToStep(nextStep);
      if (nextStep === "intro") {
        setMenuOpen(false);
      }
      resetError();
    },
    [goToStep, resetError],
  );

  const navLinks = useNavigationLinks();

  const handleIntentComplete = useCallback(
    (result: IntentCloudResult) => {
      recordIntentSelection(result);
      navigateToStep("reflectionSummary");
    },
    [recordIntentSelection, navigateToStep],
  );

  const handleIntentSummaryComplete = useCallback(
    async (urgency: number) => {
      setIntentUrgency(urgency);
      const scores = computeDimensionScores(intentCategories, urgency);
      setDimensionScores(scores);
      const recommendation = recommendSession({
        urgency,
        primaryCategory: intentCategories[0]?.category,
        dimensionScores: scores,
        hasProfile: Boolean(profile),
      });
      setRecommendedPath(recommendation.recommendedPath);
      setRecommendationReasonKey(recommendation.reasonKey);
      // Persist locally so /recommendation can restore even for guests
      try {
        saveRecommendationCache({
          intent: { categories: intentCategories, urgency },
          recommendation: { path: recommendation.recommendedPath, reasonKey: recommendation.reasonKey },
          dimensionScores: scores,
          timestamp: Date.now(),
        });
      } catch {}
      const success = await persistIntentSnapshot(urgency, {
        dimensionScores: scores,
        algoVersion: 1,
        recommendation: recommendation.recommendedPath,
        recommendationReasonKey: recommendation.reasonKey,
      });
      if (!success) {
        console.warn("intent snapshot could not be persisted; staying on summary");
        return;
      }
      navigateToStep("cards");
    },
    [
      intentCategories,
      navigateToStep,
      persistIntentSnapshot,
      profile,
      setIntentUrgency,
    ],
  );

  const handleCardSelect = useCallback(
    async (type: "individual" | "group") => {
      const success = await persistJourneyChoice(type, {
        recommendedPath,
        recommendationReasonKey,
        algoVersion: 1,
        dimensionScores,
      });
      if (!success) {
        console.warn("journey choice could not be persisted; staying on recommendation");
        return;
      }
      // Write an initial recommendation entry (userRecommendations)
      try {
        if (!areWritesDisabled() && profile?.id) {
          const db = getDb();
          const colRef = collection(db, 'userRecommendations', profile.id, 'items');
          const title = type === 'group'
            ? (lang === 'ro' ? 'Începe cu programul de grup OmniMental' : 'Start with the OmniMental group program')
            : (lang === 'ro' ? 'Începe cu ședințe individuale' : 'Start with individual sessions');
          const shortLabel = type === 'group' ? 'Pasul 1 – Grup' : 'Pasul 1 – Individual';
          await addDoc(colRef, {
            userId: profile.id,
            title,
            shortLabel,
            type: 'onboarding',
            status: 'new',
            priority: 1,
            createdAt: new Date().toISOString(),
            estimatedMinutes: 10,
            tags: ['onboarding'],
            body: lang === 'ro'
              ? 'Bazat pe răspunsurile tale, acesta este pasul recomandat. Vezi detalii și începe cu un prim pas simplu.'
              : 'Based on your answers, this is the suggested step. See details and start with one simple action.',
            ctaLabel: lang === 'ro' ? 'Vezi recomandările' : 'See recommendations',
            ctaHref: '/recommendation',
            source: 'onboarding',
          });
        }
      } catch (e) {
        console.warn('write initial recommendation failed', e);
      }
      try {
        // Update local cache so /recommendation reflects chosen path for guests
        const cached = readRecommendationCache();
        if (cached) {
          updateSelectedPath(type);
        }
      } catch {}
      navigateToStep("details");
    },
    [dimensionScores, navigateToStep, persistJourneyChoice, recommendationReasonKey, recommendedPath, profile?.id, lang],
  );

  const redirectToAuth = useCallback(() => {
    dismissAccountPrompt();
    router.push("/auth");
  }, [dismissAccountPrompt, router]);

  // Render-driven open: the modal will be open if either explicit state is true

  const savingGenericLabel = lang === "ro" ? "Se salvează..." : "Saving...";
  const savingChoiceLabel = s(
    "cardsSavingChoiceLabel",
    lang === "ro" ? "Se salvează alegerea..." : "Saving your choice...",
  );
  // account prompt handled inside Recommendation/Wizard components
  const intentSelectionTotal = useMemo(
    () => intentCategories.reduce((sum, entry) => sum + entry.count, 0),
    [intentCategories],
  );

  // Legacy stepContent rendering removed; WizardRouter handles routing.

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader
        showMenu
        onMenuToggle={() => setMenuOpen(true)}
        onAuthRequest={redirectToAuth}
        wizardMode={step !== "details"}
        onWizardExit={() => {
          if (typeof window !== 'undefined') {
            const confirmed = window.confirm(
              lang === "ro"
                ? "Păstrăm progresul în draft și poți reveni oricând. Vrei să ieși?"
                : "We’ll keep your progress as a draft. Do you want to exit?",
            );
            if (!confirmed) return;
            const url = new URL(window.location.origin + "/choose");
            url.searchParams.set("from", "wizard");
            window.location.assign(url.pathname + url.search);
          }
        }}
        onWizardReset={() => {
          if (typeof window !== 'undefined') {
            const confirmed = window.confirm(
              lang === 'ro'
                ? 'Vrei să o iei de la capăt? Progresul curent se mută în draft.'
                : 'Start over? Your current progress will be kept as a draft.'
            );
            if (!confirmed) return;
            try { clearWizardState(); } catch {}
            const params = new URLSearchParams(searchParams?.toString() ?? "");
            params.set("step", "preIntro");
            params.set("reset", "1");
            const qs = params.toString();
            window.location.assign(qs ? `/?${qs}` : "/");
          }
        }}
        canWizardReset={(() => {
          const s = step;
          return !(s === 'preIntro' || s === 'intro' || s === 'firstInput' || s === 'reflectionPrompt');
        })()}
      />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />

      <main className="px-4 py-8 sm:px-6">
        {searchParams?.get("reset") === "1" ? (
          <Toast
            message={s("toastResetMessage", lang === "ro" ? "Parcursul a fost resetat." : "Your journey was reset.")}
            okLabel={s("toastOk", "OK")}
            onClose={() => {
              void recordWizardResetNoticeDismissed();
              const params = new URLSearchParams(searchParams?.toString() ?? "");
              params.delete("reset");
              const qs = params.toString();
              router.replace(qs ? `/?${qs}` : "/", { scroll: false });
            }}
          />
        ) : null}
        {!["preIntro", "intro"].includes(step) && (
          <WizardProgress
            currentStep={step}
            lang={lang === "en" ? "en" : "ro"}
            onReset={() => {
              if (typeof window !== "undefined") {
                const confirmed = window.confirm(
                  lang === 'ro'
                    ? 'Vrei să o iei de la capăt? Progresul curent se mută în draft.'
                    : 'Start over? Your current progress will be kept as a draft.'
                );
                if (!confirmed) {
                  void recordWizardResetCanceled();
                  return;
                }
              }
              try {
                clearWizardState();
              } catch {}
              void recordWizardReset();
              if (typeof window !== "undefined") {
                const params = new URLSearchParams(searchParams?.toString() ?? "");
                params.set("step", "preIntro");
                params.set("reset", "1");
                const qs = params.toString();
                window.location.assign(qs ? `/?${qs}` : "/");
              }
            }}
            onExit={() => {
              if (typeof window !== "undefined") {
                const confirmed = window.confirm(
                  lang === 'ro'
                    ? 'Păstrăm progresul în draft și poți reveni oricând. Vrei să ieși?'
                    : 'We’ll keep your progress as a draft. Do you want to exit?'
                );
                if (!confirmed) return;
                const url = new URL(window.location.origin + "/choose");
                url.searchParams.set("from", "wizard");
                window.location.assign(url.pathname + url.search);
              }
            }}
          />
        )}
        {/* per-step reset removed; use the progress bar reset above */}
        <WizardRouter
          step={step}
          lang={lang}
          navigateToStep={navigateToStep}
          onFirstInputSubmit={submitFirstInput}
          onAuthRequest={redirectToAuth}
          firstInputError={saveError}
          reflectionPromptLines={reflectionOneLines}
          reflectionSummaryLines={reflectionSummaryLines}
          intentCategories={intentCategories}
          intentSelectionTotal={intentSelectionTotal}
          categoryLabels={categoryLabels}
          minSelection={MIN_INTENT_SELECTIONS}
          maxSelection={MAX_INTENT_SELECTIONS}
          words={adaptiveCloudWords}
          cloudKey={adaptiveCloudKey}
          onIntentComplete={handleIntentComplete}
          isSavingIntent={isSavingIntentSnapshot}
          saveError={saveError}
          savingLabel={savingGenericLabel}
          urgency={intentUrgency}
          setUrgency={setIntentUrgency}
          resolutionSpeed={resolutionSpeed}
          setResolutionSpeed={setResolutionSpeed}
          determination={determination}
          setDetermination={setDetermination}
          timeCommitmentHours={timeCommitmentHours}
          setTimeCommitmentHours={setTimeCommitmentHours}
          budgetPreference={budgetPreference}
          setBudgetPreference={setBudgetPreference}
          goalType={goalType}
          setGoalType={setGoalType}
          emotionalState={emotionalState}
          setEmotionalState={setEmotionalState}
          groupComfort={groupComfort}
          setGroupComfort={setGroupComfort}
          learnFromOthers={learnFromOthers}
          setLearnFromOthers={setLearnFromOthers}
          scheduleFit={scheduleFit}
          setScheduleFit={setScheduleFit}
          onIntentSummaryContinue={() => void handleIntentSummaryComplete(intentUrgency)}
          profile={profile}
          showAccountPrompt={showAccountPrompt}
          onAccountRequestCards={redirectToAuth}
          recommendedPath={recommendedPath}
          recommendedBadgeLabel={recommendedBadgeLabel}
          onCardSelect={handleCardSelect}
          isSavingChoice={isSavingJourney}
          savingChoiceType={journeySavingChoice}
          cardsSavingLabel={savingChoiceLabel}
          recommendationReasonKey={recommendationReasonKey}
          journalEntry={journalEntry}
          formatPreference={formatPreference}
          dimensionScores={dimensionScores}
          algoVersion={1}
          selectedCard={selectedCard}
          onReturnToOrigin={returnTo ? handleReturnToOrigin : undefined}
          returnLabel={lang === "ro" ? "Înapoi la progres" : "Back to progress"}
        />
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
