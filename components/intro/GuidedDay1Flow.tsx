"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { getGuidedCompleted, setGuidedAnswer, setGuidedCompleted } from "@/lib/intro/guidedState";
import { track } from "@/lib/telemetry/track";
import { FREE_CONTINUE_URL, UPGRADE_URL } from "@/lib/constants/routes";

type QuestionOption = { id: string; label: string };
type QuestionStep = {
  id: string;
  title: string;
  options: QuestionOption[];
};

type Content = {
  questions: QuestionStep[];
  reflection: { lines: string[]; cta: string };
  exercise: { title: string; body: string; note: string };
  exerciseDone: { line: string };
  offer: { title: string; body: string; ctaPrimary: string; ctaSecondary: string };
  timerLabel: string;
};

const EXERCISE_DURATION = 90;

const CONTENT: Record<"ro" | "en", Content> = {
  ro: {
    questions: [
      {
        id: "mind_state",
        title: "În ultimele zile, mintea ta e mai mult:",
        options: [
          { id: "crowded", label: "aglomerată" },
          { id: "tired", label: "obosită" },
          { id: "rigid", label: "rigidă" },
          { id: "scattered", label: "împrăștiată" },
        ],
      },
      {
        id: "block_time",
        title: "Când apar blocajele, cel mai des e:",
        options: [
          { id: "morning", label: "dimineața" },
          { id: "work", label: "la muncă" },
          { id: "evening", label: "seara" },
          { id: "social", label: "în social" },
        ],
      },
      {
        id: "biggest_cost",
        title: "Cel mai mare cost acum este:",
        options: [
          { id: "decisions", label: "decizii" },
          { id: "energy", label: "energie" },
          { id: "emotions", label: "emoții" },
          { id: "procrastination", label: "procrastinare" },
        ],
      },
    ],
    reflection: {
      lines: ["OK. Nu e un defect personal.", "E un tipar de supraîncărcare.", "Începem prin a stabiliza."],
      cta: "Începem",
    },
    exercise: {
      title: "Respirație lentă",
      body: "4 secunde inhale, 6 secunde exhale. Menține ritmul până timerul se termină.",
      note: "Poți apăsa pauză dacă ai nevoie.",
    },
    exerciseDone: { line: "Observă diferența. Nu e motivație. E reglaj." },
    offer: {
      title: "Păstrezi asta zilnic?",
      body: "5 minute/zi. Traseu ghidat. Istoric & progres.",
      ctaPrimary: "Vezi planurile",
      ctaSecondary: "Continui gratuit azi",
    },
    timerLabel: "Timp exercițiu",
  },
  en: {
    questions: [
      {
        id: "mind_state",
        title: "Lately, your mind feels mostly:",
        options: [
          { id: "crowded", label: "crowded" },
          { id: "tired", label: "tired" },
          { id: "rigid", label: "rigid" },
          { id: "scattered", label: "scattered" },
        ],
      },
      {
        id: "block_time",
        title: "When blocks show up, it’s usually:",
        options: [
          { id: "morning", label: "in the morning" },
          { id: "work", label: "at work" },
          { id: "evening", label: "in the evening" },
          { id: "social", label: "in social situations" },
        ],
      },
      {
        id: "biggest_cost",
        title: "Your biggest cost right now is:",
        options: [
          { id: "decisions", label: "decisions" },
          { id: "energy", label: "energy" },
          { id: "emotions", label: "emotions" },
          { id: "procrastination", label: "procrastination" },
        ],
      },
    ],
    reflection: {
      lines: ["Okay. This isn’t a personal flaw.", "It’s a pattern of overload.", "We stabilize first."],
      cta: "Let’s begin",
    },
    exercise: {
      title: "Slow breathing",
      body: "4-sec inhale, 6-sec exhale. Keep the rhythm until the timer ends.",
      note: "Pause if you need to.",
    },
    exerciseDone: { line: "Notice the difference. This is regulation, not motivation." },
    offer: {
      title: "Keep this daily?",
      body: "5 minutes/day. Guided path. History & progress.",
      ctaPrimary: "See plans",
      ctaSecondary: "Continue for free today",
    },
    timerLabel: "Exercise time",
  },
};

