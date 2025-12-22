"use client";

import type { StepManifest } from "./types";

const onboardingManifest: StepManifest = {
  routePath: "/onboarding",
  startNodeId: "kickoff",
  terminalNodeIds: ["ready"],
  nodes: [
    { id: "kickoff", label: "Kickoff" },
    { id: "profile", label: "Profile Setup" },
    { id: "baseline", label: "Baseline" },
    { id: "pillars", label: "Pillars" },
    { id: "style", label: "Training Style" },
    { id: "plan", label: "Plan Preview" },
    { id: "ready", label: "Ready" },
  ],
  edges: [
    { id: "kickoff-profile", source: "kickoff", target: "profile", variant: "start" },
    { id: "profile-baseline", source: "profile", target: "baseline", variant: "next" },
    { id: "baseline-pillars", source: "baseline", target: "pillars", variant: "next" },
    { id: "pillars-style", source: "pillars", target: "style", variant: "next" },
    { id: "style-plan", source: "style", target: "plan", variant: "next" },
    { id: "plan-ready", source: "plan", target: "ready", variant: "finish" },
    { id: "profile-plan", source: "profile", target: "plan", variant: "skip" },
    { id: "baseline-style", source: "baseline", target: "style", variant: "skip" },
    { id: "pillars-plan", source: "pillars", target: "plan", variant: "skip" },
  ],
};

export function getOnboardingManifest(): StepManifest {
  return onboardingManifest;
}
