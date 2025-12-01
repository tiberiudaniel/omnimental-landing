import { doc, runTransaction, serverTimestamp, setDoc, arrayUnion } from "firebase/firestore";
import { getDb, ensureAuth, areWritesDisabled } from "@/lib/firebase";
import type {
  ReplayTimeTrackingPayload,
  ReplayStats,
  UserTypologySnapshot,
  ReplayRecommendationPayload,
  FlexReplayProfile,
} from "@/lib/types/replay";
import { FEATURE_REPLAY_INTELLIGENCE } from "@/lib/featureFlags";

type StatsInput = ReplayTimeTrackingPayload & { recordedAt: number };

const MIN_SCORE_GOOD = 75;
const MIN_TIME_FOR_DEPTH = 180;

function defaultStats(): ReplayStats {
  return {
    totalSessions: 0,
    lessonSessions: 0,
    quizSessions: 0,
    sumTimeSec: 0,
    sumIdleSec: 0,
    responseSamples: 0,
    sumResponseMs: 0,
    shortResponseCount: 0,
    answerSamples: 0,
    totalAnswerChars: 0,
    longAnswerCount: 0,
    quizAttempts: 0,
    lowScoreCount: 0,
    deepNoActionCount: 0,
    fastSessionCount: 0,
    lastLessonId: null,
    lastModuleId: null,
    updatedAt: Date.now(),
  };
}

function aggregateStats(prev: ReplayStats | undefined, payload: StatsInput): ReplayStats {
  const next: ReplayStats = prev ? { ...prev } : defaultStats();
  next.totalSessions += 1;
  next.sumTimeSec += payload.timeSpentSec;
  next.sumIdleSec += payload.idleSec;
  next.responseSamples += payload.responseTimes.length;
  next.sumResponseMs += payload.responseTimes.reduce((acc, v) => acc + v, 0);
  next.shortResponseCount += payload.responseTimes.filter((v) => v < 2000).length;
  const answerSamples = payload.answerLengths?.length ?? 0;
  next.answerSamples += answerSamples;
  next.totalAnswerChars += payload.answerLengths?.reduce((acc, v) => acc + v, 0) ?? 0;
  next.longAnswerCount += payload.answerLengths?.filter((v) => v > 250).length ?? 0;
  if (payload.activityType === "lesson") {
    next.lessonSessions += 1;
    next.lastLessonId = payload.lessonId;
    next.lastModuleId = payload.moduleId ?? next.lastModuleId ?? null;
    if (payload.timeSpentSec < 120 || (payload.responseTimes.length && payload.responseTimes.every((v) => v < 2000))) {
      next.lowScoreCount += 1;
      next.fastSessionCount += 1;
    }
    if ((payload.answerLengths?.some((len) => len > 300) ?? false) && payload.timeSpentSec > MIN_TIME_FOR_DEPTH) {
      next.deepNoActionCount += 1;
    }
  } else if (payload.activityType === "quiz") {
    next.quizSessions += 1;
    next.quizAttempts += 1;
    if (payload.moduleId) {
      next.lastModuleId = payload.moduleId;
    }
    if ((payload.quizScore ?? 0) < MIN_SCORE_GOOD) {
      next.lowScoreCount += 1;
    }
  }
  next.updatedAt = payload.recordedAt;
  return next;
}

function inferTypology(stats: ReplayStats): UserTypologySnapshot {
  const avgResponseMs = stats.responseSamples ? stats.sumResponseMs / stats.responseSamples : 0;
  const avgAnswerLength = stats.answerSamples ? stats.totalAnswerChars / stats.answerSamples : 0;
  const quizRate = stats.totalSessions ? stats.quizSessions / stats.totalSessions : 0;
  const lowScoreRatio = stats.quizAttempts ? stats.lowScoreCount / stats.quizAttempts : 0;
  let userTypology: UserTypologySnapshot["userTypology"] = "fast_thinker";
  if (avgAnswerLength > 250 && stats.lowScoreCount <= stats.deepNoActionCount) {
    userTypology = "deep_writer";
  } else if (quizRate > 0.4 && lowScoreRatio < 0.2) {
    userTypology = "precision_user";
  } else if (avgResponseMs < 3000 && avgAnswerLength < 120) {
    userTypology = "fast_thinker";
  }
  const confidenceBase = Math.min(1, stats.totalSessions / 10);
  const signal = Math.min(1, Math.abs(avgResponseMs - 3000) / 3000);
  return {
    userTypology,
    confidence: Number((confidenceBase * 0.5 + signal * 0.5).toFixed(2)),
    detectedAt: Date.now(),
  };
}

function deriveReplayMode(typology: UserTypologySnapshot["userTypology"], flex?: FlexReplayProfile | null): ReplayRecommendationPayload["recommendedMode"] {
  if (flex?.flexProfile === "rigid") return "reflective";
  if (flex?.flexProfile === "impulsive") return "guided";
  if (flex?.flexProfile === "overthinking") return "applied";
  switch (typology) {
    case "deep_writer":
      return "applied";
    case "precision_user":
      return "reflective";
    default:
      return "guided";
  }
}

function generateRecommendation(
  stats: ReplayStats,
  typology: UserTypologySnapshot,
  flex?: FlexReplayProfile | null,
): ReplayRecommendationPayload {
  let replayType: ReplayRecommendationPayload["replayType"] = "lesson";
  let reason: ReplayRecommendationPayload["reason"] = "low_score";
  if (stats.deepNoActionCount >= 2) {
    replayType = "category";
    reason = "deep_no_action";
  } else if (stats.totalSessions >= 12 && stats.lowScoreCount <= 1) {
    replayType = "cycle";
    reason = "consistency";
  } else if (stats.fastSessionCount >= 2) {
    replayType = "lesson";
    reason = "superficial";
  }
  return {
    replayType,
    target: stats.lastLessonId ?? null,
    reason,
    recommendedMode: deriveReplayMode(typology.userTypology, flex),
    createdAt: Date.now(),
    moduleId: stats.lastModuleId ?? null,
    benefit: "clarity",
    estimatedMinutes: replayType === "cycle" ? 45 : replayType === "category" ? 25 : 12,
  };
}

export async function updateReplayAnalytics(entry: StatsInput, ownerId?: string | null) {
  if (areWritesDisabled() || !FEATURE_REPLAY_INTELLIGENCE.enabled) return;
  const user = ownerId ? { uid: ownerId } : await ensureAuth();
  if (!user?.uid) return;
  const db = getDb();
  const ref = doc(db, "userReplayData", user.uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists() ? (snap.data() as Record<string, unknown>) : {};
    const currentStats = data.stats as ReplayStats | undefined;
    const updatedStats = aggregateStats(currentStats, entry);
    const typology = inferTypology(updatedStats);
    const flex = (data.flexAdaptation as FlexReplayProfile | undefined) ?? null;
    const recommendation = generateRecommendation(updatedStats, typology, flex);
    const payload: Record<string, unknown> = {
      stats: updatedStats,
      typology,
      lastRecommendation: recommendation,
      updatedAt: serverTimestamp(),
    };
    tx.set(ref, payload, { merge: true });
  });
}

export async function appendReplayRecommendation(
  recommendation: ReplayRecommendationPayload,
  ownerId?: string | null,
) {
  const user = ownerId ? { uid: ownerId } : await ensureAuth();
  if (!user?.uid) return;
  const ref = doc(getDb(), "userReplayData", user.uid);
  await setDoc(
    ref,
    {
      recommendations: arrayUnion(recommendation),
      lastRecommendation: recommendation,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
