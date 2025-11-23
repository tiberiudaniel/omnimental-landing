"use client";

import { Suspense, useState, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
import { useI18n } from "@/components/I18nProvider";
import { useProfile } from "@/components/ProfileProvider";
import OnboardingIntro from "@/components/OnboardingIntro";
import MiniSelfAssessment from "@/components/MiniSelfAssessment";
import MiniCunoTest from "@/components/MiniCunoTest";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

function OnboardingContent() {
  const router = useRouter();
  const { lang } = useI18n();
  const { profile } = useProfile();
  const search = useSearchParams();
  const demoMode = Boolean(search?.get('demo') || search?.get('e2e') === '1');
  const aliasEnabled =
    ((process.env.NEXT_PUBLIC_ONBOARDING_ALIAS === '1') ||
      (process.env.NEXT_PUBLIC_ONBOARDING_ALIAS?.toLowerCase?.() === 'true')) &&
    !demoMode;
  // Declare step state before any conditional return so hooks order is stable
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // NAV-05: Optional alias to experience-onboarding, preserving query
  useEffect(() => {
    if (!aliasEnabled) return;
    const params = new URLSearchParams(search?.toString() ?? '');
    params.set('flow', 'initiation');
    params.set('start', '1');
    // Do not force a step here; EO will normalize to intro when start=1
    router.replace(`/experience-onboarding?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aliasEnabled]);
  if (aliasEnabled) {
    return null;
  }

  if (!profile?.id) {
    const demo = search?.get('demo');
    if (demo) {
      // Allow onboarding flow in demo mode without auth
      return (
        <div className="min-h-screen bg-[#FAF7F2]">
          <SiteHeader compact />
          <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
            <div className="mx-auto mb-4 flex max-w-3xl items-center justify-center gap-2 text-[11px] text-[#7B6B60]">
              {[1, 2, 3].map((i) => (
                <span key={i} className={`inline-flex h-2 w-2 items-center justify-center rounded-full ${i <= step ? "bg-[#2C2C2C]" : "bg-[#E4DAD1]"}`} />
              ))}
              <span className="ml-2">
                {step === 1 ? (lang === "ro" ? "Pasul 1/3 — Context" : "Step 1/3 — Context") : step === 2 ? (lang === "ro" ? "Pasul 2/3 — Auto‑evaluare" : "Step 2/3 — Self‑assessment") : (lang === "ro" ? "Pasul 3/3 — Mini‑Cuno" : "Step 3/3 — Mini‑Knowledge")}
              </span>
            </div>
            {step === 1 ? (
              <OnboardingIntro profileId={"demo-user"} onDone={() => setStep(2)} />
            ) : step === 2 ? (
              <MiniSelfAssessment onDone={() => setStep(3)} />
            ) : (
              <MiniCunoTest lang={lang === "en" ? "en" : "ro"} onDone={() => router.push("/recommendation?demo=1")} />
            )}
          </main>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <SiteHeader compact />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-sm text-[#4A3A30]">Conectează-te pentru a începe onboarding-ul.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader compact />
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        {/* Stepper */}
        <div className="mx-auto mb-4 flex max-w-3xl items-center justify-center gap-2 text-[11px] text-[#7B6B60]">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`inline-flex h-2 w-2 items-center justify-center rounded-full ${i <= step ? "bg-[#2C2C2C]" : "bg-[#E4DAD1]"}`} />
          ))}
          <span className="ml-2">
            {step === 1 ? (lang === "ro" ? "Pasul 1/3 — Context" : "Step 1/3 — Context") : step === 2 ? (lang === "ro" ? "Pasul 2/3 — Auto‑evaluare" : "Step 2/3 — Self‑assessment") : (lang === "ro" ? "Pasul 3/3 — Mini‑Cuno" : "Step 3/3 — Mini‑Knowledge")}
          </span>
        </div>

        {step === 1 ? (
          <OnboardingIntro profileId={profile.id} onDone={() => setStep(2)} />
        ) : step === 2 ? (
          <MiniSelfAssessment onDone={() => setStep(3)} />
        ) : (
          <MiniCunoTest lang={lang === "en" ? "en" : "ro"} onDone={() => router.push("/recommendation")} />
        )}
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
