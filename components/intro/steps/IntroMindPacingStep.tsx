"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useI18n } from "@/components/I18nProvider";
import { getTodayKey } from "@/lib/dailyCompletion";
import {
  MIND_PACING_QUESTIONS,
  getMindPacingQuestionById,
} from "@/config/mindPacing";
import {
  ensureMindPacingQuestion,
  getMindPacingEntry,
  getMindPacingRotationIndex,
  getLastMindPacingQuestionId,
  setMindPacingRotationIndex,
  storeMindPacingAnswer,
} from "@/lib/mindPacingStore";
import {
  getAxisFromMindPacingSignal,
  getMindPacingSignalFromOption,
  isMindPacingSignalTag,
  getAxisFromMindPacingTag,
  type MindPacingSignalTag,
} from "@/lib/mindPacingSignals";
import { recordDailyRunnerEvent, recordMindPacingSignal } from "@/lib/progressFacts/recorders";
import type { StepComponentProps } from "@/components/stepRunner/types";
import type { CatAxisId } from "@/lib/profileEngine";

type MindPacingOption = (typeof MIND_PACING_QUESTIONS)[number]["options"][number];

export type IntroMindPacingResult = {
  dayKey: string;
  questionId: string;
  optionId: string;
  answerTagPrimary: string;
  answerTagsSecondary: string[];
  mindTag: MindPacingSignalTag | null;
  axisId: CatAxisId | null;
};

type MindPacingExperienceProps = {
  onContinue: (result: IntroMindPacingResult) => void;
  persistedResult?: IntroMindPacingResult | null;
  continueTestId?: string;
};

function resolveQuestion(dayKey: string) {
  const existing = getMindPacingEntry(dayKey);
  let nextQuestionId = existing?.questionId;
  if (!nextQuestionId) {
    const total = MIND_PACING_QUESTIONS.length;
    const lastIndex = getMindPacingRotationIndex();
    let nextIndex = total ? (lastIndex + 1 + total) % total : 0;
    const lastQuestionId = getLastMindPacingQuestionId(dayKey);
    if (total > 1 && lastQuestionId && MIND_PACING_QUESTIONS[nextIndex]?.id === lastQuestionId) {
      nextIndex = (nextIndex + 1) % total;
    }
    nextQuestionId = MIND_PACING_QUESTIONS[nextIndex]?.id ?? MIND_PACING_QUESTIONS[0]?.id;
    setMindPacingRotationIndex(nextIndex);
    if (nextQuestionId) {
      ensureMindPacingQuestion(dayKey, nextQuestionId);
    }
  }
  const question = nextQuestionId ? getMindPacingQuestionById(nextQuestionId) : null;
  return question ?? MIND_PACING_QUESTIONS[0];
}

