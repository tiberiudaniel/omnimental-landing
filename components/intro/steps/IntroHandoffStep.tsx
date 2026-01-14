"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StepComponentProps } from "@/components/stepRunner/types";
import { getGuidedClusterParam } from "@/lib/guidedDayOne";
import type { IntroMindPacingResult } from "./IntroMindPacingStep";
import type { CatAxisId } from "@/lib/profileEngine";

function buildTarget(intent: "guided" | "explore", preserveE2E: boolean, axisId: CatAxisId | null) {
  const params = new URLSearchParams({ source: "intro" });
  params.set("intent", intent);
  if (intent === "guided") {
    params.set("lane", "guided_day1");
    if (axisId) {
      params.set("axis", axisId);
      const cluster = getGuidedClusterParam(axisId);
      if (cluster) {
        params.set("cluster", cluster);
      }
    }
  } else {
    params.set("mode", "explore");
  }
  if (preserveE2E) {
    params.set("e2e", "1");
  }
  return intent === "guided" ? `/intro/guided?${params.toString()}` : `/intro/explore?${params.toString()}`;
}

export function IntroHandoffStep({ state }: StepComponentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const intent = state.introIntent === "explore" ? "explore" : "guided";
    const preserveE2E = searchParams?.get("e2e") === "1";
    const mindResult = (state.introMindPacing ?? null) as IntroMindPacingResult | null;
    const axisId = (mindResult?.axisId ?? null) as CatAxisId | null;
    const target = buildTarget(intent, preserveE2E, axisId);
    router.replace(target);
  }, [router, searchParams, state.introIntent, state.introMindPacing]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-center text-sm text-[var(--omni-muted)]">
      Pregătim următoarea secțiune…
    </div>
  );
}

export default IntroHandoffStep;
