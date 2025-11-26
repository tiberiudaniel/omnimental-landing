"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import GuideCard from "@/components/onboarding/GuideCard";
import Typewriter from "@/components/onboarding/Typewriter";
import { recordOmniPatch, recordActivityEvent } from "@/lib/progressFacts";
import { increment } from "firebase/firestore";
import OnboardingLessonShell from "@/components/onboarding/OnboardingLessonShell";
import TestQuestionCard from "@/components/onboarding/TestQuestionCard";

type CardVariant = "neutral" | "accent" | "mint" | "lavender" | "tip";

function LessonSmallCard({
  title,
  children,
  variant = "neutral",
  icon,
}: {
  title: string;
  children: React.ReactNode;
  variant?: CardVariant;
  icon?: React.ReactNode;
}) {
  const cls = (() => {
    switch (variant) {
      case "accent":
        return "border-[#E4DAD1] bg-[#FFFBF7]";
      case "mint":
        return "border-[#DDEBE3] bg-[#F3FAF7]";
      case "lavender":
        return "border-[#E3DDF0] bg-[#F7F2FF]";
      case "tip":
        return "border-[#DDEBE3] bg-[#F3FAF7]";
      default:
        return "border-[#F0E6DA] bg-white";
    }
  })();
  return (
    <div className={`rounded-[14px] border px-4 py-3 shadow-[0_6px_16px_rgba(0,0,0,0.03)] ${cls}`}>
      <div className="mb-1 flex items-center gap-2">
        {icon ?? null}
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]">{title}</p>
      </div>
      <div className="text-sm text-[#2C2C2C]">{children}</div>
    </div>
  );
}

