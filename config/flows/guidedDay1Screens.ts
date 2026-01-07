import type { ScreenStep } from "./types";

export const guidedDay1Screens: ScreenStep[] = [
  {
    id: "guided_hook_hero",
    type: "screen",
    label: "Hero Declanșator + Oglindă",
    description: "Rezumat lane ghidat + de ce e relevant azi",
    order: 1,
    tags: ["cta:/guided/day1?lane=guided_day1"],
  },
  {
    id: "guided_hook_mirror",
    type: "screen",
    label: "Card Hook + Mirror",
    description: "Explică trigger-ul și mini-quiz-ul inițial",
    order: 2,
  },
  {
    id: "guided_session_cta",
    type: "screen",
    label: "CTA Pornește sesiunea",
    description: "Buton către StepRunner Guided Day1",
    order: 3,
    tags: ["cta:/guided/day1?step=guided_day1_session"],
  },
  {
    id: "guided_summary",
    type: "summary",
    label: "Summary + micro-jurnal",
    description: "Insight + CTA „Continuă (2 min)”",
    order: 4,
    tags: ["cta:/session/complete?lane=guided_day1"],
  },
];
