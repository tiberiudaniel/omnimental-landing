"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type Step =
  | "preIntro"
  | "intro"
  | "firstInput"
  | "reflectionPrompt"
  | "intent"
  | "reflectionSummary"
  | "intentSummary"
  | "cards"
  | "details";

const ORDERED_STEPS: Step[] = [
  "preIntro",
  "intro",
  "firstInput",
  "reflectionPrompt",
  "intent",
  "reflectionSummary",
  "intentSummary",
  "cards",
  "details",
];

const isStep = (value: string | null): value is Step => {
  return Boolean(value && ORDERED_STEPS.includes(value as Step));
};

export function useWizardSteps(initialStep: Step = "preIntro") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParamStep = searchParams?.get("step");
  const [localStep, setLocalStep] = useState<Step>(
    isStep(initialParamStep) ? (initialParamStep as Step) : initialStep,
  );
  const step = useMemo(() => {
    const paramStep = searchParams?.get("step");
    return isStep(paramStep) ? (paramStep as Step) : localStep;
  }, [localStep, searchParams]);

  const goToStep = useCallback(
    (next: Step) => {
      setLocalStep(next);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("step", next);
      const queryString = params.toString();
      router.replace(queryString ? `/?${queryString}` : "/", { scroll: true });
    },
    [router, searchParams],
  );

  return { step, goToStep };
}
