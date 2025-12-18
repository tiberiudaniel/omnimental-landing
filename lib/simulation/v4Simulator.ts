"use client";

import { getSensAiTodayPlan } from "@/lib/omniSensAI";
import { recordSessionTelemetry, type SessionTelemetry, type TelemetrySessionType, type TelemetryFlowTag } from "@/lib/telemetry";
import {
  advanceArcProgress,
  addTraitXp,
  applyProfilePatch,
  getTraitLabel,
  getUserProfileSnapshot,
  type CatAxisId,
  type CatProfilePatch,
  type ConfidenceLevel,
  type DomainId,
  type DomainPreference,
  type UserProfileSnapshot,
} from "@/lib/profileEngine";
import { buildPlanKpiEvent } from "@/lib/sessionTelemetry";
import { resolveTraitPrimaryForModule } from "@/config/wowLessonsV2";

export type V4SimulationOptions = {
  days: number;
  sessionType?: TelemetrySessionType;
  pretendDates?: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_AXIS_SCORE = 4;
const PRIMARY_AXIS_GAIN = 0.7;
const SECONDARY_AXIS_DECAY = 0.35;
const CAT_AXES: CatAxisId[] = [
  "clarity",
  "focus",
  "recalibration",
  "energy",
  "flexibility",
  "adaptiveConfidence",
  "emotionalStability",
];
const DOMAIN_IDS: DomainId[] = ["work", "personal", "relationships", "growth"];
const AXIS_TO_DOMAIN: Record<CatAxisId, DomainId> = {
  clarity: "work",
  focus: "work",
  recalibration: "growth",
  energy: "personal",
  flexibility: "growth",
  adaptiveConfidence: "growth",
  emotionalStability: "relationships",
};

type AxisScoreState = Record<CatAxisId, number>;

export async function simulateV4Progress(userId: string, options: V4SimulationOptions): Promise<void> {
  if (!userId) {
    throw new Error("simulateV4Progress: missing userId");
  }
  const initialSnapshot = await getUserProfileSnapshot(userId);
  const axisScores = initializeAxisScores(initialSnapshot);
  if (!initialSnapshot?.catProfile) {
    await persistProfileState(userId, axisScores);
  }
  const totalDays = Math.max(1, Math.floor(options.days ?? 1));
  const sessionType = options.sessionType ?? "daily";
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
    const { plan } = await getSensAiTodayPlan(userId);
    if (!plan) {
      console.warn("[v4-sim] plan unavailable; aborting remaining days");
      break;
    }
    const simulatedDate =
      options.pretendDates === true ? new Date(Date.now() - (totalDays - 1 - dayIndex) * DAY_MS) : new Date();
    const resolvedTraitPrimary = resolveTraitPrimaryForModule(plan.moduleId, plan.traitPrimary);
    const traitSignals: SessionTelemetry["traitSignals"] = [];
    if (resolvedTraitPrimary) {
      traitSignals.push({
        trait: resolvedTraitPrimary,
        canonDomain: plan.canonDomain,
        deltaSelfReport: 1,
        confidence: "medium",
      });
    }
    if (plan.traitSecondary.length) {
      traitSignals.push({
        trait: plan.traitSecondary[0],
        canonDomain: plan.canonDomain,
        deltaSelfReport: 0.5,
        confidence: "low",
      });
    }
    const flowTag: TelemetryFlowTag =
      sessionType === "daily"
        ? "today"
        : sessionType === "arena"
        ? "arena"
        : sessionType === "wizard"
        ? "onboarding"
        : "other";
    const kpiEvent = buildPlanKpiEvent(
      {
        userId,
        moduleId: plan.moduleId,
        canonDomain: plan.canonDomain,
        traitPrimary: resolvedTraitPrimary ?? plan.traitPrimary,
        traitSecondary: plan.traitSecondary,
      },
      { source: sessionType, difficultyFeedback: "just_right" },
    );
    await recordSessionTelemetry({
      sessionId: `sim-${userId}-${Date.now()}-${dayIndex}`,
      userId,
      sessionType,
      arcId: plan.arcId,
      moduleId: plan.moduleId,
      traitSignals,
      kpiEvents: [kpiEvent],
      difficultyFeedback: "just_right",
      recordedAtOverride: simulatedDate,
      origin: "simulated",
      flowTag,
    });
    if (plan.arcId) {
      await advanceArcProgress(userId, plan.arcId, { completedToday: true });
    }
    if (resolvedTraitPrimary) {
      await addTraitXp(userId, resolvedTraitPrimary, 10);
      await adjustCatProfileState(userId, axisScores, resolvedTraitPrimary);
    } else if (plan.traitPrimary) {
      await addTraitXp(userId, plan.traitPrimary, 10);
      await adjustCatProfileState(userId, axisScores, plan.traitPrimary);
    }
    console.log(
      `[v4-sim] Ziua ${dayIndex + 1}/${totalDays} · Arc ${plan.arcId ?? "—"} · modul ${
        plan.moduleId
      } (+10 XP ${getTraitLabel(resolvedTraitPrimary ?? plan.traitPrimary)})`,
    );
  }
}

