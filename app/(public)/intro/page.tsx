"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StepRunner from "@/components/stepRunner/StepRunner";
import { getIntroManifest } from "@/lib/stepManifests/intro";
import { primeIntroAudio } from "@/components/intro/CinematicPlayer";
import { getIntroSeen } from "@/lib/introGate";
import IntroCinematicStep from "@/components/intro/steps/IntroCinematicStep";
import IntroMindPacingStep from "@/components/intro/steps/IntroMindPacingStep";
import IntroVocabStep from "@/components/intro/steps/IntroVocabStep";
import IntroHandoffStep from "@/components/intro/steps/IntroHandoffStep";

export default function IntroGatePage() {
  const router = useRouter();
  const [gateChecked, setGateChecked] = useState(false);
  const manifest = useMemo(() => getIntroManifest(), []);
  const stepRegistry = useMemo(
    () => ({
      cinematic: IntroCinematicStep,
      mindpacing: IntroMindPacingStep,
      vocab: IntroVocabStep,
      handoff: IntroHandoffStep,
    }),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;
    const frame = window.requestAnimationFrame(() => {
      const seen = getIntroSeen();
      if (seen) {
        router.replace("/today");
      } else if (mounted) {
        setGateChecked(true);
      }
    });
    return () => {
      mounted = false;
      window.cancelAnimationFrame(frame);
    };
  }, [router]);

  useEffect(() => {
    if (!gateChecked) return;
    void primeIntroAudio().catch((error) => {
      console.warn("[intro] primeIntroAudio failed", error);
    });
  }, [gateChecked]);

  if (!gateChecked) {
    return <div className="min-h-screen bg-[#0f1116]" />;
  }

  return <StepRunner routePath="/intro" manifest={manifest} registry={stepRegistry} />;
}
