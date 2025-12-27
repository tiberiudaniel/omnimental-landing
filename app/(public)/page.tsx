"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import StartScreen from "@/components/intro/StartScreen";
import { primeIntroAudio } from "@/components/intro/CinematicPlayer";

export default function HomeGate() {
  const router = useRouter();

  const handleStart = useCallback(async () => {
    try {
      await primeIntroAudio();
    } catch (error) {
      console.warn("[home] primeIntroAudio failed", error);
    } finally {
      router.push("/intro");
    }
  }, [router]);

  return <StartScreen onStart={handleStart} />;
}
