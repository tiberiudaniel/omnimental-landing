import type { LessonId } from "@/lib/taxonomy/types";

export type RecallPrompt = {
  promptId: string;
  question: string;
  choices?: string[];
  expectedChoiceIndex?: number;
  microAction?: string;
};

const prompt = (value: string) => value as string;
const lessonId = (value: string) => value as LessonId;

export const INITIATION_RECALL_PROMPTS: Record<LessonId, RecallPrompt[]> = {
  [lessonId("clarity_01_illusion_of_clarity")]: [
    {
      promptId: prompt("clarity_01_focus_question"),
      question: "Care este întrebarea de claritate pe care trebuie să o repeți azi?",
      microAction: "Scrie regula de claritate într-o propoziție.",
    },
  ],
  [lessonId("focus_energy_01_energy_not_motivation")]: [
    {
      promptId: prompt("energy_01_signal"),
      question: "Ce semnal îți arată că este o problemă de energie, nu de motivație?",
      microAction: "Notează semnalul și momentul când apare cel mai des.",
    },
  ],
  [lessonId("emotional_flex_01_automatic_reaction_amygdala")]: [
    {
      promptId: prompt("flex_01_pause"),
      question: "Care este pașul tău de pauză de 3 secunde când reacționezi automat?",
      microAction: "Scrie contextul în care vei folosi pauza azi.",
    },
  ],
};

export const GENERIC_RECALL_PROMPTS: RecallPrompt[] = [
  {
    promptId: prompt("generic_checkin"),
    question: "Care este regula principală pe care ai extras-o din lecția de azi?",
    microAction: "Scrie regula pe telefon într-o notiță rapidă.",
  },
  {
    promptId: prompt("generic_micro_action"),
    question: "Ce micro-acțiune faci în următoarele 2 ore pentru a confirma lecția?",
    microAction: "Programează micro-acțiunea în calendar.",
  },
];
