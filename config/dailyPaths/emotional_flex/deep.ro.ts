import type { DailyPathConfig } from "@/types/dailyPath";

export const EMOTIONAL_FLEX_DEEP_RO: DailyPathConfig = {
  id: "emotional_flex_v1_deep_ro",
  cluster: "emotional_flex_cluster",
  mode: "deep",
  lang: "ro",
  version: 1,
  moduleKey: "emotional_flex_pause",
  skillLabel: "Flexibilitate: reglaj emoțional complet",
  autonomyNodeId: "emoflex_a1",
  nodes: [
    {
      id: "emoflex_intro",
      kind: "INTRO",
      shape: "circle",
      title: "Flexibilitate Emoțională",
      description:
        "Astăzi antrenezi abilitatea care decide dacă o situație dificilă te blochează sau o traversezi calm: flexibilitatea emoțională.\nVei învăța cum apar emoțiile, cum să creezi spațiu mental și cum să răspunzi — nu doar să reacționezi.",
      xp: 0,
      ctaLabel: "Încep",
    },
    {
      id: "emoflex_learn1",
      kind: "LEARN",
      shape: "circle",
      title: "De ce emoțiile ne scurtcircuitează",
      description:
        "Când atenția se lipește de o emoție, opțiunile dispar.\nFlexibilitatea începe în clipa în care observi emoția, fără să devii emoția.",
      xp: 5,
    },
    {
      id: "emoflex_example1",
      kind: "LEARN",
      shape: "circle",
      title: "Un exemplu real",
      description:
        "Imaginează-ți că primești un mesaj care te irită.\nPentru câteva secunde, totul se îngustează.\nCreierul se pregătește să se apere — nu să aleagă.\nFlexibilitatea întrerupe exact această tendință de îngustare, de fixație.",
      xp: 5,
    },
    {
      id: "emoflex_quiz1",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Test de recunoaștere",
      description: "Care este primul semn că începe hijack-ul emoțional?",
      quizOptions: [
        { id: "A", label: "Emoție puternică + atenție îngustată" },
        { id: "B", label: "Când deja ai acționat" },
        { id: "C", label: "Când emoția dispare" },
      ],
      correctOptionIds: ["A"],
      quizFeedback: {
        correct: "Exact. Atenția care se îngustează este primul semn că ai nevoie de flexibilitate.",
        incorrect: "Dacă deja ești în reacție, ai ratat momentul de flexibilitate. Observă semnele timpurii.",
      },
      xp: 10,
    },
    {
      id: "emoflex_learn2",
      kind: "LEARN",
      shape: "circle",
      title: "Fereastra de 2 secunde",
      description:
        "Există mereu un micro-spațiu între ce simți și ce alegi.\nFlexibilitatea înseamnă:\n\nObservă emoția.\n\nCreează 2 secunde de spațiu.\n\nAlege acțiunea potrivită.",
      xp: 5,
    },
    {
      id: "emoflex_quiz2",
      kind: "QUIZ_SINGLE",
      shape: "circle",
      title: "Aplicare rapidă",
      description: "Ce te menține flexibil într-un moment dificil?",
      quizOptions: [
        { id: "A", label: "Să aștepți să se liniștească emoția" },
        { id: "B", label: "Să creezi 2 secunde de spațiu" },
        { id: "C", label: "Să reprimi emoția" },
      ],
      correctOptionIds: ["B"],
      quizFeedback: {
        correct: "Corect. Flexibilitatea începe cu spațiu, nu cu reprimare.",
        incorrect: "Nu e nevoie să reprimi emoția. Creezi spațiu și apoi alegi răspunsul.",
      },
      xp: 10,
    },
    {
      id: "emoflex_sim1",
      kind: "SIMULATOR",
      shape: "circle",
      badge: "simulator",
      title: "Exercițiu de flexibilitate",
      description:
        "Apasă pe cerc ca să începi. Pentru următoarele 20 de secunde fă o micro-pauză:\n\nInspiră ușor\n\nObservă ce simți în corp și în emoții\n\nExpiră lent\nLa final, numește emoția și amintește-ți că poți alege cum răspunzi.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 15,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "emoflex_a1",
      kind: "ACTION",
      shape: "star",
      title: "Cum te simți acum?",
      description:
        "Vrei încă o rundă de antrenament sigur sau ești pregătit pentru provocarea din viața reală?",
      xp: 0,
    },
    {
      id: "emoflex_sim2",
      kind: "SIMULATOR",
      shape: "hollow",
      badge: "simulator",
      softPathOnly: true,
      title: "A doua rundă",
      description:
        "Repetă micro-pauza într-o variantă puțin mai dificilă: Observ → Denumesc emoția → Expir lent.\nÎntărești reflexul de flexibilitate.",
      simulatorConfig: { inhaleSeconds: 2, exhaleSeconds: 2 },
      xp: 5,
      ctaLabel: "Am făcut exercițiul",
    },
    {
      id: "emoflex_learn3",
      kind: "LEARN",
      shape: "circle",
      title: "Puterea numirii emoției",
      description:
        "A numi emoția (“Simt tensiune”, “Simt iritare”) reduce reactivitatea cu 30–40%.\nPregătește-te pentru aplicarea în context real.",
      xp: 0,
    },
    {
      id: "emoflex_real1",
      kind: "REAL_WORLD",
      shape: "star",
      badge: "viata_reala",
      title: "Flexibilitate în viața reală",
      description:
        "Alege o situație de azi în care obișnuiești să simți tensiune.\nDefinește-o, apoi stabilește acțiunea ta de 2 secunde.",
      fields: [
        {
          id: "context",
          label: "Când în mod obișnuit simt tensiune…",
          placeholder: "ex: înainte să răspund la mesajele tensionate",
        },
        {
          id: "rule",
          label: "Acțiunea mea:",
          prefix: "În acel moment → Creez 2 secunde de spațiu și",
          placeholder: "ex: inspir, numesc emoția și abia apoi răspund.",
        },
      ],
      xp: 25,
      ctaLabel: "Îmi iau angajamentul",
    },
    {
      id: "emoflex_summary",
      kind: "SUMMARY",
      shape: "circle",
      title: "Transformarea de azi",
      description: "",
      bullets: [
        "Ai recunoscut semnele timpurii ale tensiunii emoționale.",
        "Ai exersat fereastra de flexibilitate de 2 secunde.",
        "Ai definit o acțiune reală pentru azi.",
      ],
      anchorDescription: "Spațiul creează alegere. Alegerea creează libertate.",
      xp: 0,
      ctaLabel: "Vezi progresul",
    },
    {
      id: "emoflex_anchor",
      kind: "ANCHOR",
      shape: "circle",
      title: "Ancora zilei",
      description: "Spațiul creează alegere. Alegerea creează libertate.",
      xp: 0,
      ctaLabel: "Gata pe azi",
    },
  ],
};
