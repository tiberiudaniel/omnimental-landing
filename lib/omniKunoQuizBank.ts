export type OmniKunoQuizOption = {
  value: string;
  label: string;
};

export type OmniKunoQuizQuestion = {
  id: string;
  text: string;
  options: OmniKunoQuizOption[];
  correctAnswer: string;
  helper?: string;
};

export type OmniKunoQuizConfig = {
  topicKey: string;
  questions: OmniKunoQuizQuestion[];
};

const createQuiz = (topicKey: string, questions: OmniKunoQuizQuestion[]): OmniKunoQuizConfig => ({
  topicKey,
  questions,
});

const knowledgeQuestions = (topic: string, prefix: string): OmniKunoQuizQuestion[] => [
  {
    id: `${prefix}_01`,
    text: `Care este primul pas recomandat când lucrezi la ${topic}?`,
    options: [
      { value: "aware", label: "Să observi semnalele personale" },
      { value: "ignore", label: "Să ignori și să treci direct la acțiune" },
      { value: "delay", label: "Să amâni până ai mai mult timp liber" },
    ],
    correctAnswer: "aware",
  },
  {
    id: `${prefix}_02`,
    text: `Ce fel de micro-acțiune sprijină progresul pentru ${topic}?`,
    options: [
      { value: "repeatable", label: "Una repetabilă și scurtă" },
      { value: "complex", label: "Un ritual lung și complex" },
      { value: "random", label: "Acțiuni alese aleatoriu" },
    ],
    correctAnswer: "repeatable",
  },
  {
    id: `${prefix}_03`,
    text: `Cum verifici dacă tehnica aplicată pentru ${topic} funcționează?`,
    options: [
      { value: "note", label: "Notezi rapid efectul și nivelul de energie" },
      { value: "assume", label: "Presupui că funcționează fără măsurare" },
      { value: "compare", label: "Compari doar cu alți oameni" },
    ],
    correctAnswer: "note",
  },
];

const scenarioQuestions = (topic: string, prefix: string): OmniKunoQuizQuestion[] => [
  {
    id: `${prefix}_01`,
    text: `Lucrezi la ${topic} și apare un blocaj. Ce faci?`,
    options: [
      { value: "pause", label: "Ieși scurt din situație și revii cu o notă clară" },
      { value: "push", label: "Forțezi prin stres suplimentar" },
      { value: "abandon", label: "Renunți complet" },
    ],
    correctAnswer: "pause",
  },
  {
    id: `${prefix}_02`,
    text: `Care este semnalul că ești gata să avansezi la pasul următor din ${topic}?`,
    options: [
      { value: "evidence", label: "Ai dovezi măsurabile că exercițiul funcționează" },
      { value: "random", label: "Simți întâmplător că e momentul" },
      { value: "others", label: "Aștepți ca altcineva să-ți spună" },
    ],
    correctAnswer: "evidence",
  },
  {
    id: `${prefix}_03`,
    text: `Cum îți protejezi progresul legat de ${topic}?`,
    options: [
      { value: "plan", label: "Planifici când și cum aplici tehnica" },
      { value: "skip", label: "Sari direct la tehnici noi" },
      { value: "hide", label: "Nu discuți niciodată despre ea" },
    ],
    correctAnswer: "plan",
  },
];

const QUIZ_BANK: Record<string, OmniKunoQuizConfig> = {
  kuno_calm_intro: createQuiz(
    "calm",
    knowledgeQuestions("calm interior", "calm_intro"),
  ),
  kuno_calm_scenarios: createQuiz(
    "calm",
    scenarioQuestions("calm interior", "calm_scenarios"),
  ),
  kuno_energy_myths: createQuiz("energy", knowledgeQuestions("energia mentală", "energy_myths")),
  kuno_energy_scenarios: createQuiz("energy", scenarioQuestions("energia mentală", "energy_scenarios")),
  kuno_relations_connect: createQuiz("relations", knowledgeQuestions("relațiile sănătoase", "relations_connect")),
  kuno_relations_conflict: createQuiz("relations", scenarioQuestions("gestionarea conflictelor", "relations_conflict")),
  kuno_performance_bias: createQuiz("performance", knowledgeQuestions("performanța sănătoasă", "perf_bias")),
  kuno_performance_strategy: createQuiz(
    "performance",
    scenarioQuestions("deciziile de performanță", "perf_strategy"),
  ),
  kuno_sense_direction: createQuiz("sense", knowledgeQuestions("sensul personal", "sense_direction")),
  kuno_sense_obstacles: createQuiz("sense", scenarioQuestions("sensul personal", "sense_obstacles")),
};

export function getOmniKunoQuiz(topicKey: string): OmniKunoQuizConfig | null {
  return QUIZ_BANK[topicKey] ?? null;
}
