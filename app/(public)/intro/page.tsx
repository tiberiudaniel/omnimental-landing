"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CinematicPlayer, { primeIntroAudio } from "@/components/intro/CinematicPlayer";
import { getIntroSeen } from "@/lib/introGate";

export default function IntroGatePage() {
  const router = useRouter();
  const [checkComplete, setCheckComplete] = useState(false);
  const [allowSkip, setAllowSkip] = useState(false);

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

  useEffect(() => {
    if (!checkComplete) return;
    void primeIntroAudio().catch((error) => {
      console.warn("[intro] primeIntroAudio failed", error);
    });
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        const e2e = url.searchParams.get("e2e") === "1";
        setAllowSkip(e2e);
      } catch {
        setAllowSkip(false);
      }
    }
  }, [checkComplete]);

  if (!checkComplete) {
    return <div className="min-h-screen bg-[#0f1116]" />;
  }

  return <CinematicPlayer allowSkip={allowSkip} />;
}
