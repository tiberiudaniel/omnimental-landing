"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  omniKnowledgeModules,
  computeOmniKnowledgeScore,
  type OmniKnowledgeScores,
} from "@/lib/omniKnowledge";
import { submitOmniKnowledgeAssessment } from "@/lib/submitEvaluation";
import { recordKnowledgeViewSummary, recordOmniPatch } from "@/lib/progressFacts";
import { useProfile } from "./ProfileProvider";
import { OMNIKUNO_MODULES as LESSON_MODULES } from "@/config/omniKunoLessons";
import {
  OMNIKUNO_MODULES as MODULE_META,
  getLegacyModuleKeyById,
  resolveModuleId,
  type OmniKunoModuleId,
} from "@/config/omniKunoModules";

type KunoAreaKey = OmniKunoModuleId;

const AREA_LABELS_RO = MODULE_META.reduce((acc, meta) => {
  acc[meta.id as KunoAreaKey] = meta.label.ro;
  return acc;
}, {} as Record<KunoAreaKey, string>);

const AREA_LABELS_EN = MODULE_META.reduce((acc, meta) => {
  acc[meta.id as KunoAreaKey] = meta.label.en;
  return acc;
}, {} as Record<KunoAreaKey, string>);

const KNOWLEDGE_MODULE_TO_AREA: Record<string, KunoAreaKey> = {
  hrv: "emotional_balance",
  breath: "emotional_balance",
  sleep: "energy_body",
  cbt: "relationships_communication",
  ooda: "decision_discernment",
  mindfulness: "self_trust",
};

const buildDefaultAnswers = () => {
  const map: Record<string, number | null> = {};
  omniKnowledgeModules.forEach((module) => {
    module.questions.forEach((question) => {
      map[question.id] = null;
    });
  });
  return map;
};

const TOTAL_QUESTIONS = omniKnowledgeModules.reduce(
  (sum, module) => sum + module.questions.length,
  0,
);

const MIN_RECOMMENDED_DURATION_MS = 3 * 60 * 1000; // 3 minutes

type Props = {
  lang: "ro" | "en";
};

