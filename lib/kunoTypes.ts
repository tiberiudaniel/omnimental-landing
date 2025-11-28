export type KunoCategory = 'clarity' | 'calm' | 'energy' | 'relationships' | 'performance' | 'health' | 'general';

export type KunoDifficulty = 1 | 2 | 3; // 1=easy,2=medium,3=hard

export type KunoQuestion = {
  id: string;
  category: KunoCategory;
  difficulty: KunoDifficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type KunoAttempt = {
  questionId: string;
  category: KunoCategory;
  difficulty: KunoDifficulty;
  correct: boolean;
  timeMs: number;
  ts: number; // epoch ms
};

export type KunoSessionSummary = {
  raw: number;
  max: number;
  percent: number; // 0..100
  byCategory: Record<KunoCategory, { raw: number; max: number; percent: number }>;
};

