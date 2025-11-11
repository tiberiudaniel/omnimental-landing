"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { recordEvaluationTabChange } from "@/lib/progressFacts";
import ProgressSummary from "../../components/ProgressSummary";
import ProgressStageCard from "../../components/ProgressStageCard";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import AccountModal from "../../components/AccountModal";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { I18nProvider, useI18n } from "../../components/I18nProvider";
import { useProfile } from "../../components/ProfileProvider";
import { useProgressFacts } from "../../components/useProgressFacts";
import { useEvaluationTimeline } from "../../components/useEvaluationTimeline";
import ProgressSparkline from "../../components/ProgressSparkline";
import ProgressTrends from "../../components/ProgressTrends";
import LatestEntries from "../../components/LatestEntries";
import type { ProgressIntentCategories, ProgressFact } from "@/lib/progressFacts";
import { getRecommendationReasonCopy } from "@/lib/recommendationCopy";
import Toast from "../../components/Toast";
import { backfillProgressFacts, recordQuestCompletion } from "@/lib/progressFacts";
import { omniKnowledgeModules } from "@/lib/omniKnowledge";
import { computeOmniIntelScore, computeConsistencyIndexFromDates } from "@/lib/omniIntel";
import { recordOmniPatch } from "@/lib/progressFacts";
import StickyMiniSummary from "../../components/StickyMiniSummary";
import NextBestStep from "../../components/NextBestStep";
import type { SessionType } from "@/lib/recommendation";
import type { DimensionScores } from "@/lib/scoring";

const STAGE_LABELS: Record<string, string> = {
  t0: "Start (0 săpt.)",
  t1: "3 săptămâni",
  t2: "6 săptămâni",
  t3: "9 săptămâni",
  t4: "12 săptămâni",
};

const PATH_LABELS: Record<SessionType, { ro: string; en: string }> = {
  individual: {
    ro: "Sesiuni individuale 1-la-1",
    en: "1:1 individual sessions",
  },
  group: {
    ro: "Programul de grup OmniMental",
    en: "OmniMental group program",
  },
};

type DimensionKey = keyof DimensionScores;

const DIMENSION_ORDER: DimensionKey[] = [
  "calm",
  "focus",
  "energy",
  "relationships",
  "performance",
  "health",
];

const DIMENSION_LABELS: Record<DimensionKey, { ro: string; en: string }> = {
  calm: { ro: "Calm & reglare", en: "Calm & regulation" },
  focus: { ro: "Claritate & focus", en: "Clarity & focus" },
  energy: { ro: "Energie & reziliență", en: "Energy & resilience" },
  relationships: { ro: "Relații & limite", en: "Relationships & boundaries" },
  performance: { ro: "Performanță & impact", en: "Performance & impact" },
  health: { ro: "Obiceiuri & sănătate", en: "Habits & health" },
};

function deriveSenseiUnlocked(p?: ProgressFact | null) {
  const kunoCompleted = Number(p?.omni?.kuno?.completedTests ?? 0) >= 1;
  const explicit = Boolean(p?.omni?.sensei?.unlocked);
  return explicit || kunoCompleted;
}

const RETURN_TO_PROGRESS = "/progress";

type WizardEntryStep = "firstInput" | "reflectionPrompt" | "intent" | "intentSummary" | "cards";

const buildWizardLink = (step: WizardEntryStep, source: string) => ({
  pathname: "/",
  query: {
    step,
    source,
    returnTo: RETURN_TO_PROGRESS,
  },
});

const buildEvaluationLink = () => ({
  pathname: "/evaluation",
  query: {
    source: "progress",
    returnTo: RETURN_TO_PROGRESS,
  },
});

const buildRecommendationLink = () => ({
  pathname: "/recommendation",
  query: {
    source: "progress",
    returnTo: RETURN_TO_PROGRESS,
  },
});

function resolveString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function formatTimestamp(value: unknown, locale: string) {
  if (!value || typeof (value as { toDate?: () => Date }).toDate !== "function") return "-";
  const date = (value as { toDate: () => Date }).toDate();
  return date.toLocaleString(locale === "ro" ? "ro-RO" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCategories(
  categories: ProgressIntentCategories,
  labels: Record<string, string>,
  limit = 6,
) {
  return categories
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      label: labels[entry.category] ?? entry.category,
    }));
}

