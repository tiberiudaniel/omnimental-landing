"use client";

import type { StepManifest } from "./types";

const guidedDayOneManifest: StepManifest = {
  routePath: "/guided/day1",
  startNodeId: "guided_day1_session",
  terminalNodeIds: ["guided_day1_complete"],
  nodes: [
    { id: "guided_day1_session", label: "Guided Day 1 · Session" },
    { id: "guided_day1_complete", label: "Guided Day 1 · Complete" },
  ],
  edges: [
    {
      id: "guided-day1-session-complete",
      source: "guided_day1_session",
      target: "guided_day1_complete",
      variant: "next",
    },
  ],
};

export function getGuidedDayOneManifest(): StepManifest {
  return guidedDayOneManifest;
}