function initializeAxisScores(snapshot: UserProfileSnapshot | null | undefined): AxisScoreState {
  return CAT_AXES.reduce<AxisScoreState>((acc, axis) => {
    const existing = snapshot?.catProfile?.axes?.[axis]?.score;
    acc[axis] = typeof existing === "number" ? clampScore(existing) : DEFAULT_AXIS_SCORE;
    return acc;
  }, {} as AxisScoreState);
}

async function adjustCatProfileState(userId: string, axisScores: AxisScoreState, strengthenedAxis: CatAxisId) {
  const nowTouchedAxes: CatAxisId[] = [];
  axisScores[strengthenedAxis] = clampScore(axisScores[strengthenedAxis] + PRIMARY_AXIS_GAIN);
  nowTouchedAxes.push(strengthenedAxis);
  const weakenedAxis = pickAxisToWeaken(axisScores, strengthenedAxis);
  if (weakenedAxis) {
    axisScores[weakenedAxis] = clampScore(axisScores[weakenedAxis] - SECONDARY_AXIS_DECAY);
    nowTouchedAxes.push(weakenedAxis);
  }
  await persistProfileState(userId, axisScores, nowTouchedAxes);
}

async function persistProfileState(userId: string, axisScores: AxisScoreState, axes?: CatAxisId[]) {
  const patch = buildProfilePatch(axisScores, axes);
  const domains = buildDomainPreferences(axisScores);
  if (!Object.keys(patch).length && !domains.length) {
    return;
  }
  await applyProfilePatch(userId, Object.keys(patch).length ? patch : null, domains.length ? domains : undefined);
}

function buildProfilePatch(axisScores: AxisScoreState, axes?: CatAxisId[]): CatProfilePatch {
  const patch: CatProfilePatch = {};
  const targetAxes = axes && axes.length ? axes : CAT_AXES;
  const timestamp = new Date().toISOString();
  targetAxes.forEach((axis) => {
    const score = clampScore(axisScores[axis]);
    patch[axis] = {
      score,
      confidence: deriveConfidence(score),
      lastUpdated: timestamp,
    };
  });
  return patch;
}

function buildDomainPreferences(axisScores: AxisScoreState): DomainPreference[] {
  const totals = DOMAIN_IDS.reduce<Record<DomainId, number>>((acc, domain) => {
    acc[domain] = 0;
    return acc;
  }, {} as Record<DomainId, number>);
  CAT_AXES.forEach((axis) => {
    const domain = AXIS_TO_DOMAIN[axis];
    totals[domain] += Math.max(axisScores[axis], 0);
  });
  const totalWeight = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const stamp = new Date().toISOString();
  if (totalWeight <= 0) {
    return DOMAIN_IDS.map((domain) => ({
      domainId: domain,
      weight: 0.25,
      lastMentioned: stamp,
    }));
  }
  const raw = DOMAIN_IDS.map((domain) => ({
    domainId: domain,
    weight: totals[domain] / totalWeight,
    lastMentioned: stamp,
  })).filter((pref) => pref.weight > 0.01);
  const rawTotal = raw.reduce((sum, pref) => sum + pref.weight, 0);
  if (rawTotal <= 0) {
    return DOMAIN_IDS.map((domain) => ({
      domainId: domain,
      weight: 0.25,
      lastMentioned: stamp,
    }));
  }
  return raw.map((pref) => ({
    ...pref,
    weight: pref.weight / rawTotal,
  }));
}

function pickAxisToWeaken(axisScores: AxisScoreState, exclude: CatAxisId): CatAxisId | null {
  let target: CatAxisId | null = null;
  let highest = -Infinity;
  CAT_AXES.forEach((axis) => {
    if (axis === exclude) return;
    const value = axisScores[axis];
    if (value > highest) {
      highest = value;
      target = axis;
    }
  });
  return target;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, value));
}

function deriveConfidence(score: number): ConfidenceLevel {
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  if (score > 0) return "low";
  return "unknown";
}
