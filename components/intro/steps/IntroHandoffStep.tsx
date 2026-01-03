"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StepComponentProps } from "@/components/stepRunner/types";

function buildTarget(intent: "guided" | "explore", preserveE2E: boolean) {
  const base = intent === "explore" ? "/intro/explore" : "/intro/guided";
  const params = new URLSearchParams({ source: "intro_spine" });
  if (preserveE2E) {
    params.set("e2e", "1");
  }
  const query = params.toString();
  return `${base}?${query}`;
}

export function IntroHandoffStep({ state }: StepComponentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const intent = state.introIntent === "explore" ? "explore" : "guided";
    const preserveE2E = searchParams?.get("e2e") === "1";
    const target = buildTarget(intent, preserveE2E);
    router.replace(target);
  }, [router, searchParams, state.introIntent]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-center text-sm text-[var(--omni-muted)]">
      Pregătim următoarea secțiune…
    </div>
  );
}

export default IntroHandoffStep;
