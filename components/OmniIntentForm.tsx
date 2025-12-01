"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useProfile } from "./ProfileProvider";
import { useProgressFacts } from "./useProgressFacts";
import { buildIndicatorSummary, INDICATOR_LABELS, type IndicatorChartKey, type IndicatorChartValues } from "@/lib/indicators";
import RadarIndicators from "./RadarIndicators";
import { intentCategoryLabels } from "@/lib/intentExpressions";
import { computeOmniIntentScore, type OmniIntentAnswers } from "@/lib/omniIntent";
import { submitOmniIntentAssessment } from "@/lib/submitEvaluation";
// Removed header-level JournalTrigger per request; section-level buttons remain
import { useTStrings } from "./useTStrings";
import type { JournalContext } from "./journal/useJournal";
// Simple emoji icon to avoid extra dependencies

const defaultIntentAnswers: OmniIntentAnswers = {
  knowledge: [5, 5, 5, 5],
  belief: [5, 5, 5, 5],
  commitment: [5, 5, 5, 5],
  planning: [5, 5, 5, 5],
  progress: 0,
};

const FIELD_LABELS: Record<
  "knowledge" | "belief" | "commitment" | "planning",
  readonly [string, string, string, string]
> = {
  knowledge: [
    "Obiectiv clar formulat",
    "Tehnici cunoscute pentru săptămână",
    "Indicatori de progres clari",
    "Bariere și răspunsuri anticipate",
  ],
  belief: [
    "Obiectiv realist pentru mine",
    "Cred că tehnicile vor funcționa",
    "Îmi atribui progresul acțiunilor mele",
    "După eșec fac ajustări",
  ],
  commitment: [
    "Timp blocat în calendar",
    "Dispus(ă) să evit distragerile",
    "Raport onest, chiar zero",
    "Am partener de responsabilizare",
  ],
  planning: [
    "Plan zilnic, cu durată și loc",
    "Trigger clar pentru start",
    "Plan B de 5 minute",
    "Sistem vizibil de urmărire",
  ],
};

type ArrayKeys = "knowledge" | "belief" | "commitment" | "planning";

type Props = {
  lang: "ro" | "en";
  onOpenJournal?: (ctx: JournalContext) => void;
  activeJournalSourceBlock?: string;
};

