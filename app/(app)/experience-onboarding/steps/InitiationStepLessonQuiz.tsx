"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import TestQuestionCard from "@/components/onboarding/TestQuestionCard";
import { recordActivityEvent } from "@/lib/progressFacts";
import OnboardingLessonShell from "@/components/onboarding/OnboardingLessonShell";

type Q = { id: string; question: string; options: string[]; correctIndex: number; explanation: string };

export default function InitiationStepLessonQuiz({ onDone }: { onDone: () => void }) {
  const { lang } = useI18n();
  const questions: Q[] = useMemo(() => {
    return [
      {
        id: "init_lesson_q1_reflexes",
        question:
          lang === "ro"
            ? "Ce sunt „reflexele mentale adaptabile” conform lecției?"
            : "What are “adaptive mental reflexes” according to the lesson?",
        options:
          lang === "ro"
            ? [
                "3-4 obiceiuri mentale care îți schimbă reacțiile la haos",
                "Un test teoretic de 60 de minute",
                "O tehnică de memorare pentru examene",
              ]
            : [
                "3-4 mental habits that change how you react to chaos",
                "A 60-minute theory test",
                "A memorization trick for exams",
              ],
        correctIndex: 0,
        explanation:
          lang === "ro"
            ? "Lecția explică faptul că aceste reflexe sunt câteva obiceiuri care te fac mai stabil când apar crize."
            : "The lesson frames them as a handful of habits that keep you steadier when crises hit.",
      },
      {
        id: "init_lesson_q2_pause",
        question:
          lang === "ro"
            ? "Care este primul reflex menționat și cum arată practic?"
            : "What is the first reflex described and how do you apply it?",
        options:
          lang === "ro"
            ? [
                "Pauza de 90 de secunde cu respirație 4-7-8 înainte să reacționezi",
                "Să răspunzi imediat la fiecare mesaj primit",
                "Să ignori complet respirația și să continui munca",
              ]
            : [
                "A 90-second pause with 4-7-8 breathing before reacting",
                "Reply instantly to every message that arrives",
                "Ignore breathing completely and keep working",
              ],
        correctIndex: 0,
        explanation:
          lang === "ro"
            ? "Primul reflex descris este pauza ghidată (4 secunde inspiri, 7 ții, 8 eliberezi) pentru a ieși din modul „luptă sau fugă”."
            : "The first reflex is the guided pause (inhale 4, hold 7, exhale 8) to exit fight-or-flight before acting.",
      },
    ];
  }, [lang]);

  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [touched, setTouched] = useState<boolean[]>(Array(questions.length).fill(false));
  const allAnswered = touched.every(Boolean);
  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const [showSummary, setShowSummary] = useState(false);

  const submit = async () => {
    try {
      // log a small knowledge event so trendurile includ acest pas
      await recordActivityEvent({ startedAtMs: Date.now(), source: 'omnikuno', category: 'knowledge', units: 1, durationMin: 3, focusTag: 'emotional_balance' });
    } catch {}
    onDone();
  };

  return (
    <OnboardingLessonShell
      label={lang === 'ro' ? 'Quiz final' : 'Final quiz'}
      title={lang === 'ro' ? 'Mini-quiz din lecția anterioară' : 'Mini quiz from the previous lesson'}
      subtitle={lang === 'ro' ? '2 întrebări rapide pentru a fixa ideile.' : 'Two rapid-fire questions to anchor the ideas.'}
      meta={lang === 'ro' ? 'Omni-Kuno · ~2 min' : 'Omni-Kuno · ~2 min'}
      statusLabel={lang === 'ro' ? 'În desfășurare' : 'In progress'}
      stepIndex={showSummary ? 1 : 0}
      stepCount={2}
      collapsible
      defaultExpanded={false}
    >
      {!showSummary ? (
        <>
          {questions.map((q, idx) => (
            <div key={q.id} className={idx === 0 ? "mb-4" : undefined}>
              <TestQuestionCard
                item={q}
                onAnswer={(sel) => {
                  setAnswers((prev) => prev.map((v, i) => (i === idx ? sel : v)));
                  setTouched((prev) => prev.map((v, i) => (i === idx ? true : v)));
                }}
                scored
                styleLabel="knowledge"
                index={idx}
                total={questions.length}
                questionTestId="eo-question"
                optionTestId="eo-option"
              />
            </div>
          ))}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-main)" }}>
              {lang === 'ro' ? 'Scor' : 'Score'}: {score}/{questions.length}
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setShowSummary(true)}
              disabled={!allAnswered}
              className="theme-btn-solid rounded-[10px] px-6 py-2 text-sm font-semibold tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {lang === 'ro' ? 'Finalizează' : 'Finalize'}
            </button>
          </div>
        </>
      ) : (
        <section
          className="omni-card px-6 py-6"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
        >
          <h3
            className="text-sm font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--text-soft)" }}
          >
            {lang === 'ro' ? 'Inițiere completă' : 'Initiation complete'}
          </h3>
          <p className="mt-2 text-sm" style={{ color: "var(--text-main)" }}>
            {lang === 'ro'
              ? 'Ai ajuns la finalul inițierii: ți-ai luat pulsul zilnic, ai înțeles terenul și știi deja următorul gest concret.'
              : 'You reached the end of initiation: you checked today’s pulse, understood the terrain, and already chose the next concrete move.'}
          </p>
          <ul
            className="mt-3 list-disc pl-5 text-sm"
            style={{ color: "var(--text-main)" }}
          >
            <li>{lang === 'ro' ? 'Ți-ai evaluat resursele și ai pus cap la cap contextul Omni-Kuno.' : 'You evaluated your resources and pieced together the Omni-Kuno context.'}</li>
            <li>{lang === 'ro' ? 'Ai absorbit micro-lecția despre reflexele mentale adaptabile.' : 'You absorbed the micro lesson on adaptive mental reflexes.'}</li>
            <li>{lang === 'ro' ? 'Ai ales o acțiune realistă pentru următoarele 24 de ore.' : 'You picked a realistic action for the next 24 hours.'}</li>
            <li>{lang === 'ro' ? 'Ai calibrat OmniScope pe tema ta în focus.' : 'You calibrated OmniScope for your focus theme.'}</li>
            <li>{lang === 'ro' ? 'Ai lăsat o primă notă în jurnal, ca reper.' : 'You captured a first note in the journal as an anchor.'}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submit}
              className="theme-btn-solid rounded-[10px] px-5 py-2 text-sm font-medium tracking-[0.12em]"
              data-testid="init-lesson-quiz-submit"
            >
              {lang === 'ro' ? 'Mergi la progres' : 'Go to progress'}
            </button>
            <a
              href="/recommendation?from=initiation"
              className="theme-btn-outline rounded-[10px] px-5 py-2 text-sm font-medium tracking-[0.12em]"
            >
              {lang === 'ro' ? 'Vezi recomandarea ta' : 'See your recommendation'}
            </a>
          </div>
        </section>
      )}
    </OnboardingLessonShell>
  );
}
