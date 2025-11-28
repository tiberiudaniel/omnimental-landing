/**
 * Static configuration for mental arcs (Season structure).
 * Each arc groups a set of OmniKuno lessons plus lightweight OmniAbil tasks
 * that can later be generated automatically based on the user's arc.
 */
export type OmniArc = {
  id: string;
  title: string;
  description: string;
  lessonIds: string[];
  abilTaskTemplates: {
    id: string;
    type: "daily" | "weekly";
    title: string;
    description?: string;
    suggestedXp: number;
  }[];
  status: "active" | "coming_soon";
};

export const OMNI_ARCS: OmniArc[] = [
  {
    id: "claritate-energie",
    title: "Arc 1 — Claritate & Energie",
    description: "Fundamentele clarității mentale și energetice.",
    lessonIds: [
      "emotional_balance_l1_01_foundations",
      "emotional_balance_l1_02_triggers",
      "emotional_balance_l1_03_body_scan",
      "emotional_balance_l1_04_micro_choices",
      "emotional_balance_l1_05_micro_breaks",
      "emotional_balance_l1_06_story_line",
      "emotional_balance_l1_07_evening_reset",
      "emotional_balance_l1_q1",
      "emotional_balance_l1_08_micro_commit",
      "energy_body_protocol",
      "energy_body_l1_01_signals",
      "energy_body_l1_02_breath",
    ],
    abilTaskTemplates: [
      {
        id: "daily-breathing-2min",
        type: "daily",
        title: "2 minute de respirație conștientă",
        description: "Înainte de primul task important, 2 minute respirație ritmată.",
        suggestedXp: 10,
      },
      {
        id: "weekly-energy-journal",
        type: "weekly",
        title: "Jurnalul energiei de 5 minute",
        description: "O dată pe săptămână, notează pattern-urile de energie și factorii perturbatori.",
        suggestedXp: 25,
      },
      {
        id: "weekly-digital-fast",
        type: "weekly",
        title: "Protejează somnul",
        description: "Într-o seară, blochează ecranele cu 30 de minute înainte de somn.",
        suggestedXp: 30,
      },
    ],
    status: "active",
  },
];
