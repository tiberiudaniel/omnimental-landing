"use client";

import { useState } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import type { WowLessonDefinition } from "@/config/wowLessonsV2";
import type { TraitSignal, TelemetrySessionType } from "@/lib/telemetry";
import { getCanonDomainForAxis } from "@/lib/profileEngine";

export type WowCompletionPayload = {
  traitSignals: TraitSignal[];
  difficultyFeedback?: "too_easy" | "just_right" | "too_hard";
};

type Props = {
  lesson: WowLessonDefinition;
  sessionType?: TelemetrySessionType;
  xpRewardLabel?: string;
  onComplete?: (payload: WowCompletionPayload) => Promise<void> | void;
  mode?: "full" | "short";
};

export default function WowLessonShell({
  lesson,
  sessionType = "daily",
  xpRewardLabel,
  onComplete,
  mode = "full",
}: Props) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [contextAnswer, setContextAnswer] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [difficulty, setDifficulty] = useState<"too_easy" | "just_right" | "too_hard" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isShort = mode === "short";
  const disableStep0 = !contextAnswer;
  const disableStep2 = reflection.trim().length === 0 || saving || !difficulty;

  const buildTraitSignals = (): TraitSignal[] => {
    const signals: TraitSignal[] = [
      {
        trait: lesson.traitPrimary,
        canonDomain: lesson.canonDomain,
        deltaSelfReport: 1,
        confidence: "medium",
      },
    ];
    if (lesson.traitSecondary) {
      signals.push({
        trait: lesson.traitSecondary,
        canonDomain: getCanonDomainForAxis(lesson.traitSecondary),
        deltaSelfReport: 0.5,
        confidence: "low",
      });
    }
    return signals;
  };

  const handleComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      await onComplete?.({
        traitSignals: buildTraitSignals(),
        difficultyFeedback: difficulty ?? undefined,
      });
    } catch (err) {
      console.warn("wow lesson completion failed", err);
      setError("Nu am reușit să salvăm progresul. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  const headerLabel =
    sessionType === "wizard"
      ? "WOW • Onboarding"
      : sessionType === "daily"
      ? "WOW • L1/L2/L3"
      : "WOW • Session";
  const contextOptions = isShort ? lesson.context.options.slice(0, 2) : lesson.context.options;
  const exerciseSteps = isShort ? lesson.exercise.steps.slice(0, 2) : lesson.exercise.steps;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4 rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
          {headerLabel}
          {isShort ? " · Mod scurt" : ""}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--omni-ink)]">{lesson.title}</h1>
        <p className="text-sm text-[var(--omni-ink-soft)]">{lesson.summary}</p>
      </header>

      {step === 0 ? (
        <article className="rounded-[16px] border border-[var(--omni-border-soft)] bg-white px-4 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{lesson.context.eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold">{lesson.context.title}</h2>
          <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">{lesson.context.description}</p>
          <p className="mt-4 text-sm font-semibold">{lesson.context.question}</p>
          <div className="mt-3 grid gap-2">
            {contextOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setContextAnswer(option)}
                className={`rounded-[10px] border px-4 py-2 text-sm text-left ${
                  contextAnswer === option ? "border-[var(--omni-energy)] bg-[var(--omni-energy)]/10" : "border-[var(--omni-border-soft)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <OmniCtaButton type="button" disabled={disableStep0} onClick={() => setStep(1)}>
              Continuă
            </OmniCtaButton>
          </div>
        </article>
      ) : null}

      {step === 1 ? (
        <article className="rounded-[16px] border border-[var(--omni-border-soft)] bg-white px-4 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Exercițiu</p>
          <h2 className="mt-1 text-lg font-semibold">{lesson.exercise.title}</h2>
          {lesson.exercise.durationHint ? (
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">{lesson.exercise.durationHint}</p>
          ) : null}
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--omni-ink)]/85">
            {exerciseSteps.map((stepText, idx) => (
              <li key={idx}>{stepText}</li>
            ))}
          </ol>
          <div className="mt-4 flex justify-end">
            <OmniCtaButton type="button" onClick={() => setStep(2)}>
              Gata
            </OmniCtaButton>
          </div>
        </article>
      ) : null}

      {step === 2 ? (
        <article className="rounded-[16px] border border-[var(--omni-border-soft)] bg-white px-4 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Reflection</p>
          <h2 className="mt-1 text-lg font-semibold">{lesson.reflection.title}</h2>
          <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">{lesson.reflection.prompt}</p>
          <textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder={lesson.reflection.placeholder}
            className="mt-3 h-28 w-full rounded-[12px] border border-[var(--omni-border-soft)] bg-transparent px-3 py-2 text-sm text-[var(--omni-ink)] focus:border-[var(--omni-energy)] focus:outline-none"
          />
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              Cum ți s-a părut exercițiul?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { value: "too_easy", label: "Prea ușor" },
                { value: "just_right", label: "Potrivit" },
                { value: "too_hard", label: "Prea greu" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value as typeof difficulty)}
                  className={`rounded-[10px] border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
                    difficulty === option.value
                      ? "border-[var(--omni-energy)] bg-[var(--omni-energy)]/10"
                      : "border-[var(--omni-border-soft)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">{lesson.reflection.mapping}</p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          {xpRewardLabel ? (
            <p className="mt-3 text-sm font-semibold text-[var(--omni-energy)]">{xpRewardLabel}</p>
          ) : null}
          <div className="mt-4 flex justify-end">
            <OmniCtaButton type="button" disabled={disableStep2 || saving} onClick={handleComplete}>
              {saving ? "Se salvează…" : "Finalizează"}
            </OmniCtaButton>
          </div>
        </article>
      ) : null}
    </section>
  );
}
