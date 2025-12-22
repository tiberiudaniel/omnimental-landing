"use client";

import type { StepManifest } from "./types";

const arenaRunManifest: StepManifest = {
  routePath: "/training/arenas/[arenaId]/[moduleId]/run",
  startNodeId: "briefing",
  terminalNodeIds: ["exit"],
  nodes: [
    { id: "briefing", label: "Briefing" },
    { id: "start_gate", label: "Start" },
    { id: "run", label: "Run" },
    { id: "results", label: "Results" },
    { id: "retry", label: "Retry / Exit" },
    { id: "exit", label: "Back to Hub" },
  ],
  edges: [
    { id: "briefing-start", source: "briefing", target: "start_gate", variant: "start" },
    { id: "start-run", source: "start_gate", target: "run", variant: "next" },
    { id: "run-results", source: "run", target: "results", variant: "next" },
    { id: "results-retry", source: "results", target: "retry", variant: "next" },
    { id: "retry-exit", source: "retry", target: "exit", variant: "finish" },
    { id: "results-exit", source: "results", target: "exit", variant: "skip" },
    { id: "retry-run", source: "retry", target: "run", variant: "skip" },
  ],
};

export function getArenaRunManifest(): StepManifest {
  return arenaRunManifest;
}
