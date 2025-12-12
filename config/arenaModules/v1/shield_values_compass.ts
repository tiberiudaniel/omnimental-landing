import type { ArenaModuleV1 } from "./types";

export const SHIELD_VALUES_COMPASS_V1: ArenaModuleV1 = {
  id: "shield_values_compass_v1",
  arena: "psychological_shielding",
  title: {
    ro: "Valori & busolă internă (Protecție Mentală)",
    en: "Values & Inner Compass (Psychological Shielding)",
  },
  explain: {
    ro: "În contexte ostile, mintea sare pe scurtături: defensiv, justificare, conformare. Busola internă = criteriu stabil, repetabil, care te protejează de decizii reactive. Semn că funcționează: poți răspunde aliniat chiar când apare presiunea.",
    en: "In hostile contexts, the mind jumps to shortcuts: defensiveness, justification, compliance. An inner compass = a stable, repeatable criterion that protects you from reactive decisions. Signal it works: you can respond aligned even under pressure.",
  },
  drills: {
    ro: [
      {
        duration: "30s",
        constraint: "Alegi o singură valoare activă azi.",
        steps: [
          "Alege 1 valoare pentru azi (adevăr / curaj / respect / disciplină).",
          "Spune: «Azi mă ghidez după <valoare>.»",
        ],
        successMetric: "Ai reușit dacă valoarea este 1 singură și formulată clar.",
      },
      {
        duration: "90s",
        constraint: "Transformi valoarea într-o regulă observabilă.",
        steps: [
          "Completează: «Dacă respect <valoare>, atunci fac X.»",
          "X trebuie să fie observabil (acțiune, nu intenție).",
        ],
        successMetric: "Ai reușit dacă X poate fi verificat de un observator extern.",
      },
      {
        duration: "3m",
        constraint: "Simulezi presiune și alegi un micro-răspuns.",
        steps: [
          "Imaginează o presiune (critică / manipulare / grabă).",
          "Numește reacția automată (1 cuvânt).",
          "Alege un micro-răspuns care exprimă valoarea.",
        ],
        successMetric: "Ai reușit dacă micro-răspunsul poate fi executat în <5 secunde în viața reală.",
      },
    ],
    en: [
      {
        duration: "30s",
        constraint: "Pick a single active value for today.",
        steps: [
          "Pick 1 value today (truth / courage / respect / discipline).",
          "Say: “Today I’m guided by <value>.”",
        ],
        successMetric: "Success if it’s one value stated clearly.",
      },
      {
        duration: "90s",
        constraint: "Turn the value into an observable rule.",
        steps: [
          "Complete: “If I honor <value>, I do X.”",
          "X must be observable (action, not intention).",
        ],
        successMetric: "Success if X can be verified by an external observer.",
      },
      {
        duration: "3m",
        constraint: "Simulate pressure and pick a micro-response.",
        steps: [
          "Imagine pressure (criticism / manipulation / urgency).",
          "Name your automatic reaction (1 word).",
          "Pick a micro-response that expresses the value.",
        ],
        successMetric: "Success if the micro-response is executable in <5 seconds in real life.",
      },
    ],
  },
  realWorldChallenge: {
    ro: {
      title: "Interacțiune dificilă (aplicare busolă)",
      steps: [
        "La prima interacțiune dificilă azi: pauză 1 secundă.",
        "Amintește valoarea activă.",
        "Execută micro-răspunsul ales.",
      ],
      successMetric: "Ai reușit dacă ai făcut pauza + micro-răspunsul în moment real (nu după).",
    },
    en: {
      title: "Hard interaction (compass application)",
      steps: [
        "In your first hard interaction today: pause 1 second.",
        "Recall the active value.",
        "Execute the chosen micro-response.",
      ],
      successMetric: "Success if you paused + executed the micro-response in the real moment (not after).",
    },
  },
  bridges: [
    {
      toL1: "clarity",
      because: {
        ro: "Valoarea devine criteriu de decizie și reduce confuzia sub presiune.",
        en: "A value becomes a decision criterion and reduces confusion under pressure.",
      },
    },
    {
      toL1: "energy",
      because: {
        ro: "Alinierea reduce consumul mental din conflict intern și stabilizează energia.",
        en: "Alignment reduces mental drain from inner conflict and stabilizes energy.",
      },
    },
  ],
};
