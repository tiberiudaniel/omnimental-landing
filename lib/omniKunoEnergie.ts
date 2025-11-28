import type { OmniKunoMiniTestConfig, OmniKunoQuestion } from './omniKunoTypes';

export const omniKunoEnergieQuestions: OmniKunoQuestion[] = [
  { id: 'ener_q1_light', topicKey: 'energie', subtopicKey: 'general', order: 1, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce obicei susține energia pe parcursul zilei?', options: [ { id: 'A', label: 'Expunere la lumină dimineața' }, { id: 'B', label: 'Cafea seara târziu' }, { id: 'C', label: 'Somn aleator' } ], defaultFeedback: 'Lumina dimineața ancorează ritmurile circadiene.', },
  { id: 'ener_q2_posture', topicKey: 'energie', subtopicKey: 'general', order: 2, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce mic reset ajută energia în zile aglomerate?', options: [ { id: 'A', label: 'Mișcare ușoară + postură' }, { id: 'B', label: 'Ecran constant' }, { id: 'C', label: 'Orice snack rapid' } ], defaultFeedback: 'Mișcarea scurtă și postura corectă sprijină energia.', },
  { id: 'ener_q3_breaks', topicKey: 'energie', subtopicKey: 'general', order: 3, type: 'singleChoice', style: 'scenario', isOnboarding: true, text: 'Când energia scade, ce faci de obicei?', options: [ { id: 'A', label: 'Pauză scurtă + respirație' }, { id: 'B', label: 'Forțez continuu' }, { id: 'C', label: 'Compensez cu stimuli mereu' } ], defaultFeedback: 'Reseturile scurte stabilizează energia.', },
  { id: 'ener_q4_reflect', topicKey: 'energie', subtopicKey: 'general', order: 4, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'state_check', text: 'Cât de des observi ritmul energiei în zi?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Des' } ], defaultFeedback: 'Observarea ritmului ajută planificarea mai bună.', },
  { id: 'ener_q5_readiness', topicKey: 'energie', subtopicKey: 'general', order: 5, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'readiness', text: 'Poți include 5–10 min de plimbare/zi?', options: [ { id: 'A', label: 'Greu' }, { id: 'B', label: 'Pot încerca' }, { id: 'C', label: 'Da, ușor' } ], defaultFeedback: 'Pașii scurți repetabili cresc energia în timp.', },
  { id: 'ener_q6_barrier', topicKey: 'energie', subtopicKey: 'general', order: 6, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'barrier', text: 'Care este bariera principală pentru energie constantă?', options: [ { id: 'A', label: 'Somn neregulat' }, { id: 'B', label: 'Sedentarism' }, { id: 'C', label: 'Pauze lipsă' } ], defaultFeedback: 'Identifică bariera dominantă și adaugă micro-obiceiuri.', },
  { id: 'ener_q7_support', topicKey: 'energie', subtopicKey: 'general', order: 7, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'social_support', text: 'Ai sprijin pentru a susține o rutină ușoară zilnic?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Da' } ], defaultFeedback: 'Sprijinul crește consecvența.', },
];

export const omniKunoEnergieMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: 'energie',
  questionIds: [
    'ener_q1_light',
    'ener_q2_posture',
    'ener_q3_breaks',
    'ener_q4_reflect',
    'ener_q5_readiness',
    'ener_q6_barrier',
    'ener_q7_support',
  ],
};

