import type { OmniKunoMiniTestConfig, OmniKunoQuestion } from './omniKunoTypes';

export const omniKunoObiceiuriQuestions: OmniKunoQuestion[] = [
  { id: 'hab_q1_anchor', topicKey: 'obiceiuri', subtopicKey: 'general', order: 1, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce ajută consolidarea unui obicei nou?', options: [ { id: 'A', label: 'Ancore simple, repetate' }, { id: 'B', label: 'Complexitate maximă din prima' }, { id: 'C', label: 'Schimbări zilnice drastice' } ], defaultFeedback: 'Ancorele simple cresc aderența în timp.', },
  { id: 'hab_q2_tiny', topicKey: 'obiceiuri', subtopicKey: 'general', order: 2, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce strategie sprijină consecvența?', options: [ { id: 'A', label: 'Pași mici zilnici' }, { id: 'B', label: 'Doar sprinturi lungi' }, { id: 'C', label: 'Fără ritm' } ], defaultFeedback: 'Pașii mici, zilnici, cresc probabilitatea de repetare.', },
  { id: 'hab_q3_scenario', topicKey: 'obiceiuri', subtopicKey: 'general', order: 3, type: 'singleChoice', style: 'scenario', isOnboarding: true, text: 'Când uiți să aplici un obicei, ce faci de obicei?', options: [ { id: 'A', label: 'Setez un reminder scurt' }, { id: 'B', label: 'Renunț' }, { id: 'C', label: 'Amân pe termen nedefinit' } ], defaultFeedback: 'Micile remindere facilitează consecvența.', },
  { id: 'hab_q4_reflect', topicKey: 'obiceiuri', subtopicKey: 'general', order: 4, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'self_check', text: 'Cât de des verifici progresul pe obiceiuri?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Des' } ], defaultFeedback: 'Verificarea periodică sprijină ajustarea.', },
  { id: 'hab_q5_readiness', topicKey: 'obiceiuri', subtopicKey: 'general', order: 5, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'readiness', text: 'Poți include 2–3 minute/zi pentru un obicei cheie?', options: [ { id: 'A', label: 'Greu' }, { id: 'B', label: 'Pot încerca' }, { id: 'C', label: 'Da' } ], defaultFeedback: 'Ritmul scurt este un început realist.', },
  { id: 'hab_q6_barrier', topicKey: 'obiceiuri', subtopicKey: 'general', order: 6, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'barrier', text: 'Care e bariera principală pentru consecvență?', options: [ { id: 'A', label: 'Multe întreruperi' }, { id: 'B', label: 'Uit des' }, { id: 'C', label: 'Obiective vagi' } ], defaultFeedback: 'Clarifică obiectivul și reduce întreruperile.', },
  { id: 'hab_q7_support', topicKey: 'obiceiuri', subtopicKey: 'general', order: 7, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'social_support', text: 'Ai un partener de responsabilizare?', options: [ { id: 'A', label: 'Nu' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Da' } ], defaultFeedback: 'Un partener crește probabilitatea de menținere.', },
];

export const omniKunoObiceiuriMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: 'obiceiuri',
  questionIds: [
    'hab_q1_anchor',
    'hab_q2_tiny',
    'hab_q3_scenario',
    'hab_q4_reflect',
    'hab_q5_readiness',
    'hab_q6_barrier',
    'hab_q7_support',
  ],
};

