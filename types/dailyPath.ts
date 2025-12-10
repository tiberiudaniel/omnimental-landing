export type AdaptiveCluster =
  | "clarity_cluster"
  | "emotional_flex_cluster"
  | "focus_energy_cluster";

export type DailyNodeKind =
  | "INTRO"
  | "LEARN"
  | "RESET"
  | "ACTION"
  | "SUMMARY"
  | "ANCHOR"
  | "QUIZ_SINGLE"
  | "SIMULATOR"
  | "REAL_WORLD";

export type DailyNodeShape = "circle" | "star" | "hollow";

export interface DailyPathNodeConfig {
  id: string;
  kind: DailyNodeKind;
  shape: DailyNodeShape;
  title: string;
  description: string;
  xp: number;
  isBonus?: boolean;
  softPathOnly?: boolean;
  linkType?: "none" | "kuno" | "abil";
  linkTarget?: string;
  quizOptions?: { id: string; label: string }[];
  correctOptionIds?: string[];
  quizFeedback?: {
    correct: string;
    incorrect: string;
  };
  badge?: "simulator" | "viata_reala";
  anchorDescription?: string;
  simulatorConfig?: {
    inhaleSeconds?: number;
    exhaleSeconds?: number;
  };
  fields?: Array<{
    id: string;
    label: string;
    placeholder?: string;
    prefix?: string;
    suffix?: string;
  }>;
  bullets?: string[];
  ctaLabel?: string;
}

export interface DailyPathConfig {
  cluster: AdaptiveCluster;
  nodes: DailyPathNodeConfig[];
  autonomyNodeId?: string;
}
