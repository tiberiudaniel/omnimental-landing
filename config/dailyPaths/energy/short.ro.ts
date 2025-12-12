import type { DailyPathConfig } from "@/types/dailyPath";

export const ENERGY_SHORT_RO: DailyPathConfig = {
  id: "focus_energy_v1_short_ro",
  cluster: "focus_energy_cluster",
  mode: "short",
  lang: "ro",
  version: 1,
  skillLabel: "Energie: o acțiune concretă",
  nodes: [
    {
      id: "focus_short_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Energie & recuperare mentală (rapid)",
      description:
        "Astăzi faci o versiune scurtă de antrenament. Înveți unde pierzi energie și exersezi pauza de 2 secunde.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "focus_short_learn",
      kind: "LEARN",
      shape: "circle",
      title: "Bateria ta mentală",
      description:
        "Nu obosești doar de la muncă. Comutările dese între telefon, email și task-uri îți golesc energia.\nPauza de 2 secunde reduce scurgerea mentală.",
      xp: 5,
    },
    {
      id: "focus_short_sim",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Simulator: pauza de 2 secunde",
      description:
        "Inspiră 2 secunde când cercul se umple.\nExpiră 2 secunde când se golește.\nRepetă câteva cicluri.",
      xp: 10,
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "focus_short_quiz",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Recunoaște zgomotul",
      description: "Ce te obosește cel mai tare în mod invizibil?",
      quizOptions: [
        { id: "A", label: "40 min de lucru concentrat." },
        { id: "B", label: "Verificări dese telefon → email → chat." },
        { id: "C", label: "O pauză de 10 min fără telefon." },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Exact. Comutările dese sunt cele care te obosesc.",
        incorrect: "Aproape. Lucrul concentrat nu e problema, ci schimbările dese.",
      },
      xp: 10,
    },
    {
      id: "focus_short_real",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Provocarea ta de azi",
      description: "Scrie contextul și regula pentru pauza ta de 2 secunde.",
      fields: [
        {
          id: "context",
          label: "Când întâlnesc situația:",
          placeholder: "ex: închid telefonul și mă apuc de lucru",
        },
        {
          id: "rule",
          label: "Regula mea de azi:",
          prefix: "Când",
          suffix: "→ respir 2 secunde.",
          placeholder: "ex: închid notificările și revin la task",
        },
      ],
      xp: 20,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "focus_short_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Felicitări — mini antrenamentul e gata.",
      description: "",
      bullets: [
        "Comutările dese consumă energia.",
        "Pauza de 2 secunde o protejează.",
        "Regula scrisă o aduce în viața reală.",
      ],
      anchorDescription: "O pauză mică. O zi mai clară.",
      xp: 0,
      ctaLabel: "Vezi progresul tău",
    },
    {
      id: "focus_short_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "O pauză mică. O zi mai clară.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};
