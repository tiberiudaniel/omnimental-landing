"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import GuideCard from "@/components/onboarding/GuideCard";
import Typewriter from "@/components/onboarding/Typewriter";
import { recordOmniPatch, recordActivityEvent } from "@/lib/progressFacts";
import { increment } from "firebase/firestore";
import { getMicroLesson } from "@/data/lessons";

export default function InitiationStepLesson({ userId }: { userId: string | null }) {
  const { lang } = useI18n();
  const [done, setDone] = useState(false);
  const complete = async () => {
    try {
      const label = lang === 'ro' ? 'Micro‑lecție: stres + claritate' : 'Micro‑lesson: stress + clarity';
      await recordOmniPatch({
        kuno: {
          lessonsCompletedCount: increment(1) as unknown as number,
          signals: { lastLessonsCsv: label } as unknown as Record<string, string>,
        },
      }, userId ?? undefined);
      // Log knowledge activity (lesson completed)
      try {
        // This initiation lesson targets stress + clarity; tag to 'calm' for focus weighting
        await recordActivityEvent({ startedAtMs: Date.now(), source: 'omnikuno', category: 'knowledge', units: 1, focusTag: 'calm' }, userId ?? undefined);
      } catch {}
    } catch (e) {
      console.warn('lesson save failed', e);
    } finally {
      setDone(true);
    }
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
  const lesson = getMicroLesson('initiation.stress_clarity', lang === 'ro' ? 'ro' : 'en');
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <Typewriter text={lang === 'ro' ? 'O micro‑lecție pentru tema ta.' : 'A micro‑lesson for your theme.'} />
      </div>
      <GuideCard title={lesson?.title ?? (lang === 'ro' ? 'Micro‑lecție' : 'Micro‑lesson')}>
        <div className="space-y-3 text-sm text-[#2C2C2C]">
          {lesson ? (
            <>
              <p className="font-medium">{lang === 'ro' ? 'Scop' : 'Goal'}</p>
              <p>{lesson.goal}</p>
              <p className="font-medium">{lang === 'ro' ? '3 idei cheie' : '3 key ideas'}</p>
              <ul className="list-disc pl-5">
                {lesson.bullets.map((b, i) => (<li key={i}>{b}</li>))}
              </ul>
              <p className="font-medium">{lang === 'ro' ? 'Exemplu' : 'Example'}</p>
              <p>{lesson.example}</p>
              <p className="font-medium">{lang === 'ro' ? 'Exercițiu pentru azi (3 minute)' : 'Exercise for today (3 minutes)'}</p>
              <ol className="list-decimal pl-5">
                {lesson.exercise.map((s, i) => (<li key={i}>{s}</li>))}
              </ol>
              {lesson.linkToKuno ? (
                <>
                  <p className="font-medium">Omni‑Kuno</p>
                  <p>{lesson.linkToKuno}</p>
                </>
              ) : null}
            </>
          ) : null}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={complete}
            className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
            data-testid="init-lesson-complete"
          >
            {lang === 'ro' ? 'Am terminat lecția' : 'I have completed this lesson'}
          </button>
        </div>
      </GuideCard>
    </section>
  );
}
