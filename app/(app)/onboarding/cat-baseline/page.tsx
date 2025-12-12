"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import { CAT_ITEMS } from "@/config/catEngine";
import type { CatItemConfig } from "@/config/catEngine";
import { getCatProfile, saveCatBaseline } from "@/lib/firebase/cat";
import type { CatAnswerMap } from "@/types/cat";

const BASELINE_ITEMS = CAT_ITEMS.filter((item) => item.usedInBaseline);

export default function CatBaselinePage() {
  const router = useRouter();
  const { user, loading, authReady } = useAuth();
  const [answers, setAnswers] = useState<CatAnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = BASELINE_ITEMS.length;
  const currentItem = BASELINE_ITEMS[currentIndex];
  const currentValue = answers[currentItem?.id ?? ""] ?? null;
  const answeredCount = BASELINE_ITEMS.filter((item) => typeof answers[item.id] === "number").length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await getCatProfile(user.uid);
        if (cancelled) return;
        if (profile) {
          router.replace("/onboarding/cat-baseline/result");
          return;
        }
      } finally {
        if (!cancelled) {
          setCheckingProfile(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, router, user]);

  const handleAnswer = (itemId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
    setError(null);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setError(null);
  };

  const handleNext = async () => {
    if (!currentItem) return;
    if (!isLastQuestion) {
      setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      return;
    }
    await submitBaseline();
  };

  const submitBaseline = async () => {
    if (!user?.uid) {
      setError("Ai nevoie de un profil OmniMental pentru a salva scorurile.");
      return;
    }
    const baselineComplete = answeredCount === totalQuestions;
    if (!baselineComplete) {
      setError("Completează toate întrebările pentru a finaliza baseline-ul.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await saveCatBaseline(user.uid, answers);
      router.push("/onboarding/cat-baseline/result");
    } catch (err) {
      console.error("[CAT baseline] failed to save profile", err);
      setError("Nu am putut salva răspunsurile. Încearcă din nou în câteva momente.");
    } finally {
      setSubmitting(false);
    }
  };

  const showLoader = loading || checkingProfile || !authReady;
  const showAuthWarning = !loading && authReady && !user;

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">CAT Baseline</p>
          <h1 className="text-3xl font-semibold">Cognitive Adaptive Traits – Evaluare inițială</h1>
          <p className="text-base text-[var(--omni-ink)]/80">
            Răspunde sincer la fiecare afirmație. Nu există răspuns corect – doar felul în care simți că funcționezi acum.
          </p>
        </header>

        {showLoader ? (
          <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center text-sm text-[var(--omni-muted)] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
            Pregătim evaluarea…
          </div>
        ) : showAuthWarning ? (
          <div className="rounded-2xl border border-[var(--omni-danger)] bg-[#FDEAEA] px-6 py-8 text-center text-sm text-[var(--omni-danger)] shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
            Nu te putem identifica în acest moment. Reîncarcă pagina sau autentifică-te pentru a continua.
          </div>
        ) : (
          <section className="space-y-6 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                Întrebarea {currentIndex + 1} din {totalQuestions}
              </p>
              <div className="w-full rounded-full bg-[var(--omni-bg-main)]">
                <div
                  className="rounded-full bg-[var(--omni-energy)] py-[6px] text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition-all"
                  style={{ width: `${Math.max(progressPercent, 5)}%` }}
                >
                  {progressPercent}%
                </div>
              </div>
            </div>
            {currentItem ? (
              <CatSliderQuestion item={currentItem} value={currentValue} onChange={(value) => handleAnswer(currentItem.id, value)} />
            ) : null}
            {error ? (
              <div className="rounded-[14px] border border-[var(--omni-danger)] bg-[#FBEAEA] px-4 py-3 text-sm text-[var(--omni-danger)]">
                {error}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <OmniCtaButton variant="neutral" onClick={handlePrev} disabled={currentIndex === 0}>
                Înapoi
              </OmniCtaButton>
              <OmniCtaButton onClick={handleNext} disabled={typeof currentValue !== "number" || submitting}>
                {submitting ? "Salvez..." : isLastQuestion ? "Finalizează baseline" : "Continuă"}
              </OmniCtaButton>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function CatSliderQuestion({
  item,
  value,
  onChange,
}: {
  item: CatItemConfig;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold text-[var(--omni-ink)]">{item.text}</p>
      <div className="space-y-4">
        <input
          type="range"
          min={1}
          max={7}
          step={1}
          value={value ?? 4}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[var(--omni-energy)]"
        />
        <div className="flex justify-between text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          <span>Deloc</span>
          <span>Întotdeauna</span>
        </div>
        <div className="text-center text-sm text-[var(--omni-ink)]">
          {typeof value === "number" ? `Scor selectat: ${value}` : "Mută sliderul pentru a alege un răspuns."}
        </div>
      </div>
    </div>
  );
}
