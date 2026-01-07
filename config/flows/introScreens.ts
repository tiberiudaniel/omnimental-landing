import type { ScreenStep } from "./types";

export const introScreens: ScreenStep[] = [
  {
    id: "cinematic",
    type: "screen",
    label: "Intro cinematic",
    description: "Cinematic opener + alegi Guided sau Explore",
    order: 1,
    tags: ["cta:intro-choice-guided", "cta:intro-choice-explore"],
  },
  {
    id: "mindpacing",
    type: "screen",
    label: "MindPacing Ziua 1",
    description: "Identifici semnalul mental principal",
    order: 2,
    tags: ["cta:mindpacing-continue"],
  },
  {
    id: "vocab",
    type: "screen",
    label: "Primer vocab",
    description: "2–3 concepte obligatorii înainte de Today",
    order: 3,
    tags: ["cta:vocab-continue"],
  },
  {
    id: "handoff",
    type: "summary",
    label: "Handoff către Today",
    description: "Recomandă lane-ul și pornește Today deep",
    order: 4,
    tags: ["cta:/today?mode=deep"],
  },
];
