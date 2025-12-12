// config/catEngine.ts

// 1. Tipuri de bază

export type CatAxisId =
  | "clarity"
  | "flex"
  | "emo_stab"
  | "recalib"
  | "focus"
  | "energy"
  | "adapt_conf";

export type CatMetricType =
  | "likert_1_7"
  | "count_per_week"
  | "count_per_month"
  | "ratio_0_1"
  | "categorical";

export type CatItemPhase = 1 | 2;

export interface CatAxisConfig {
  id: CatAxisId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface CatSubAxisConfig {
  id: string;
  axisId: CatAxisId;
  label: string;
  description: string;
  phase: CatItemPhase;
  metricType: CatMetricType;
  usedInBaseline: boolean;
}

export interface CatItemConfig {
  id: string;
  axisId: CatAxisId;
  subAxisId?: string;
  text: string;
  responseType: "likert_1_7"; // pentru Faza 1 avem doar Likert
  phase: CatItemPhase;
  usedInBaseline: boolean;
}

// 2. Axele principale CAT (cele 7 care se văd în UI)

export const CAT_AXES: CatAxisConfig[] = [
  {
    id: "clarity",
    label: "Claritate cognitivă",
    shortLabel: "Claritate",
    description:
      "Cât de bine poți defini problemele și separa esențialul de zgomot."
  },
  {
    id: "flex",
    label: "Flexibilitate mentală",
    shortLabel: "Flexibilitate",
    description:
      "Cât de ușor poți schimba perspectivă, strategie și explicații când realitatea o cere."
  },
  {
    id: "emo_stab",
    label: "Stabilitate emoțională",
    shortLabel: "Stabilitate emoțională",
    description:
      "Cât de stabil rămâi sub stres, presiune și incertitudine."
  },
  {
    id: "recalib",
    label: "Recalibrare după greșeli",
    shortLabel: "Recalibrare",
    description:
      "Cât de repede transformi greșelile în ajustări concrete, fără să rămâi blocat."
  },
  {
    id: "focus",
    label: "Focus și continuitate",
    shortLabel: "Focus",
    description:
      "Capacitatea de a menține atenția și continuitatea pe ceea ce contează."
  },
  {
    id: "energy",
    label: "Energie și recuperare",
    shortLabel: "Energie",
    description:
      "Nivelul de energie perceput și capacitatea de a-ți reface resursele."
  },
  {
    id: "adapt_conf",
    label: "Încredere adaptativă",
    shortLabel: "Încredere adaptativă",
    description:
      "Credința că te poți adapta și învăța ceea ce este necesar în contexte noi."
  }
];

// 3. Sub-axe (Phase 1 = folosite acum, Phase 2 = arhitectură pentru mai târziu)

export const CAT_SUBAXES: CatSubAxisConfig[] = [
  // Strong thinking
  {
    id: "clarity_problem_definition",
    axisId: "clarity",
    label: "Definirea problemei",
    description:
      "Capacitatea de a formula problema clar înainte de acțiune.",
    phase: 1,
    metricType: "likert_1_7",
    usedInBaseline: true
  },
  {
    id: "clarity_depth",
    axisId: "clarity",
    label: "Adâncime",
    description:
      "Tendința de a căuta cauze de profunzime, nu doar explicații superficiale.",
    phase: 2,
    metricType: "likert_1_7",
    usedInBaseline: false
  },
  {
    id: "clarity_structure",
    axisId: "clarity",
    label: "Gândire structurată",
    description:
      "Cât de des îți externalizezi gândirea (note, diagrame, liste).",
    phase: 2,
    metricType: "count_per_week",
    usedInBaseline: false
  },
  {
    id: "flex_perspective_taking",
    axisId: "flex",
    label: "Perspective multiple",
    description:
      "Tendința de a lua în calcul două sau mai multe perspective înainte de decizie.",
    phase: 1,
    metricType: "likert_1_7",
    usedInBaseline: true
  },

  // Resilience
  {
    id: "emo_recovery_speed",
    axisId: "emo_stab",
    label: "Viteză de recuperare",
    description:
      "Cât de repede revii la baseline după un eveniment stresant.",
    phase: 2,
    metricType: "categorical",
    usedInBaseline: false
  },
  {
    id: "emo_regulation_under_pressure",
    axisId: "emo_stab",
    label: "Reglare sub presiune",
    description:
      "Capacitatea de a răspunde conform valorilor în situații tensionate.",
    phase: 1,
    metricType: "likert_1_7",
    usedInBaseline: true
  },
  {
    id: "emo_load_capacity",
    axisId: "energy",
    label: "Capacitate de încărcare",
    description:
      "Câți stresori semnificativi poți duce într-o perioadă scurtă fără să cedezi.",
    phase: 2,
    metricType: "count_per_week",
    usedInBaseline: false
  },
  {
    id: "emo_support_usage",
    axisId: "recalib",
    label: "Folosirea suportului",
    description:
      "Cât de des folosești strategii sănătoase vs. amorțire când ești sub stres.",
    phase: 2,
    metricType: "ratio_0_1",
    usedInBaseline: false
  },

  // Continuous learning
  {
    id: "learning_cadence",
    axisId: "focus",
    label: "Cadenta de învățare",
    description:
      "Câte blocuri intenționale de învățare ai pe săptămână.",
    phase: 2,
    metricType: "count_per_week",
    usedInBaseline: false
  },
  {
    id: "learning_feedback_loop",
    axisId: "recalib",
    label: "Cicluri de feedback",
    description:
      "Câte cicluri de feedback → ajustare faci într-o lună.",
    phase: 2,
    metricType: "count_per_month",
    usedInBaseline: false
  },
  {
    id: "learning_explore_exploit_ratio",
    axisId: "flex",
    label: "Explore vs. Exploit",
    description:
      "Raportul dintre timpul investit în explorare vs. aprofundare.",
    phase: 2,
    metricType: "ratio_0_1",
    usedInBaseline: false
  },
  {
    id: "learning_reflection_to_systems",
    axisId: "clarity",
    label: "Reflecție în sisteme",
    description:
      "Câte învățări transformi în sisteme, reguli sau structuri.",
    phase: 2,
    metricType: "count_per_month",
    usedInBaseline: false
  }
];

// 4. Itemii de baseline (Phase 1, folosiți în fluxul inițial CAT)

export const CAT_ITEMS: CatItemConfig[] = [
  // CLARITY
  {
    id: "clarity_1",
    axisId: "clarity",
    subAxisId: "clarity_problem_definition",
    text:
      "Când am o problemă importantă, reușesc, de obicei, să o descriu în 1–2 propoziții clare înainte să mă apuc de treabă.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },
  {
    id: "clarity_2",
    axisId: "clarity",
    text:
      "De cele mai multe ori îmi dau seama relativ repede ce este esențial și ce e doar zgomot.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },

  // FLEX
  {
    id: "flex_1",
    axisId: "flex",
    subAxisId: "flex_perspective_taking",
    text:
      "Îmi este relativ natural să mă întreb „cum ar vedea altcineva situația asta?” înainte să iau o decizie.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },
  {
    id: "flex_2",
    axisId: "flex",
    text:
      "Dacă planul meu nu mai funcționează, pot să schimb direcția fără să mă blochez prea mult.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },

  // EMO_STAB
  {
    id: "emo_stab_1",
    axisId: "emo_stab",
    subAxisId: "emo_regulation_under_pressure",
    text:
      "În situații tensionate, de obicei reușesc să răspund într-un mod care respectă valorile mele, chiar dacă simt presiune.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },
  {
    id: "emo_stab_2",
    axisId: "emo_stab",
    text:
      "Când ceva merge prost, de regulă nu mă destram complet, doar mă lovește o perioadă scurtă și apoi revin.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },

  // RECALIB
  {
    id: "recalib_1",
    axisId: "recalib",
    text:
      "După ce fac o greșeală importantă, îmi revin relativ repede și pot să analizez la rece ce s-a întâmplat.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },
  {
    id: "recalib_2",
    axisId: "recalib",
    text:
      "Îmi este ușor să transform o greșeală într-un mic experiment: „ce schimb data viitoare?”.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },

  // FOCUS
  {
    id: "focus_1",
    axisId: "focus",
    text:
      "Pot să rămân concentrat pe o activitate 25–50 de minute fără să sar constant pe telefon sau alte taburi.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },
  {
    id: "focus_2",
    axisId: "focus",
    text:
      "Nu abandonez ușor traseele de învățare sau de antrenament pe care mi le propun, chiar dacă progresul pare lent.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },

  // ENERGY
  {
    id: "energy_1",
    axisId: "energy",
    text:
      "În medie, am suficientă energie să duc ziua fără să mă simt complet stors.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },
  {
    id: "energy_2",
    axisId: "energy",
    text:
      "Când simt că încep să obosesc mental, știu ce să fac ca să îmi refac măcar parțial bateria.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },

  // ADAPT_CONF
  {
    id: "adapt_conf_1",
    axisId: "adapt_conf",
    text:
      "Chiar dacă nu știu încă ceva, am încredere reală că pot învăța ce am nevoie.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  },
  {
    id: "adapt_conf_2",
    axisId: "adapt_conf",
    text:
      "În fața unei schimbări majore, îmi vine mai degrabă să mă adaptez decât să mă blochez în „nu se poate”.",
    responseType: "likert_1_7",
    phase: 1,
    usedInBaseline: true
  }
];

// 5. Funcție de scorare (exemplu, poate fi mutată în alt utilitar)

export function scoreLikertTo0_100(value: number): number {
  // value: 1–7
  return Math.round(((value - 1) / 6) * 100);
}
