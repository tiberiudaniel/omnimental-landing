"use client";

import type {
  BudgetPreference,
  EmotionalState,
  FormatPreference,
  GoalType,
  ResolutionSpeed,
} from "../evaluation";
import type { OmniKnowledgeScores } from "../omniKnowledge";
import type { QuestSuggestion } from "../quests";
import type { SessionType } from "../recommendation";
import type { DimensionScores } from "../scoring";
import type { OmniBlock } from "../omniIntel";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ProgressIntentCategories = Array<{ category: string; count: number }>;

export type ProgressMotivationPayload = {
  urgency: number;
  timeHorizon: ResolutionSpeed;
  determination: number;
  hoursPerWeek: number;
  budgetLevel: BudgetPreference;
  goalType: GoalType;
  emotionalState: EmotionalState;
  groupComfort: number;
  learnFromOthers: number;
  scheduleFit: number;
  formatPreference: FormatPreference;
  cloudFocusCount: number;
};

export type EvaluationScoreTotals = {
  pssTotal: number;
  gseTotal: number;
  maasTotal: number;
  panasPositive: number;
  panasNegative: number;
  svs: number;
};

export type FireTs = { toDate: () => Date };

export type RecentEntry = {
  text: string;
  timestamp: Date | number | FireTs;
  tabId?: string;
  theme?: string | null;
  sourceBlock?: string | null;
  sourceType?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  sig?: string;
};

export type ProgressFact = {
  updatedAt?: Date;
  intent?: {
    tags: string[];
    categories: ProgressIntentCategories;
    urgency: number;
    lang: string;
    firstExpression?: string | null;
    firstCategory?: string | null;
    updatedAt?: Date;
  };
  motivation?: ProgressMotivationPayload & { updatedAt?: Date };
  evaluation?: {
    scores: EvaluationScoreTotals;
    knowledge?: OmniKnowledgeScores | null;
    stageValue: string;
    lang: string;
    updatedAt?: Date;
  };
  quests?: {
    generatedAt: Date;
    items: Array<QuestSuggestion & { completed?: boolean }>;
  };
  recommendation?: {
    suggestedPath?: SessionType | null;
    reasonKey?: string | null;
    selectedPath?: SessionType | null;
    acceptedRecommendation?: boolean | null;
    dimensionScores?: DimensionScores | null;
    updatedAt?: Date;
  };
  omni?: OmniBlock;
  recentEntries?: RecentEntry[];
  quickAssessment?: {
    energy: number;
    stress: number;
    sleep: number;
    clarity: number;
    confidence: number;
    focus: number;
    updatedAt?: Date;
  };
  practiceSessions?: Array<{
    type: "reflection" | "breathing" | "drill";
    startedAt: Date;
    endedAt?: Date;
    durationSec: number;
  }>;
};
