export type OmniKunoFinalTestQuestion =
  | {
      id?: string;
      type: "singleChoice" | "scenario";
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }
  | {
      id?: string;
      type: "fillBlank";
      question: string;
      answer: string;
      variations?: string[];
    }
  | {
      id?: string;
      type: "reflectionShort";
      question: string;
      prompt: string;
    };

export type OmniKunoFinalTest = {
  testId: string;
  intro: { title: string; body: string };
  questions: OmniKunoFinalTestQuestion[];
};

export const OMNI_KUNO_FINAL_TESTS: Record<string, OmniKunoFinalTest> = {
  calm_final_test: {
    testId: "calm_final_test",
    intro: {
      title: "Mini-Test — Echilibru Emoțional",
      body: "Un test scurt pentru a verifica ce ai învățat. Nu există note — doar claritate.",
    },
    questions: [
      {
        id: "calm_final_q1",
        type: "singleChoice",
        question: "Ce descrie cel mai bine calmul activ?",
        options: [
          "Absența emoțiilor.",
          "Claritatea din mijlocul emoțiilor.",
          "Evitarea discuțiilor tensionate.",
        ],
        correctIndex: 1,
        explanation: "Calmul activ înseamnă prezență, nu absența emoției.",
      },
      {
        id: "calm_final_q2",
        type: "singleChoice",
        question: "Care este primul pas util când tonul cuiva te activează?",
        options: [
          "Răspunzi imediat.",
          "Separi tonul de mesaj.",
          "Pleci fără să spui nimic.",
        ],
        correctIndex: 1,
      },
      {
        id: "calm_final_q3",
        type: "scenario",
        question: "Într-o discuție, cineva ridică vocea. Ce acțiune îți păstrează claritatea?",
        options: [
          "Să îți ridici și tu vocea.",
          "Să respiri lent o secundă înainte de a răspunde.",
          "Să întrerupi discuția brusc.",
        ],
        correctIndex: 1,
      },
      {
        id: "calm_final_q4",
        type: "fillBlank",
        question: "Completează propoziția: „O micro-decizie este ___.”",
        answer: "o alegere mică înainte de impuls",
        variations: [
          "o mică alegere înainte de impuls",
          "o pauză scurtă înainte să acționez",
        ],
      },
      {
        id: "calm_final_q5",
        type: "singleChoice",
        question: "Ce te ajută într-un moment cu presiune mare?",
        options: [
          "Să accelerezi ca să termini mai repede.",
          "Să încetinești primul gest.",
          "Să ignori corpul.",
        ],
        correctIndex: 1,
      },
      {
        id: "calm_final_q6",
        type: "singleChoice",
        question: "Ce este „puterea blândă”?",
        options: [
          "Forță rigidă.",
          "Claritate și calm în același timp.",
          "Eliminarea emoțiilor.",
        ],
        correctIndex: 1,
      },
      {
        id: "calm_final_q7",
        type: "reflectionShort",
        question: "Scrie o propoziție scurtă:",
        prompt: "Un lucru pe care vreau să-l aplic mai des este ___",
      },
    ],
  },
};
