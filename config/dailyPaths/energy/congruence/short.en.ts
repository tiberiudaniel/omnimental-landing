import type { DailyPathConfig } from "@/types/dailyPath";

export const ENERGY_CONGRUENCE_SHORT_EN: DailyPathConfig = {
  id: "energy_congruence_short_en",
  cluster: "focus_energy_cluster",
  mode: "short",
  lang: "en",
  version: 1,
  moduleKey: "energy_congruence",
  skillLabel: "Energy: congruence (quick)",
  nodes: [
    {
      id: "energy_congruence_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Energy through congruence (quick)",
      description:
        "Today you’ll do a short version. You’ll notice an internal energy leak and make one small aligned choice.\nToday isn’t about breaks or breathing — it’s about energy you lose through inner conflict.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "energy_congruence_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "The conflict that drains you",
      description:
        "Fatigue often appears when you say “yes” outwardly and “no” inside.\nCongruence reduces this loss.\nIt doesn’t mean doing only what you enjoy — it means knowing when you choose and when you sacrifice on purpose.",
      xp: 5,
    },
    {
      id: "energy_congruence_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Quick check",
      description: "What drains more energy?",
      quizOptions: [
        { id: "A", label: "Conscious, chosen effort." },
        { id: "B", label: "Constant inner conflict." },
        { id: "C", label: "A short break." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Correct. Conflict between inner and outer consumes energy fast. You’ve probably felt this before, even if you never named it.",
        incorrect: "Almost. Chosen effort energizes — conflict drains.",
      },
      xp: 10,
    },
    {
      id: "energy_congruence_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: notice the conflict",
      description:
        "Recall a recent situation where you weren’t fully aligned.\nAs the circle runs, feel that moment in your body. No analysis — only awareness.\nYou might notice chest tension, a heavy stomach, restlessness — or nothing clear (that’s okay).",
      xp: 10,
      ctaLabel: "Exercise done",
    },
    {
      id: "energy_congruence_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Your congruent choice today",
      description: "Describe the situation and your choice. Choose something small and realistic that can happen today.",
      fields: [
        {
          id: "situation",
          label: "Situation:",
          placeholder: "e.g., when I receive an extra request",
        },
        {
          id: "decision",
          label: "My choice:",
          placeholder: "e.g., I choose to say no calmly, even if someone is disappointed",
        },
      ],
      xp: 20,
      ctaLabel: "I commit",
    },
    {
      id: "energy_congruence_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Quick training complete.",
      description: "",
      bullets: [
        "Congruence preserves energy.",
        "Inner conflict drains it.",
        "One small choice makes a difference.",
        "You don’t have to fix everything. It’s enough to stop fighting yourself.",
      ],
      anchorDescription: "Less struggle. More energy.",
      xp: 0,
      ctaLabel: "See your progress",
    },
    {
      id: "energy_congruence_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "Less struggle. More energy.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};
