"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CinematicPlayer, { primeIntroAudio } from "@/components/intro/CinematicPlayer";
import StartScreen from "@/components/intro/StartScreen";
import { getIntroSeen } from "@/lib/introGate";

export default function IntroGatePage() {
  const router = useRouter();
  const [checkComplete, setCheckComplete] = useState(false);
  const [mode, setMode] = useState<"gate" | "cinematic">("gate");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;
    const frame = window.requestAnimationFrame(() => {
      const seen = getIntroSeen();
      if (seen) {
        router.replace("/today");
      } else if (mounted) {
        setCheckComplete(true);
      }
    });
    return () => {
      mounted = false;
      window.cancelAnimationFrame(frame);
    };
  }, [router]);

  const handleStart = async () => {
    const ok = await primeIntroAudio();
    if (typeof window !== "undefined") {
      const state = (window as typeof window & { __introAudioState?: string }).__introAudioState;
      console.log("primeIntroAudio ok:", ok, "state:", state);
    } else {
      console.log("primeIntroAudio ok:", ok);
    }
    setMode("cinematic");
  };

  if (!checkComplete) {
    return <div className="min-h-screen bg-[#0f1116]" />;
  }

  if (mode === "gate") {
    return <StartScreen onStart={handleStart} />;
  }

  return <CinematicPlayer allowSkip={false} />;
}
