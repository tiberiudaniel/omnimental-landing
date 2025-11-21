"use client";

import { Suspense, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import Toast from '@/components/Toast';
import { useProfile } from '@/components/ProfileProvider';
import { CUNO_QUESTIONS } from '@/lib/cunoQuestions';
import { scoreAttempts, pickNextAdaptive } from '@/lib/kunoScoring';
import type { KunoAttempt, KunoCategory, KunoDifficulty, KunoQuestion } from '@/lib/kunoTypes';
import { saveKunoAttempts } from '@/lib/kunoPersistence';
import { recordPracticeSession } from '@/lib/progressFacts';
import { useProgressFacts } from '@/components/useProgressFacts';

function PracticeInner() {
  const router = useRouter();
  const { profile } = useProfile();
  const search = useSearchParams();
  const cat = search?.get('cat');
  const n = Math.max(1, Math.min(10, Number(search?.get('n') ?? 5)));
  type BankQ = typeof CUNO_QUESTIONS[number];
  const questions: BankQ[] = useMemo(() => {
    const pool = cat ? CUNO_QUESTIONS.filter((q) => String(q.category) === cat) : CUNO_QUESTIONS;
    return pool;
  }, [cat]);
  const { data: facts } = useProgressFacts(profile?.id);
  const mastery = useMemo(() => {
    const mk = (facts?.omni as unknown as { kuno?: { masteryByCategory?: Record<string, number> } } | undefined)?.kuno?.masteryByCategory;
    if (mk) return mk;
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('omnimental_kuno_guest_mastery');
        if (raw) return JSON.parse(raw) as Record<string, number>;
      } catch {}
    }
    return undefined;
  }, [facts?.omni]);
  const [count, setCount] = useState(0);
  const [attempts, setAttempts] = useState<KunoAttempt[]>([]);
  const [current, setCurrent] = useState<BankQ | undefined>(() => questions[0]);
  const seenRef = useRef<Set<string>>(new Set(current ? [current.id] : []));
  const done = count >= n;

  const [showFb, setShowFb] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const advanceNext = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    if (nextCount < n) {
      const pool: KunoQuestion[] = questions.map((bq) => ({
        id: bq.id,
        category: (bq.category ?? 'general') as KunoCategory,
        difficulty: (bq.difficulty ?? 1) as KunoDifficulty,
        question: bq.question,
        options: bq.options,
        correctIndex: bq.correctIndex,
        explanation: bq.explanation,
      }));
      const nextK = pickNextAdaptive(pool, seenRef.current, attempts[attempts.length - 1], mastery as unknown as Partial<Record<KunoCategory, number>> | undefined);
      if (nextK) {
        const nextQ = questions.find((qq) => qq.id === nextK.id);
        if (nextQ) {
          setCurrent(nextQ);
          seenRef.current.add(nextQ.id);
        }
      }
    }
  };

  const onAnswer = async (optionIndex: number) => {
    const q = current;
    if (!q) return;
    if (showFb) {
      // Treat a second click as "next" to support rapid flows in tests
      setShowFb(false);
      advanceNext();
      return;
    }
    const correct = typeof q.correctIndex === 'number' && q.correctIndex >= 0 ? optionIndex === q.correctIndex : false;
    setWasCorrect(correct);
    setLastExplanation(q.explanation ?? null);
    setShowFb(true);
    const attempt: KunoAttempt = {
      questionId: q.id,
      category: (q.category ?? 'general') as KunoCategory,
      difficulty: (q.difficulty ?? 1) as KunoDifficulty,
      correct,
      timeMs: 0,
      ts: 0,
    };
    setAttempts((prev) => [...prev, attempt]);
  };

  const [toast, setToast] = useState<string | null>(null);
  if (done) {
    const s = scoreAttempts(attempts);
    return (
      <div className="mx-auto max-w-xl rounded-[14px] border border-[#E4D8CE] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#2C2C2C]">Rezultat</h2>
        <p className="mt-2 text-3xl font-bold text-[#C07963]">{s.percent}%</p>
        <p className="mt-2 text-sm text-[#4A3A30]">
          {cat ? 'Recomandare: continuă cu o lecție scurtă în aceeași categorie.' : 'Recomandare: încearcă o lecție scurtă pe o categorie utilă.'}
        </p>
        <Link
          className="mt-2 inline-block rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
          href={`/kuno/learn${cat ? `?cat=${encodeURIComponent(cat)}` : ''}`}
        >
          Mergi la lecții
        </Link>
        <button
          className="mt-4 rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
          onClick={async () => {
            await saveKunoAttempts(profile?.id, attempts, s.percent);
            try {
              const started = Date.now() - 180000; // ~3 min
              await recordPracticeSession('drill', started, 180, profile?.id);
            } catch {}
            setToast('Sesiunea Kuno a fost salvată');
            // Deterministic client-side navigation for tests/Beta
            setTimeout(() => {
              router.push('/progress?from=kuno-practice');
            }, 300);
          }}
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

  const q = current;
  return (
    <div className="mx-auto max-w-xl rounded-[14px] border border-[#E4D8CE] bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">Întrebarea {Math.min(count + 1, n)}/{n}</p>
      <h2 className="mt-2 text-xl sm:text-2xl font-semibold leading-snug text-[#1F1F1F]">{q?.question}</h2>
      <div className="mt-3 grid gap-2">
        {(q?.options ?? []).map((opt, i) => (
          <button
            key={i}
            className="rounded-[10px] border border-[#D8C6B6] px-3 py-2 text-left text-[13px] sm:text-sm text-[#2C2C2C] hover:border-[#2C2C2C]"
            onClick={() => onAnswer(i)}
          >
            {opt}
          </button>
        ))}
      </div>
      {showFb ? (
        <div className="mt-3 rounded-[10px] border border-[#E4DAD1] bg-[#FFFBF7] px-3 py-2">
          <p className={`text-sm ${wasCorrect ? 'text-[#1C5E3D]' : 'text-[#8A1F11]'}`}>
            {wasCorrect ? 'Corect' : 'Greșit'}
          </p>
          {lastExplanation ? (
            <p className="mt-1 text-[13px] sm:text-sm leading-relaxed text-[#4A3A30]">{lastExplanation}</p>
          ) : null}
          <div className="mt-2">
            <button
              className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
              onClick={() => {
                setShowFb(false);
                advanceNext();
              }}
            >
              Următoarea întrebare
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-[#FDFCF9]">
        {/* Render main content before header so first button is a quiz option (E2E stability) */}
        <main className="px-4 py-8">
          <PracticeInner />
        </main>
        <HeaderWithAuth />
      </div>
    </Suspense>
  );
}

function HeaderWithAuth() {
  const search = useSearchParams();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
  return <SiteHeader compact onAuthRequest={e2e ? undefined : goToAuth} />;
}
