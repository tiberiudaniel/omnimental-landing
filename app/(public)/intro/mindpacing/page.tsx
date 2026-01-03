"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { MindPacingExperience, type IntroMindPacingResult } from "@/components/intro/steps/IntroMindPacingStep";

const RETURN_TO_TODAY = "/today?mode=short&source=mindpacing_safe";

function getPreviousDayKey(dayKey: string): string | null {
  const date = new Date(dayKey);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MindPacingPage() {
  const router = useRouter();
  const handleContinue = useCallback(
    (result: IntroMindPacingResult) => {
      const params = new URLSearchParams({
        source: "mindpacing",
        returnTo: RETURN_TO_TODAY,
      });
      const avoidKeys = [result.dayKey];
      const previousDayKey = getPreviousDayKey(result.dayKey);
      if (previousDayKey) {
        avoidKeys.push(previousDayKey);
      }
      params.set("avoid", avoidKeys.join(","));
      if (result.mindTag) {
        params.set("mindpacingTag", result.mindTag);
      }
      router.replace(`/intro/vocab?${params.toString()}`);
    },
    [router],
  );
  return <MindPacingExperience onContinue={handleContinue} />;
}
