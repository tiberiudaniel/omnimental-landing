"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useI18n } from "@/components/I18nProvider";
import { getTodayKey } from "@/lib/dailyCompletion";
import { MIND_PACING_QUESTIONS, getMindPacingQuestionById } from "@/config/mindPacing";
import {
  ensureMindPacingQuestion,
  getMindPacingEntry,
  storeMindPacingAnswer,
  getMindPacingRotationIndex,
  setMindPacingRotationIndex,
  getLastMindPacingQuestionId,
} from "@/lib/mindPacingStore";
import {
  getMindPacingSignalFromOption,
  isMindPacingSignalTag,
  type MindPacingSignalTag,
} from "@/lib/mindPacingSignals";

type MindPacingOption = (typeof MIND_PACING_QUESTIONS)[number]["options"][number];

const RETURN_TO_TODAY = "/today?mode=short&source=mindpacing_safe";

function getPreviousDayKey(dayKey: string): string | null {
  const date = new Date(dayKey);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

export default function MindPacingPage() {
  const router = useRouter();
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const dayKey = useMemo(() => getTodayKey(), []);
  const previousDayKey = useMemo(() => getPreviousDayKey(dayKey), [dayKey]);
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
  }, [dayKey, locale, question]);

  const vocabUrl = useMemo(() => {
    const params = new URLSearchParams({
      source: "mindpacing",
      returnTo: RETURN_TO_TODAY,
      avoid: previousDayKey ? [dayKey, previousDayKey].join(",") : dayKey,
    });
    if (mindTag) {
      params.set("mindpacingTag", mindTag);
    }
    return `/intro/vocab?${params.toString()}`;
  }, [dayKey, previousDayKey, mindTag]);

  const eyebrowText = locale === "ro" ? "5 secunde · 1 întrebare" : "5 seconds · 1 question";
  const helperText = locale === "ro" ? "Ne ajută să ajustăm exercițiul de azi pentru tine." : "This helps us adjust today's exercise for you.";
  const questionTitle = question?.prompt?.[locale] ?? "";

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12" />
      </div>
    );
  }

  const handleAnswer = (option: MindPacingOption) => {
    if (!option) return;
    const signal = getMindPacingSignalFromOption(option.id);
    storeMindPacingAnswer(dayKey, {
      questionId: question.id,
      optionId: option.id,
      answerTagPrimary: option.tagsPrimary[0],
      answerTagsSecondary: option.tagsSecondary,
      mindTag: signal,
    });
    setSelectedLabel(option.label[locale]);
    setMindTag(signal);
    setPhase("result");
  };

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]">
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
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
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
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{locale === "ro" ? "Semnal notat" : "Signal noted"}</p>
            <h3 className="text-lg font-semibold text-[var(--omni-ink)]">
              {selectedLabel
                ? locale === "ro"
                  ? `Ai ales: „${selectedLabel}”.`
                  : `You chose: “${selectedLabel}”.`
                : locale === "ro"
                  ? "Ai ales un semnal."
                  : "You captured a signal."}
            </h3>
            <div className="space-y-2 text-sm text-[var(--omni-ink)]/85">
              {locale === "ro" ? (
                <>
                  <p>Mintea nu stă pe loc. Într-o zi sare prin mii de gânduri și stări care vin și pleacă.</p>
                  <p>Nu le poți controla pe toate, dar poți învăța să recunoști câteva tipare cheie și să știi ce să faci cu ele.</p>
                </>
              ) : (
                <>
                  <p>The mind never stays still. Some days it jumps through a thousand thoughts and states that appear and disappear.</p>
                  <p>You can’t control them all, but you can learn to notice the key patterns and know what to do with them.</p>
                </>
              )}
            </div>
            <div className="flex justify-center">
              <OmniCtaButton className="justify-center" onClick={() => router.push(vocabUrl)}>
                {locale === "ro" ? "Continuă" : "Continue"}
              </OmniCtaButton>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
