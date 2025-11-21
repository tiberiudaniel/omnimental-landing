"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readWizardState, writeWizardState } from "./wizardStorage";

export const WIZARD_STEP_IDS = [
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
] as const;

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

const LEGACY_ALIASES: Record<string, WizardStepId> = {
  intentSummary: "intentMotivation",
};

export function getWizardStepTestId(step: WizardStepId) {
  return `wizard-step-${step}` as const;
}

const ORDERED_STEPS: WizardStepId[] = [...WIZARD_STEP_IDS];

const isStep = (value: string | null): value is WizardStepId => {
  if (!value) return false;
  if (ORDERED_STEPS.includes(value as WizardStepId)) return true;
  return Boolean(LEGACY_ALIASES[value]);
};

export function useWizardSteps(initialStep: WizardStepId = "preIntro") {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParamStep = searchParams?.get("step");
  const hasQueryStepRef = useRef(isStep(initialParamStep));
  const [localStep, setLocalStep] = useState<WizardStepId>(
    isStep(initialParamStep) ? (initialParamStep as WizardStepId) : initialStep,
  );
  const step = useMemo(() => {
    const paramStep = searchParams?.get("step");
    if (isStep(paramStep)) {
      return LEGACY_ALIASES[paramStep as string] ?? (paramStep as WizardStepId);
    }
    return localStep;
  }, [localStep, searchParams]);

  const goToStep = useCallback(
    (next: WizardStepId) => {
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
    const paramStep = searchParams?.get("step");
    if (isStep(paramStep)) {
      const normalized = LEGACY_ALIASES[paramStep as string] ?? (paramStep as WizardStepId);
      if (normalized !== localStep) {
        queueMicrotask(() => setLocalStep((prev) => (prev !== normalized ? normalized : prev)));
      }
      if (!hasQueryStepRef.current) {
        hasQueryStepRef.current = true;
      }
      return;
    }
    if (!hasQueryStepRef.current) {
      queueMicrotask(() => {
        if (hasQueryStepRef.current) return;
        const stored = readWizardState();
        if (stored?.step && isStep(stored.step)) {
          setLocalStep(stored.step as WizardStepId);
        }
        hasQueryStepRef.current = true;
      });
    }
  }, [localStep, searchParams]);

  useEffect(() => {
    writeWizardState({ step });
  }, [step]);

  return { step, goToStep };
}
