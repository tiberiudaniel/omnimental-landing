import type { OmniKunoMiniTestConfig, OmniKunoQuestion } from './omniKunoTypes';

export const omniKunoCalmQuestions: OmniKunoQuestion[] = [
  { id: 'calm_q1_breath_rate', topicKey: 'calm', subtopicKey: 'general', order: 1, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce ritm respirator favorizează calmul?', options: [ { id: 'A', label: '~6 respirații/min' }, { id: 'B', label: '18 resp/min' }, { id: 'C', label: '30 resp/min' } ], defaultFeedback: 'Respirația lentă (~6/min) activează parasimpaticul.', },
  { id: 'calm_q2_exhale_longer', topicKey: 'calm', subtopicKey: 'general', order: 2, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Care e un marker simplu că respirația e eficientă pentru calm?', options: [ { id: 'A', label: 'Expirația mai lungă decât inspirația' }, { id: 'B', label: 'Inspir scurt și alert' }, { id: 'C', label: 'Nu contează' } ], defaultFeedback: 'Expirația prelungită stimulează parasimpaticul.', },
  { id: 'calm_q3_break_type', topicKey: 'calm', subtopicKey: 'general', order: 3, type: 'singleChoice', style: 'scenario', isOnboarding: true, text: 'Ce tip de pauză sprijină calmul în lucru?', options: [ { id: 'A', label: 'Pauză scurtă fără ecran' }, { id: 'B', label: 'Pauză lungă cu multitasking' }, { id: 'C', label: 'Deloc pauze' } ], defaultFeedback: 'Pauzele scurte, fără ecran, reduc supra-stimularea.', },
  { id: 'calm_q4_state_check', topicKey: 'calm', subtopicKey: 'general', order: 4, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'state_check', text: 'Cât de des îți verifici starea (tensiune/respirație) în zile aglomerate?', options: [ { id: 'A', label: 'Aproape niciodată' }, { id: 'B', label: 'Din când în când' }, { id: 'C', label: 'Destul de des' } ], defaultFeedback: 'Observarea stării permite intervenții scurte și eficiente.', },
  { id: 'calm_q5_readiness', topicKey: 'calm', subtopicKey: 'general', order: 5, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'readiness', text: 'Cât de realist simți că poți face 2 minute de respirație/zi?', options: [ { id: 'A', label: 'Foarte greu acum' }, { id: 'B', label: 'Pot încerca scurt' }, { id: 'C', label: 'Pot include zilnic' } ], defaultFeedback: 'Ritmul scurt și consecvent produce efecte cumulative.', },
  { id: 'calm_q6_trigger', topicKey: 'calm', subtopicKey: 'general', order: 6, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'trigger', text: 'Când apare tensiunea, ce simți că te împiedică cel mai mult să faci o pauză?', options: [ { id: 'A', label: 'Graba și presiunea timpului' }, { id: 'B', label: 'Nu-mi amintesc la timp' }, { id: 'C', label: 'Pare ciudat în context' } ], defaultFeedback: 'Identifică bariera principală pentru a-ți seta ancore simple.', },
  { id: 'calm_q7_support', topicKey: 'calm', subtopicKey: 'general', order: 7, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'social_support', text: 'Ai pe cineva cu care poți vorbi când ești foarte tensionat(ă)?', options: [ { id: 'A', label: 'Aproape pe nimeni' }, { id: 'B', label: '1–2 persoane' }, { id: 'C', label: 'Da, cel puțin o persoană' } ], defaultFeedback: 'Un minim suport social ajută autoreglarea.', },
];

export const omniKunoCalmMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: 'calm',
  questionIds: [
    'calm_q1_breath_rate',
    'calm_q2_exhale_longer',
    'calm_q3_break_type',
    'calm_q4_state_check',
    'calm_q5_readiness',
    'calm_q6_trigger',
    'calm_q7_support',
  ],
};

