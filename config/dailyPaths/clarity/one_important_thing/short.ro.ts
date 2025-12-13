import type { DailyPathConfig } from "@/types/dailyPath";

export const CLARITY_ONE_THING_SHORT_RO: DailyPathConfig = {
  id: "clarity_one_important_thing_short_ro",
  cluster: "clarity_cluster",
  mode: "short",
  lang: "ro",
  version: 1,
  moduleKey: "clarity_one_important_thing",
  skillLabel: "Claritate: un lucru (rapid)",
  nodes: [
    {
      id: "clarity_one_thing_short_intro_ro",
      kind: "INTRO",
      shape: "circle",
      title: "Un singur lucru important (rapid)",
      description:
        "Astăzi faci o versiune scurtă de claritate: alegi un singur lucru important și reduci zgomotul mental.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "clarity_one_thing_short_learn_ro",
      kind: "LEARN",
      shape: "circle",
      title: "De ce prea multe priorități obosesc",
      description:
        "Când totul e important, atenția se fragmentează.\nClaritatea apare când alegi un singur lucru care contează acum.",
      xp: 5,
    },
    {
      id: "clarity_one_thing_short_quiz_ro",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Verificare scurtă",
      description: "Ce aduce mai multă claritate?",
      quizOptions: [
        { id: "A", label: "Să încerci să le faci pe toate." },
        { id: "B", label: "Să alegi un singur lucru important." },
        { id: "C", label: "Să amâni tot." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Corect. O singură prioritate liniștește zgomotul.",
        incorrect: "Nu chiar. Claritatea începe când alegi un lucru.",
      },
      xp: 10,
    },
    {
      id: "clarity_one_thing_short_sim_ro",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: focus pe unul",
      description:
        "Adu în minte lucrurile care te solicită.\nAlege unul singur și lasă restul deoparte pentru moment.",
      xp: 10,
      ctaLabel: "Exercițiul e gata",
    },
    {
      id: "clarity_one_thing_short_real_ro",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Alegerea ta de azi",
      description: "Notează contextul și singurul lucru important.",
      fields: [
        {
          id: "context",
          label: "Context:",
          placeholder: "ex: începutul zilei de lucru",
        },
        {
          id: "focus",
          label: "Singurul lucru important:",
          prefix: "Cel mai important lucru acum este ",
          suffix: ".",
          placeholder: "descrie acel lucru",
        },
      ],
      xp: 20,
      ctaLabel: "Mă angajez",
    },
    {
      id: "clarity_one_thing_short_summary_ro",
      kind: "SUMMARY",
      shape: "circle",
      title: "Antrenamentul rapid e gata.",
      description: "",
      bullets: [
        "Claritatea cere o singură prioritate.",
        "Un lucru important reduce zgomotul.",
        "Alegerea explicită aduce direcție.",
      ],
      anchorDescription: "Un lucru. Atât.",
      xp: 0,
      ctaLabel: "Vezi progresul",
    },
    {
      id: "clarity_one_thing_short_anchor_ro",
      kind: "ANCHOR",
      shape: "circle",
      title: "Motto zilnic",
      description: "Un lucru. Atât.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};