export default function OmniIntentForm({ lang, onOpenJournal, activeJournalSourceBlock }: Props) {
  const { profile } = useProfile();
  const { data: progress } = useProgressFacts(profile?.id);
  const { s } = useTStrings();
  const [answers, setAnswers] = useState<OmniIntentAnswers>(defaultIntentAnswers);
  const scores = useMemo(() => computeOmniIntentScore(answers), [answers]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateArray = (key: ArrayKeys, index: number, value: number) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [key]: [...prev[key]] as OmniIntentAnswers[ArrayKeys],
      } as OmniIntentAnswers;
      next[key][index] = value;
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await submitOmniIntentAssessment({
        lang,
        result: scores,
        answers: {
          knowledge: Math.round(
            answers.knowledge.reduce((sum, v) => sum + v, 0) / answers.knowledge.length,
          ),
          belief: Math.round(answers.belief.reduce((sum, v) => sum + v, 0) / answers.belief.length),
          commitment: Math.round(
            answers.commitment.reduce((sum, v) => sum + v, 0) / answers.commitment.length,
          ),
          planning: Math.round(
            answers.planning.reduce((sum, v) => sum + v, 0) / answers.planning.length,
          ),
          progress: answers.progress,
        },
      });
      setMessage(
        lang === "ro"
          ? "Scorul Omni-Scop a fost salvat."
          : "Omni-Intent score saved successfully.",
      );
    } catch (error) {
      console.error("OS submit failed", error);
      setMessage(
        lang === "ro"
          ? "Nu am putut salva evaluarea. Încearcă din nou."
          : "Could not save assessment. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const headerTitleFor = (k: keyof typeof FIELD_LABELS) => {
    if (lang === "ro") {
      switch (k) {
        case "knowledge":
          return "Claritate & cunoaștere";
        case "belief":
          return "Convingeri & încredere";
        case "commitment":
          return "Angajament";
        case "planning":
          return "Plan & execuție";
      }
    }
    switch (k) {
      case "knowledge":
        return "Clarity & knowledge";
      case "belief":
        return "Beliefs & confidence";
      case "commitment":
        return "Commitment";
      case "planning":
        return "Plan & execution";
    }
  };

  const getLevelLabel = (val: number) => {
    if (val <= 3) return lang === "ro" ? "Nivel scăzut" : "Low";
    if (val <= 6) return lang === "ro" ? "Nivel mediu" : "Medium";
    return lang === "ro" ? "Nivel ridicat" : "High";
  };

  const renderSection = (
    key: keyof typeof FIELD_LABELS,
    labels: readonly [string, string, string, string],
  ) => {
    const values = answers[key] as number[];
    const avg = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
    const scaleDescription = lang === "ro" ? "0 = sunt ok / 10 = am nevoie urgentă de schimbare" : "0 = I’m ok / 10 = urgent change needed";

    const isActive = activeJournalSourceBlock === `section_${key}`;
    return (
      <section
        className={`space-y-4 rounded-[16px] border px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)] ${
          isActive ? "border-[var(--omni-ink)]/70 bg-[var(--omni-bg-paper)]" : "border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]"
        }`}
      >
        {isActive ? (
          <span className="mb-1 inline-block rounded-full bg-[var(--omni-bg-paper)] px-2 py-0.5 text-[10px] text-[var(--omni-ink)]">
            {s("journal.badge.active", "Jurnal activ")}
          </span>
        ) : null}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--omni-ink)]">{headerTitleFor(key)}</h3>
            <p className="text-xs text-[var(--omni-muted)]">{scaleDescription}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-[10px] border border-[var(--omni-border-soft)] px-2 text-[11px] text-[var(--omni-ink)] hover:border-[#C9B8A8]"
            onClick={() => {
              if (!onOpenJournal) return;
              const ctx: JournalContext = {
                theme: headerTitleFor(key) ?? String(key),
                sourcePage: "scop_intentii",
                sourceBlock: `section_${key}`,
                suggestedSnippets: [
                  `Întrebare: ${headerTitleFor(key) ?? String(key)}`,
                  (lang === "ro" ? "Valoare actuală: " : "Current value: ") + `${avg} / 10`,
                  scaleDescription,
                ].filter(Boolean) as string[],
              };
              onOpenJournal(ctx);
            }}
            aria-label={lang === "ro" ? "Deschide jurnal" : "Open journal"}
            title={lang === "ro" ? "Deschide jurnal" : "Open journal"}
          >
            <span role="img" aria-hidden className="inline-block text-[12px]">📝</span>
            Jurnal
          </button>
        </div>

        {labels.map((label, index) => {
          const v = values[index] ?? 0;
          const valueClass = v >= 7 ? "text-[var(--omni-energy)]" : "text-[var(--omni-ink)]";
          return (
            <div key={`${key}-${index}`} className="rounded-[10px] border border-[#F6EDE2] bg-[var(--omni-bg-paper)] p-3">
              <p className="text-sm text-[var(--omni-ink)]">{label}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-16 text-center text-[11px] text-[var(--omni-muted)]">0–10</div>
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={v}
                    onChange={(event) => updateArray(key, index, Number(event.target.value))}
                    className="omni-range"
                    style={{ "--range-progress": `${(v / 10) * 100}%` } as CSSProperties}
                  />
                </div>
                <div className={`w-16 text-right text-sm font-semibold ${valueClass}`}>{v} / 10</div>
              </div>
              <p className="mt-1 text-[11px] text-[var(--omni-muted)]">{getLevelLabel(v)}</p>
            </div>
          );
        })}

        <p className="mt-1 text-[11px] text-[var(--omni-muted)]">
          {lang === "ro" ? "Ultima notare (medie secțiune): " : "Last note (section average): "}
          <span className="font-semibold text-[var(--omni-ink)]">{avg} / 10</span>
        </p>
      </section>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <header className="space-y-2 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-energy)]">
          {lang === "ro" ? "Omni-Scop" : "Omni-Intent"}
        </p>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">
          {lang === "ro"
            ? "Claritate, angajament și plan pentru obiectivul tău"
            : "Clarity, commitment, and planning for your goal"}
          </h2>
        </div>
        <p className="text-sm text-[var(--omni-ink-soft)]">
          {lang === "ro"
            ? "Completează fiecare rubrică (0–10). Scorul final combină Knowledge, Belief, Commitment, Planning și progresul obiectivului."
            : "Set each rubric (0–10). Final score blends Knowledge, Belief, Commitment, Planning, plus goal progress."}
        </p>
        {progress?.intent ? (
          <div className="mt-3 grid gap-4 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.05)] md:grid-cols-2">
            <div className="space-y-2 text-left">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                {lang === "ro" ? "Obiectiv curent" : "Current objective"}
              </p>
              {(() => {
                const categories = progress.intent.categories ?? [];
                const primary = categories.slice().sort((a,b)=>b.count-a.count)[0];
                const labels = intentCategoryLabels;
                const label = primary
                  ? (labels[primary.category as keyof typeof labels]?.[lang] ?? primary.category)
                  : (lang === "ro" ? "Nespecificat" : "Unspecified");
                return (
                  <h3 className="text-lg font-semibold text-[var(--omni-ink)]">{label}</h3>
                );
              })()}
              {progress.intent.firstExpression ? (
                <p className="text-sm text-[var(--omni-ink-soft)]">{progress.intent.firstExpression}</p>
              ) : null}
              {Array.isArray(progress.intent.tags) && progress.intent.tags.length ? (
                <div className="flex flex-wrap gap-2">
                  {progress.intent.tags.slice(0, 8).map((tag: string) => (
                    <span key={tag} className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs text-[var(--omni-ink-soft)]">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-center">
              {(() => {
                const categories = progress.intent?.categories ?? [];
                const { chart } = buildIndicatorSummary(categories);
                const values: IndicatorChartValues = chart as IndicatorChartValues;
                const max = Math.max(...Object.values(values));
                const normalized = (key: IndicatorChartKey) => {
                  const raw = Number(values[key]) || 0;
                  if (max <= 0) return 0;
                  return Math.round(((raw / max) * 5) * 10) / 10;
                };
                const langKey = lang === "ro" ? "ro" : "en";
                const data = (Object.keys(INDICATOR_LABELS) as IndicatorChartKey[]).map((k) => ({
                  key: k,
                  label: INDICATOR_LABELS[k][langKey],
                  value: normalized(k),
                }));
                return <RadarIndicators data={data} maxValue={5} />;
              })()}
            </div>
          </div>
        ) : null}
      </header>

      {renderSection("knowledge", FIELD_LABELS.knowledge)}
      {renderSection("belief", FIELD_LABELS.belief)}
      {renderSection("commitment", FIELD_LABELS.commitment)}
      {renderSection("planning", FIELD_LABELS.planning)}

      <section className="space-y-4 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <p className="text-sm font-semibold text-[var(--omni-ink)]">
          {lang === "ro" ? "Procent progres obiectiv (ultimele 7 zile)" : "Goal progress (%)"}
        </p>
        <input
          type="range"
          min={0}
          max={100}
          value={answers.progress}
          onChange={(event) =>
            setAnswers((prev) => ({ ...prev, progress: Number(event.target.value) }))
          }
          className="w-full accent-[var(--omni-ink)]"
        />
        <span className="text-xs uppercase tracking-[0.25em] text-[var(--omni-muted)]">
          {answers.progress}%
        </span>
      </section>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
            ? "Salvează Omni-Scop"
            : "Save Omni-Intent"}
        </button>
        {message ? <p className="text-sm text-[var(--omni-ink-soft)]">{message}</p> : null}
      </div>

      <section className="space-y-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-[var(--omni-ink)]">
          {lang === "ro" ? "Rezumat scor" : "Score summary"}
        </h3>
        <p className="text-sm text-[var(--omni-ink-soft)]">
          Total: <span className="font-semibold text-[var(--omni-ink)]">{scores.total}/100</span>
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {([
            ["k", "Knowledge"],
            ["b", "Belief"],
            ["c", "Commitment"],
            ["p", "Planning"],
            ["g", "Progress"],
          ] as const).map(([key, label]) => (
            <div key={key} className="space-y-1 rounded-[10px] border border-[#F6EDE2] bg-[var(--omni-bg-paper)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--omni-ink)]">
                {label}: {scores[key as keyof typeof scores]}%
              </p>
              <div className="h-1.5 w-full rounded-full bg-[#F6EDE2]">
                <div
                  className="h-full rounded-full bg-[var(--omni-ink)]"
                  style={{ width: `${scores[key as keyof typeof scores]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
