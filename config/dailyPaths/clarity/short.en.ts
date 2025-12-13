import type { DailyPathConfig } from "@/types/dailyPath";

export const CLARITY_SHORT_EN: DailyPathConfig = {
  id: "clarity_v1_short_en",
  cluster: "clarity_cluster",
  mode: "short",
  lang: "en",
  version: 1,
  moduleKey: "clarity_single_intent",
  skillLabel: "Clarity: one clear intention",
  nodes: [
    {
      id: "clarity_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Mental Clarity (Quick)",
      description:
        "Today you’ll do a short training. You’ll learn to use one clear sentence before you start a task.",
      xp: 0,
      ctaLabel: "Start training",
    },
    {
      id: "clarity_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "The clarity test",
      description:
        "Simple test: “Can I say in one sentence what I’ll do in the next 20–30 minutes?” If the sentence is vague or overloaded, clarity is missing.",
      xp: 5,
    },
    {
      id: "clarity_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Quick quiz",
      description: "Which sentence is clearest for the next half hour?",
      quizOptions: [
        { id: "A", label: "I’ll work a bit on slides and a bit on emails." },
        { id: "B", label: "For the next 30 minutes I finalize the structure for the first 5 slides." },
        { id: "C", label: "I’ll start several things and see what happens." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exactly. A good sentence is time + outcome + one objective.",
        incorrect: "Not quite. If the sentence is vague or packs several goals, clarity is missing.",
      },
      xp: 10,
    },
    {
      id: "clarity_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: one sentence",
      description:
        "Pick a real task. While the circle runs, repeat one clear sentence about what you’ll do next. When your mind drifts, return to the sentence.",
      xp: 10,
      ctaLabel: "Exercise done",
    },
    {
      id: "clarity_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Your challenge today",
      description: "Write where you’ll use a clear sentence and what it is.",
      fields: [
        {
          id: "context",
          label: "Where will you use a clear sentence:",
          placeholder: "e.g., when I sit back at my desk tonight",
        },
        {
          id: "rule",
          label: "My sentence:",
          placeholder: "In the next 30 minutes I finalize the key structure.",
        },
      ],
      xp: 20,
      ctaLabel: "I commit",
    },
    {
      id: "clarity_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Quick clarity training done",
      description: "",
      bullets: [
        "Clarity starts with one simple sentence.",
        "A good sentence has time + outcome + one objective.",
        "Linking it to a real moment makes it usable.",
      ],
      anchorDescription: "One clear sentence. A calmer mind.",
      xp: 0,
      ctaLabel: "See your progress",
    },
    {
      id: "clarity_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Daily motto",
      description: "One clear sentence. A calmer mind.",
      xp: 0,
      ctaLabel: "Done for today",
    },
  ],
};
