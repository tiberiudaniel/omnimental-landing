"use client";

import type { StepManifest } from "./types";

const todayRunManifest: StepManifest = {
  routePath: "/today/run",
  startNodeId: "primer",
  terminalNodeIds: ["complete"],
  nodes: [
    { id: "primer", label: "Primer" },
    { id: "intro", label: "Intro" },
    { id: "learn", label: "Learn" },
    { id: "quiz", label: "Quiz" },
    { id: "simulator", label: "Simulator" },
    { id: "real_world", label: "Real World" },
    { id: "summary", label: "Summary" },
    { id: "complete", label: "Complete" },
  ],
  edges: [
    { id: "primer-intro", source: "primer", target: "intro", variant: "start" },
    { id: "intro-learn", source: "intro", target: "learn", variant: "next" },
    { id: "learn-quiz", source: "learn", target: "quiz", variant: "next" },
    { id: "quiz-simulator", source: "quiz", target: "simulator", variant: "next" },
    { id: "simulator-realworld", source: "simulator", target: "real_world", variant: "next" },
    { id: "realworld-summary", source: "real_world", target: "summary", variant: "next" },
    { id: "summary-complete", source: "summary", target: "complete", variant: "finish" },
    { id: "intro-simulator", source: "intro", target: "simulator", variant: "skip" },
    { id: "learn-summary", source: "learn", target: "summary", variant: "skip" },
    { id: "quiz-summary", source: "quiz", target: "summary", variant: "skip" },
  ],
};

export function getTodayRunManifest(): StepManifest {
  return todayRunManifest;
}
