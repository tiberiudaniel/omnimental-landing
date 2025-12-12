export type ArenaId = "executive_control" | "adaptive_intelligence" | "psychological_shielding";
export type L1Bridge = "clarity" | "energy" | "emotional_flex";
export type ArenaLang = "ro" | "en";

export type ArenaDrillDuration = "30s" | "90s" | "3m";

export interface ArenaDrill {
  duration: ArenaDrillDuration;
  constraint: string;
  steps: string[];
  successMetric: string;
}

export interface ArenaRealWorldChallenge {
  title: string;
  steps: string[];
  successMetric: string;
}

export interface ArenaModuleV1 {
  id: string;
  arena: ArenaId;
  title: Record<ArenaLang, string>;
  explain: Record<ArenaLang, string>;
  drills: Record<ArenaLang, ArenaDrill[]>;
  realWorldChallenge: Record<ArenaLang, ArenaRealWorldChallenge>;
  bridges: Array<{ toL1: L1Bridge; because: Record<ArenaLang, string> }>;
  tags?: string[];
}
