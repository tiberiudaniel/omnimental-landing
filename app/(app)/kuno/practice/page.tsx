"use client";

import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { AppShell } from '@/components/AppShell';
import Toast from '@/components/Toast';
import { useProfile } from '@/components/ProfileProvider';
import { CUNO_QUESTIONS } from '@/lib/cunoQuestions';
import { scoreAttempts, pickNextAdaptive } from '@/lib/kunoScoring';
import type { KunoAttempt, KunoCategory, KunoDifficulty, KunoQuestion } from '@/lib/kunoTypes';
import { saveKunoAttempts } from '@/lib/kunoPersistence';
import { recordPracticeSession } from '@/lib/progressFacts';
import { useProgressFacts } from '@/components/useProgressFacts';
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { canAccessOmniKuno, getTotalDailySessionsCompleted } from "@/lib/gatingSelectors";
import { GATING } from "@/lib/gatingConfig";

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
  greutate: "optimal_weight_management",
  weight: "optimal_weight_management",
  diet: "optimal_weight_management",
  dieta: "optimal_weight_management",
  alimentatie: "optimal_weight_management",
};

function PracticeInner() {
  const router = useRouter();
  const { profile } = useProfile();
  const search = useSearchParams();
  const { user, authReady } = useAuth();
  const cat = search?.get('cat');
  const n = Math.max(1, Math.min(10, Number(search?.get('n') ?? 5)));
  const returnPath = useMemo(() => {
    const qs = search?.toString();
    return qs && qs.length > 0 ? `/kuno/practice?${qs}` : "/kuno/practice";
  }, [search]);
  type BankQ = typeof CUNO_QUESTIONS[number];
  const questions: BankQ[] = useMemo(() => {
    const pool = cat ? CUNO_QUESTIONS.filter((q) => String(q.category) === cat) : CUNO_QUESTIONS;
    return pool;
  }, [cat]);
  const { data: facts, loading: factsLoading } = useProgressFacts(profile?.id ?? user?.uid ?? null);
  const totalSessions = getTotalDailySessionsCompleted(facts);
  const unlocked = canAccessOmniKuno(facts);
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/auth?returnTo=${encodeURIComponent(returnPath)}`);
    }
  }, [authReady, user, router, returnPath]);
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

  if (!authReady || factsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--omni-ink-soft)]">
        Se verifică accesul la OmniKuno...
      </div>
    );
  }
  if (!user) return null;
  if (!unlocked) {
    const remainingSessions = Math.max(0, GATING.omniKunoMinDailySessions - totalSessions);
    const progressPct = Math.min(
      100,
      Math.round((totalSessions / GATING.omniKunoMinDailySessions) * 100),
    );
    return (
      <div className="px-4 py-12">
        <section className="mx-auto max-w-3xl space-y-4 rounded-[28px] border border-[var(--omni-border-soft)] bg-white px-6 py-8 text-center text-[var(--omni-ink)] shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">OmniKuno</p>
          <h2 className="text-2xl font-semibold">Completează {GATING.omniKunoMinDailySessions} sesiuni reale pentru a exersa aici</h2>
          <p className="text-sm text-[var(--omni-ink)]/75">
            Ai {totalSessions} sesiuni înregistrate. Continuă cu /today și revino după prag pentru a rula mini-testele OmniKuno.
          </p>
          <div className="mx-auto mt-4 w-full max-w-sm text-left">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
              <span>Progres</span>
              <span>{progressPct}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[var(--omni-border-soft)]/60">
              <div className="h-2 rounded-full bg-[var(--omni-energy)]" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-1 text-[var(--omni-ink)]/70 text-xs">
              Mai ai {remainingSessions} {remainingSessions === 1 ? "zi" : "zile"} până când deblocăm mini-teste adaptive.
            </p>
          </div>
          <div className="mt-6 rounded-[18px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">Ce primești la acces</p>
            <ul className="mt-3 space-y-1 text-sm text-[var(--omni-ink)]/80">
              <li>• Drill-uri de 5 întrebări cu dificultate adaptivă.</li>
              <li>• Feedback instant și recomandare de lecție.</li>
              <li>• XP suplimentar pe trăsătura dominantă.</li>
            </ul>
          </div>
          <OmniCtaButton className="mt-4 justify-center" onClick={() => router.push("/today")}>
            Înapoi la /today
          </OmniCtaButton>
        </section>
      </div>
    );
  }
  if (done) {
    const s = scoreAttempts(attempts);
    const moduleId = CATEGORY_TO_MODULE[cat ?? ""] ?? "emotional_balance";
    const omniHref = `/omni-kuno?area=${moduleId}&module=${moduleId}`;
    return (
      <div className="mx-auto max-w-xl rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[var(--omni-ink)]">Rezultat</h2>
        <p className="mt-2 text-3xl font-bold text-[var(--omni-energy)]">{s.percent}%</p>
        <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">
          {cat ? 'Recomandare: continuă cu o lecție scurtă în aceeași categorie.' : 'Recomandare: încearcă o lecție scurtă pe o categorie utilă.'}
        </p>
        <Link
          className="mt-2 inline-block rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
          href={`/kuno/learn${cat ? `?cat=${encodeURIComponent(cat)}` : ''}`}
        >
          Mergi la lecții
        </Link>
        <button
          className="mt-4 rounded-[10px] border border-[var(--omni-border-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
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
        <Link
          className="mt-3 inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-energy)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)] hover:text-white"
          href={omniHref}
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

  const q = current;
  return (
    <div className="mx-auto max-w-xl rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">Întrebarea {Math.min(count + 1, n)}/{n}</p>
      <h2 className="mt-2 text-xl sm:text-2xl font-semibold leading-snug text-[var(--omni-ink)]">{q?.question}</h2>
      <div className="mt-3 grid gap-2">
        {(q?.options ?? []).map((opt, i) => (
          <button
            key={i}
            className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-2 text-left text-[13px] sm:text-sm text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
            onClick={() => onAnswer(i)}
            data-testid="practice-option"
          >
            {opt}
          </button>
        ))}
      </div>
      {showFb ? (
        <div className="mt-3 rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2">
          <p className={`text-sm ${wasCorrect ? 'text-[#1C5E3D]' : 'text-[#8A1F11]'}`}>
            {wasCorrect ? 'Corect' : 'Greșit'}
          </p>
          {lastExplanation ? (
            <p className="mt-1 text-[13px] sm:text-sm leading-relaxed text-[var(--omni-ink-soft)]">{lastExplanation}</p>
          ) : null}
          <div className="mt-2">
            <button
              className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
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
      <AppShell header={<HeaderWithAuth />} mainClassName="px-4 py-8">
        <PracticeInner />
      </AppShell>
    </Suspense>
  );
}

function HeaderWithAuth() {
  const search = useSearchParams();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
  return <SiteHeader onAuthRequest={e2e ? undefined : goToAuth} />;
}
