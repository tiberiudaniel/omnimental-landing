"use client";

import Link from "next/link";
import { useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { CUNO_QUESTIONS } from '@/lib/cunoQuestions';
import type { KunoAttempt, KunoCategory, KunoDifficulty } from '@/lib/kunoTypes';
import { useProfile } from '@/components/ProfileProvider';
import { scoreAttempts } from '@/lib/kunoScoring';
import { saveKunoAttempts } from '@/lib/kunoPersistence';
import { recordOmniPatch, recordPracticeSession, recordActivityEvent } from '@/lib/progressFacts';
import { increment } from 'firebase/firestore';
import { applyKunoGamification } from '@/lib/kunoGamification';
import Toast from '@/components/Toast';
import { getMicroLesson } from '@/data/lessons';
import { resolveModuleId, type OmniKunoModuleId } from "@/config/omniKunoModules";

const CATEGORY_TO_MODULE: Record<string, OmniKunoModuleId> = {
  clarity: "focus_clarity",
  calm: "emotional_balance",
  energy: "energy_body",
  relationships: "relationships_communication",
  performance: "decision_discernment",
  health: "energy_body",
  general: "emotional_balance",
  willpower: "willpower_perseverance",
  discipline: "willpower_perseverance",
  perseverance: "willpower_perseverance",
  resilience: "willpower_perseverance",
  vointa: "willpower_perseverance",
  perseverenta: "willpower_perseverance",
};

function LessonQuiz({ category }: { category: string }) {
  const { profile } = useProfile();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const pool = useMemo(() => CUNO_QUESTIONS.filter((q) => String(q.category) === category), [category]);
  const questions = useMemo(() => {
    if (pool.length >= 3) return pool.slice(0, 3);
    if (pool.length > 0) {
      const extras = CUNO_QUESTIONS.filter((q) => String(q.category) !== category);
      return [...pool, ...extras].slice(0, 3);
    }
    return CUNO_QUESTIONS.slice(0, 3);
  }, [category, pool]);
  const [idx, setIdx] = useState(0);
  const [attempts, setAttempts] = useState<KunoAttempt[]>([]);
  const q = questions[idx];
  const done = idx >= questions.length;

  const onAnswer = async (optIdx: number) => {
    if (!q) return;
    const correct = optIdx === q.correctIndex;
    const attempt: KunoAttempt = {
      questionId: q.id,
      category: (q.category ?? 'general') as KunoCategory,
      difficulty: (q.difficulty ?? 1) as KunoDifficulty,
      correct,
      timeMs: 0,
      ts: 0,
    };
    setAttempts((prev) => [...prev, attempt]);
    setIdx((i) => i + 1);
  };

  if (done) {
    const s = scoreAttempts(attempts);
    const moduleId = CATEGORY_TO_MODULE[category] ?? "emotional_balance";
    const omniHref = `/omni-kuno?area=${moduleId}&module=${moduleId}`;
    return (
      <div className="mx-auto max-w-xl rounded-[14px] border border-[#E4DAD1] bg-white p-6 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-[#2C2C2C]">Rezultat micro‑lecție</h2>
        <p className="mt-2 text-3xl font-bold text-[#C07963]">{s.percent}%</p>
        <button
          className="mt-4 rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
          onClick={async () => {
            await saveKunoAttempts(profile?.id, attempts, s.percent);
            try {
              const label = `Lecție ${String(category || 'general')}`;
              await recordOmniPatch({
                kuno: {
                  gamification: applyKunoGamification(undefined, 'lesson'),
                  lessonsCompletedCount: increment(1) as unknown as number,
                  signals: { lastLessonsCsv: label } as unknown as Record<string, string>,
                },
              }, profile?.id);
              // Log a practice session (~3 min) so trend reflects EDU time
              const started = Date.now() - 180000;
              await recordPracticeSession('drill', started, 180, profile?.id);
              // Log knowledge activity event
              // Try to tag with category param if present
              const focusTag = category && typeof category === "string" ? resolveModuleId(category) ?? category : null;
              await recordActivityEvent({ startedAtMs: Date.now(), source: "omnikuno", category: "knowledge", units: 1, focusTag }, profile?.id ?? undefined);
            } catch {}
            setToast('Lecția a fost salvată');
            setTimeout(() => router.push('/progress'), 700);
          }}
          data-testid="learn-finish"
        >
          Salvează și mergi la progress
        </button>
        <Link
          href={omniHref}
          className="mt-3 inline-flex items-center justify-center rounded-[10px] border border-[#C07963] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white"
        >
          Continuă în OmniKuno
        </Link>
        {toast ? (
          <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md px-4">
            <Toast message={toast} okLabel="OK" onClose={() => setToast(null)} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-[14px] border border-[#E4DAD1] bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">Întrebarea {idx + 1}/{questions.length}</p>
      <h2 className="mt-2 text-xl sm:text-2xl font-semibold leading-snug text-[#1F1F1F]">{q.question}</h2>
      <div className="mt-3 grid gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className="rounded-[10px] border border-[#D8C6B6] px-3 py-2 text-left text-[13px] sm:text-sm text-[#2C2C2C] hover:border-[#2C2C2C]"
            onClick={() => onAnswer(i)}
            data-testid="learn-option"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContentLessonView({ id, locale }: { id: string; locale: 'ro' | 'en' }) {
  const { profile } = useProfile();
  const router = useRouter();
  const lesson = getMicroLesson(id, locale);
  const [toast, setToast] = useState<string | null>(null);
  if (!lesson) {
    return (
      <div className="mx-auto max-w-xl rounded-[14px] border border-[#E4DAD1] bg-[#FFF5F4] p-6 text-[#8C2B2F] shadow-sm">
        Lecția nu a fost găsită.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl rounded-[14px] border border-[#E4DAD1] bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-[#2C2C2C]">{lesson.title}</h1>
      <div className="mt-3 space-y-3 text-sm text-[#2C2C2C]">
        <p className="font-medium">{locale === 'ro' ? 'Scop' : 'Goal'}</p>
        <p>{lesson.goal}</p>
        <p className="font-medium">{locale === 'ro' ? 'Idei cheie' : 'Key ideas'}</p>
        <ul className="list-disc pl-5">
          {lesson.bullets.map((b, i) => (<li key={i}>{b}</li>))}
        </ul>
        <p className="font-medium">{locale === 'ro' ? 'Exemplu' : 'Example'}</p>
        <p>{lesson.example}</p>
        <p className="font-medium">{locale === 'ro' ? 'Exercițiu pentru azi' : 'Exercise for today'}</p>
        <ol className="list-decimal pl-5">
          {lesson.exercise.map((s, i) => (<li key={i}>{s}</li>))}
        </ol>
        {lesson.linkToKuno ? (
          <>
            <p className="font-medium">Omni‑Kuno</p>
            <p>{lesson.linkToKuno}</p>
          </>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
          onClick={async () => {
            try {
              const label = lesson.title;
              await recordOmniPatch({
                kuno: {
                  gamification: applyKunoGamification(undefined, 'lesson'),
                  lessonsCompletedCount: increment(1) as unknown as number,
                  signals: { lastLessonsCsv: label } as unknown as Record<string, string>,
                },
              }, profile?.id);
              // Log a short session so EDU time is visible
              await recordPracticeSession('drill', Date.now() - 180000, 180, profile?.id);
            } catch {}
            setToast(locale === 'ro' ? 'Lecția a fost salvată' : 'Lesson saved');
            setTimeout(() => router.push('/progress'), 700);
          }}
          data-testid="learn-finish-content"
        >
          {locale === 'ro' ? 'Salvează și mergi la progres' : 'Save and go to progress'}
        </button>
      </div>
      {toast ? (
        <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md px-4">
          <Toast message={toast} okLabel="OK" onClose={() => setToast(null)} />
        </div>
      ) : null}
    </div>
  );
}

function LessonInner() {
  const search = useSearchParams();
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
  const qs = new URLSearchParams(search?.toString() ?? '');
  const locale = (qs.get('lang') === 'en' ? 'en' : 'ro') as 'ro' | 'en';
  const lessonId = decodeURIComponent(params?.lessonId || '');
  const cat = qs.get('cat') || 'general';
  const catDesc: Record<string, string> = {
    clarity: 'Antrenează claritatea: observare, jurnalizare scurtă, reframing. Construiește un spațiu mental de decizie. ',
    calm: 'Reglează-ți starea: respirație lentă (~6/min), relaxare activă, pauze scurte. ',
    energy: 'Stabilizează energia: micro‑mișcare, postură, ritm respirator și pauze curate. ',
    relationships: 'Îmbunătățește relațiile: întreabă intenția, ascultare activă, cadru comun. ',
    performance: 'Intră în flow: concentrare relaxată, provocare potrivită, feedback rapid. ',
    health: 'Consolidează sănătatea: somn, nutriție simplă, variabilitate în mișcare. ',
    general: 'Principii generale pentru progres consecvent și adaptare. ',
  };
  const [started, setStarted] = useState(() => qs.get('start') === '1');

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader compact onAuthRequest={e2e ? undefined : goToAuth} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Branch: if a registry lessonId is provided (e.g., initiation.stress_clarity), render content view */}
        {lessonId && lessonId.includes('.') ? (
          <ContentLessonView id={lessonId} locale={locale} />
        ) : (
          <div className="mx-auto max-w-2xl rounded-[14px] border border-[#E4DAD1] bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-semibold text-[#2C2C2C]">Omni‑Kuno</h1>
              <p className="mt-1 text-sm text-[#4A3A30]">Lecție scurtă — categorie: <span className="font-medium">{cat}</span></p>
            </div>

            {!started ? (
              <div className="mt-5">
                <p className="text-[13px] text-[#6A6A6A]">{catDesc[cat] ?? catDesc.general}Parcurge 3 întrebări rapide pentru a crește măiestria în această categorie.</p>
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                    data-testid="learn-start"
                  >
                    Începe
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <LessonQuiz category={cat} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LessonInner />
    </Suspense>
  );
}
