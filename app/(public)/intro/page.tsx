"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CinematicPlayer, { primeIntroAudio } from "@/components/intro/CinematicPlayer";
import { getIntroSeen } from "@/lib/introGate";

export default function IntroGatePage() {
  const router = useRouter();
  const [checkComplete, setCheckComplete] = useState(false);

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
  }, [checkComplete]);

  const allowSkip = useMemo(() => {
    if (!checkComplete || typeof window === "undefined") return false;
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get("e2e") === "1";
    } catch {
      return false;
    }
  }, [checkComplete]);

  if (!checkComplete) {
    return <div className="min-h-screen bg-[#0f1116]" />;
  }

  return <CinematicPlayer allowSkip={allowSkip} />;
}
