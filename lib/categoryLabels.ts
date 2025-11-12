export type CategoryKeyRO = "claritate" | "relatii" | "stres" | "incredere" | "echilibru";

export type CategoryLabels = {
  name: { ro: string; en: string };
  short: { ro: string; en: string };
  reflection?: { ro: string; en: string };
};

export const CATEGORY_LABELS: Record<CategoryKeyRO, CategoryLabels> = {
  claritate: {
    name: { ro: "Claritate", en: "Clarity" },
    short: { ro: "direcție & focus", en: "direction & focus" },
    reflection: {
      ro: "Notează 1–2 lucruri care ți-ar aduce mai multă claritate săptămâna asta.",
      en: "Write 1–2 things that would bring you more clarity this week.",
    },
  },
  relatii: {
    name: { ro: "Relații", en: "Relationships" },
    short: { ro: "limite & conexiune", en: "boundaries & connection" },
    reflection: {
      ro: "Unde ai nevoie de o limită clară? Cum ai formula-o simplu?",
      en: "Where do you need a clear boundary? How would you phrase it simply?",
    },
  },
  stres: {
    name: { ro: "Calm", en: "Calm" },
    short: { ro: "reglare stres", en: "stress regulation" },
    reflection: {
      ro: "Ce te ajută, în mod realist, să cobori ritmul 10 minute azi?",
      en: "What can realistically help you slow down by 10 minutes today?",
    },
  },
  incredere: {
    name: { ro: "Încredere", en: "Confidence" },
    short: { ro: "auto-eficacitate", en: "self-efficacy" },
    reflection: {
      ro: "Ce pas mic, tangibil, poți face ca să crești încrederea?",
      en: "What small, tangible step can you take to increase confidence?",
    },
  },
  echilibru: {
    name: { ro: "Echilibru", en: "Balance" },
    short: { ro: "energie & obiceiuri", en: "energy & habits" },
    reflection: {
      ro: "Ce obicei de 5 minute ți-ar aduce un plus de energie azi?",
      en: "Which 5-minute habit could bring you a bit more energy today?",
    },
  },
};

