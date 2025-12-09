export type AdaptiveCluster =
  | "clarity_cluster"
  | "emotional_flex_cluster"
  | "focus_energy_cluster";

export type DailyNodeKind = "LEARN" | "ACTION" | "RESET";

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
}

export interface DailyPathConfig {
  cluster: AdaptiveCluster;
  nodes: DailyPathNodeConfig[];
  autonomyNodeId: string;
}
