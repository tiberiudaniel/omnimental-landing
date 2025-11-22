"use client";

import type { OmniKunoModuleId } from "@/config/omniKunoModules";

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
  // Optional thematic areas used to rank/reorder for users
  areas?: OmniKunoModuleId[];
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
  areas: ["emotional_balance", "energy_body"],
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
  areas: ["focus_clarity", "self_trust"],
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
  areas: ["focus_clarity", "emotional_balance"],
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
  areas: ["energy_body"],
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
    areas: ["decision_discernment", "self_trust"],
  },
  {
    id: "clarity-notes-3",
    type: "reflect",
    title: {
      ro: "Notează 3 clarificări azi",
      en: "Write 3 clarifications today",
    },
    template: {
      ro: "Astăzi, observă trei momente concrete în care apare confuzia sau ezitarea (la muncă, în familie, în tine). Pentru fiecare, scrie o propoziție clară: ce vrei, ce limită pui și o acțiune în următoarele 24h. Notează un semn somatic observat și un obstacol probabil. Seara, revizuiește și marchează progresul pentru fiecare situație.",
      en: "Today, notice three concrete moments where confusion or hesitation shows up (at work, at home, in yourself). For each, write one clear sentence: what you want, which boundary you set, and one action within 24h. Add one somatic sign you noticed and one likely obstacle. In the evening, review and mark progress for each situation.",
    },
    ctaLabel: {
      ro: "Notez 3 clarificări",
      en: "Write 3 clarifications",
    },
    // No hard condition: available broadly; ordering handled by priority and weekly rotation
    conditions: [],
    priority: 6,
    notes: "Short clarity journaling task; good general-purpose quest.",
    areas: ["focus_clarity"],
  },
  {
    id: "clarity-notes-3-10min",
    type: "reflect",
    title: {
      ro: "Notează 3 clarificări în 10 minute",
      en: "Write 3 clarifications in 10 minutes",
    },
    template: {
      ro: "Setează un timer de 10 minute. Alege rapid trei situații de azi în care ai simțit ezitare sau confuzie. Pentru fiecare, notează: intenția clară (1 propoziție), o limită/regulă personală (1 propoziție) și un pas în următoarele 24h. Adaugă un semn somatic observat (respirație, tensiune, căldură) și un obstacol probabil. La final, bifează ce ai clarificat cu adevărat.",
      en: "Set a 10‑minute timer. Quickly pick three moments from today where hesitation or confusion showed up. For each, jot: a clear intent (1 sentence), a boundary/personal rule (1 sentence), and one step within 24h. Add one somatic sign noticed (breath, tension, warmth) and a likely obstacle. At the end, check what you truly clarified.",
    },
    ctaLabel: {
      ro: "Pornesc sesiunea de 10 minute",
      en: "Start 10‑minute session",
    },
    conditions: [],
    priority: 7,
    notes: "Time‑boxed clarity journaling; complements clarity‑notes‑3.",
    areas: ["focus_clarity"],
  },
];
