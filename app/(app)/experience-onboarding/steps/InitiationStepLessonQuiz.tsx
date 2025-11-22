"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import Typewriter from "@/components/onboarding/Typewriter";
import TestQuestionCard from "@/components/onboarding/TestQuestionCard";
import { recordActivityEvent } from "@/lib/progressFacts";

type Q = { id: string; question: string; options: string[]; correctIndex: number; explanation: string };

export default function InitiationStepLessonQuiz({ onDone }: { onDone: () => void }) {
  const { lang } = useI18n();
  const questions: Q[] = useMemo(() => {
    // 2 întrebări simple din micro-lecția de inițiere (calm + claritate)
    return [
      {
        id: "init_lesson_q1_breath_marker",
        question:
          lang === "ro"
            ? "Care e un marker simplu că respirația e eficientă pentru calm?"
            : "What is a simple marker that your breathing helps calm?",
        options:
          lang === "ro"
            ? [
                "Respirație foarte rapidă",
                "Expirație ușor mai lungă decât inspirația",
                "Ținutul respirației cât mai mult",
              ]
            : [
                "Very fast breathing",
                "Exhale slightly longer than inhale",
                "Hold breath as long as possible",
              ],
        correctIndex: 1,
        explanation:
          lang === "ro"
            ? "Când expirația e puțin mai lungă, activezi parasimpaticul (frânarea) și scade tensiunea."
            : "A slightly longer exhale activates the parasympathetic side (the brake) and lowers arousal.",
      },
      {
        id: "init_lesson_q2_break_type",
        question:
          lang === "ro"
            ? "Ce tip de pauză sprijină calmul în lucru?"
            : "Which type of break supports calm while working?",
        options:
          lang === "ro"
            ? ["Pauză scurtă fără ecran", "Pauză lungă cu multitasking", "Deloc pauze"]
            : ["Short off-screen break", "Long break with multitasking", "No breaks"],
        correctIndex: 0,
        explanation:
          lang === "ro"
            ? "Micro-pauzele scurte, fără ecran, împing sistemul nervos să revină în fereastra optimă."
            : "Short, off-screen micro-breaks help your nervous system return to its optimal window.",
      },
    ];
  }, [lang]);

  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [touched, setTouched] = useState<boolean[]>(Array(questions.length).fill(false));
  const allAnswered = touched.every(Boolean);
  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;

  const submit = async () => {
    try {
      // log a small knowledge event so trendurile includ acest pas
      await recordActivityEvent({ startedAtMs: Date.now(), source: 'omnikuno', category: 'knowledge', units: 1, durationMin: 3, focusTag: 'emotional_balance' });
    } catch {}
    onDone();
  };

  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Mini‑quiz' : 'Mini quiz'}</div>
        <Typewriter text={lang === 'ro' ? '2 întrebări rapide din lecția anterioară.' : '2 quick questions from the previous lesson.'} />
      </div>
      {questions.map((q, idx) => (
        <TestQuestionCard
          key={q.id}
          item={q}
          onAnswer={(sel) => {
            setAnswers((prev) => prev.map((v, i) => (i === idx ? sel : v)));
            setTouched((prev) => prev.map((v, i) => (i === idx ? true : v)));
          }}
          scored
          styleLabel="knowledge"
          index={idx}
          total={questions.length}
        />
      ))}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#4A3A30]">{lang === 'ro' ? 'Scor' : 'Score'}: {score}/{questions.length}</p>
        <button
          disabled={!allAnswered}
          onClick={submit}
          className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
          data-testid="init-lesson-quiz-submit"
        >
          {lang === 'ro' ? 'Continuă' : 'Continue'}
        </button>
      </div>
    </section>
  );
}
