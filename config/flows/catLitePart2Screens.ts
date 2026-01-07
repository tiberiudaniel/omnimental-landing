import type { ScreenStep } from "./types";

export const catLitePart2Screens: ScreenStep[] = [
  {
    id: "extended_intro",
    type: "screen",
    label: "Intro CAT Lite Part 2",
    description: "Context, explică slider-ele și cele 4 axe extinse",
    order: 1,
  },
  {
    id: "axis_recalibration",
    type: "screen",
    label: "Slider Recalibrare",
    description: "Prima axă extinsă",
    order: 2,
    tags: ["test:cat_recalibration"],
  },
  {
    id: "axis_flexibility",
    type: "screen",
    label: "Slider Flexibilitate",
    description: "A doua axă extinsă",
    order: 3,
    tags: ["test:cat_flexibility"],
  },
  {
    id: "axis_adaptive_confidence",
    type: "screen",
    label: "Slider Adaptive Confidence",
    description: "A treia axă extinsă",
    order: 4,
    tags: ["test:cat_adaptive_confidence"],
  },
  {
    id: "axis_energy_focus",
    type: "screen",
    label: "Slider Energia/Focalizare",
    description: "A patra axă extinsă (energie/focus combinat)",
    order: 5,
    tags: ["test:cat_energy"],
  },
  {
    id: "results_summary",
    type: "summary",
    label: "Radar + salvare profil",
    description: "Rezumat scoruri + CTA „Salvează și revino”",
    order: 6,
    tags: ["cta:/intro/vocab?source=cat-lite"],
  },
];
