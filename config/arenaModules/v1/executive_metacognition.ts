import type { ArenaModuleV1 } from "./types";

export const EXECUTIVE_METACOGNITION_V1: ArenaModuleV1 = {
  id: "executive_metacognition_v1",
  arena: "executive_control",
  title: {
    ro: "Metacogniție aplicată (Control Executiv)",
    en: "Applied Metacognition (Executive Control)",
  },
  explain: {
    ro: "Când te identifici cu gândul, execuția scade: atenția fuge, apare rigiditate, reacționezi automat. Metacogniția = abilitatea de a observa gândul ca obiect, nu ca adevăr. Semnul că funcționează: apare un mic spațiu între stimul și reacție.",
    en: "When you identify with a thought, execution drops: attention slips, rigidity appears, you react automatically. Metacognition = seeing the thought as an object, not a truth. Signal it works: a small gap appears between stimulus and response.",
  },
  drills: {
    ro: [
      {
        duration: "30s",
        constraint: "Nu rezolvi nimic. Doar observi + etichetezi.",
        steps: [
          "Observă gândul dominant acum.",
          "Spune mental: «Acesta este un gând, nu un fapt.»",
          "Revino la respirație 2 cicluri.",
        ],
        successMetric: "Ai reușit dacă ai făcut etichetarea fără să intri în poveste.",
      },
      {
        duration: "90s",
        constraint: "3 gânduri consecutive, fără analiză.",
        steps: [
          "Observă 3 gânduri consecutive.",
          "Etichetează: planificare / îngrijorare / judecată.",
          "După fiecare etichetă: revino 1 sec la o senzație din corp.",
        ],
        successMetric: "Ai reușit dacă ai etichetat 3/3 și ai revenit la corp de 3 ori.",
      },
      {
        duration: "3m",
        constraint: "Menții atenția pe flux, nu pe conținut.",
        steps: [
          "Timp de 3 minute: observă fluxul gândurilor.",
          "Detectează tiparul dominant (1 cuvânt).",
          "Revino la ancoraj (respirație sau palme) ori de câte ori te pierzi.",
        ],
        successMetric: "Ai reușit dacă poți numi tiparul dominant în 1 cuvânt la final.",
      },
    ],
    en: [
      {
        duration: "30s",
        constraint: "Do not solve anything. Only observe + label.",
        steps: [
          "Notice the dominant thought.",
          "Say mentally: “This is a thought, not a fact.”",
          "Return to breath for 2 cycles.",
        ],
        successMetric: "Success if you labeled without entering the story.",
      },
      {
        duration: "90s",
        constraint: "3 consecutive thoughts, no analysis.",
        steps: [
          "Observe 3 consecutive thoughts.",
          "Label: planning / worry / judgment.",
          "After each label: return 1s to a body sensation.",
        ],
        successMetric: "Success if you labeled 3/3 and returned to the body 3 times.",
      },
      {
        duration: "3m",
        constraint: "Stay with the stream, not the content.",
        steps: [
          "For 3 minutes: watch the thought stream.",
          "Detect the dominant pattern (1 word).",
          "Return to an anchor (breath or palms) whenever you drift.",
        ],
        successMetric: "Success if you can name the dominant pattern in 1 word at the end.",
      },
    ],
  },
  realWorldChallenge: {
    ro: {
      title: "Aplicare sub sarcină (micro-performanță)",
      steps: [
        "Alege o sarcină reală de 5–10 minute (scris / task / decizie).",
        "Setează 2 momente de check (la minutul 2 și 5).",
        "La fiecare check: Observă → Etichetează → Revino (10 sec).",
      ],
      successMetric: "Ai reușit dacă ai făcut 2/2 check-uri fără să abandonezi sarcina.",
    },
    en: {
      title: "Apply under task load (micro-performance)",
      steps: [
        "Pick a real 5–10 minute task (writing / task / decision).",
        "Set 2 check moments (minute 2 and 5).",
        "At each check: Notice → Label → Return (10s).",
      ],
      successMetric: "Success if you executed 2/2 checks without abandoning the task.",
    },
  },
  bridges: [
    {
      toL1: "clarity",
      because: {
        ro: "Observarea reduce zgomotul mental și clarifică intenția.",
        en: "Observing reduces mental noise and sharpens intention.",
      },
    },
    {
      toL1: "emotional_flex",
      because: {
        ro: "Distanțarea reduce reactivitatea și face posibil reframing-ul.",
        en: "Distancing lowers reactivity and enables reframing.",
      },
    },
  ],
};
