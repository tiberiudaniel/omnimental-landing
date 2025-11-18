"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readWizardState, writeWizardState } from "./wizardStorage";

export type Step =
  | "preIntro"
  | "intro"
  | "firstInput"
  | "reflectionPrompt"
  | "intent"
  | "reflectionSummary"
  | "needMain"
  | "needConfidence"
  | "microLessonInfo"
  | "intentMotivation" // new canonical name
  | "intentSummary" // legacy alias accepted in URL
  | "cards"
  | "details";

const ORDERED_STEPS: Step[] = [
  "preIntro",
  "intro",
  "firstInput",
  "reflectionPrompt",
  "intent",
  "reflectionSummary",
  "needMain",
  "needConfidence",
  "microLessonInfo",
  "intentMotivation",
  "cards",
  "details",
];

const LEGACY_ALIASES: Record<string, Step> = {
  intentSummary: "intentMotivation",
};

const isStep = (value: string | null): value is Step => {
  if (!value) return false;
  if (ORDERED_STEPS.includes(value as Step)) return true;
  return Boolean(LEGACY_ALIASES[value]);
};

export function useWizardSteps(initialStep: Step = "preIntro") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParamStep = searchParams?.get("step");
  const hasQueryStepRef = useRef(isStep(initialParamStep));
  const [localStep, setLocalStep] = useState<Step>(
    isStep(initialParamStep) ? (initialParamStep as Step) : initialStep,
  );
  const step = useMemo(() => {
    const paramStep = searchParams?.get("step");
    if (isStep(paramStep)) {
      return (LEGACY_ALIASES[paramStep as string] ?? (paramStep as Step));
    }
    return localStep;
  }, [localStep, searchParams]);

  const goToStep = useCallback(
    (next: Step) => {
      setLocalStep(next);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("step", next);
      const queryString = params.toString();
      // Use push to preserve browser history so Back navigates to previous wizard steps
      router.push(queryString ? `/?${queryString}` : "/", { scroll: true });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (hasQueryStepRef.current) {
      return;
    }
    const stored = readWizardState();
    if (stored?.step && isStep(stored.step)) {
      // We intentionally restore the step after hydration to avoid SSR/CSR mismatch.
      // This mirrors a subscription-style update and runs only once.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalStep(stored.step as Step);
    }
  }, []);

  useEffect(() => {
    writeWizardState({ step });
  }, [step]);

  return { step, goToStep };
}
