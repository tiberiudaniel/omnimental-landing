"use client";

import { getUserProfileSnapshot, type UserProfileSnapshot, type CatAxisId } from "@/lib/profileEngine";
import { getTodayPlan, type SessionPlan } from "@/lib/sessionRecommenderEngine";
import { getSessionsToday, getArenaRunsById } from "@/lib/usageStats";
import { FREE_LIMITS } from "@/lib/gatingRules";
import { getBenchmarkMinutes } from "@/lib/durationBenchmarks";

export type SensAiContext = {
  profile: UserProfileSnapshot;
  sessionsToday: number;
  arenasRunsById: Record<string, number>;
};

const SAFE_FALLBACK_PLAN: SessionPlan = {
  id: "fallback_clarity",
  type: "daily",
  moduleId: "clarity_01_illusion_of_clarity",
  title: "Claritate operațională",
  summary: "Un exercițiu scurt de traducere a zgomotului în acțiuni clare.",
  expectedDurationMinutes: 8,
  traitPrimary: "clarity",
  traitSecondary: ["focus"],
  canonDomain: "decisionalClarity",
  arcId: null,
  arcDayIndex: 0,
  arcLengthDays: null,
};

export async function buildSensAiContext(userId: string): Promise<SensAiContext | null> {
  const profile = await getUserProfileSnapshot(userId);
  if (!profile) return null;
  let sessionsToday = 0;
  let arenasRunsById: Record<string, number> = {};
  try {
    sessionsToday = await getSessionsToday(userId);
  } catch (error) {
    console.warn("buildSensAiContext: getSessionsToday failed", error);
  }
  try {
    arenasRunsById = await getArenaRunsById(userId);
  } catch (error) {
    console.warn("buildSensAiContext: getArenaRunsById failed", error);
  }
  return { profile, sessionsToday, arenasRunsById };
}

function withDurationBenchmark(plan: SessionPlan | null): SessionPlan | null {
  if (!plan) return plan;
  const benchmarkMinutes = getBenchmarkMinutes(plan.moduleId);
  if (!benchmarkMinutes) return plan;
  const adjustedMinutes = Math.max(3, Math.min(45, Math.round(benchmarkMinutes)));
  if (!Number.isFinite(adjustedMinutes) || adjustedMinutes <= 0) {
    return plan;
  }
  if (adjustedMinutes === plan.expectedDurationMinutes) {
    return plan;
  }
  return { ...plan, expectedDurationMinutes: adjustedMinutes };
}

export async function getSensAiTodayPlan(
  userId: string,
  options?: { forcedAxis?: CatAxisId | null },
): Promise<{ ctx: SensAiContext | null; plan: SessionPlan | null }> {
  const forcedAxis = options?.forcedAxis ?? null;
  const ctx = await buildSensAiContext(userId);
  if (!ctx) {
    const fallbackProfile = await getUserProfileSnapshot(userId);
    if (!fallbackProfile) {
      return { ctx: null, plan: SAFE_FALLBACK_PLAN };
    }
    try {
      const nextPlan = getTodayPlan(fallbackProfile, forcedAxis ? { forcedTrait: forcedAxis } : undefined);
      return { ctx: null, plan: withDurationBenchmark(nextPlan) };
    } catch (error) {
      console.warn("getSensAiTodayPlan fallback planner failed", error);
      return { ctx: null, plan: withDurationBenchmark(SAFE_FALLBACK_PLAN) };
    }
  }
  try {
    const plan = getTodayPlan(ctx.profile, forcedAxis ? { forcedTrait: forcedAxis } : undefined);
    return { ctx, plan: withDurationBenchmark(plan) };
  } catch (error) {
    console.warn("getSensAiTodayPlan planner failed", error);
    return { ctx, plan: withDurationBenchmark(SAFE_FALLBACK_PLAN) };
  }
}

export function hasFreeDailyLimit(ctx: SensAiContext | null): boolean {
  if (!ctx) return false;
  const isPremium = ctx.profile.subscription.status === "premium";
  if (isPremium) return false;
  return ctx.sessionsToday >= FREE_LIMITS.dailySessionsPerDay;
}
