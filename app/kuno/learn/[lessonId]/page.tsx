"use client";

import { useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import AccountModal from '@/components/AccountModal';
import { CUNO_QUESTIONS } from '@/lib/cunoQuestions';
import type { KunoAttempt, KunoCategory, KunoDifficulty } from '@/lib/kunoTypes';
import { useProfile } from '@/components/ProfileProvider';
import { scoreAttempts } from '@/lib/kunoScoring';
import { saveKunoAttempts } from '@/lib/kunoPersistence';
import { recordOmniPatch, recordPracticeSession } from '@/lib/progressFacts';
import { increment } from 'firebase/firestore';
import { applyKunoGamification } from '@/lib/kunoGamification';
import Toast from '@/components/Toast';

function LessonQuiz({ category }: { category: string }) {
  const { profile } = useProfile();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const pool = useMemo(() => CUNO_QUESTIONS.filter((q) => String(q.category) === category), [category]);
  const questions = useMemo(() => pool.slice(0, 3), [pool]);
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
    return (
      <div className="mx-auto max-w-xl rounded-[14px] border border-[#E4DAD1] bg-white p-6 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-[#2C2C2C]">Rezultat micro‑lecție</h2>
        <p className="mt-2 text-3xl font-bold text-[#C07963]">{s.percent}%</p>
        <button
          className="mt-4 rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
          onClick={async () => {
            await saveKunoAttempts(profile?.id, attempts, s.percent);
            try {
              await recordOmniPatch({
                kuno: {
                  gamification: applyKunoGamification(undefined, 'lesson'),
                  lessonsCompletedCount: increment(1) as unknown as number,
                },
              }, profile?.id);
              // Log a practice session (~3 min) so trend reflects EDU time
              const started = Date.now() - 180000;
              await recordPracticeSession('drill', started, 180, profile?.id);
            } catch {}
            setToast('Lecția a fost salvată');
            setTimeout(() => router.push('/progress'), 700);
          }}
          data-testid="learn-finish"
        >
          Salvează și mergi la progress
        </button>
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

function LessonInner() {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const search = useSearchParams();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const params = new URLSearchParams(search?.toString() ?? '');
  const cat = params.get('cat') || 'general';
  const catDesc: Record<string, string> = {
    clarity: 'Antrenează claritatea: observare, jurnalizare scurtă, reframing. Construiește un spațiu mental de decizie. ',
    calm: 'Reglează-ți starea: respirație lentă (~6/min), relaxare activă, pauze scurte. ',
    energy: 'Stabilizează energia: micro‑mișcare, postură, ritm respirator și pauze curate. ',
    relationships: 'Îmbunătățește relațiile: întreabă intenția, ascultare activă, cadru comun. ',
    performance: 'Intră în flow: concentrare relaxată, provocare potrivită, feedback rapid. ',
    health: 'Consolidează sănătatea: somn, nutriție simplă, variabilitate în mișcare. ',
    general: 'Principii generale pentru progres consecvent și adaptare. ',
  };
  const [started, setStarted] = useState(true);

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader compact onAuthRequest={e2e ? undefined : (() => setAccountModalOpen(true))} />
      {e2e ? null : (
        <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
      )}
      <main className="mx-auto max-w-4xl px-4 py-8">
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
