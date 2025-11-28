export type OmniKunoTopicKey =
  | 'relatii'
  | 'calm'
  | 'identitate'
  | 'performanta'
  | 'obiceiuri'
  | 'sens'
  | 'energie';

export type OmniKunoQuestionType = 'singleChoice' | 'trueFalse' | 'likert';

export interface OmniKunoOption {
  id: string;
  label: string;
}

export interface OmniKunoQuestion {
  id: string;
  topicKey: OmniKunoTopicKey;
  subtopicKey?: string; // ex: 'cuplu' | 'familie' | 'job' | 'general'
  order: number;
  type: OmniKunoQuestionType;
  text: string;
  options: OmniKunoOption[];
  defaultFeedback?: string;
  feedbackByOption?: Record<string, string>;
  // v1.1 extensions
  style?: 'knowledge' | 'reflection' | 'scenario' | 'microSkill';
  isOnboarding?: boolean;
  facet?: string; // e.g., 'conflict_style', 'limits', ...
  xpValue?: number; // small XP per item if needed
}

export interface OmniKunoMiniTestConfig {
  topicKey: OmniKunoTopicKey;
  questionIds: string[]; // order for onboarding mini‑test
}
