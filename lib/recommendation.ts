import type { DimensionScores } from "./scoring";

export type SessionType = "individual" | "group";

export interface RecommendationContext {
  urgency: number;
  primaryCategory?: string;
  dimensionScores: DimensionScores;
  hasProfile: boolean;
}

export interface RecommendationResult {
  recommendedPath: SessionType;
  reasonKey: string;
}

export function recommendSession(ctx: RecommendationContext): RecommendationResult {
  const { urgency, primaryCategory, dimensionScores } = ctx;

  if (urgency >= 8) {
    return {
      recommendedPath: "individual",
      reasonKey: "reason_high_urgency",
    };
  }

  if (
    primaryCategory === "relationships" ||
    primaryCategory === "selfTrust" ||
    primaryCategory === "boundaries"
  ) {
    return {
      recommendedPath: "individual",
      reasonKey: "reason_relationships",
    };
  }

  if (dimensionScores.performance >= 3 && dimensionScores.calm <= 2) {
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
