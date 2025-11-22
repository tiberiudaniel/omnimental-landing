import { resolveModuleId, type OmniKunoModuleId } from "@/config/omniKunoModules";
import type { DimensionScores } from "./scoring";

export type SessionType = "individual" | "group";

export interface RecommendationContext {
  urgency: number;
  primaryCategory?: string | OmniKunoModuleId;
  dimensionScores: DimensionScores;
  hasProfile: boolean;
}

export interface RecommendationResult {
  recommendedPath: SessionType;
  reasonKey: string;
}

export function recommendSession(ctx: RecommendationContext): RecommendationResult {
  const { urgency, primaryCategory, dimensionScores } = ctx;
  const normalizedCategory = primaryCategory ? resolveModuleId(primaryCategory) : null;

  if (urgency >= 8) {
    return {
      recommendedPath: "individual",
      reasonKey: "reason_high_urgency",
    };
  }

  if (
    normalizedCategory === "relationships_communication" ||
    normalizedCategory === "self_trust" ||
    normalizedCategory === "decision_discernment"
  ) {
    return {
      recommendedPath: "individual",
      reasonKey: "reason_relationships",
    };
  }

  if (dimensionScores.decision_discernment >= 3 && dimensionScores.emotional_balance <= 2) {
    return {
      recommendedPath: "group",
      reasonKey: "reason_performance_group",
    };
  }

  if (urgency <= 4) {
    return {
      recommendedPath: "group",
      reasonKey: "reason_low_urgency",
    };
  }

  return {
    recommendedPath: "group",
    reasonKey: "reason_default",
  };
}
