"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import CinematicPlayer from "@/components/intro/CinematicPlayer";
import type { StepComponentProps } from "@/components/stepRunner/types";

export function IntroCinematicStep({ go, setState }: StepComponentProps) {
  const searchParams = useSearchParams();
  const allowSkip =
    (searchParams?.get("e2e") ?? searchParams?.get("demo")) === "1" ||
    searchParams?.get("allowSkip") === "1";
  const handleIntentSelect = useCallback(
    (intent: "guided" | "explore") => {
      setState((prev) => ({ ...prev, introIntent: intent }));
      go("next");
    },
    [go, setState],
  );
  return <CinematicPlayer allowSkip={allowSkip} onIntentSelect={handleIntentSelect} />;
}

export default IntroCinematicStep;
