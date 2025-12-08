"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import CatLikertQuestion from "@/components/cat/CatLikertQuestion";
import { CAT_ITEMS } from "@/config/catEngine";
import type { CatItemConfig } from "@/config/catEngine";
import { getCatProfile, saveCatBaseline } from "@/lib/firebase/cat";
import type { CatAnswerMap } from "@/types/cat";

type StepConfig =
  | { id: "intro"; kind: "intro" }
  | { id: string; kind: "questions"; title: string; description: string; itemIds: string[] };

const BASELINE_ITEMS = CAT_ITEMS.filter((item) => item.usedInBaseline);

const STEP_SEQUENCE: StepConfig[] = [
  { id: "intro", kind: "intro" },
  {
    id: "clarity-flex",
    kind: "questions",
    title: "Claritate & Flexibilitate",
    description: "Cum definești problemele și cât de repede îți schimbi strategia când contextul o cere.",
    itemIds: ["clarity_1", "clarity_2", "flex_1", "flex_2"],
  },
  {
    id: "emo-recalib",
    kind: "questions",
    title: "Stabilitate emoțională & Recalibrare",
    description: "Cum te regăsești sub presiune și cât de repede transformi greșelile în ajustări.",
    itemIds: ["emo_stab_1", "emo_stab_2", "recalib_1", "recalib_2"],
  },
  {
    id: "focus-energy",
    kind: "questions",
    title: "Focus & Energie",
    description: "Câtă continuitate și reziliență energetică menții în zile încărcate.",
    itemIds: ["focus_1", "focus_2", "energy_1", "energy_2"],
  },
  {
    id: "adapt-conf",
    kind: "questions",
    title: "Încredere adaptativă",
    description: "Cât de repede crezi că poți învăța și te poți adapta în fața schimbărilor mari.",
    itemIds: ["adapt_conf_1", "adapt_conf_2"],
  },
];

const stepCount = STEP_SEQUENCE.length;

export default function CatBaselinePage() {
  const router = useRouter();
  const { user, loading, authReady } = useAuth();
  const [answers, setAnswers] = useState<CatAnswerMap>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questionMap = useMemo(() => {
    const map = new Map<string, CatItemConfig>();
    for (const item of BASELINE_ITEMS) {
      map.set(item.id, item);
    }
    return map;
  }, []);

  const currentStep = STEP_SEQUENCE[currentStepIndex];

  const totalQuestions = BASELINE_ITEMS.length;
  const answeredCount = BASELINE_ITEMS.filter((item) => typeof answers[item.id] === "number").length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  useEffect(() => {
    if (!authReady) {
      return;
    }
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
  };

  const handleNext = () => {
    if (currentStepIndex < stepCount - 1) {
      setCurrentStepIndex((index) => index + 1);
      setError(null);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex === 0) return;
    setCurrentStepIndex((index) => index - 1);
    setError(null);
  };

  const allRequiredAnswered =
    currentStep.kind === "intro" ||
    (currentStep.itemIds ?? []).every((id) => typeof answers[id] === "number");

  const baselineComplete = answeredCount === totalQuestions;

  const showLoader = loading || checkingProfile || !authReady;
  const showAuthWarning = !loading && authReady && !user;

  const submitBaseline = async () => {
    if (!user?.uid) {
      setError("Ai nevoie de un profil OmniMental pentru a salva scorurile.");
      return;
    }
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
      console.error("Failed to save CAT baseline", err);
      setError("Nu am putut salva răspunsurile. Încearcă din nou în câteva momente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">CAT Baseline</p>
          <h1 className="text-3xl font-semibold">Cognitive Adaptive Traits – Evaluare inițială</h1>
          <p className="text-base text-[var(--omni-ink)]/80">
            3–5 minute pentru a vedea unde ești pe axele clare OmniMental. Nu există răspunsuri bune sau greșite,
            ci un profil sincer al adaptivității tale.
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
          <>
            {currentStep.kind !== "intro" ? (
              <div className="space-y-3 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-4 shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                      Pas {currentStepIndex} din {stepCount - 1}
                    </p>
                    <p className="text-sm text-[var(--omni-ink)]/70">Întrebări completate: {answeredCount}/{totalQuestions}</p>
                  </div>
                  <div className="w-full max-w-xs rounded-full bg-[var(--omni-bg-main)]">
                    <div
                      className="rounded-full bg-[var(--omni-energy)] py-[6px] text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition-all"
                      style={{ width: `${Math.max(progressPercent, 8)}%` }}
                    >
                      {progressPercent}%
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep.kind === "intro" ? (
              <section className="space-y-6 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-10 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
                <div className="space-y-4 text-[var(--omni-ink)]">
                  <h2 className="text-2xl font-semibold">Cum funcționează această evaluare</h2>
                  <p>
                    Fiecare afirmație descrie un obicei cognitiv sau emoțional. Marchează cât de des se aplică la tine,
                    sincer și fără filtrul “cum ar trebui”. Răspunsurile tale rămân private și ne ajută să calibrăm
                    recomandările AI și pilonii OmniMental.
                  </p>
                  <ul className="list-disc space-y-2 pl-6 text-sm text-[var(--omni-ink)]/85">
                    <li>Durată: 3–5 minute, 14 itemi pe scala 1–7.</li>
                    <li>Nu există răspunsuri corecte. Căutăm patternuri reale, nu perfecțiune.</li>
                    <li>Poți reveni pe pași anteriori înainte de a finaliza.</li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3">
                  <OmniCtaButton onClick={handleNext} variant="primary">
                    Începe evaluarea
                  </OmniCtaButton>
                  <OmniCtaButton as="link" href="/experience-onboarding" variant="neutral">
                    Înapoi
                  </OmniCtaButton>
                </div>
              </section>
            ) : (
              <section className="space-y-6">
                <div className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 shadow-[0_20px_35px_rgba(0,0,0,0.06)]">
                  <h2 className="text-xl font-semibold">{currentStep.title}</h2>
                  <p className="text-sm text-[var(--omni-ink)]/80">{currentStep.description}</p>
                </div>
                <div className="space-y-5">
                  {currentStep.itemIds.map((itemId) => {
                    const item = questionMap.get(itemId);
                    if (!item) return null;
                    return (
                      <CatLikertQuestion
                        key={item.id}
                        item={item}
                        value={answers[item.id]}
                        onChange={(value) => handleAnswer(item.id, value)}
                      />
                    );
                  })}
                </div>
                {error ? (
                  <div className="rounded-[14px] border border-[var(--omni-danger)] bg-[#FBEAEA] px-4 py-3 text-sm text-[var(--omni-danger)]">
                    {error}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <OmniCtaButton variant="neutral" onClick={handlePrev} disabled={currentStepIndex === 0}>
                    Înapoi
                  </OmniCtaButton>
                  {currentStepIndex < stepCount - 1 ? (
                    <OmniCtaButton onClick={handleNext} disabled={!allRequiredAnswered}>
                      Continuă
                    </OmniCtaButton>
                  ) : (
                    <OmniCtaButton onClick={submitBaseline} disabled={!allRequiredAnswered || submitting}>
                      {submitting ? "Salvez..." : "Finalizează baseline"}
                    </OmniCtaButton>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
