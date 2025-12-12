import type { ArenaModuleV1 } from "./types";

export const ADAPTIVE_AMBIGUITY_TOLERANCE_V1: ArenaModuleV1 = {
  id: "adaptive_ambiguity_tolerance_v1",
  arena: "adaptive_intelligence",
  title: {
    ro: "Toleranță la ambiguitate (Inteligență Adaptivă)",
    en: "Ambiguity Tolerance (Adaptive Intelligence)",
  },
  explain: {
    ro: "Sub ambiguitate, mintea caută închidere rapidă (certitudine). Asta produce rigiditate și decizii proaste. Abilitatea reală: tolerezi incertitudinea și acționezi pe criterii minime. Semn că funcționează: poți face un pas reversibil fără „răspuns perfect”.",
    en: "Under ambiguity, the mind seeks fast closure (certainty). That creates rigidity and bad decisions. The real skill: tolerate uncertainty and act on minimal criteria. Signal it works: you can take a reversible step without a “perfect answer”.",
  },
  drills: {
    ro: [
      {
        duration: "30s",
        constraint: "Separi informația în 3 coloane; nu rezolvi.",
        steps: [
          "Alege o situație incertă.",
          "Spune: «Știu / Nu știu / Presupun» și numește 1 item la fiecare.",
          "Stop. Nu optimizezi.",
        ],
        successMetric: "Ai reușit dacă ai produs 3 itemi (1 pe coloană) fără să sari la concluzie.",
      },
      {
        duration: "90s",
        constraint: "Definiție MCA (minimal criterion to act) într-o propoziție.",
        steps: [
          "Scrie mental: «Dacă X e adevărat → fac pasul 1»",
          "Scrie: «Dacă Y apare → mă opresc»",
          "Formulează MCA într-o propoziție finală.",
        ],
        successMetric: "Ai reușit dacă ai 1 propoziție MCA clară și aplicabilă.",
      },
      {
        duration: "3m",
        constraint: "Alegi un pas mic reversibil, nu o decizie finală.",
        steps: [
          "Definește 2 opțiuni posibile.",
          "Pentru fiecare: 1 risc + 1 câștig.",
          "Alege un pas mic reversibil (care poate fi anulat).",
        ],
        successMetric: "Ai reușit dacă pasul ales este reversibil și poate fi făcut azi.",
      },
    ],
    en: [
      {
        duration: "30s",
        constraint: "Split info into 3 columns; don’t solve.",
        steps: [
          "Pick an uncertain situation.",
          "Say: “Know / Don’t know / Assume” and name 1 item per column.",
          "Stop. No optimizing.",
        ],
        successMetric: "Success if you produced 3 items (1 per column) without jumping to closure.",
      },
      {
        duration: "90s",
        constraint: "Define MCA (minimal criterion to act) in one sentence.",
        steps: [
          "Write mentally: “If X is true → do step 1.”",
          "Write: “If Y appears → stop.”",
          "Finalize a single MCA sentence.",
        ],
        successMetric: "Success if you have 1 clear, usable MCA sentence.",
      },
      {
        duration: "3m",
        constraint: "Choose a small reversible step, not a final decision.",
        steps: [
          "Define 2 possible options.",
          "For each: 1 risk + 1 gain.",
          "Pick a small reversible step (can be undone).",
        ],
        successMetric: "Success if the step is reversible and doable today.",
      },
    ],
  },
  realWorldChallenge: {
    ro: {
      title: "Decizie reală cu MCA (sub presiune)",
      steps: [
        "Alege o decizie reală azi (mică sau medie).",
        "Aplică MCA: dacă X → pas 1; dacă Y → stop.",
        "Execută pasul reversibil în <10 minute.",
      ],
      successMetric: "Ai reușit dacă ai executat pasul în timp, fără a căuta certitudine completă.",
    },
    en: {
      title: "Real decision with MCA (under pressure)",
      steps: [
        "Pick a real decision today (small/medium).",
        "Apply MCA: if X → step 1; if Y → stop.",
        "Execute the reversible step in <10 minutes.",
      ],
      successMetric: "Success if you executed the step on time without seeking full certainty.",
    },
  },
  bridges: [
    {
      toL1: "emotional_flex",
      because: {
        ro: "Reglajul emoțional scade anxietatea de incertitudine și permite acțiune.",
        en: "Emotional regulation lowers uncertainty anxiety and enables action.",
      },
    },
    {
      toL1: "clarity",
      because: {
        ro: "Criteriile minime reduc zgomotul și clarifică decizia.",
        en: "Minimal criteria reduce noise and clarify decisions.",
      },
    },
  ],
};
