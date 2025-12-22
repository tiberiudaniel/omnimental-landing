"use client";

import type { StepManifest } from "./types";

const introManifest: StepManifest = {
  routePath: "/intro",
  startNodeId: "welcome",
  terminalNodeIds: ["cta_handoff"],
  nodes: [
    { id: "welcome", label: "Welcome" },
    { id: "why_now", label: "Why now" },
    { id: "story", label: "Origin Story" },
    { id: "primer", label: "Primer" },
    { id: "path_select", label: "Choose Path" },
    { id: "cta_handoff", label: "Handoff" },
  ],
  edges: [
    { id: "welcome-why", source: "welcome", target: "why_now", variant: "start" },
    { id: "why-story", source: "why_now", target: "story", variant: "next" },
    { id: "story-primer", source: "story", target: "primer", variant: "next" },
    { id: "primer-select", source: "primer", target: "path_select", variant: "next" },
    { id: "select-cta", source: "path_select", target: "cta_handoff", variant: "finish" },
    { id: "why-primer", source: "why_now", target: "primer", variant: "skip" },
    { id: "story-select", source: "story", target: "path_select", variant: "skip" },
  ],
};

export function getIntroManifest(): StepManifest {
  return introManifest;
}
