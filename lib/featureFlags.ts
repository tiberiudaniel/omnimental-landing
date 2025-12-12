const TRUE_VALUES = new Set(["1", "true", "on", "yes", "enabled"]);
const FORCE_REPLAY_PHASE1 = true; // TEMP: always enabled in dev/beta to surface Replay foundation

function envFlag(name: string, fallback: boolean): boolean {
  if (FORCE_REPLAY_PHASE1) return true;
  const value = process.env[name];
  if (typeof value === "undefined") return fallback;
  return TRUE_VALUES.has(value.toLowerCase());
}

export const FEATURE_REPLAY_INTELLIGENCE = {
  enabled: FORCE_REPLAY_PHASE1 || envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE", true),
  telemetry: FORCE_REPLAY_PHASE1 || envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_TELEMETRY", true),
  lockedQuiz: FORCE_REPLAY_PHASE1 || envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_LOCKED_QUIZ", true),
  recommendationCard: FORCE_REPLAY_PHASE1 || envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_CARD", true),
  typology: FORCE_REPLAY_PHASE1 || envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_TYPOLOGY", false),
  insightDepth: FORCE_REPLAY_PHASE1 || envFlag("NEXT_PUBLIC_FEATURE_REPLAY_INTELLIGENCE_INSIGHT_DEPTH", false),
};

export type ReplayFeatureFlags = typeof FEATURE_REPLAY_INTELLIGENCE;
