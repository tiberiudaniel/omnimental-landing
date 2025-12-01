const TRUE_VALUES = new Set(["1", "true", "on", "yes", "enabled"]);

function envFlag(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (typeof value === "undefined") return fallback;
  return TRUE_VALUES.has(value.toLowerCase());
}

export const FEATURE_REPLAY_INTELLIGENCE = {
  enabled: envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE", true),
  telemetry: envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_TELEMETRY", true),
  lockedQuiz: envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_LOCKED_QUIZ", true),
  recommendationCard: envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_CARD", true),
  typology: envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_TYPOLOGY", false),
  insightDepth: envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_INSIGHT_DEPTH", false),
};

export type ReplayFeatureFlags = typeof FEATURE_REPLAY_INTELLIGENCE;
