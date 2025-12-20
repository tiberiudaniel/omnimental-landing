"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingCatLite from "@/components/onboarding/OnboardingCatLite";
import QuickStroopTask from "@/components/onboarding/QuickStroopTask";
import OnboardingFirstSession from "@/components/onboarding/OnboardingFirstSession";
import OnboardingFirstTemple from "@/components/onboarding/OnboardingFirstTemple";
import { useAuth } from "@/components/AuthProvider";
import type { OnboardingProgressMeta } from "@/components/onboarding/OnboardingProgressBar";
import { useProgressFacts } from "@/components/useProgressFacts";
import { getTotalDailySessionsCompleted } from "@/lib/gatingSelectors";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export const ONBOARDING_STEPS = ["cat-lite", "quick-task", "first-session", "first-temple"] as const;
export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

const DEFAULT_STEP: OnboardingStepId = "cat-lite";
const RETURN_TO = "/onboarding?step=cat-lite";

function normalizeStep(value: string | null): OnboardingStepId {
  if (!value) return DEFAULT_STEP;
  return ONBOARDING_STEPS.includes(value as OnboardingStepId) ? (value as OnboardingStepId) : DEFAULT_STEP;
}

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authReady } = useAuth();
  const { data: progressFacts } = useProgressFacts(user?.uid ?? null);
  const step = useMemo(() => normalizeStep(searchParams?.get("step") ?? null), [searchParams]);
  const stepIndex = Math.max(0, ONBOARDING_STEPS.indexOf(step));
  const progress: OnboardingProgressMeta = useMemo(
    () => ({
      stepIndex,
      totalSteps: ONBOARDING_STEPS.length,
    }),
    [stepIndex],
  );

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/auth?returnTo=${encodeURIComponent(RETURN_TO)}`);
    }
  }, [authReady, user, router]);

  const goTo = (next: OnboardingStepId) => {
    router.replace(`/onboarding?step=${next}`);
  };

  const totalDailySessions = getTotalDailySessionsCompleted(progressFacts);
  const hasCompletedFirstDaily = totalDailySessions >= 1;

  if (!authReady || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-sm text-[var(--omni-ink-soft)]">
        Pregătim traseul tău...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {step === "cat-lite" ? <OnboardingCatLite onComplete={() => goTo("quick-task")} progress={progress} /> : null}
        {step === "quick-task" ? (
          hasCompletedFirstDaily ? (
            <QuickStroopTask onComplete={() => goTo("first-session")} progress={progress} />
          ) : (
            <LockedStepPanel
              title="Mini-testul se deschide după prima sesiune reală"
              description="Începe cu /today și finalizează o sesiune ghidată. După aceea, mini-Stroop-ul devine disponibil."
              actionLabel="Merg la /today"
              onAction={() => router.replace("/today")}
            />
          )
        ) : null}
        {step === "first-session" ? (
          <OnboardingFirstSession onComplete={() => goTo("first-temple")} progress={progress} />
        ) : null}
        {step === "first-temple" ? (
          hasCompletedFirstDaily ? (
            <OnboardingFirstTemple progress={progress} />
          ) : (
            <LockedStepPanel
              title="Templul apare după primul antrenament zilnic"
              description="Finalizează prima sesiune /today ca să vezi harta ta și templul activat."
              actionLabel="Finalizez prima sesiune"
              onAction={() => router.replace("/today")}
            />
          )
        ) : null}
      </div>
    </main>
  );
}

type LockedStepPanelProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

function LockedStepPanel({ title, description, actionLabel, onAction }: LockedStepPanelProps) {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 text-center shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pas blocat temporar</p>
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">{title}</h2>
      <p className="text-sm text-[var(--omni-ink)]/80">{description}</p>
      <OmniCtaButton className="mx-auto mt-4 justify-center" onClick={onAction}>
        {actionLabel}
      </OmniCtaButton>
    </section>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-center text-[var(--omni-ink-soft)]">
          Se pregătește onboarding-ul…
        </main>
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}