export default function GuidedDay1Flow() {
  const { lang } = useI18n();
  const locale: "ro" | "en" = lang === "en" ? "en" : "ro";
  const content = CONTENT[locale];
  const initialCompleted = useMemo(() => getGuidedCompleted(), []);
  const [stepIndex, setStepIndex] = useState(() =>
    initialCompleted ? content.questions.length + 2 : 0,
  );
  const [exerciseSeconds, setExerciseSeconds] = useState(EXERCISE_DURATION);
  const [exerciseRunning, setExerciseRunning] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [exerciseFinished, setExerciseFinished] = useState(initialCompleted);
  const [offerTracked, setOfferTracked] = useState(initialCompleted);
  const intervalRef = useRef<number | null>(null);

  const reflectionIndex = content.questions.length;
  const exerciseIndex = reflectionIndex + 1;
  const offerIndex = exerciseIndex + 1;

  useEffect(() => {
    track("guided_opened");
  }, []);

  useEffect(() => {
    if (!exerciseRunning) return;
    intervalRef.current = window.setInterval(() => {
      setExerciseSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalRef.current ?? undefined);
          intervalRef.current = null;
          setExerciseRunning(false);
          handleExerciseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseRunning]);

  useEffect(() => {
    if (stepIndex === offerIndex && !offerTracked) {
      setOfferTracked(true);
      track("offer_shown", { flow: "guided" });
      if (!initialCompleted) {
        setGuidedCompleted(true);
      }
      track("guided_day1_completed");
    }
  }, [initialCompleted, offerIndex, offerTracked, stepIndex]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const goToNextStep = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, offerIndex));
  }, [offerIndex]);

  const handleQuestionSelect = (questionId: string, optionId: string) => {
    setGuidedAnswer(questionId, optionId);
    track("guided_step_completed", { step: questionId, value: optionId });
    goToNextStep();
  };

  const handleReflectionContinue = () => {
    track("guided_step_completed", { step: "reflection" });
    goToNextStep();
  };

  const handleExerciseStart = () => {
    if (!exerciseStarted) {
      setExerciseStarted(true);
      track("guided_exercise_started");
    }
    setExerciseRunning(true);
  };

  const handleExercisePause = () => {
    setExerciseRunning(false);
  };

  const handleExerciseComplete = useCallback(() => {
    if (exerciseFinished) return;
    setExerciseFinished(true);
    track("guided_exercise_completed");
    setExerciseRunning(false);
    setExerciseSeconds(0);
    goToNextStep();
  }, [exerciseFinished, goToNextStep]);

  const handleOfferClick = (action: "plans" | "continue_free") => {
    track("offer_clicked", { flow: "guided", action });
  };

  const currentQuestion = content.questions[stepIndex];

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Guided Day-1</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {locale === "ro" ? "Încep ghidat" : "Start guided"}
          </h1>
          <p className="text-sm text-[var(--omni-ink)]/70 sm:text-base">
            {locale === "ro" ? "5–7 minute. Niciun progres salvat fără acord." : "5–7 minutes. Nothing saved without consent."}
          </p>
        </header>

        {stepIndex < reflectionIndex && currentQuestion ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:px-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
              {locale === "ro" ? "Micro-identificare" : "Micro-identification"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">
              {currentQuestion.title}
            </h2>
            <div className="mt-6 space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleQuestionSelect(currentQuestion.id, option.id)}
                  className="w-full rounded-[18px] border border-[var(--omni-border-soft)] px-4 py-3 text-left text-sm font-semibold text-[var(--omni-ink)] transition hover:border-[var(--omni-ink)]/50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {stepIndex === reflectionIndex ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:px-8">
            <div className="space-y-3 text-lg leading-relaxed text-[var(--omni-ink)] sm:text-xl">
              {content.reflection.lines.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
            <OmniCtaButton className="mt-6 justify-center" onClick={handleReflectionContinue}>
              {content.reflection.cta}
            </OmniCtaButton>
          </section>
        ) : null}

        {stepIndex === exerciseIndex ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:px-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{content.timerLabel}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">{content.exercise.title}</h2>
            <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">{content.exercise.body}</p>
            <p className="mt-1 text-xs text-[var(--omni-muted)]">{content.exercise.note}</p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-5xl font-semibold tracking-tight">{formatTimer(exerciseSeconds)}</p>
              <div className="flex gap-3">
                {!exerciseRunning ? (
                  <OmniCtaButton onClick={handleExerciseStart}>
                    {exerciseStarted ? (locale === "ro" ? "Reiau" : "Resume") : locale === "ro" ? "Start" : "Start"}
                  </OmniCtaButton>
                ) : (
                  <OmniCtaButton variant="neutral" onClick={handleExercisePause}>
                    {locale === "ro" ? "Pauză" : "Pause"}
                  </OmniCtaButton>
                )}
                {exerciseSeconds <= 0 && !exerciseFinished ? (
                  <OmniCtaButton onClick={handleExerciseComplete}>
                    {locale === "ro" ? "Continuă" : "Continue"}
                  </OmniCtaButton>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {stepIndex >= offerIndex ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] sm:px-8">
            <p className="text-sm text-[var(--omni-ink)]/70">{content.exerciseDone.line}</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">{content.offer.title}</h2>
            <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">{content.offer.body}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <OmniCtaButton
                as="link"
                href={UPGRADE_URL}
                onClick={() => handleOfferClick("plans")}
                className="justify-center sm:min-w-[220px]"
              >
                {content.offer.ctaPrimary}
              </OmniCtaButton>
              <OmniCtaButton
                as="link"
                variant="neutral"
                href={FREE_CONTINUE_URL}
                onClick={() => handleOfferClick("continue_free")}
                className="justify-center sm:min-w-[220px]"
              >
                {content.offer.ctaSecondary}
              </OmniCtaButton>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
