"use client";

import { collection, doc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { areWritesDisabled, getDb } from "./firebase";
import type { CanonDomainId, CatAxisId } from "./profileEngine";
import { isE2EMode, pushE2ETelemetryEntry } from "@/lib/e2eMode";

export type TraitSignal = {
  trait: CatAxisId;
  canonDomain: CanonDomainId;
  deltaSelfReport?: number | null;
  confidence: "low" | "medium" | "high";
};

export type TelemetrySessionType = "daily" | "intensive" | "arena" | "wizard" | "omnikuno";
export type TelemetryOrigin = "real" | "simulated";
export type TelemetryFlowTag = "onboarding" | "today" | "arena" | "os" | "other";

export type KpiEvent = {
  userId: string;
  indicatorId: string;
  source: TelemetrySessionType;
  canonDomain: CanonDomainId;
  catAxes: CatAxisId[];
  preValue?: number | null;
  postValue: number | null;
  delta?: number | null;
  selfReport?: number | null;
  timestamp: string;
};

export type SessionTelemetry = {
  sessionId: string;
  userId: string;
  sessionType: TelemetrySessionType;
  arcId?: string | null;
  moduleId?: string | null;
  arenaId?: string | null;
  traitSignals: TraitSignal[];
  kpiEvents: KpiEvent[];
  difficultyFeedback?: "too_easy" | "just_right" | "too_hard";
  recordedAt?: unknown;
  recordedAtOverride?: Date | null;
  origin?: TelemetryOrigin;
  flowTag?: TelemetryFlowTag;
};

export async function recordSessionTelemetry(payload: SessionTelemetry): Promise<void> {
  const origin = payload.origin ?? "real";
  const flowTag = payload.flowTag ?? "other";
  const normalizedPayload: SessionTelemetry = { ...payload, origin, flowTag };
  console.log("[telemetry] session", normalizedPayload);
  if (areWritesDisabled()) return;
  if (isE2EMode()) {
    const recordedAt = normalizedPayload.recordedAtOverride ?? new Date();
    pushE2ETelemetryEntry(normalizedPayload.userId, {
      ...normalizedPayload,
      recordedAt,
    });
    return;
  }
  try {
    const db = getDb();
    const ref = doc(collection(db, "userTelemetry", normalizedPayload.userId, "sessions"));
    const { recordedAtOverride, ...rest } = normalizedPayload;
    const recordedAtValue =
      recordedAtOverride instanceof Date ? Timestamp.fromDate(recordedAtOverride) : serverTimestamp();
    await setDoc(
      ref,
      {
        ...rest,
        recordedAt: recordedAtValue,
      },
      { merge: false },
    );
  } catch (error) {
    console.warn("recordSessionTelemetry stub write failed", error);
  }
}
