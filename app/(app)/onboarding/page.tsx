"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingCatLite from "@/components/onboarding/OnboardingCatLite";
import QuickStroopTask from "@/components/onboarding/QuickStroopTask";
import OnboardingFirstSession from "@/components/onboarding/OnboardingFirstSession";
import OnboardingFirstTemple from "@/components/onboarding/OnboardingFirstTemple";

const STEP_SEQUENCE = ["cat-lite", "quick-task", "first-session", "first-temple"] as const;
type OnboardingStep = (typeof STEP_SEQUENCE)[number];

function normalizeStep(value: string | null): OnboardingStep {
  if (!value) return "cat-lite";
  return STEP_SEQUENCE.includes(value as OnboardingStep) ? (value as OnboardingStep) : "cat-lite";
}

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = useMemo(() => normalizeStep(searchParams?.get("step") ?? null), [searchParams]);

  useEffect(() => {
    if (!searchParams) return;
    const current = searchParams.get("step");
    if (!current || !STEP_SEQUENCE.includes(current as OnboardingStep)) {
      router.replace("/onboarding?step=cat-lite");
    }
  }, [router, searchParams]);

  const goTo = (next: OnboardingStep) => {
    router.replace(`/onboarding?step=${next}`);
  };

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {step === "cat-lite" ? <OnboardingCatLite onComplete={() => goTo("quick-task")} /> : null}
        {step === "quick-task" ? <QuickStroopTask onComplete={() => goTo("first-session")} /> : null}
        {step === "first-session" ? <OnboardingFirstSession onComplete={() => goTo("first-temple")} /> : null}
        {step === "first-temple" ? <OnboardingFirstTemple /> : null}
      </div>
    </main>
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
