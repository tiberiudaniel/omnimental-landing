"use client";

import type { StepManifest } from "./types";

const todayOverviewManifest: StepManifest = {
  routePath: "/today",
  startNodeId: "check_in",
  terminalNodeIds: ["complete"],
  nodes: [
    { id: "check_in", label: "Check-in" },
    { id: "intent", label: "Intent" },
    { id: "plan", label: "Plan" },
    { id: "primer", label: "Primer" },
    { id: "action", label: "Action" },
    { id: "reflection", label: "Reflection" },
    { id: "complete", label: "Complete" },
  ],
  edges: [
    { id: "checkin-intent", source: "check_in", target: "intent", variant: "start" },
    { id: "intent-plan", source: "intent", target: "plan", variant: "next" },
    { id: "plan-primer", source: "plan", target: "primer", variant: "next" },
    { id: "primer-action", source: "primer", target: "action", variant: "next" },
    { id: "action-reflection", source: "action", target: "reflection", variant: "next" },
    { id: "reflection-complete", source: "reflection", target: "complete", variant: "finish" },
    { id: "intent-action", source: "intent", target: "action", variant: "skip" },
    { id: "plan-reflection", source: "plan", target: "reflection", variant: "skip" },
  ],
};

export function getTodayOverviewManifest(): StepManifest {
  return todayOverviewManifest;
}
