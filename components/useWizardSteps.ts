"use client";

import { useCallback, useState } from "react";

export type Step =
  | "preIntro"
  | "intro"
  | "firstInput"
  | "reflectionPrompt"
  | "intent"
  | "intentSummary"
  | "reflectionSummary"
  | "cards"
  | "details";

export function useWizardSteps(initialStep: Step = "preIntro") {
  const [step, setStep] = useState<Step>(initialStep);

  const goToStep = useCallback((next: Step) => {
    setStep(next);
  }, []);

  return { step, goToStep };
}
