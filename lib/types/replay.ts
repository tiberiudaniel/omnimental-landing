export type UserTypology = "fast_thinker" | "deep_writer" | "precision_user";

export type ReplayMode = "guided" | "applied" | "reflective";

export type ReplayType = "lesson" | "category" | "cycle";

export type ReplayReason = "low_score" | "superficial" | "deep_no_action" | "consistency" | "returning";

export type FlexProfile = "rigid" | "impulsive" | "overthinking" | "balanced";

export interface UserTypologySnapshot {
  userTypology: UserTypology;
  confidence: number;
  detectedAt: number;
}

export interface ReplayRecommendationPayload {
  replayType: ReplayType;
  target: string | null;
  reason: ReplayReason;
  recommendedMode: ReplayMode;
  createdAt: number;
}

export interface ReplayTimeTrackingPayload {
  activityType: "lesson" | "quiz";
  lessonId: string;
  moduleId?: string;
  startTimestamp: number;
  endTimestamp: number;
  timeSpentSec: number;
  idleSec: number;
  idleSegments?: Array<{ start: number; end: number }>;
  responseTimes: number[];
}

export interface InsightDepthPayload {
  depthScore: number;
  specificity?: number;
  emotionalInsight?: number;
  recordedAt: number;
}

export interface ReplayScoresPayload {
  growthDelta: number;
  insightScore: number;
  consistencyBonus: number;
  recordedAt: number;
}

export interface MasteryMetrics {
  consistency: number;
  depth: number;
  correctness: number;
  implementation: number;
  updatedAt: number;
}

export interface FlexReplayProfile {
  flexProfile: FlexProfile;
  adaptiveReplayMode: ReplayMode;
  updatedAt: number;
}

export interface ReplayTelemetryDocument {
  timeTracking?: ReplayTimeTrackingPayload[];
  recommendations?: ReplayRecommendationPayload[];
  typology?: UserTypologySnapshot | null;
  insightDepth?: InsightDepthPayload[];
  replayScores?: ReplayScoresPayload[];
  mastery?: MasteryMetrics | null;
  flexAdaptation?: FlexReplayProfile | null;
}
