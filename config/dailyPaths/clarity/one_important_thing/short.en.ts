import type { DailyPathConfig } from "@/types/dailyPath";

export const CLARITY_ONE_THING_SHORT_EN: DailyPathConfig = {
  id: "clarity_one_important_thing_short_en",
  cluster: "clarity_cluster",
  mode: "short",
  lang: "en",
  version: 1,
  moduleKey: "clarity_one_important_thing",
  skillLabel: "Clarity: one thing (quick)",
  nodes: [
    {
      id: "clarity_one_thing_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "One important thing (quick)",
      description:
        "Today you’ll do a short clarity exercise: choosing one important thing to reduce mental noise.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "clarity_one_thing_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Why too many priorities exhaust you",
      description:
        "When everything is important, attention fragments.\nClarity appears when you choose one thing that matters now.",
      xp: 5,
    },
    {
      id: "clarity_one_thing_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Quick check",
      description: "What brings more clarity?",
      quizOptions: [
        { id: "A", label: "Trying to do everything." },
        { id: "B", label: "Choosing one important thing." },
        { id: "C", label: "Postponing all tasks." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exactly. One priority quiets the noise.",
        incorrect: "Not quite. Clarity starts when you pick one thing.",
      },
      xp: 10,
    },
    {
      id: "clarity_one_thing_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: focus on one",
      description:
        "Bring to mind the things pulling at your attention.\nChoose one and set the rest aside for now.",
      xp: 10,
      ctaLabel: "Exercise done",
    },
    {
      id: "clarity_one_thing_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Your choice today",
      description: "Write the context and the one important thing.",
      fields: [
        {
          id: "context",
          label: "Context:",
          placeholder: "e.g., start of the workday",
        },
        {
          id: "focus",
          label: "One important thing:",
          prefix: "The most important thing right now is ",
          suffix: ".",
          placeholder: "describe the one thing",
        },
      ],
      xp: 20,
      ctaLabel: "I commit",
    },
    {
      id: "clarity_one_thing_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Quick training complete.",
      description: "",
      bullets: [
        "Clarity requires one priority.",
        "One thing reduces mental noise.",
        "Explicit choice brings direction.",
      ],
      anchorDescription: "One thing. That’s enough.",
      xp: 0,
      ctaLabel: "See your progress",
    },
    {
      id: "clarity_one_thing_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "One thing. That’s enough.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};
