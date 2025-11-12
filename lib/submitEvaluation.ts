"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb, ensureAuth, areWritesDisabled } from "@/lib/firebase";
import { recordQuestProgressFact } from "./progressFacts";
import type { OmniKnowledgeScores } from "./omniKnowledge";
import type { QuestSuggestion } from "./quests";

export type EvalPayload = {
  lang: "ro" | "en";
  answers: Record<string, unknown>;
  // poți adăuga câmpuri non-PII: context, source, etc.
};

export async function submitEvaluation(payload: EvalPayload) {
  const user = await ensureAuth();
  if (!user) throw new Error("Auth not available on server. Call from client component.");
  const db = getDb();
  const timestamp = serverTimestamp();
  if (areWritesDisabled()) {
    return `local-${Date.now()}`;
  }
  const ref = await addDoc(collection(db, "userIntentSnapshots"), {
    profileId: user.uid, // necesar pentru reguli
    lang: payload.lang,
    answers: payload.answers,
    createdAt: timestamp,
    timestamp,
  });
  return ref.id;
}

export type OmniAbilitySubmission = {
  lang: "ro" | "en";
  result: {
    total: number;
    probes: Record<string, { raw: number; scaled: number; maxRaw: number }>;
  };
  inputs: Record<string, unknown>;
};

export async function submitOmniAbilitiesAssessment(payload: OmniAbilitySubmission) {
  const user = await ensureAuth();
  if (!user) throw new Error("Auth not available on server. Call from client component.");
  const db = getDb();
  const timestamp = serverTimestamp();
  if (areWritesDisabled()) return;
  await addDoc(collection(db, "userAbilityAssessments"), {
    profileId: user.uid,
    lang: payload.lang,
    result: payload.result,
    inputs: payload.inputs,
    createdAt: timestamp,
    timestamp,
  });
}

export type OmniIntentSubmission = {
  lang: "ro" | "en";
  result: {
    total: number;
    k: number;
    b: number;
    c: number;
    p: number;
    g: number;
  };
  answers: Record<string, number>;
};

export async function submitOmniIntentAssessment(payload: OmniIntentSubmission) {
  const user = await ensureAuth();
  if (!user) throw new Error("Auth not available on server. Call from client component.");
  const db = getDb();
  const timestamp = serverTimestamp();
  if (areWritesDisabled()) return;
  await addDoc(collection(db, "userIntentAssessments"), {
    profileId: user.uid,
    lang: payload.lang,
    result: payload.result,
    answers: payload.answers,
    createdAt: timestamp,
    timestamp,
  });
}

export type OmniKnowledgeSubmission = {
  lang: "ro" | "en";
  score: OmniKnowledgeScores;
  answers: Record<string, number>;
  metadata?: {
    completionDurationMs?: number;
    completionDurationSeconds?: number;
    totalQuestions?: number;
    answeredCount?: number;
    completionPercent?: number;
    suspiciousSpeed?: boolean;
    submittedAt?: string;
    clientUserAgent?: string | null;
    timezoneOffsetMinutes?: number;
  };
};

export async function submitOmniKnowledgeAssessment(payload: OmniKnowledgeSubmission) {
  const user = await ensureAuth();
  if (!user) throw new Error("Auth not available on server. Call from client component.");
  const db = getDb();
  const timestamp = serverTimestamp();
  if (areWritesDisabled()) return;
  await addDoc(collection(db, "userKnowledgeAssessments"), {
    profileId: user.uid,
    lang: payload.lang,
    score: payload.score,
    answers: payload.answers,
    metadata: payload.metadata ?? null,
    createdAt: timestamp,
    timestamp,
  });
}

type QuestSuggestionPayload = {
  lang: "ro" | "en";
  stage: string;
  snapshotId: string;
  quests: QuestSuggestion[];
};

export async function saveQuestSuggestions(payload: QuestSuggestionPayload) {
  if (!payload.quests.length) return;
  const user = await ensureAuth();
  if (!user) throw new Error("Auth not available on server. Call from client component.");
  const db = getDb();
  const timestamp = serverTimestamp();
  if (areWritesDisabled()) {
    await recordQuestProgressFact({ quests: payload.quests });
    return;
  }
  await addDoc(collection(db, "userQuestSuggestions"), {
    profileId: user.uid,
    lang: payload.lang,
    stage: payload.stage,
    snapshotId: payload.snapshotId,
    quests: payload.quests,
    createdAt: timestamp,
    timestamp,
  });
  await recordQuestProgressFact({ quests: payload.quests });
}
