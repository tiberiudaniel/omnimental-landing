"use client";

import DailyPathRunner from "@/components/today/DailyPathRunner";
import type { StepComponentProps } from "@/components/stepRunner/types";
import { useEnsureGuidedQueryParams } from "@/components/guidedDay1/useEnsureGuidedQueryParams";

export default function GuidedDayOneSessionStep({ go }: StepComponentProps) {
  const ready = useEnsureGuidedQueryParams();
  if (!ready) {
    return <div className="min-h-[50vh] bg-[var(--omni-bg-main)]" />;
  }
  return (
    <DailyPathRunner
      onCompleted={() => {
        go("next");
      }}
    />
  );
}