export default function OmniKnowledgeQuiz({ lang }: Props) {
  const { profile } = useProfile();
  const [answers, setAnswers] = useState<Record<string, number | null>>(buildDefaultAnswers);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);
  const [flagSuspicious, setFlagSuspicious] = useState(false);
  const [recommendedArea, setRecommendedArea] = useState<KunoAreaKey | null>(null);
  const quizStartRef = useRef<number>(Date.now());
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const score = useMemo(() => computeOmniKnowledgeScore(answers), [answers]);
  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => typeof value === "number").length,
    [answers],
  );
  const completionPercent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  const allAnswered = answeredCount === TOTAL_QUESTIONS;

  const handleSelect = (id: string, index: number) => {
    setAnswers((prev) => ({ ...prev, [id]: index }));
    setMessage(null);
    setError(null);
  };

  const resetQuiz = () => {
    setAnswers(buildDefaultAnswers());
    setMessage(null);
    setError(null);
    setLastDurationMs(null);
    setFlagSuspicious(false);
    setRecommendedArea(null);
    quizStartRef.current = Date.now();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!allAnswered) {
      setError(
        lang === "ro"
          ? "Răspunde la toate întrebările înainte de a salva scorul."
          : "Please answer every question before submitting.",
      );
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    const now = Date.now();
    const durationMs = now - quizStartRef.current;
    const suspicious = durationMs < MIN_RECOMMENDED_DURATION_MS;

    try {
      const cleaned = Object.entries(answers).reduce<Record<string, number>>((acc, [id, value]) => {
        if (typeof value === "number") {
          acc[id] = value;
        }
        return acc;
      }, {});
      const areaAggregate = aggregateAreaStats(score);
      const recommendedAreaId = areaAggregate.bestArea;
      const breakdown = buildExamBreakdown(score);
      const legacyKey = getLegacyModuleKeyById(recommendedAreaId);
      const recommendedLessonModuleId = (() => {
        if (!legacyKey) return null;
        const mapped = resolveModuleId(legacyKey);
        if (mapped && LESSON_MODULES[mapped as OmniKunoModuleId]) {
          return LESSON_MODULES[mapped as OmniKunoModuleId].moduleId;
        }
        return null;
      })();
      await submitOmniKnowledgeAssessment({
        lang,
        score,
        answers: cleaned,
        metadata: {
          completionDurationMs: durationMs,
          completionDurationSeconds: Math.round(durationMs / 1000),
          totalQuestions: TOTAL_QUESTIONS,
          answeredCount,
          completionPercent,
          suspiciousSpeed: suspicious,
          submittedAt: new Date(now).toISOString(),
          clientUserAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        },
      });
      setLastDurationMs(durationMs);
      setFlagSuspicious(suspicious);
      // Patch Omni: knowledgeIndex + mark at least one test completed
      try {
        await recordOmniPatch(
          {
            kuno: {
              knowledgeIndex: score.percent,
              completedTests: 1,
              ...(recommendedLessonModuleId ? { recommendedModuleId: recommendedLessonModuleId } : {}),
              recommendedArea: recommendedAreaId,
              exam: {
                score: score.percent,
                lastTakenAt: now,
                breakdown,
              },
            },
          },
          profile?.id,
        );
      } catch (patchErr) {
        console.warn("omni patch (knowledgeIndex) failed", patchErr);
      }
      setRecommendedArea(recommendedAreaId);
      setMessage(
        lang === "ro"
          ? `Scorul Omni-Cunoaștere a fost salvat. Începe cu misiunile din zona ${AREA_LABELS_RO[recommendedAreaId]}.`
          : `Your Omni-Knowledge score is saved. Start with missions in ${AREA_LABELS_EN[recommendedAreaId]}.`,
      );
    } catch (submitError) {
      console.error("OC submit failed", submitError);
      setError(
        lang === "ro"
          ? "Nu am putut salva evaluarea. Încearcă din nou."
          : "Could not save the quiz. Please retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <header className="space-y-2 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">Omni-Cunoaștere</p>
        <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">
          {lang === "ro"
            ? "Verifică ce știi despre instrumentele OmniMental"
            : "Check your knowledge of OmniMental tools"}
        </h2>
        <p className="text-sm text-[var(--omni-ink-soft)]">
          {lang === "ro"
            ? "6 module × 8 întrebări (aprox. 6–7 minute). Primești feedback imediat și scor pe module."
            : "6 modules × 8 questions (about 6–7 minutes). Get instant feedback and module scores."}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          <span>
            {answeredCount}/{TOTAL_QUESTIONS}{" "}
            {lang === "ro" ? "întrebări completate" : "questions answered"}
          </span>
          <span>
            {completionPercent}% {lang === "ro" ? "progres" : "progress"}
          </span>
        </div>
        <div ref={summaryRef} id="knowledge-summary">
          <KnowledgeSummaryCard score={score} lang={lang} />
        </div>
        {lastDurationMs !== null && (
          <DurationBadge
            durationMs={lastDurationMs}
            suspicious={flagSuspicious}
            lang={lang}
          />
        )}
      </header>

      {error && (
        <div className="border border-[var(--omni-energy)] bg-[#FBE9EB] px-4 py-3 text-sm text-[var(--omni-ink)]">{error}</div>
      )}
      {message && (
        <div className="space-y-3 border border-[var(--omni-success)] bg-[var(--omni-success-soft)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]">
          <p>{message}</p>
          {recommendedArea ? (
            <Link
              href="/omni-kuno"
              className="inline-flex items-center rounded-full border border-[var(--omni-ink-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink-soft)] transition hover:bg-[var(--omni-ink-soft)] hover:text-white"
            >
              {lang === "ro" ? "Deschide OmniKuno" : "Open OmniKuno"}
            </Link>
          ) : null}
        </div>
      )}

      <div className="space-y-6 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[var(--omni-ink)]">
          {lang === "ro" ? "Întrebări pe module" : "Module questions"}
        </h3>
        <div className="space-y-6">
          {omniKnowledgeModules.map((module) => (
            <article
              key={module.key}
              className="space-y-4 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4"
            >
              <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Modul</p>
                  <h4 className="text-base font-semibold text-[var(--omni-ink)]">{module.title}</h4>
                </div>
                <span className="text-xs uppercase tracking-[0.35em] text-[var(--omni-ink-soft)]">
                  {module.questions.length} itemi
                </span>
              </header>
              <div className="space-y-4">
                {module.questions.map((question) => {
                  const selected = answers[question.id];
                  const showFeedback = typeof selected === "number";
                  const isCorrect = showFeedback && selected === question.correctIndex;
                  return (
                    <div
                      key={question.id}
                      className="space-y-2 rounded-[8px] border border-[#F6EDE2] bg-[var(--omni-surface-card)] px-3 py-3 text-sm text-[var(--omni-ink)]"
                    >
                      <p className="font-medium">{question.question}</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {question.options.map((option, index) => {
                          const active = selected === index;
                          const correctOption = index === question.correctIndex;
                          const showState = showFeedback && (active || correctOption);
                          const baseClass =
                            "rounded-[8px] border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--omni-energy)]";
                          let stateClass = "border-[#E5D3C4] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]";
                          if (showState) {
                            stateClass = correctOption
                              ? "border-[#0F6D45] bg-[#EEF8F2] text-[#0F3B27]"
                              : "border-[var(--omni-energy)] bg-[#FBE9EB] text-[#5C0A0A]";
                          } else if (active) {
                            stateClass = "border-[var(--omni-ink)] text-[var(--omni-ink)]";
                          }
                          return (
                            <button
                              key={`${question.id}-${index}`}
                              type="button"
                              onClick={() => handleSelect(question.id, index)}
                              className={`${baseClass} ${stateClass}`}
                            >
                              <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>{" "}
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {showFeedback && (
                        <p className="text-xs text-[var(--omni-ink-soft)]">
                          {isCorrect
                            ? lang === "ro"
                              ? "Corect ✓"
                              : "Correct ✓"
                            : lang === "ro"
                            ? `Răspuns corect: ${question.options[question.correctIndex]}`
                            : `Correct answer: ${question.options[question.correctIndex]}`}
                          {" • "}
                          {question.rationale}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? lang === "ro"
                ? "Se salvează..."
                : "Saving..."
              : lang === "ro"
              ? "Salvează scorul"
              : "Save score"}
          </button>
          <button
            type="button"
            onClick={resetQuiz}
            className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)] transition hover:bg-[var(--omni-bg-paper)]"
          >
            {lang === "ro" ? "Resetează răspunsurile" : "Reset answers"}
          </button>
          <button
            type="button"
            onClick={() => {
              summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              void recordKnowledgeViewSummary();
            }}
            className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
          >
            {lang === "ro" ? "Vezi punctajul general" : "View overall score"}
          </button>
        </div>
        <p className="text-xs text-[var(--omni-ink-soft)]">
          {lang === "ro"
            ? "Scorul minim recomandat pentru progres rapid: 70%+"
            : "Recommended mastery threshold: 70%+"}
        </p>
      </div>

      <ModuleBreakdown score={score} />
    </form>
  );
}

function KnowledgeSummaryCard({ score, lang }: { score: OmniKnowledgeScores; lang: "ro" | "en" }) {
  return (
    <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4 text-sm text-[var(--omni-ink-soft)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            {lang === "ro" ? "Punctaj total" : "Total score"}
          </p>
          <p className="text-3xl font-semibold text-[var(--omni-ink)]">
            {score.percent}
            <span className="text-base text-[var(--omni-ink-soft)]">% </span>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              ({score.raw}/{score.max})
            </span>
          </p>
        </div>
        <div className="space-y-1 text-xs text-[var(--omni-ink-soft)]">
          <p>
            {score.percent >= 70
              ? lang === "ro"
                ? "Ai o bază solidă; treci la Omni-Abil pentru aplicare."
                : "Solid base; move to Omni-Abil to practice."
              : lang === "ro"
              ? "Revizitează modulele cu scor mai mic pentru consolidare."
              : "Review low-score modules before moving on."}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuleBreakdown({ score }: { score: OmniKnowledgeScores }) {
  return (
    <section className="space-y-4 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
      <h3 className="text-lg font-semibold text-[var(--omni-ink)]">Breakdown pe module</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {omniKnowledgeModules.map((module) => {
          const moduleScore = score.breakdown[module.key];
          const percent = moduleScore?.percent ?? 0;
          return (
            <div
              key={module.key}
              className="space-y-2 rounded-[10px] border border-[#F5EBE0] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink)]"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--omni-ink)]">{module.title}</p>
                <span className="text-xs uppercase tracking-[0.3em] text-[var(--omni-ink-soft)]">
                  {moduleScore ? `${moduleScore.raw}/${moduleScore.max}` : "0"}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--omni-bg-paper)]">
                <div
                  className="h-full rounded-full bg-[var(--omni-ink)]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function aggregateAreaStats(score: OmniKnowledgeScores) {
  const stats: Record<KunoAreaKey, { raw: number; max: number; percent: number }> = MODULE_META.reduce(
    (acc, meta) => {
      acc[meta.id as KunoAreaKey] = { raw: 0, max: 0, percent: 0 };
      return acc;
    },
    {} as Record<KunoAreaKey, { raw: number; max: number; percent: number }>,
  );
  Object.entries(score.breakdown).forEach(([moduleKey, value]) => {
    const area = KNOWLEDGE_MODULE_TO_AREA[moduleKey] ?? "emotional_balance";
    stats[area].raw += value.raw;
    stats[area].max += value.max;
  });
  let bestArea: KunoAreaKey = "emotional_balance";
  let bestPct = -1;
  (Object.keys(stats) as KunoAreaKey[]).forEach((area) => {
    const areaData = stats[area];
    areaData.percent = areaData.max ? Math.round((areaData.raw / areaData.max) * 100) : 0;
    if (areaData.percent > bestPct) {
      bestPct = areaData.percent;
      bestArea = area;
    }
  });
  return { stats, bestArea };
}

function buildExamBreakdown(score: OmniKnowledgeScores) {
  const map: Record<string, number> = {};
  Object.entries(score.breakdown).forEach(([moduleKey, data]) => {
    const ratio = data.max ? data.raw / data.max : 0;
    const clamped = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
    map[moduleKey] = Number(clamped.toFixed(4));
  });
  return map;
}

function DurationBadge({
  durationMs,
  suspicious,
  lang,
}: {
  durationMs: number;
  suspicious: boolean;
  lang: "ro" | "en";
}) {
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const tone = suspicious
    ? {
        border: "#F9C6C1",
        bg: "var(--omni-danger-soft)",
        text: "var(--omni-danger)",
        icon: "⚠️",
        label: lang === "ro" ? "Completare foarte rapidă" : "Completion too fast",
        helper:
          lang === "ro"
            ? "Verifică dacă răspunsurile reflectă experiența ta (date potențial distorsionate)."
            : "Double-check the answers; data might be unreliable.",
      }
    : {
        border: "var(--omni-success)",
        bg: "var(--omni-success-soft)",
        text: "var(--omni-ink-soft)",
        icon: "⏱️",
        label: lang === "ro" ? "Durata completării" : "Completion time",
        helper:
          lang === "ro"
            ? "Ritm potrivit pentru răspunsuri reflec­tate."
            : "Pace looks consistent with reflective answers.",
      };
  return (
    <div
      className="space-y-1 rounded-[12px] px-4 py-3 text-sm"
      style={{ border: `1px solid ${tone.border}`, backgroundColor: tone.bg, color: tone.text }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em]">
        <span>{tone.icon}</span>
        <span>{tone.label}</span>
      </div>
      <p className="text-lg font-semibold text-[var(--omni-ink)]">{formatted} min</p>
      <p className="text-xs">{tone.helper}</p>
    </div>
  );
}
