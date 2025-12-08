"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import { getCatProfile, completePillarsIntro } from "@/lib/firebase/cat";
import type { CatProfileDoc } from "@/types/cat";
import { PILLARS } from "@/config/pillars";

const TOTAL_STEPS = PILLARS.length + 1;

export default function OnboardingPillarsWizard() {
  const router = useRouter();
  const { user, loading, authReady } = useAuth();
  const [profile, setProfile] = useState<CatProfileDoc | null>(null);
  const [step, setStep] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await getCatProfile(user.uid);
        if (cancelled) return;
        setProfile(doc);
        if (doc?.pillarsIntroCompleted) {
          setStep(TOTAL_STEPS);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  const currentPillar = useMemo(() => {
    if (step === 0 || step > PILLARS.length) return null;
    return PILLARS[step - 1];
  }, [step]);

  const showCompletedMessage = profile?.pillarsIntroCompleted ?? false;

  const handleNext = async () => {
    setError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
      return;
    }
    if (!user?.uid) return;
    setSavingCompletion(true);
    setError(null);
    try {
      await completePillarsIntro(user.uid);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              pillarsIntroCompleted: true,
              pillarsIntroCompletedAt: prev.pillarsIntroCompletedAt ?? null,
            }
          : prev,
      );
      router.push("/onboarding/adaptive-practice");
    } catch (err) {
      console.error("Failed to complete pillars intro", err);
      setError("Nu am putut marca introducerea ca fiind completă. Încearcă din nou.");
    } finally {
      setSavingCompletion(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 0) return;
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStart = () => {
    setStep(1);
  };

  const overviewCards = (
    <div className="grid gap-4 md:grid-cols-2">
      {PILLARS.map((pillar) => (
        <div
          key={pillar.id}
          className="rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-4 text-left shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pilonul {pillar.index}</p>
          <h3 className="text-lg font-semibold">{pillar.title}</h3>
          <p className="text-sm text-[var(--omni-ink)]/75">{pillar.subtitle}</p>
        </div>
      ))}
    </div>
  );

  const pillarCard = currentPillar ? (
    <section className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
          Pilonul {currentPillar.index} din {PILLARS.length}
        </p>
        <h2 className="text-3xl font-semibold text-[var(--omni-ink)]">{currentPillar.title}</h2>
        <p className="text-base text-[var(--omni-ink)]/80">{currentPillar.subtitle}</p>
      </div>
      <p className="text-sm leading-relaxed text-[var(--omni-ink)]/85">{currentPillar.description}</p>
      <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-5 py-4 text-sm text-[var(--omni-ink)]/90">
        {currentPillar.catLinks}
      </div>
    </section>
  ) : null;

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pilonii OmniMental</p>
          <h1 className="text-3xl font-semibold">Cum transformăm profilul tău adaptiv în antrenament</h1>
          <p className="text-base text-[var(--omni-ink)]/80">
            OmniMental lucrează cu 5 piloni. Ei traduc scorurile tale CAT în practici concrete și orchestrarea zilnică.
          </p>
        </header>

        {loading || loadingProfile ? (
          <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center text-sm text-[var(--omni-muted)] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
            Pregătim traseul tău…
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-[var(--omni-danger)] bg-[#FDEAEA] px-6 py-8 text-center text-sm text-[var(--omni-danger)] shadow-[0_6px_22px_rgba(0,0,0,0.04)]">
            Ai nevoie de un cont pentru a continua.
          </div>
        ) : !profile ? (
          <section className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-semibold">Finalizează întâi evaluarea CAT</h2>
            <p className="text-sm text-[var(--omni-ink)]/80">
              Avem nevoie de baseline-ul tău pentru a personaliza pilonii. Revino după ce ai completat evaluarea.
            </p>
            <div className="flex justify-center">
              <OmniCtaButton as="link" href="/onboarding/cat-baseline">
                Mergi la evaluare
              </OmniCtaButton>
            </div>
          </section>
        ) : showCompletedMessage ? (
          <section className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-semibold">Ai parcurs deja pilonii OmniMental</h2>
            <p className="text-sm text-[var(--omni-ink)]/80">
              Poți merge direct la practica adaptivă orchestrată.
            </p>
            <div className="flex justify-center gap-3">
              <OmniCtaButton as="link" href="/onboarding/adaptive-practice">
                Continuă
              </OmniCtaButton>
              <OmniCtaButton as="link" href="/experience-onboarding" variant="neutral">
                Înapoi la hub
              </OmniCtaButton>
            </div>
          </section>
        ) : (
          <>
            {step === 0 ? (
              <section className="space-y-6 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
                <div className="space-y-4 text-center">
                  <p className="text-base text-[var(--omni-ink)]/85">
                    Aceștia sunt cei 5 piloni care îți vor orchestra zilele: Intel → Flex → Kuno → Abil → Scop.
                  </p>
                </div>
                {overviewCards}
                <div className="flex justify-center pt-4">
                  <OmniCtaButton onClick={handleStart}>Explorează-ți pilonii</OmniCtaButton>
                </div>
              </section>
            ) : (
              <>
                {pillarCard}
                {error ? (
                  <p className="text-sm text-[var(--omni-danger)]">{error}</p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <OmniCtaButton variant="neutral" onClick={handleBack} disabled={step === 0}>
                    Înapoi
                  </OmniCtaButton>
                  <OmniCtaButton onClick={handleNext} disabled={savingCompletion}>
                    {step === PILLARS.length ? (savingCompletion ? "Se finalizează..." : "Continuă către practică") : "Continuă"}
                  </OmniCtaButton>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
