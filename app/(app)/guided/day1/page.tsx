"use client";

import { Suspense, useMemo } from "react";
import StepRunner from "@/components/stepRunner/StepRunner";
import { getGuidedDayOneManifest } from "@/lib/stepManifests/guidedDay1";
import GuidedDayOneSessionStep from "@/components/guidedDay1/steps/GuidedDayOneSessionStep";
import GuidedDayOneCompleteStep from "@/components/guidedDay1/steps/GuidedDayOneCompleteStep";

function GuidedDayOneRunner() {
  const manifest = useMemo(() => getGuidedDayOneManifest(), []);
  const registry = useMemo(
    () => ({
      guided_day1_session: GuidedDayOneSessionStep,
      guided_day1_complete: GuidedDayOneCompleteStep,
    }),
    [],
  );
  return <StepRunner routePath="/guided/day1" manifest={manifest} registry={registry} />;
}

export default function GuidedDayOnePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <GuidedDayOneRunner />
    </Suspense>
  );
}
