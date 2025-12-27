"use client";

import type { StepManifest } from "./types";

const onboardingCatLiteManifest: StepManifest = {
  routePath: "/onboarding/cat-lite-2",
  startNodeId: "intro",
  terminalNodeIds: ["cta_continue"],
  nodes: [
    { id: "intro", label: "Intro + instructiuni" },
    { id: "clarity_scan_primary", label: "Claritate – scan 1" },
    { id: "clarity_scan_secondary", label: "Claritate – scan 2" },
    { id: "focus_scan_primary", label: "Focus – scan 1" },
    { id: "focus_scan_secondary", label: "Focus – scan 2" },
    { id: "energy_scan_primary", label: "Energie – scan 1" },
    { id: "energy_scan_secondary", label: "Energie – scan 2" },
    { id: "emo_stability_scan_primary", label: "Stabilitate emoțională – scan 1" },
    { id: "emo_stability_scan_secondary", label: "Stabilitate emoțională – scan 2" },
    { id: "radar_summary", label: "Hartă CAT + radar" },
    { id: "vocab_unlock", label: "Cuvânt reflex" },
    { id: "cta_continue", label: "Salvare scor + continuă" },
  ],
  edges: [
    { id: "intro-clarity1", source: "intro", target: "clarity_scan_primary", variant: "start" },
    { id: "clarity1-clarity2", source: "clarity_scan_primary", target: "clarity_scan_secondary", variant: "next" },
    { id: "clarity2-focus1", source: "clarity_scan_secondary", target: "focus_scan_primary", variant: "next" },
    { id: "focus1-focus2", source: "focus_scan_primary", target: "focus_scan_secondary", variant: "next" },
    { id: "focus2-energy1", source: "focus_scan_secondary", target: "energy_scan_primary", variant: "next" },
    { id: "energy1-energy2", source: "energy_scan_primary", target: "energy_scan_secondary", variant: "next" },
    { id: "energy2-emo1", source: "energy_scan_secondary", target: "emo_stability_scan_primary", variant: "next" },
    { id: "emo1-emo2", source: "emo_stability_scan_primary", target: "emo_stability_scan_secondary", variant: "next" },
    { id: "emo2-radar", source: "emo_stability_scan_secondary", target: "radar_summary", variant: "next" },
    { id: "radar-vocab", source: "radar_summary", target: "vocab_unlock", variant: "next" },
    { id: "vocab-cta", source: "vocab_unlock", target: "cta_continue", variant: "finish" },
  ],
};

export function getOnboardingCatLiteManifest(): StepManifest {
  return onboardingCatLiteManifest;
}
