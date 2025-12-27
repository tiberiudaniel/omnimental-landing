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
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setQuestion(resolveQuestion(dayKey));
  }, [dayKey]);

  const vocabUrl = useMemo(() => {
    const params = new URLSearchParams({
      source: "mindpacing",
      returnTo: RETURN_TO_TODAY,
      avoid: previousDayKey ? [dayKey, previousDayKey].join(",") : dayKey,
    });
    return `/intro/vocab?${params.toString()}`;
  }, [dayKey, previousDayKey]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12" />
      </div>
    );
  }

  const handleAnswer = (option: MindPacingOption) => {
    if (!option) return;
    storeMindPacingAnswer(dayKey, {
      questionId: question.id,
      optionId: option.id,
      answerTagPrimary: option.tagsPrimary[0],
      answerTagsSecondary: option.tagsSecondary,
    });
    setPhase("result");
  };

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] text-[var(--omni-ink)]">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
        <section className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">MindPacing · Primele 24h</p>
          <h1 className="text-3xl font-semibold">{locale === "ro" ? "Calibrăm rapid" : "Quick calibration"}</h1>
          <p className="text-sm text-[var(--omni-muted)]">
            {locale === "ro" ? "O singură întrebare și notăm semnalul. Apoi trecem la vocab." : "One check-in. We note the signal, then continue with vocab."}
          </p>
        </section>

        {phase === "question" ? (
          <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 shadow-[0_15px_50px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{locale === "ro" ? "MindPacing" : "Mind pacing"}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--omni-ink)]">{question.prompt[locale]}</h2>
            <div className="mt-6 space-y-3">
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
            <div className="space-y-2 text-sm text-[var(--omni-ink)]/85">
              <p>{locale === "ro" ? "Ne oprim aici. Urmează vocab reflex, într-un pas separat." : "We stop here. Vocab will follow in a separate step."}</p>
              <p>{locale === "ro" ? "Continuă liniștit – nu există verdict, doar urmărim semnalul." : "Continue gently – no verdict, just recording the signal."}</p>
            </div>
            <div className="flex justify-center">
              <OmniCtaButton className="justify-center" onClick={() => router.push(vocabUrl)}>
                {locale === "ro" ? "Continuă către vocab" : "Continue to vocab"}
              </OmniCtaButton>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
