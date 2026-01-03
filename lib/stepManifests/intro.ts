"use client";

import type { StepManifest } from "./types";

const introManifest: StepManifest = {
  routePath: "/intro",
  startNodeId: "cinematic",
  terminalNodeIds: ["handoff"],
  nodes: [
    { id: "cinematic", label: "Intro cinematic" },
    { id: "mindpacing", label: "MindPacing" },
    { id: "vocab", label: "Vocab primer" },
    { id: "handoff", label: "Handoff" },
  ],
  edges: [
    { id: "cinematic-mindpacing", source: "cinematic", target: "mindpacing", variant: "next" },
    { id: "mindpacing-vocab", source: "mindpacing", target: "vocab", variant: "next" },
    { id: "vocab-handoff", source: "vocab", target: "handoff", variant: "next" },
  ],
};

export function getIntroManifest(): StepManifest {
  return introManifest;
}