export default function InitiationStepLesson({ userId, onNext }: { userId: string | null; onNext?: () => void }) {
  const { lang } = useI18n();
  const [done, setDone] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const complete = async () => {
    try {
      const label = lang === 'ro' ? 'Micro‑lecție: reflexe mentale adaptabile' : 'Micro lesson: adaptive mental reflexes';
      await recordOmniPatch({
        kuno: {
          lessonsCompletedCount: increment(1) as unknown as number,
          signals: { lastLessonsCsv: label } as unknown as Record<string, string>,
        },
      }, userId ?? undefined);
      // Log knowledge activity (lesson completed)
      try {
        // This initiation lesson targets stress + clarity; tag to emotional balance for focus weighting
        await recordActivityEvent({ startedAtMs: Date.now(), source: 'omnikuno', category: 'knowledge', units: 1, focusTag: 'emotional_balance' }, userId ?? undefined);
      } catch {}
    } catch (e) {
      console.warn('lesson save failed', e);
    } finally {
      if (onNext) {
        onNext();
      } else {
        setDone(true);
      }
    }
  };
  const lessonCopy = (() => {
    const ro = {
      title: 'Reflexe Mentale Adaptabile',
      goal: 'Nu te mai lași călcat în picioare de haos; înveți să rămâi stabil când valul lovește.',
      bullets: [
        'Reflexele mentale adaptabile sunt 3-4 obiceiuri care îți schimbă reacțiile la știri, crize sau schimbări bruște.',
        'Nu te fac „mai deștept”, ci mai greu de dezechilibrat – ca un pahar termorezistent care nu crapă la apa clocotită.',
        'Primul reflex: Pauza de 90 de secunde cu respirație 4-7-8, ca să ieși din modul „luptă sau fugă”.',
      ],
      example:
        'Când torni apă clocotită într-un pahar normal, se sparge. Cel termorezistent rămâne intact. Tu vrei să fii paharul termorezistent în fața veștilor proaste.',
      exercise: [
        'De 3 ori pe zi, când simți stres, oprește-te 90 de secunde și respiră 4 secunde, ține 7, eliberează 8.',
        'Întreabă-te: „Pot ignora asta acum?” Nu trebuie să rezolvi, doar să decizi dacă merită atenția.',
        'Reia zi de zi — antrenezi butonul de pauză pentru viitorul plin de schimbări.',
      ],
      action:
        'Reflexele mentale adaptabile sunt butonul tău de pauză în nebunie. Viitorul e al celor care rămân calmi când ceilalți intră în panică.',
    };
    const en = {
      title: 'Adaptive Mental Reflexes',
      goal: 'Stop letting chaos trample you; stay steady when the wave hits.',
      bullets: [
        'Adaptive mental reflexes are 3‑4 habits that change how you respond to news, crises, or sudden shifts.',
        'They don’t make you “smarter”, they make you sturdy—like heat-resistant glass that doesn’t crack under boiling water.',
        'First reflex: the 90-second pause with 4‑7‑8 breathing so you exit fight-or-flight.',
      ],
      example:
        'Pour boiling water into a regular glass and it breaks; a heatproof one stays intact. Be the heatproof glass when bad news lands.',
      exercise: [
        'Three times a day, when stress shows up, stop for 90 seconds and breathe 4 seconds in, hold 7, release 8.',
        'Ask yourself: “Can I ignore this right now?” You don’t have to fix it, just decide if it deserves attention.',
        'Repeat daily—this trains your pause button for a future full of change.',
      ],
      action: 'Adaptive mental reflexes are your pause button in the chaos. The future belongs to the calm in the room.',
    };
    return lang === 'ro' ? ro : en;
  })();
  const lessonSteps = useMemo(() => {
    return [
      {
        id: "intro",
        render: (
          <div className="space-y-3 text-sm text-[#4A3A30] md:text-base">
            <Typewriter
              text={
                lang === "ro"
                  ? "În această micro-lecție transformi reflexele mentale în instrumente practice. Nu este teorie rece, ci pași clari ca să rămâi calm când haosul lovește."
                  : "This micro lesson turns mental reflexes into practical tools. It’s not cold theory—it’s clear steps to stay steady when chaos hits."
              }
            />
            <p>
              {lang === "ro"
                ? "Urmează câteva mini-ecrane: scopul, ideile esențiale, un exemplu, protocolul rapid și o întrebare aplicată."
                : "You’ll move through a few mini screens: the goal, key ideas, an example, a rapid protocol, and one applied question."}
            </p>
          </div>
        ),
      },
      {
        id: "goal",
        render: (
          <LessonSmallCard title={lang === "ro" ? "Scopul lecției" : "Lesson goal"} variant="neutral">
            <p>{lessonCopy.goal}</p>
          </LessonSmallCard>
        ),
      },
      {
        id: "ideas",
        render: (
          <LessonSmallCard title={lang === "ro" ? "3 idei cheie" : "3 key ideas"} variant="mint" icon={<span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#1F7A53]" />}>
            <ul className="space-y-1 pl-0">
              {lessonCopy.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-[#1F7A53]" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </LessonSmallCard>
        ),
      },
      {
        id: "example",
        render: (
          <LessonSmallCard title={lang === "ro" ? "Exemplul paharului" : "Glass example"} variant="lavender" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 7h6M9 12h6M9 17h6" stroke="#7B6BDF" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          }>
            <blockquote className="border-l-2 border-[#C7C1EE] pl-3 text-[13px] leading-relaxed text-[#2C2C2C]">{lessonCopy.example}</blockquote>
          </LessonSmallCard>
        ),
      },
      {
        id: "exercise",
        render: (
          <LessonSmallCard title={lang === "ro" ? "Protocolul de 3 minute" : "3-minute protocol"} variant="accent" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="#C07963" strokeWidth="1.2" />
              <path d="M8 12l3 3 5-6" stroke="#C07963" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }>
            <ol className="list-decimal pl-5 space-y-1">
              {lessonCopy.exercise.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </LessonSmallCard>
        ),
      },
      {
        id: "action",
        render: (
          <LessonSmallCard title={lang === "ro" ? "Acțiunea ta" : "Your action"} variant="tip" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 6v6l4 2" stroke="#1F7A53" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="12" cy="12" r="9" stroke="#1F7A53" strokeWidth="1.2" />
            </svg>
          }>
            <p>{lessonCopy.action}</p>
          </LessonSmallCard>
        ),
      },
      {
        id: "quiz",
        requiresAnswer: true,
        render: (
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A08F82]">
              {lang === "ro" ? "Verificare rapidă" : "Quick check"}
            </p>
            <TestQuestionCard
              item={{
                id: "init_lesson_inline_quiz",
                question:
                  lang === "ro"
                    ? "Ce faci în primele 90 de secunde ca să rămâi stabil când apare un stres?"
                    : "What do you do in the first 90 seconds to stay steady when stress shows up?",
                options:
                  lang === "ro"
                    ? [
                        "Respiri 4‑7‑8 și amâni reacția directă",
                        "Răspunzi în maximum 5 secunde",
                        "Ignori complet și speri să dispară singur",
                      ]
                    : [
                        "Use a 4‑7‑8 breath and delay the reaction",
                        "Respond within 5 seconds no matter what",
                        "Ignore it completely and hope it goes away",
                      ],
                correctIndex: 0,
                explanation:
                  lang === "ro"
                    ? "Pauza ghidată (4 secunde inspiri, 7 ții, 8 eliberezi) îți scoate sistemul din modul de alarmă."
                    : "The guided pause (inhale 4, hold 7, exhale 8) takes your system out of alarm mode.",
              }}
              onAnswer={(sel) => setQuizAnswer(sel)}
              scored={false}
              styleLabel="knowledge"
              index={0}
              total={1}
              questionTestId="init-lesson-inline-question"
              optionTestId="init-lesson-inline-option"
            />
            {quizAnswer !== null ? (
              <p className="text-sm text-[#4A3A30]">{lang === "ro" ? "Perfect, acesta este primul reflex pe care îl practici." : "Great—that’s the first reflex you’ll practice."}</p>
            ) : null}
          </div>
        ),
      },
    ];
  }, [lang, lessonCopy.action, lessonCopy.bullets, lessonCopy.example, lessonCopy.exercise, lessonCopy.goal, quizAnswer]);

  const totalSteps = lessonSteps.length;
  const currentConfig = lessonSteps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const canContinue = !currentConfig?.requiresAnswer || quizAnswer !== null;
  const continueLabel = isLastStep ? (lang === "ro" ? "Finalizează lecția" : "Finish lesson") : lang === "ro" ? "Continuă" : "Continue";
  const backLabel = lang === "ro" ? "Înapoi" : "Back";

  const goNext = () => {
    if (isLastStep) {
      void complete();
      return;
    }
    setCurrentStep((prev) => Math.min(totalSteps - 1, prev + 1));
  };
  const goPrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  if (done) {
    return (
      <section className="space-y-4">
        <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
          <Typewriter text={lang === 'ro' ? 'Inițiere completă! Felicitări.' : 'Initiation complete! Well done.'} />
        </div>
        <GuideCard title={lang === 'ro' ? 'Ce ai făcut' : 'What you did'}>
          <ul className="list-disc pl-5 text-sm text-[#2C2C2C]">
            <li>{lang === 'ro' ? 'Ai testat OmniKuno pe tema principală.' : 'You tested OmniKuno on your main theme.'}</li>
            <li>{lang === 'ro' ? 'Ai scris o reflecție și ai clarificat contextul.' : 'You wrote a reflection and clarified your context.'}</li>
            <li>{lang === 'ro' ? 'Ai înregistrat starea de azi și ai completat o lecție.' : 'You recorded today’s state and completed a lesson.'}</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <a
              href="/progress?from=initiation&completed=1"
              className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
              data-testid="init-final-progress"
            >
              {lang === 'ro' ? 'Mergi la progres' : 'Go to progress'}
            </a>
            <a
              href="/recommendation?from=initiation"
              className="rounded-[10px] border border-[#D8C6B6] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C]"
            >
              {lang === 'ro' ? 'Înapoi la recomandări' : 'Back to recommendations'}
            </a>
          </div>
        </GuideCard>
      </section>
    );
  }

  return (
    <OnboardingLessonShell
      label={lang === 'ro' ? 'Lecție aplicată' : 'Applied lesson'}
      title={lessonCopy.title}
      subtitle={lang === 'ro' ? 'O micro-învățare pentru tema ta.' : 'A micro lesson tailored to your theme.'}
      meta={lang === 'ro' ? 'Inițiere · Omni-Kuno · ~4 min' : 'Initiation · Omni-Kuno · ~4 min'}
      statusLabel={lang === 'ro' ? 'În desfășurare' : 'In progress'}
      stepIndex={currentStep}
      stepCount={totalSteps}
      continueLabel={continueLabel}
      continueTestId={isLastStep ? "init-lesson-complete" : undefined}
      onContinue={goNext}
      onBack={currentStep > 0 ? goPrev : undefined}
      backLabel={backLabel}
      collapsible
      defaultExpanded={false}
      collapsibleTestId="init-lesson-shell"
      continueDisabled={!canContinue}
    >
      {currentConfig?.render ?? null}
    </OnboardingLessonShell>
  );
}
