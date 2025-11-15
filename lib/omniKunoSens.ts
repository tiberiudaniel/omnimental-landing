import type { OmniKunoMiniTestConfig, OmniKunoQuestion } from './omniKunoTypes';

export const omniKunoSensQuestions: OmniKunoQuestion[] = [
  { id: 'sens_q1_meaning', topicKey: 'sens', subtopicKey: 'general', order: 1, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce sprijină sentimentul de sens în activitate?', options: [ { id: 'A', label: 'Legătura cu o contribuție sau scop' }, { id: 'B', label: 'Doar recompense imediate' }, { id: 'C', label: 'Evit orice dificultate' } ], defaultFeedback: 'Conexiunea cu un scop crește sensul resimțit.', },
  { id: 'sens_q2_values', topicKey: 'sens', subtopicKey: 'general', order: 2, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce întrebare simplă ajută?', options: [ { id: 'A', label: 'Ce valori ating prin acest pas?' }, { id: 'B', label: 'Cine e vinovat?' }, { id: 'C', label: 'Cum evit tot?' } ], defaultFeedback: 'Conectarea cu valori ghidează alegerile.', },
  { id: 'sens_q3_scenario', topicKey: 'sens', subtopicKey: 'general', order: 3, type: 'singleChoice', style: 'scenario', isOnboarding: true, text: 'Când motivația scade, ce faci?', options: [ { id: 'A', label: 'Reamintesc de ce contează' }, { id: 'B', label: 'Renunț' }, { id: 'C', label: 'Mă forțez fără sens' } ], defaultFeedback: 'Reamintirea scopului reactivează motivația.', },
  { id: 'sens_q4_reflect', topicKey: 'sens', subtopicKey: 'general', order: 4, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'self_check', text: 'Cât de des conectezi sarcinile la valori?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Des' } ], defaultFeedback: 'Conexiunile frecvente cresc sensul.', },
  { id: 'sens_q5_readiness', topicKey: 'sens', subtopicKey: 'general', order: 5, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'readiness', text: 'Poți nota 1 propoziție despre “de ce contează”/zi?', options: [ { id: 'A', label: 'Greu' }, { id: 'B', label: 'Pot încerca' }, { id: 'C', label: 'Da' } ], defaultFeedback: 'Formularea scurtă susține direcția.', },
  { id: 'sens_q6_barrier', topicKey: 'sens', subtopicKey: 'general', order: 6, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'barrier', text: 'Care e bariera tipică pentru sens?', options: [ { id: 'A', label: 'Oboseală' }, { id: 'B', label: 'Lipsa clarității' }, { id: 'C', label: 'Presiune externă' } ], defaultFeedback: 'Identifică bariera și ajustează pașii.', },
  { id: 'sens_q7_support', topicKey: 'sens', subtopicKey: 'general', order: 7, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'social_support', text: 'Ai cu cine discuta despre direcție/valori?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Da' } ], defaultFeedback: 'Dialogul despre valori clarifică pașii.', },
];

export const omniKunoSensMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: 'sens',
  questionIds: [
    'sens_q1_meaning',
    'sens_q2_values',
    'sens_q3_scenario',
    'sens_q4_reflect',
    'sens_q5_readiness',
    'sens_q6_barrier',
    'sens_q7_support',
  ],
};

