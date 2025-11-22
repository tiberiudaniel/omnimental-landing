"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import GuideCard from "@/components/onboarding/GuideCard";
import Typewriter from "@/components/onboarding/Typewriter";
import { recordOmniPatch, recordActivityEvent } from "@/lib/progressFacts";
import { increment } from "firebase/firestore";
import { getMicroLesson } from "@/data/lessons";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";

export default function InitiationStepLesson({ userId, onNext }: { userId: string | null; onNext?: () => void }) {
  const { lang } = useI18n();
  const { profile } = useProfile();
  const { data: facts } = useProgressFacts(profile?.id);
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
  const hintKey = (() => {
    try {
      const onboarding = (facts as unknown as { onboarding?: { lessonHint?: { lessonKey?: string } } } | undefined)?.onboarding;
      const key = onboarding?.lessonHint?.lessonKey;
      if (typeof key === 'string' && key) return key;
    } catch {}
    return 'initiation-stress-clarity';
  })();
  const lesson = getMicroLesson(hintKey, lang === 'ro' ? 'ro' : 'en');
  type CardVariant = 'neutral' | 'accent' | 'mint' | 'lavender' | 'tip';
  function SmallCard({ title, children, variant = 'neutral', icon }: { title: string; children: React.ReactNode; variant?: CardVariant; icon?: React.ReactNode }) {
    const cls = (() => {
      switch (variant) {
        case 'accent':
          return 'border-[#E4DAD1] bg-[#FFFBF7]';
        case 'mint':
          return 'border-[#DDEBE3] bg-[#F3FAF7]';
        case 'lavender':
          return 'border-[#E3DDF0] bg-[#F7F2FF]';
        case 'tip':
          return 'border-[#DDEBE3] bg-[#F3FAF7]';
        default:
          return 'border-[#F0E6DA] bg-white';
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
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <Typewriter text={lang === 'ro' ? 'O micro‑lecție pentru tema ta.' : 'A micro‑lesson for your theme.'} />
      </div>
      <GuideCard title={lesson?.title ?? (lang === 'ro' ? 'Micro‑lecție' : 'Micro‑lesson')}>
        {lesson ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <SmallCard title={lang === 'ro' ? 'Scop' : 'Goal'} variant="neutral" icon={(
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.6L12 15l-4.9 2.3.9-5.6-4-3.9 5.5-.8L12 2z" stroke="#A08F82" strokeWidth="1.2" fill="none"/>
                </svg>
              )}>
                <p>{lesson.goal}</p>
              </SmallCard>
            </div>
            <SmallCard title={lang === 'ro' ? '3 idei cheie' : '3 key ideas'} variant="mint" icon={(<span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#1F7A53]" />)}>
              <ul className="space-y-1 pl-0">
                {lesson.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-[#1F7A53]" aria-hidden />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </SmallCard>
            <SmallCard title={lang === 'ro' ? 'Exemplu' : 'Example'} variant="lavender" icon={(
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 7h6M9 12h6M9 17h6" stroke="#7B6BDF" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            )}>
              <blockquote className="border-l-2 border-[#C7C1EE] pl-3 text-[13px] leading-relaxed text-[#2C2C2C]">{lesson.example}</blockquote>
            </SmallCard>
            <div className="md:col-span-2">
              <SmallCard title={lang === 'ro' ? 'Exercițiu (3 minute)' : 'Exercise (3 minutes)'} variant="accent" icon={(
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="#C07963" strokeWidth="1.2"/>
                  <path d="M8 12l3 3 5-6" stroke="#C07963" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}>
                <ol className="list-decimal pl-5">
                  {lesson.exercise.map((s, i) => (<li key={i} className="mb-1">{s}</li>))}
                </ol>
              </SmallCard>
            </div>
            {lesson.linkToKuno ? (
              <SmallCard title="Omni‑Kuno" variant="tip" icon={(
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 6v6l4 2" stroke="#1F7A53" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="9" stroke="#1F7A53" strokeWidth="1.2"/>
                </svg>
              )}>
                <p>{lesson.linkToKuno}</p>
              </SmallCard>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 flex justify-end">
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
