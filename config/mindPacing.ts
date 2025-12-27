import type { CatVocabTag } from "./catVocabulary";

export type MindPacingOption = {
  id: string;
  label: {
    ro: string;
    en: string;
  };
  tagsPrimary: [CatVocabTag];
  tagsSecondary?: CatVocabTag[];
};

export type MindPacingQuestion = {
  id: string;
  prompt: {
    ro: string;
    en: string;
  };
  options: MindPacingOption[];
};

export const MIND_PACING_QUESTIONS: MindPacingQuestion[] = [
  {
    id: "mind_noise",
    prompt: {
      ro: "Cum este mintea ta acum?",
      en: "How does your mind feel right now?",
    },
    options: [
      {
        id: "noise_fog",
        label: { ro: "Parcă e ceață în cap", en: "Feels foggy" },
        tagsPrimary: ["clarity_low"],
        tagsSecondary: ["meta_observe"],
      },
      {
        id: "noise_story",
        label: { ro: "Îmi tot fac scenarii", en: "I keep spinning stories" },
        tagsPrimary: ["clarity_low"],
        tagsSecondary: ["identity_loop"],
      },
      {
        id: "noise_scatter",
        label: { ro: "Sar între 3 lucruri", en: "Jumping between tasks" },
        tagsPrimary: ["focus_scattered"],
      },
      {
        id: "noise_tension",
        label: { ro: "Simt tensiune în corp", en: "Body feels tense" },
        tagsPrimary: ["tension_high"],
      },
    ],
  },
  {
    id: "mind_pace",
    prompt: {
      ro: "Ritmul de azi se simte mai mult ca…",
      en: "Today's pace feels more like…",
    },
    options: [
      {
        id: "pace_rush",
        label: { ro: "Pe fugă, totul urgent", en: "On the run, everything urgent" },
        tagsPrimary: ["pace_hurried"],
      },
      {
        id: "pace_overpush",
        label: { ro: "Trag prea tare, nu mă pot opri", en: "Pushing hard, can't stop" },
        tagsPrimary: ["energy_low"],
        tagsSecondary: ["pace_hurried"],
      },
      {
        id: "pace_impulse",
        label: { ro: "Fac lucruri impulsiv", en: "Acting on impulse" },
        tagsPrimary: ["reactive"],
      },
      {
        id: "pace_empty",
        label: { ro: "Bateria e joasă", en: "Battery is low" },
        tagsPrimary: ["energy_low"],
      },
    ],
  },
  {
    id: "mind_loops",
    prompt: {
      ro: "Ce buclă simți că se repetă?",
      en: "Which loop keeps repeating?",
    },
    options: [
      {
        id: "loop_pattern",
        label: { ro: "Iar intru în același scenariu", en: "Same scenario again" },
        tagsPrimary: ["identity_loop"],
      },
      {
        id: "loop_resist",
        label: { ro: "Refuz să schimb direcția", en: "Resisting to change course" },
        tagsPrimary: ["change_resistance"],
      },
      {
        id: "loop_stubborn",
        label: { ro: "Apăr planul deși nu mai merge", en: "Defending a dead plan" },
        tagsPrimary: ["rigid"],
      },
      {
        id: "loop_sunk",
        label: { ro: "Nu pot opri ce am început", en: "Can't stop what I started" },
        tagsPrimary: ["sunk_cost"],
      },
    ],
  },
  {
    id: "mind_selftalk",
    prompt: {
      ro: "Ce apare în auto-dialog?",
      en: "What shows up in your self-talk?",
    },
    options: [
      {
        id: "selftalk_judge",
        label: { ro: "Sunt dur cu mine", en: "Harsh with myself" },
        tagsPrimary: ["self_critical"],
      },
      {
        id: "selftalk_reactive",
        label: { ro: "Sar imediat cu reacția", en: "Snap response" },
        tagsPrimary: ["reactive"],
      },
      {
        id: "selftalk_block",
        label: { ro: "Nu pot începe nimic", en: "Can't get started" },
        tagsPrimary: ["stuck"],
      },
      {
        id: "selftalk_slice",
        label: { ro: "Încep și las neterminat", en: "Leave things unfinished" },
        tagsPrimary: ["focus_scattered"],
        tagsSecondary: ["pace_hurried"],
      },
    ],
  },
  {
    id: "mind_energy",
    prompt: {
      ro: "Cum stă energia ta azi?",
      en: "Where is your energy today?",
    },
    options: [
      {
        id: "energy_low",
        label: { ro: "E aproape zero", en: "Almost zero" },
        tagsPrimary: ["energy_low"],
      },
      {
        id: "energy_overpush",
        label: { ro: "Împing chiar dacă știu că pic", en: "Pushing though I know I'll crash" },
        tagsPrimary: ["energy_low"],
        tagsSecondary: ["pace_hurried"],
      },
      {
        id: "energy_fragment",
        label: { ro: "Mintea sare și se rupe", en: "Mind fragments" },
        tagsPrimary: ["focus_scattered"],
      },
      {
        id: "energy_tension",
        label: { ro: "Corp tensionat", en: "Body is tight" },
        tagsPrimary: ["tension_high"],
      },
    ],
  },
  {
    id: "mind_decision",
    prompt: {
      ro: "Ce se întâmplă când trebuie să alegi ceva?",
      en: "When you need to decide…",
    },
    options: [
      {
        id: "decision_story",
        label: { ro: "Rămân în film și nu decid", en: "Stay in the story" },
        tagsPrimary: ["clarity_low"],
      },
      {
        id: "decision_fog",
        label: { ro: "Nu văd clar următorul pas", en: "Can't see next step" },
        tagsPrimary: ["clarity_low"],
      },
      {
        id: "decision_cling",
        label: { ro: "Mă agăț de ce am început", en: "Cling to what I started" },
        tagsPrimary: ["sunk_cost"],
      },
      {
        id: "decision_resist",
        label: { ro: "Nu pot adapta planul", en: "Can't adapt the plan" },
        tagsPrimary: ["change_resistance"],
      },
    ],
  },
  {
    id: "mind_identity",
    prompt: {
      ro: "Ce crezi despre tine în ultimele ore?",
      en: "Lately you think…",
    },
    options: [
      {
        id: "identity_pattern",
        label: { ro: "Așa sunt eu, nu se schimbă", en: "That's just who I am" },
        tagsPrimary: ["identity_loop"],
      },
      {
        id: "identity_judge",
        label: { ro: "Mă tot critic", en: "I judge myself" },
        tagsPrimary: ["self_critical"],
      },
      {
        id: "identity_nostart",
        label: { ro: "Parcă nu pot porni", en: "Can't seem to start" },
        tagsPrimary: ["stuck"],
      },
      {
        id: "identity_unfinished",
        label: { ro: "Încep multe, nu termin", en: "Start and abandon" },
        tagsPrimary: ["focus_scattered"],
      },
    ],
  },
  {
    id: "mind_pressure",
    prompt: {
      ro: "Când apare presiunea…",
      en: "When pressure shows up…",
    },
    options: [
      {
        id: "pressure_rush",
        label: { ro: "Accelerez și greșesc", en: "Go faster and make mistakes" },
        tagsPrimary: ["pace_hurried"],
      },
      {
        id: "pressure_overpush",
        label: { ro: "Nu știu să mă opresc", en: "Can't stop" },
        tagsPrimary: ["energy_low"],
      },
      {
        id: "pressure_impulse",
        label: { ro: "Acționez fără pauză", en: "Act without pausing" },
        tagsPrimary: ["reactive"],
      },
      {
        id: "pressure_fragment",
        label: { ro: "Mă fragmentez complet", en: "Completely fragment" },
        tagsPrimary: ["focus_scattered"],
      },
    ],
  },
];

export function getMindPacingQuestionById(id: string): MindPacingQuestion | undefined {
  return MIND_PACING_QUESTIONS.find((question) => question.id === id);
}
