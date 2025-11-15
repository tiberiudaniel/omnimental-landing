"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import StepIntro from "./steps/StepIntro";
import StepMiniTest from "./steps/StepMiniTest";
import StepMiniTestScore from "./steps/StepMiniTestScore";
import StepProgressRedirect from "./steps/StepProgressRedirect";
import StepJournal from "./steps/StepJournal";
import StepBreathPractice from "./steps/StepBreathPractice";
import StepProjection from "./steps/StepProjection";

export type StepId =
  | "intro"
  | "miniTest"
  | "score"
  | "progressRedirect"
  | "journal"
  | "breath"
  | "projection";

function ExperienceOnboardingContent() {
  const router = useRouter();
  const search = useSearchParams();
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  const start = search?.get("start") === "1";
  const stepParam = (search?.get("step") as StepId | null) ?? null;
  const [step, setStep] = useState<StepId>(stepParam ?? (start ? "intro" : "intro"));

  // Normalize entry: when coming with start=1, force intro and clear any stray step
  useEffect(() => {
    if (start && stepParam !== "intro") {
      const params = new URLSearchParams(search?.toString() ?? "");
      params.delete("step");
      params.set("step", "intro");
      router.replace(`?${params.toString()}`, { scroll: false });
      setStep("intro");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const go = (next: StepId, extra?: Record<string, string>) => {
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("step", next);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, String(v));
    }
    router.replace(`?${params.toString()}`, { scroll: false });
    setStep(next);
  };

  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<{ raw: number; max: number }>({ raw: 0, max: 0 });
  const [miniMeta, setMiniMeta] = useState<{ topicKey?: string; questions?: Array<{ id: string; correctIndex: number; style?: string }> } | undefined>();

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader compact />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        {step === "intro" && (
          <StepIntro onStart={() => go("miniTest")} />
        )}
        {step === "miniTest" && (
          <StepMiniTest
            onSubmit={(a, s, meta) => {
              setAnswers(a);
              setScore(s);
              setMiniMeta(meta);
              go("score");
            }}
          />
        )}
        {step === "score" && (
          <StepMiniTestScore
            answers={answers}
            score={score}
            userId={profile?.id ?? null}
            topicKey={miniMeta?.topicKey}
            questionsMeta={miniMeta?.questions}
            onContinue={() => go("progressRedirect")}
          />
        )}
        {step === "progressRedirect" && (
          <StepProgressRedirect onRedirect={() => router.push("/progress?from=experience-onboarding")}/>
        )}
        {step === "journal" && (
          <StepJournal
            userId={profile?.id ?? null}
            onSaved={() => router.push("/progress?after=os")}
            onSkip={() => go("breath")}
          />
        )}
        {step === "breath" && (
          <StepBreathPractice userId={profile?.id} onDone={() => router.push("/progress?after=abil")} onSkip={() => go("projection")} />
        )}
        {step === "projection" && (
          <StepProjection onGoTraining={() => router.push("/antrenament")} />
        )}
      </main>
    </div>
  );
}

export default function ExperienceOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ExperienceOnboardingContent />
    </Suspense>
  );
}
