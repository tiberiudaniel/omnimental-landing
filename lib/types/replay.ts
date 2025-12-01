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
  moduleId?: string | null;
  benefit?: string;
  estimatedMinutes?: number;
}

export interface ReplayTimeTrackingPayload {
  activityType: "lesson" | "quiz";
  lessonId: string;
  moduleId?: string;
  categoryId?: string | null;
  startTimestamp: number;
  endTimestamp: number;
  timeSpentSec: number;
  idleSec: number;
  idleSegments?: Array<{ start: number; end: number }>;
  responseTimes: number[];
  answerLengths?: number[];
  quizScore?: number | null;
  recordedAt?: number;
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

export interface ReplayStats {
  totalSessions: number;
  lessonSessions: number;
  quizSessions: number;
  sumTimeSec: number;
  sumIdleSec: number;
  responseSamples: number;
  sumResponseMs: number;
  shortResponseCount: number;
  answerSamples: number;
  totalAnswerChars: number;
  longAnswerCount: number;
  quizAttempts: number;
  lowScoreCount: number;
  deepNoActionCount: number;
  fastSessionCount: number;
  lastLessonId?: string | null;
  lastModuleId?: string | null;
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
  stats?: ReplayStats;
  lastRecommendation?: ReplayRecommendationPayload | null;
}
