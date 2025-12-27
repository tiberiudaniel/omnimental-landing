"use client";

import type { StepManifest } from "./types";

const guidedManifest: StepManifest = {
  routePath: "/intro/guided",
  startNodeId: "mind_state",
  terminalNodeIds: ["redirect_today", "offer"],
  nodes: [
    { id: "mind_state", label: "Mind state selection" },
    { id: "block_time", label: "When it appears" },
    { id: "biggest_cost", label: "Biggest cost" },
    { id: "reflection", label: "Reflection" },
    { id: "offer", label: "Plans / CTA" },
    { id: "redirect_today", label: "Redirect to /today" },
  ],
  edges: [
    { id: "mind-block", source: "mind_state", target: "block_time", variant: "next" },
    { id: "block-cost", source: "block_time", target: "biggest_cost", variant: "next" },
    { id: "cost-reflection", source: "biggest_cost", target: "reflection", variant: "next" },
    { id: "reflection-offer", source: "reflection", target: "offer", variant: "next" },
    { id: "reflection-redirect", source: "reflection", target: "redirect_today", variant: "finish" },
    { id: "offer-redirect", source: "offer", target: "redirect_today", variant: "finish" },
  ],
};

export function getIntroGuidedManifest(): StepManifest {
  return guidedManifest;
}
