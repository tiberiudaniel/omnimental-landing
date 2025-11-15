import type { OmniKunoMiniTestConfig, OmniKunoQuestion } from './omniKunoTypes';

export const omniKunoClaritateQuestions: OmniKunoQuestion[] = [
  { id: 'clar_q1_priorities', topicKey: 'identitate', subtopicKey: 'general', order: 1, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce pas scurt crește claritatea la început de zi?', options: [ { id: 'A', label: 'Aleg 1–2 priorități' }, { id: 'B', label: 'Deschid toate notificările' }, { id: 'C', label: 'Încep fără plan' } ], defaultFeedback: 'Prioritizarea scurtă creează claritate și momentum.', },
  { id: 'clar_q2_journal', topicKey: 'identitate', subtopicKey: 'general', order: 2, type: 'singleChoice', style: 'knowledge', isOnboarding: true, text: 'Ce practică reduce ruminația?', options: [ { id: 'A', label: 'Jurnalizare ghidată 1–2 min' }, { id: 'B', label: 'Scroll prelungit' }, { id: 'C', label: 'Evit orice reflecție' } ], defaultFeedback: 'Jurnalizarea direcționează atenția și scade ruminația.', },
  { id: 'clar_q3_scenario', topicKey: 'identitate', subtopicKey: 'general', order: 3, type: 'singleChoice', style: 'scenario', isOnboarding: true, text: 'Când apare confuzia într-o decizie, ce faci de obicei?', options: [ { id: 'A', label: 'Notez rapid 2–3 opțiuni' }, { id: 'B', label: 'Amân pe termen nedefinit' }, { id: 'C', label: 'Cer orice părere disponibilă' } ], defaultFeedback: 'Externalizarea opțiunilor scurtează indecizia.', },
  { id: 'clar_q4_reflect', topicKey: 'identitate', subtopicKey: 'general', order: 4, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'self_check', text: 'Cât de des îți clarifici nevoile într-o discuție dificilă?', options: [ { id: 'A', label: 'Rar' }, { id: 'B', label: 'Când îmi amintesc' }, { id: 'C', label: 'Des' } ], defaultFeedback: 'Clarificarea nevoilor reduce confuzia în dialog.', },
  { id: 'clar_q5_readiness', topicKey: 'identitate', subtopicKey: 'general', order: 5, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'readiness', text: 'Cât de realist simți că poți face 2 min de jurnal/zi?', options: [ { id: 'A', label: 'Foarte greu acum' }, { id: 'B', label: 'Pot încerca scurt' }, { id: 'C', label: 'Pot include zilnic' } ], defaultFeedback: 'Pașii mici, repetați, cresc claritatea.', },
  { id: 'clar_q6_barrier', topicKey: 'identitate', subtopicKey: 'general', order: 6, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'barrier', text: 'Care-i bariera tipică pentru claritate?', options: [ { id: 'A', label: 'Multe întreruperi' }, { id: 'B', label: 'Nu-mi amintesc' }, { id: 'C', label: 'Nu am un cadru' } ], defaultFeedback: 'Pregătește un cadru scurt și repetabil.', },
  { id: 'clar_q7_support', topicKey: 'identitate', subtopicKey: 'general', order: 7, type: 'singleChoice', style: 'reflection', isOnboarding: true, facet: 'social_support', text: 'Ai pe cineva cu care poți clarifica opțiuni pe scurt?', options: [ { id: 'A', label: 'Aproape pe nimeni' }, { id: 'B', label: '1–2 persoane' }, { id: 'C', label: 'Da' } ], defaultFeedback: 'Un partener de clarificare ajută deciziile.', },
];

export const omniKunoClaritateMiniTestConfig: OmniKunoMiniTestConfig = {
  topicKey: 'identitate',
  questionIds: [
    'clar_q1_priorities',
    'clar_q2_journal',
    'clar_q3_scenario',
    'clar_q4_reflect',
    'clar_q5_readiness',
    'clar_q6_barrier',
    'clar_q7_support',
  ],
};

