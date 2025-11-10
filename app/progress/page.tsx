"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "../../components/MenuOverlay";
import AccountModal from "../../components/AccountModal";
import { useNavigationLinks } from "../../components/useNavigationLinks";
import { I18nProvider, useI18n } from "../../components/I18nProvider";
import { useProfile } from "../../components/ProfileProvider";
import { useProgressFacts } from "../../components/useProgressFacts";
import type { ProgressIntentCategories } from "@/lib/progressFacts";
import { getRecommendationReasonCopy } from "@/lib/recommendationCopy";
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
  const { t, lang } = useI18n();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const { data: progress, loading, error } = useProgressFacts(profile?.id);

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
                  href="/#intent-cloud"
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
                    href="/#intent-cloud"
                    className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Actualizează intențiile" : "Update intents"}
                  </Link>
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
                  href="/#motivation"
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
                    href="/evaluation"
                    className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
                  >
                    {lang === "ro" ? "Mergi la motivație" : "Go to motivation"}
                  </Link>
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
                <Link
                  href="/evaluation"
                  className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2C2C2C] hover:text-[#E60012]"
                >
                  {resolveString(t("progressViewEvaluation"), "Vezi evaluările")}
                </Link>
              </header>
              {evaluation ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {evaluationRows.map((row) => (
                      <EvalRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                  <p className="text-xs text-[#A08F82]">{formatTimestamp(evaluation.updatedAt, lang)}</p>
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
                    href="/evaluation"
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
                    href="/recommendation"
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
