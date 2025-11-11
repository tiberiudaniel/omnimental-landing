"use client";

export type ScriptCondition = {
  metric: "pssTotal" | "gseTotal" | "maasTotal" | "svs" | "knowledgePercent";
  operator: "gte" | "lte";
  value: number;
};

export type ContentScript = {
  id: string;
  type: "learn" | "practice" | "reflect";
  title: {
    ro: string;
    en: string;
  };
  template: {
    ro: string;
    en: string;
  };
  ctaLabel: {
    ro: string;
    en: string;
  };
  conditions: ScriptCondition[];
  priority: number;
  notes?: string;
};

export const defaultContentScripts: ContentScript[] = [
  {
    id: "stress-reset",
    type: "practice",
    title: {
      ro: "Reset de stres în 2 pași",
      en: "Two-step stress reset",
    },
    template: {
      ro: "Ai raportat un scor de {{stressScore}} la stres pentru etapa {{stageLabel}}. Creează două ferestre de câte 5 minute (dimineața și seara) în care să respiri 5-6/min și să notezi ce se schimbă în corp. La final, marchează dacă percepția stresului a scăzut cu 1 punct.",
      en: "You logged a stress score of {{stressScore}} for {{stageLabel}}. Block two 5-minute windows (morning and evening) to breathe at 5-6/min and jot down body changes. Close by noting if stress dropped by at least one point.",
    },
    ctaLabel: {
      ro: "Încep resetul",
      en: "Start reset",
    },
    conditions: [
      { metric: "pssTotal", operator: "gte", value: 25 },
    ],
    priority: 1,
    notes: "Activated when perceived stress is high.",
  },
  {
    id: "knowledge-gap",
    type: "learn",
    title: {
      ro: "Reîmprospătează conceptele cheie",
      en: "Refresh core concepts",
    },
    template: {
      ro: "Scorul Omni-Cunoaștere este {{knowledgePercent}}%. Revizitează modulele: {{gapList}}. Alege un insight nou din fiecare și aplică-l în următoarea sesiune sau zi.",
      en: "Your Omni-Knowledge score sits at {{knowledgePercent}}%. Revisit these modules: {{gapList}}. Pull one insight from each and apply it in the next session or day.",
    },
    ctaLabel: {
      ro: "Revizuiesc modulele",
      en: "Review modules",
    },
    conditions: [
      { metric: "knowledgePercent", operator: "lte", value: 70 },
    ],
    priority: 2,
    notes: "Highlights when knowledge mastery is below the desired threshold.",
  },
  {
    id: "presence-scan",
    type: "reflect",
    title: {
      ro: "Scanare de prezență",
      en: "Presence scan",
    },
    template: {
      ro: "Prezența conștientă este la {{maasScore}}/6. În etapa {{stageLabel}}, setează trei momente fixe în care oprești tot pentru 60 secunde și observi fără să corectezi. Notează un detaliu nou de fiecare dată.",
      en: "Mindful presence reads {{maasScore}}/6. During {{stageLabel}}, set three fixed 60-second pauses to observe without fixing anything. Log a novel detail each time.",
    },
    ctaLabel: {
      ro: "Planific pauzele",
      en: "Plan pauses",
    },
    conditions: [
      { metric: "maasTotal", operator: "lte", value: 4 },
    ],
    priority: 3,
    notes: "Triggered by lower mindfulness scores.",
  },
  {
    id: "vitality-check",
    type: "reflect",
    title: {
      ro: "Verificare energie reală",
      en: "Energy reality check",
    },
    template: {
      ro: "Vitalitatea (SVS) este {{svsScore}}/7. În următoarele 48h, notează trei situații în care îți scade energia și ce faci imediat după. Identifică un micro-obicei care ar inversa trendul.",
      en: "Vitality (SVS) scores {{svsScore}}/7. Over the next 48 hours, capture three situations where energy dips and what you do right after. Identify one micro-habit that could flip the pattern.",
    },
    ctaLabel: {
      ro: "Pornește jurnalul de energie",
      en: "Start energy log",
    },
    conditions: [
      { metric: "svs", operator: "lte", value: 3 },
    ],
    priority: 4,
    notes: "Helps when vitality is low.",
  },
  {
    id: "confidence-loop",
    type: "practice",
    title: {
      ro: "Loop de autoeficacitate",
      en: "Self-efficacy loop",
    },
    template: {
      ro: "Autoeficacitatea (GSE) este {{gseScore}}/40. Identifică o sarcină mică legată de obiectiv și finalizeaz-o în 24h. Scrie ce a mers și ce ajustezi. Repetă de 3 ori.",
      en: "Self-efficacy (GSE) is {{gseScore}}/40. Pick a micro task tied to your goal, finish it within 24h, and log what worked plus your next tweak. Repeat three times.",
    },
    ctaLabel: {
      ro: "Pornesc micro-task-ul",
      en: "Start micro task",
    },
    conditions: [
      { metric: "gseTotal", operator: "lte", value: 25 },
    ],
    priority: 5,
    notes: "Boosts confidence when GSE is low.",
  },
];
