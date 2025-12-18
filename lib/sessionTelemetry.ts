"use client";

import type { KpiEvent, TelemetrySessionType } from "@/lib/telemetry";
import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";

type PlanTelemetryShape = {
  userId: string;
  moduleId?: string | null;
  canonDomain: CanonDomainId;
  traitPrimary: CatAxisId;
  traitSecondary?: CatAxisId[];
};

type BuildPlanEventOptions = {
  source: TelemetrySessionType;
  difficultyFeedback?: "too_easy" | "just_right" | "too_hard";
};

export function buildPlanKpiEvent(plan: PlanTelemetryShape, options: BuildPlanEventOptions): KpiEvent {
  const catAxes = Array.from(new Set([plan.traitPrimary, ...(plan.traitSecondary ?? [])]));
  return {
    userId: plan.userId,
    indicatorId: plan.moduleId ?? plan.traitPrimary ?? "session_module",
    source: options.source,
    canonDomain: plan.canonDomain,
    catAxes,
    preValue: null,
    postValue: null,
    delta: null,
    selfReport: difficultyToSelfReport(options.difficultyFeedback),
    timestamp: new Date().toISOString(),
  };
}

function difficultyToSelfReport(value?: "too_easy" | "just_right" | "too_hard"): number | null {
  if (!value) return null;
  switch (value) {
    case "too_easy":
      return 2;
    case "too_hard":
      return 8;
    case "just_right":
    default:
      return 5;
  }
}
