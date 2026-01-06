"use client";

import { SessionCompletePageInner } from "@/app/(app)/session/complete/page";
import { useEnsureGuidedQueryParams } from "@/components/guidedDay1/useEnsureGuidedQueryParams";

export default function GuidedDayOneCompleteStep() {
  useEnsureGuidedQueryParams();
  return <SessionCompletePageInner forcedSource="guided_day1" forcedLane="guided_day1" />;
}
