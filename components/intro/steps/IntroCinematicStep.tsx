"use client";

import { useCallback } from "react";
import CinematicPlayer from "@/components/intro/CinematicPlayer";
import type { StepComponentProps } from "@/components/stepRunner/types";

export function IntroCinematicStep({ go, setState }: StepComponentProps) {
  const handleIntentSelect = useCallback(
    (intent: "guided" | "explore") => {
      setState((prev) => ({ ...prev, introIntent: intent }));
      go("next");
    },
    [go, setState],
  );
  return <CinematicPlayer allowSkip={false} onIntentSelect={handleIntentSelect} />;
}

export default IntroCinematicStep;