function ProgressContent() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navLinks = useNavigationLinks();
  const { data: progress, loading, error } = useProgressFacts(profile?.id);
  const { entries: evalTimeline } = useEvaluationTimeline();

  const title = t("progressTitle");
  const subtitle = t("progressSubtitle");
  const noProfileTitle = t("progressNoProfileTitle");
  const noProfileDesc = t("progressNoProfileDesc");
  const createAccountLabel = t("progressCreateAccount");
  const categoryLabels = useMemo(() => {
    const value = t("intentCategoryLabels");
    if (value && typeof value === "object") {
      return value as Record<string, string>;
    }
    return {};
  }, [t]);
  const intentTitle = t("progressIntentTitle");
  const intentEmpty = t("progressIntentEmpty");
  const evaluationTitle = t("progressEvaluationCardTitle");
  const evaluationEmpty = t("progressEvaluationEmpty");
  const motivationTitle = t("progressMotivationTitle");
  const motivationEmpty = t("progressMotivationEmpty");
  const questTitle = t("progressQuestTitle");
  const questEmpty = t("progressQuestEmpty");

  const intent = progress?.intent;
  const motivation = progress?.motivation;
  const evaluation = progress?.evaluation;
  const quests = progress?.quests?.items ?? [];
  const heroMeta = useMemo(() => {
    if (!progress?.intent && !progress?.evaluation) return [];
    const meta: string[] = [];
    if (progress?.intent) {
      meta.push(`${lang === "ro" ? "Urgență" : "Urgency"}: ${progress.intent.urgency}/10`);
    }
    if (progress?.evaluation) {
      meta.push(
        `${lang === "ro" ? "Etapă" : "Stage"}: ${
          STAGE_LABELS[progress.evaluation.stageValue] ?? progress.evaluation.stageValue
        }`,
      );
    }
    return meta;
  }, [lang, progress]);

  const heroDetails = useMemo(() => {
    const rec = progress?.recommendation;
    if (!rec) return null;
    const langKey = lang === "ro" ? "ro" : "en";
    const recommendedLabel = rec.suggestedPath
      ? PATH_LABELS[rec.suggestedPath as SessionType]?.[langKey]
      : rec.selectedPath
      ? PATH_LABELS[rec.selectedPath as SessionType]?.[langKey]
      : null;
    const reasonText = getRecommendationReasonCopy(rec.reasonKey ?? "reason_default", langKey);
    const dimensionScores = rec.dimensionScores;
    const topDimensions = dimensionScores
      ? DIMENSION_ORDER.map((key) => ({
          key,
          value: Number(dimensionScores[key]) || 0,
        }))
          .filter((entry) => entry.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .map((entry) => DIMENSION_LABELS[entry.key][langKey])
      : [];
    if (!recommendedLabel && topDimensions.length === 0 && !reasonText) {
      return null;
    }
    return {
      recommendedLabel,
      reasonText,
      suggestedPath: rec.suggestedPath ?? null,
      selectedPath: rec.selectedPath ?? null,
      topDimensions,
    };
  }, [lang, progress?.recommendation]);

  // Compute a coarse global load label from intent urgency
  const globalLoadLabel = useMemo(() => {
    const u = Number(progress?.intent?.urgency ?? 0);
    if (u >= 7) return lang === "ro" ? "Ridicat" : "High";
    if (u >= 4) return lang === "ro" ? "Moderat" : "Moderate";
    return lang === "ro" ? "Scăzut" : "Low";
  }, [lang, progress?.intent?.urgency]);

  const omniIntelScore = useMemo(() => {
    const raw = Number(progress?.omni?.omniIntelScore ?? NaN);
    if (Number.isFinite(raw)) return raw;
    const k = Number(progress?.omni?.kuno?.knowledgeIndex ?? NaN);
    const s = Number(progress?.omni?.abil?.skillsIndex ?? NaN);
    const d = Number(progress?.omni?.scope?.directionMotivationIndex ?? NaN);
    const c = Number(progress?.omni?.intel?.consistencyIndex ?? NaN);
    if ([k, s, d, c].some((v) => Number.isNaN(v))) return NaN;
    return computeOmniIntelScore({
      knowledgeIndex: k,
      skillsIndex: s,
      directionMotivationIndex: d,
      consistencyIndex: c,
    });
  }, [progress?.omni]);
  const omniLevel = useMemo(() => {
    const s = Math.round(omniIntelScore);
    if (!Number.isFinite(s)) return null;
    if (s >= 75) return lang === "ro" ? "Sensei" : "Sensei";
    if (s >= 50) return lang === "ro" ? "Adept" : "Adept";
    if (s >= 25) return lang === "ro" ? "Pathfinder" : "Pathfinder";
    return lang === "ro" ? "Explorer" : "Explorer";
  }, [lang, omniIntelScore]);

  // Derive and patch consistency index from evaluation timeline (distinct active days / 14)
  useEffect(() => {
    const dates = (evalTimeline ?? []).map((e) => e.createdAt).filter((d): d is Date => d instanceof Date);
    if (!dates.length) return;
    const consistency = computeConsistencyIndexFromDates(dates);
    const existing = Number(progress?.omni?.intel?.consistencyIndex ?? NaN);
    const needsPatch = !Number.isFinite(existing) || Math.abs(consistency - existing) >= 2;
    if (!needsPatch) return;
    // Recompute OmniIntel with new consistency if other indices exist
    const k = Number(progress?.omni?.kuno?.knowledgeIndex ?? 0);
    const s = Number(progress?.omni?.abil?.skillsIndex ?? 0);
    const d = Number(progress?.omni?.scope?.directionMotivationIndex ?? 0);
    const omni = computeOmniIntelScore({ knowledgeIndex: k, skillsIndex: s, directionMotivationIndex: d, consistencyIndex: consistency });
    void recordOmniPatch({ intel: { consistencyIndex: consistency }, omniIntelScore: omni }).catch(() => {});
  }, [evalTimeline, progress?.omni]);

  const sparkValues = useMemo(() => {
    // Map MAAS (mindful awareness) totals to a 0–10 scale for a simple trend
    if (!evalTimeline || evalTimeline.length === 0) return [] as number[];
    return evalTimeline.map((e) => {
      const maas = Number(e.scores?.maasTotal ?? 0);
      const normalized = Math.max(0, Math.min(10, (maas / 6) * 10));
      return Math.round(normalized * 10) / 10;
    });
  }, [evalTimeline]);

  const distributionData = useMemo(() => {
    if (!intent?.categories || intent.categories.length === 0)
      return [] as { label: string; value: number }[];
    const total = intent.categories.reduce((sum, c) => sum + c.count, 0) || 1;
    const sorted = intent.categories.slice().sort((a, b) => b.count - a.count);
    return sorted.slice(0, 3).map((c) => ({
      label: categoryLabels[c.category] ?? c.category,
      value: Math.round((c.count / total) * 100),
    }));
  }, [categoryLabels, intent?.categories]);

  const heroSelectionMessage = useMemo(() => {
    if (!heroDetails) return null;
    const langKey = lang === "ro" ? "ro" : "en";
    const selectedLabel =
      heroDetails.selectedPath && PATH_LABELS[heroDetails.selectedPath as SessionType]?.[langKey];
    const suggestedLabel =
      heroDetails.suggestedPath && PATH_LABELS[heroDetails.suggestedPath as SessionType]?.[langKey];
    if (heroDetails.selectedPath && heroDetails.suggestedPath) {
      if (heroDetails.selectedPath === heroDetails.suggestedPath) {
        return lang === "ro"
          ? "Ai ales exact varianta recomandată."
          : "You followed the recommended format.";
      }
      return lang === "ro"
        ? `Ai selectat ${selectedLabel ?? "alt format"}, în timp ce recomandarea era ${
            suggestedLabel ?? "altă direcție"
          }.`
        : `You selected ${selectedLabel ?? "another format"} while the recommendation was ${
            suggestedLabel ?? "different"
          }.`;
    }
    if (heroDetails.selectedPath) {
      return lang === "ro"
        ? `Ai ales ${selectedLabel ?? "un format"} pentru a continua.`
        : `You selected ${selectedLabel ?? "a format"} to continue.`;
    }
    return null;
  }, [heroDetails, lang]);

  const formattedCategories = useMemo(() => {
    if (!intent?.categories) return [];
    return formatCategories(intent.categories, categoryLabels);
  }, [intent, categoryLabels]);

  const motivationRows = useMemo(() => {
    if (!motivation) return [];
    return [
      {
        label: lang === "ro" ? "Urgență declarată" : "Declared urgency",
        value: `${motivation.urgency}/10`,
      },
      {
        label: lang === "ro" ? "Determinare" : "Determination",
        value: `${motivation.determination}/10`,
      },
      {
        label: lang === "ro" ? "Timp disponibil / săptămână" : "Weekly time available",
        value: `${motivation.hoursPerWeek}h`,
      },
      {
        label: lang === "ro" ? "Buget" : "Budget",
        value: motivation.budgetLevel,
      },
      {
        label: lang === "ro" ? "Preferință format" : "Format preference",
        value: motivation.formatPreference,
      },
      {
        label: lang === "ro" ? "Confort în grup" : "Group comfort",
        value: `${motivation.groupComfort}/10`,
      },
      {
        label: lang === "ro" ? "Învăț din alții" : "Learn from others",
        value: `${motivation.learnFromOthers}/10`,
      },
    ];
  }, [motivation, lang]);

  const evaluationRows = useMemo(() => {
    if (!evaluation) return [];
    const rows = [
      { label: "PSS – Stres perceput", value: evaluation.scores.pssTotal.toFixed(0) },
      { label: "GSE – Autoeficacitate", value: evaluation.scores.gseTotal.toFixed(0) },
      { label: "MAAS – Prezență", value: evaluation.scores.maasTotal.toFixed(1) },
      { label: "PANAS +", value: evaluation.scores.panasPositive.toFixed(0) },
      { label: "PANAS -", value: evaluation.scores.panasNegative.toFixed(0) },
      { label: "SVS – Vitalitate", value: evaluation.scores.svs.toFixed(1) },
    ];
    if (evaluation.knowledge) {
      rows.push({
        label: "Omni-Cunoaștere",
        value: `${evaluation.knowledge.percent.toFixed(0)}%`,
      });
    }
    return rows;
  }, [evaluation]);

  if (!profile?.id) {
    return (
      <div className="bg-bgLight min-h-screen">
        <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => setAccountModalOpen(true)} />
        <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
        <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
        <main className="px-4 py-12 md:px-8">
          <div className="mx-auto max-w-2xl rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-12 text-center shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
            <h1 className="text-2xl font-semibold text-[#2C1F18]">
              {resolveString(noProfileTitle, "Creează-ți contul")}
            </h1>
            <p className="mt-2 text-sm text-[#4A3A30]">
              {resolveString(noProfileDesc, "Salvează progresul și vezi recomandările personalizate.")}
            </p>
            <p className="mt-1 text-xs text-[#7A6455]">
              {lang === "ro"
                ? "Dacă ai completat deja evaluarea, o conectăm automat după autentificare."
                : "If you already completed an evaluation, we’ll link it automatically after you sign in."}
            </p>
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="mt-6 inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
            >
              {typeof createAccountLabel === "string" ? createAccountLabel : "Creează cont"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-bgLight min-h-screen">
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => setAccountModalOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
      <main className="px-4 py-12 md:px-8">
        <div className="sticky top-14 z-10">
          <StickyMiniSummary
            omniIntelScore={Number.isFinite(omniIntelScore) ? omniIntelScore : null}
            omniLevel={omniLevel ?? null}
            lang={lang === "en" ? "en" : "ro"}
          />
          <NextBestStep
            progress={progress ?? undefined}
            lang={lang === "en" ? "en" : "ro"}
            onGoToKuno={() => {
              void recordEvaluationTabChange("oc");
              const qs = new URLSearchParams({ tab: "oc", source: "progress" }).toString();
              router.push(`/evaluation?${qs}`);
            }}
            onGoToSensei={() => {
              const qs = new URLSearchParams({ tab: "ose", source: "progress" }).toString();
              router.push(`/evaluation?${qs}`);
            }}
            onGoToAbil={() => {
              void recordEvaluationTabChange("oa");
              const qs = new URLSearchParams({ tab: "oa", source: "progress" }).toString();
              router.push(`/evaluation?${qs}`);
            }}
            onGoToIntel={() => {
              void recordEvaluationTabChange("oi");
              const qs = new URLSearchParams({ tab: "oi", source: "progress" }).toString();
              router.push(`/evaluation?${qs}`);
            }}
          />
        </div>
        {/* Top summary row */}
        <div className="mx-auto mb-6 max-w-5xl">
          <ProgressSummary
            urgency={progress?.intent?.urgency ?? null}
            stage={progress?.evaluation?.stageValue ?? null}
            globalLoad={globalLoadLabel}
            updatedAt={progress?.updatedAt ? formatTimestamp(progress.updatedAt, lang) : null}
            omniIntelScore={Number.isFinite(omniIntelScore) ? omniIntelScore : null}
            omniLevel={omniLevel}
          />
        </div>

        {/* Trends + Distribution + Latest entries */}
        <ProgressTrends lang={lang === "en" ? "en" : "ro"} sparkValues={sparkValues} distribution={distributionData} />
        <LatestEntries lang={lang === "en" ? "en" : "ro"} quests={quests as unknown as Array<{ title?: string }>} evaluationsCount={evalTimeline?.length ?? 0} />

        {/* 2x2 grid of stages on desktop */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          {/* Stage 1: Intent */}
          <ProgressStageCard
            icon="🎯"
            title={resolveString(intentTitle, "Intenții & Cloud")}
            subtitle={intent ? (lang === "ro" ? "Complet" : "Complete") : (lang === "ro" ? "Începe sau reia selecția" : "Start or resume selection")}
            percent={(intent?.tags?.length ? Math.min(100, Math.round((intent.tags.length / 7) * 100)) : 0)}
            status={intent ? "complete" : "stale"}
            ctaLabel={lang === "ro" ? "Reia clarificarea" : "Clarify now"}
            onAction={() => {
              const link = buildWizardLink("intent", "progress-intent-card");
              const qs = new URLSearchParams(link.query as Record<string, string>).toString();
              router.push(qs ? `${link.pathname}?${qs}` : link.pathname);
            }}
          />

          {/* Stage 2: Motivation */}
          <ProgressStageCard
            icon="🧭"
            title={resolveString(motivationTitle, "Motivație & Resurse")}
            subtitle={motivation ? (lang === "ro" ? "Actualizat" : "Updated") : (lang === "ro" ? "Adaugă resurse" : "Add resources")}
            percent={(() => {
              const m = motivation;
              if (!m) return 0;
              const answers = [
                m.urgency,
                m.determination,
                m.hoursPerWeek,
                m.budgetLevel,
                m.goalType,
                m.emotionalState,
                m.groupComfort,
                m.learnFromOthers,
                m.scheduleFit,
                m.formatPreference,
              ];
              const total = answers.length;
              const filled = answers.filter((v) => v !== undefined && v !== null).length;
              return Math.round((filled / total) * 100);
            })()}
            status={motivation ? "inProgress" : "stale"}
            ctaLabel={lang === "ro" ? "Adaugă resurse" : "Add resources"}
            onAction={() => {
              const link = buildWizardLink("intentSummary", "progress-motivation-card");
              const qs = new URLSearchParams(link.query as Record<string, string>).toString();
              router.push(qs ? `${link.pathname}?${qs}` : link.pathname);
            }}
          />

          {/* Stage 3: Evaluations */}
          <ProgressStageCard
            icon="🧠"
            title={resolveString(evaluationTitle, "Evaluări Omni-Intel")}
            subtitle={evaluation ? (lang === "ro" ? "Există măsurători" : "Measurements found") : (lang === "ro" ? "Completează o evaluare" : "Complete an evaluation")}
            percent={evaluation ? 100 : 0}
            status={evaluation ? "inProgress" : "stale"}
            ctaLabel={lang === "ro" ? "Deschide evaluările" : "Open evaluations"}
            onAction={() => {
              const qs = new URLSearchParams({ tab: "oi", source: "progress" }).toString();
              router.push(`/evaluation?${qs}`);
            }}
          />

          {/* Stage 4: Quests */}
          <ProgressStageCard
            icon="🧩"
            title={resolveString(questTitle, "Quest-uri")}
            subtitle={(progress?.quests?.items?.length ?? 0) > 0 ? (lang === "ro" ? "Active" : "Active") : (lang === "ro" ? "Vor apărea după evaluare" : "Will appear after evaluation")}
            percent={(progress?.quests?.items?.length ?? 0) > 0 ? 50 : 0}
            status={(progress?.quests?.items?.length ?? 0) > 0 ? "inProgress" : "stale"}
            ctaLabel={lang === "ro" ? "Vezi quest-uri" : "View quests"}
            onAction={() => {
              const link = buildRecommendationLink();
              const qs = new URLSearchParams(link.query as Record<string, string>).toString();
              router.push(qs ? `${link.pathname}?${qs}` : link.pathname);
            }}
            locked={!deriveSenseiUnlocked(progress)}
            lockHint={lang === "ro" ? "Se activează după Kuno" : "Unlocks after Kuno"}
          />
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">OmniMental Progress</p>
          <h1 className="text-3xl font-semibold text-[#2C1F18]">
            {typeof title === "string" ? title : "Progresul tău"}
          </h1>
          <p className="text-sm text-[#4A3A30]">
            {typeof subtitle === "string"
              ? subtitle
              : "Fiecare etapă completată se salvează aici pentru ajustări rapide."}
          </p>
          {heroDetails ? (
            <section className="mx-auto mt-4 max-w-3xl space-y-3 rounded-[18px] border border-[#E4D8CE] bg-white px-6 py-5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C07963]">
                {lang === "ro" ? "Rezumat recomandare" : "Recommendation summary"}
              </p>
              {heroDetails.recommendedLabel ? (
                <h2 className="text-lg font-semibold text-[#2C1F18]">{heroDetails.recommendedLabel}</h2>
              ) : null}
              <p className="text-sm leading-relaxed text-[#4A3A30]">{heroDetails.reasonText}</p>
              {heroSelectionMessage ? (
                <p className="text-xs text-[#7A6455]">{heroSelectionMessage}</p>
              ) : null}
              {sparkValues.length > 1 ? (
                <div className="mx-auto mt-2 flex w-full max-w-xs items-center justify-center">
                  <ProgressSparkline values={sparkValues} />
                </div>
              ) : null}
              {heroDetails.topDimensions.length ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {heroDetails.topDimensions.map((label, index) => (
                    <span
                      key={`${label}-${index.toString()}`}
                      className="rounded-full border border-[#E4D8CE] bg-[#FFFBF7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#5C4F45]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  disabled={resyncing}
                  onClick={async () => {
                    if (!profile?.id) return;
                    try {
                      setResyncing(true);
                      const fact = await backfillProgressFacts(profile.id);
                      setToastMessage(
                        lang === "ro"
                          ? fact
                            ? "Datele au fost resincronizate."
                            : "Nu am găsit date recente pentru resincronizare."
                          : fact
                          ? "Data was resynchronized."
                          : "No recent data found to resync.",
                      );
                    } catch (e) {
                      console.warn("progress resync failed", e);
                      setToastMessage(
                        lang === "ro" ? "A apărut o eroare la resincronizare." : "Resynchronization failed.",
                      );
                    } finally {
                      setResyncing(false);
                    }
                  }}
                  className="rounded-[10px] border border-[#A08F82] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4A3A30] hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
                >
                  {resyncing
                    ? lang === "ro"
                      ? "Sincronizare..."
                      : "Syncing..."
                    : lang === "ro"
                    ? "Resincronizează"
                    : "Resync now"}
                </button>
              </div>
              {heroMeta.length ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {heroMeta.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#F0E6DA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A08F82]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>
          ) : heroMeta.length ? (
            <section className="mx-auto mt-4 max-w-3xl rounded-[16px] border border-[#E4D8CE] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#5C4F45] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
              {heroMeta.join(" • ")}
            </section>
          ) : null}
        </div>

        {error ? (
          <div className="mx-auto mt-8 max-w-4xl rounded-[16px] border border-[#F4C7C3] bg-[#FFF5F4] px-6 py-4 text-center text-xs text-[#8C2B2F] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            Nu am putut sincroniza datele din cloud. Încearcă să reîmprospătezi sau să salvezi o nouă evaluare.
          </div>
        ) : null}

        {/* Dev helper: mark one quest as completed to unlock Abil */}
        <section className="mx-auto mt-6 max-w-5xl">
          <div className="rounded-[12px] border border-dashed border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3 text-center text-xs text-[#5C4F45]">
            <p className="mb-2 font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
              {lang === "ro" ? "Acțiuni rapide (dev)" : "Quick actions (dev)"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await recordQuestCompletion();
                    setToastMessage(
                      lang === "ro"
                        ? "Am marcat un quest ca finalizat. Abil este deblocat."
                        : "Marked one quest completed. Abil unlocked.",
                    );
                  } catch {
                    setToastMessage(
                      lang === "ro" ? "Nu am putut marca finalizarea." : "Could not mark completion.",
                    );
                  }
                }}
                className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
              >
                {lang === "ro" ? "Finalizează un quest" : "Complete a quest"}
              </button>
              <span className="rounded-full border border-[#F0E6DA] bg-white px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-[#7A6455]">
                {lang === "ro"
                  ? `Abil: ${progress?.omni?.abil?.unlocked ? "deblocat" : "blocat"}`
                  : `Abil: ${progress?.omni?.abil?.unlocked ? "unlocked" : "locked"}`}
              </span>
            </div>
          </div>
        </section>
        {loading ? (
          <div className="mx-auto mt-10 max-w-4xl rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 text-center text-sm text-[#4A3A30] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            Se încarcă progresul…
          </div>
        ) : (
          <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-8">
            <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">Etapa 1</p>
                <h2 className="text-xl font-semibold text-[#1F1F1F]">
                  {resolveString(intentTitle, "Intenții & Cloud")}
                </h2>
                </div>
                <Link
                  href={buildWizardLink("firstInput", "progress-intent")}
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C] hover:text-[#E60012]"
                >
                  {resolveString(t("progressCTA"), "Actualizează")}
                </Link>
              </header>
              {intent ? (
                <>
                  <div className="flex flex-wrap gap-2 text-xs text-[#5C4F45]">
                    {intent.tags.slice(0, 8).map((tag) => (
                      <span key={tag} className="rounded-full border border-[#D8C6B6] px-3 py-1">
                        {tag}
                      </span>
                    ))}
                    {intent.tags.length === 0 ? (
                      <p className="text-sm text-[#A08F82]">
                        {resolveString(
                          t("progressTagsLabel"),
                          "Alege câteva teme pentru a popula secțiunea.",
                        )}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {formattedCategories.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]"
                      >
                        <span>{item.label}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#A08F82]">
                    {`${resolveString(t("progressUrgencyLabel"), "Intensitate")}: ${intent.urgency}/10`} ·{" "}
                    {formatTimestamp(intent.updatedAt, lang)}
                  </p>
                </>
              ) : (
                <div className="space-y-3 text-sm text-[#A08F82]">
                  <p>{resolveString(intentEmpty, "Completează secțiunea Intenții & Cloud.")}</p>
                  <Link
                    href={buildWizardLink("intent", "progress-intent-empty")}
                    className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Actualizează intențiile" : "Update intents"}
                  </Link>
                  <div>
                    <button
                      type="button"
                      disabled={resyncing}
                      onClick={async () => {
                        if (!profile?.id) return;
                        try {
                          setResyncing(true);
                          const fact = await backfillProgressFacts(profile.id);
                          setToastMessage(
                            lang === "ro"
                              ? fact
                                ? "Datele au fost resincronizate."
                                : "Nu am găsit date recente pentru resincronizare."
                              : fact
                              ? "Data was resynchronized."
                              : "No recent data found to resync.",
                          );
                        } catch (e) {
                          console.warn("progress resync failed", e);
                          setToastMessage(
                            lang === "ro" ? "A apărut o eroare la resincronizare." : "Resynchronization failed.",
                          );
                        } finally {
                          setResyncing(false);
                        }
                      }}
                      className="ml-2 rounded-[10px] border border-[#A08F82] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4A3A30] hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
                    >
                      {resyncing
                        ? lang === "ro"
                          ? "Sincronizare..."
                          : "Syncing..."
                        : lang === "ro"
                        ? "Resincronizează"
                        : "Resync now"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">Etapa 2</p>
                <h2 className="text-xl font-semibold text-[#1F1F1F]">
                  {resolveString(motivationTitle, "Motivație & Resurse")}
                </h2>
                </div>
                <Link
                  href={buildWizardLink("intentSummary", "progress-motivation")}
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C] hover:text-[#E60012]"
                >
                  {resolveString(t("progressCTA"), "Actualizează")}
                </Link>
              </header>
              {motivation ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {motivationRows.map((row) => (
                      <MotivationRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                  <p className="text-xs text-[#A08F82]">
                    {formatTimestamp(motivation.updatedAt, lang)}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-[#A08F82]">
                  <p>
                    {resolveString(
                      motivationEmpty,
                      "Completează secțiunea Motivație & Resurse pentru a vedea datele aici.",
                    )}
                  </p>
                  <Link
                    href={buildWizardLink("intentSummary", "progress-motivation-empty")}
                    className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Mergi la motivație" : "Go to motivation"}
                  </Link>
                  <div>
                    <button
                      type="button"
                      disabled={resyncing}
                      onClick={async () => {
                        if (!profile?.id) return;
                        try {
                          setResyncing(true);
                          const fact = await backfillProgressFacts(profile.id);
                          setToastMessage(
                            lang === "ro"
                              ? fact
                                ? "Datele au fost resincronizate."
                                : "Nu am găsit date recente pentru resincronizare."
                              : fact
                              ? "Data was resynchronized."
                              : "No recent data found to resync.",
                          );
                        } catch (e) {
                          console.warn("progress resync failed", e);
                          setToastMessage(
                            lang === "ro" ? "A apărut o eroare la resincronizare." : "Resynchronization failed.",
                          );
                        } finally {
                          setResyncing(false);
                        }
                      }}
                      className="ml-2 rounded-[10px] border border-[#A08F82] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#4A3A30] hover:border-[#E60012] hover:text-[#E60012] disabled:opacity-60"
                    >
                      {resyncing
                        ? lang === "ro"
                          ? "Sincronizare..."
                          : "Syncing..."
                        : lang === "ro"
                        ? "Resincronizează"
                        : "Resync now"}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">Etapa 3</p>
                  <h2 className="text-xl font-semibold text-[#1F1F1F]">
                  {resolveString(evaluationTitle, "Evaluări Omni-Intel")}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={{ pathname: "/evaluation", query: { tab: "os", source: "progress" } }}
                    onClick={() => { void recordEvaluationTabChange("os"); }}
                    className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C] hover:text-[#E60012]"
                  >
                    Omni-Scop
                  </Link>
                  <Link
                    href={{ pathname: "/evaluation", query: { tab: "oa", source: "progress" } }}
                    onClick={() => { void recordEvaluationTabChange("oa"); }}
                    className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C] hover:text-[#E60012]"
                  >
                    Omni-Abil
                  </Link>
                  <Link
                    href={buildEvaluationLink()}
                    className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C] hover:text-[#E60012]"
                  >
                    {resolveString(t("progressViewEvaluation"), "Vezi evaluările")}
                  </Link>
                </div>
              </header>
              {evaluation ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {evaluationRows.map((row) => (
                      <EvalRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                  <p className="text-xs text-[#A08F82]">{formatTimestamp(evaluation.updatedAt, lang)}</p>
                  {evaluation.knowledge ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">Omni-Cunoaștere</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {Object.entries(evaluation.knowledge.breakdown || {}).map(([key, val]) => {
                          const percent = Math.round((val?.percent ?? 0));
                          const label = (omniKnowledgeModules.find((m) => m.key === key)?.title) || key;
                          return (
                            <div key={key} className="rounded-[10px] border border-[#F0E6DA] bg-[#FFFBF7] px-3 py-2">
                              <div className="flex items-center justify-between text-xs text-[#5C4F45]">
                                <span>{label}</span>
                                <span>{percent}%</span>
                              </div>
                              <div className="mt-1 h-1.5 w-full rounded-full bg-[#F6F2EE]">
                                <div className="h-full rounded-full bg-[#2C2C2C]" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3 text-sm text-[#A08F82]">
                  <p>
                    {resolveString(
                      evaluationEmpty,
                      "Completează prima evaluare pentru a vedea scorurile aici.",
                    )}
                  </p>
                  <Link
                    href={buildEvaluationLink()}
                    className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Pornește evaluarea" : "Start the evaluation"}
                  </Link>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#C07963]">Etapa 4</p>
                <h2 className="text-xl font-semibold text-[#1F1F1F]">
                  {resolveString(questTitle, "Quest-uri generate")}
                </h2>
                </div>
              </header>
              {quests.length ? (
                <div className="space-y-3">
                  {quests.map((quest) => (
                    <div
                      key={quest.id}
                      className="space-y-2 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold">{quest.title}</h3>
                        <span className="rounded-full border border-[#D8C6B6] px-2 py-[2px] text-[10px] uppercase tracking-[0.3em] text-[#5C4F45]">
                          {quest.type}
                        </span>
                      </div>
                      <p>{quest.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 text-sm text-[#A08F82]">
                  <p>
                    {resolveString(
                      questEmpty,
                      "Quest-urile apar automat după fiecare evaluare completă.",
                    )}
                  </p>
                  <Link
                    href={buildRecommendationLink()}
                    className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Vezi recomandarea" : "View recommendation"}
                  </Link>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      {toastMessage ? (
        <Toast message={toastMessage} okLabel={lang === "ro" ? "OK" : "OK"} onClose={() => setToastMessage(null)} />
      ) : null}
    </div>
  );
}

function MotivationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{label}</p>
      <p className="text-base font-semibold text-[#1F1F1F]">{value}</p>
    </div>
  );
}

function EvalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C]">
      <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{label}</p>
      <p className="text-base font-semibold text-[#1F1F1F]">{value}</p>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <I18nProvider>
      <ProgressContent />
    </I18nProvider>
  );
}
