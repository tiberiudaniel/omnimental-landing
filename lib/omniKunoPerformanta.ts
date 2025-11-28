import type { OmniKunoMiniTestConfig, OmniKunoQuestion } from './omniKunoTypes';

export const omniKunoPerformantaQuestions: OmniKunoQuestion[] = [
  { id: 'perf_q1_flow_def', topicKey: 'performanta', subtopicKey: 'general', order: 1, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce descrie mai bine “intrarea în flow”?', options: [ { id: 'A', label: 'Concentrare relaxată + feedback rapid' }, { id: 'B', label: 'Lipsa totală a emoțiilor' }, { id: 'C', label: 'Control complet al contextului' } ], defaultFeedback: 'Flow-ul înseamnă provocare potrivită, concentrare relaxată și feedback rapid.', },
  { id: 'perf_q2_challenge_match', topicKey: 'performanta', subtopicKey: 'general', order: 2, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce crește șansa de flow?', options: [ { id: 'A', label: 'Provocare potrivită abilității' }, { id: 'B', label: 'Provocare mult peste abilitate' }, { id: 'C', label: 'Provocare mult sub abilitate' } ], defaultFeedback: 'Potrivirea dintre provocare și abilitate favorizează flow-ul.', },
  { id: 'perf_q3_focus_breaks', topicKey: 'performanta', subtopicKey: 'general', order: 3, type: 'singleChoice', style: 'scenario', isOnboarding: true, text: 'Când ai multe întreruperi, ce strategie te ajută cel mai des?', options: [ { id: 'A', label: 'Blocuri scurte fără notificări' }, { id: 'B', label: 'Fac totul simultan' }, { id: 'C', label: 'Stau online constant' } ], defaultFeedback: 'Blocurile scurte, fără întreruperi, cresc calitatea concentrării.', },
  { id: 'perf_q4_reflect', topicKey: 'performanta', subtopicKey: 'general', order: 4, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'self_check', text: 'Cât de des îți ajustezi nivelul de provocare când te blochezi?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Des' } ], defaultFeedback: 'Ajustarea provocării menține ritmul și învățarea.', },
  { id: 'perf_q5_readiness', topicKey: 'performanta', subtopicKey: 'general', order: 5, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'readiness', text: 'Cât de realist e să lucrezi 20–25 min fără notificări/zi?', options: [ { id: 'A', label: 'Greu acum' }, { id: 'B', label: 'Pot încerca' }, { id: 'C', label: 'Pot include zilnic' } ], defaultFeedback: 'Blocurile scurte, zilnice, cresc performanța în timp.', },
  { id: 'perf_q6_feedback', topicKey: 'performanta', subtopicKey: 'general', order: 6, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'feedback', text: 'Ai un feedback clar pe taskurile cheie?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Da, de obicei' } ], defaultFeedback: 'Feedback-ul clar ghidează ajustările utile.', },
  { id: 'perf_q7_energy', topicKey: 'performanta', subtopicKey: 'general', order: 7, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'energy_match', text: 'Îți potrivești munca grea în intervalele cu energie mai bună?', options: [ { id: 'A', label: 'Rareori' }, { id: 'B', label: 'Uneori' }, { id: 'C', label: 'Des' } ], defaultFeedback: 'Potrivirea energiei cu sarcina crește randamentul.', },
];

export const omniKunoPerformantaMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: 'performanta',
  questionIds: [
    'perf_q1_flow_def',
    'perf_q2_challenge_match',
    'perf_q3_focus_breaks',
    'perf_q4_reflect',
    'perf_q5_readiness',
    'perf_q6_feedback',
    'perf_q7_energy',
  ],
};

