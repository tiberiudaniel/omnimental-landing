"use client";

import type { StepManifest } from "./types";

const mindPacingManifest: StepManifest = {
  routePath: "/intro/mindpacing",
  startNodeId: "mindpacing_question",
  terminalNodeIds: ["cta_safe_mode"],
  nodes: [
    { id: "mindpacing_question", label: "MindPacing question" },
    { id: "vocab_primary", label: "Vocab #1" },
    { id: "neutral_close", label: "Neutral close" },
    { id: "vocab_secondary", label: "Vocab #2 (rare)" },
    { id: "cta_safe_mode", label: "CTA → DailyPath Safe" },
  ],
  edges: [
    { id: "mindpacing-primary", source: "mindpacing_question", target: "vocab_primary", variant: "start" },
    { id: "primary-close", source: "vocab_primary", target: "neutral_close", variant: "next" },
    { id: "close-cta", source: "neutral_close", target: "cta_safe_mode", variant: "finish" },
    { id: "close-secondary", source: "neutral_close", target: "vocab_secondary", variant: "next" },
    { id: "secondary-cta", source: "vocab_secondary", target: "cta_safe_mode", variant: "finish" },
  ],
};

export function getMindPacingManifest(): StepManifest {
  return mindPacingManifest;
}