export function MindPacingExperience({
  onContinue,
  persistedResult = null,
  continueTestId = "mindpacing-continue",
}: MindPacingExperienceProps) {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const dayKey = useMemo(() => getTodayKey(), []);
  const [hydrated, setHydrated] = useState(false);
  const [question, setQuestion] = useState(() => resolveQuestion(dayKey));
  const [phase, setPhase] = useState<"question" | "result">(() => {
    const entry = getMindPacingEntry(dayKey);
    return entry?.answerTagPrimary ? "result" : "question";
  });
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [mindTag, setMindTag] = useState<MindPacingSignalTag | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setQuestion(resolveQuestion(dayKey));
  }, [dayKey]);

  useEffect(() => {
    const entry = getMindPacingEntry(dayKey);
    if (!entry?.optionId) {
      setSelectedLabel(null);
      setMindTag(null);
      return;
    }
    const resolvedQuestion = getMindPacingQuestionById(entry.questionId);
    const option = resolvedQuestion?.options.find((opt) => opt.id === entry.optionId);
    setSelectedLabel(option ? option.label[locale] : null);
    const inferredTag = getMindPacingSignalFromOption(entry.optionId);
    const storedTag = isMindPacingSignalTag(entry.mindTag) ? entry.mindTag : null;
    setMindTag(storedTag ?? inferredTag ?? null);
    setPhase("result");
  }, [dayKey, locale, question]);

  useEffect(() => {
    if (!persistedResult) return;
    const resolvedQuestion = getMindPacingQuestionById(persistedResult.questionId);
    if (resolvedQuestion) {
      setQuestion(resolvedQuestion);
      const option = resolvedQuestion.options.find((opt) => opt.id === persistedResult.optionId);
      if (option) {
        setSelectedLabel(option.label[locale]);
      }
    }
    setMindTag(persistedResult.mindTag ?? null);
    setPhase("result");
  }, [locale, persistedResult]);

  const handleAnswer = useCallback(
    (option: MindPacingOption) => {
      if (!option) return;
      const primaryTag = option.tagsPrimary[0];
      const signal = getMindPacingSignalFromOption(option.id);
      const axisId = getAxisFromMindPacingTag(primaryTag) ?? (signal ? getAxisFromMindPacingSignal(signal) : null);
      storeMindPacingAnswer(dayKey, {
        questionId: question.id,
        optionId: option.id,
        answerTagPrimary: primaryTag,
        answerTagsSecondary: option.tagsSecondary,
        mindTag: signal,
        axisId,
      });
      setSelectedLabel(option.label[locale]);
      setMindTag(signal);
      setPhase("result");
      void recordMindPacingSignal({
        dayKey,
        questionId: question.id,
        optionId: option.id,
        mindTag: signal,
        axisId,
      });
      void recordDailyRunnerEvent({
        type: "mindpacing_completed",
        optionId: option.id,
        label: signal ?? undefined,
        context: "mindpacing",
      });
    },
    [dayKey, locale, question.id],
  );

  const handleContinue = useCallback(() => {
    const entry = getMindPacingEntry(dayKey);
    if (!entry?.questionId || !entry.optionId || !entry.answerTagPrimary) return;
    const payload: IntroMindPacingResult = {
      dayKey,
      questionId: entry.questionId,
      optionId: entry.optionId,
      answerTagPrimary: entry.answerTagPrimary,
      answerTagsSecondary: entry.answerTagsSecondary ?? [],
      mindTag: isMindPacingSignalTag(entry.mindTag) ? entry.mindTag : mindTag,
      axisId: (entry.axisId ?? null) as CatAxisId | null,
    };
    onContinue(payload);
  }, [dayKey, mindTag, onContinue]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]" data-testid="mindpacing-root">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12" />
      </div>
    );
  }

  const eyebrowText = locale === "ro" ? "5 secunde · 1 întrebare" : "5 seconds · 1 question";
  const helperText =
    locale === "ro"
      ? "Ne ajută să ajustăm exercițiul de azi pentru tine."
      : "This helps us adjust today's exercise for you.";
  const questionTitle = question?.prompt?.[locale] ?? "";

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]" data-testid="mindpacing-root">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
        {phase === "question" ? (
          <section className="space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{eyebrowText}</p>
            <h1 className="text-3xl font-semibold text-[var(--omni-ink)]">{questionTitle}</h1>
            <p className="text-sm text-[var(--omni-muted)]">{helperText}</p>
          </section>
        ) : null}

        {phase === "question" ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <button
                  key={option.id}
                  type="button"
                  data-testid={`mindpacing-option-${idx}`}
                  onClick={() => handleAnswer(option)}
                  className="w-full rounded-2xl border border-[var(--omni-border-soft)] px-4 py-3 text-left text-sm font-semibold transition hover:border-[var(--omni-ink)]/60"
                >
                  {option.label[locale]}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {phase === "result" ? (
          <section className="space-y-6 rounded-[28px] border border-[var(--omni-border-soft)] bg-white/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <h3 className="text-2xl font-semibold text-[var(--omni-ink)]">
              {locale === "ro" ? "Când mintea e „În ceață”." : 'When your mind feels “foggy.”'}
            </h3>
            <p className="text-sm text-[var(--omni-muted)]">
              {locale === "ro"
                ? "Asta e situația reală acum — exact de aici începem și ajustăm exercițiile pentru azi."
                : "This is your real state right now—it's where we start and adjust today's exercises."}
            </p>
            {selectedLabel ? (
              <p className="text-sm text-[var(--omni-ink)]">
                {locale === "ro" ? `Ai ales: „${selectedLabel}”.` : `You chose: “${selectedLabel}.”`}
              </p>
            ) : null}
            <div className="pt-2">
              <OmniCtaButton
                className="w-full justify-center"
                onClick={handleContinue}
                data-testid={continueTestId}
              >
                {locale === "ro" ? "Continuă" : "Continue"}
              </OmniCtaButton>
            </div>
          </section>
        ) : null}
     </main>
   </div>
  );
}

export function IntroMindPacingStep({ go, state, setState }: StepComponentProps) {
  const persistedResult = (state.introMindPacing ?? null) as IntroMindPacingResult | null;
  const handleContinue = useCallback(
    (result: IntroMindPacingResult) => {
      setState((prev) => ({ ...prev, introMindPacing: result }));
      go("next");
    },
    [go, setState],
  );
  return <MindPacingExperience onContinue={handleContinue} persistedResult={persistedResult} />;
}

export default IntroMindPacingStep;
