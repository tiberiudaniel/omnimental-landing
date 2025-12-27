"use client";

import type { UserProfileSnapshot, CanonDomainId, CatAxisId } from "./profileEngine";
import { ARC_CONFIGS, type ArcConfig } from "@/config/arcs";
import { getNextArcRecommendation, getActiveArc } from "@/lib/arcEngine";

export type SessionPlan = {
  id: string;
  type: "daily" | "intensive";
  moduleId: string;
  title: string;
  summary: string;
  expectedDurationMinutes: number;
  traitPrimary: CatAxisId;
  traitSecondary: CatAxisId[];
  canonDomain: CanonDomainId;
  arcId: string | null;
  arcDayIndex: number;
  arcLengthDays: number | null;
};

const DEFAULT_SESSION_PLAN: SessionPlan = {
  id: "onboarding_clarity_reset",
  type: "daily",
  moduleId: "dp_clarity_reset_v1",
  title: "Reset rapid de claritate",
  summary: "Notezi 3 gânduri dominante, alegi unul și îl traduci într-o acțiune de azi.",
  expectedDurationMinutes: 6,
  traitPrimary: "clarity",
  traitSecondary: ["energy"],
  canonDomain: "decisionalClarity",
  arcId: null,
  arcDayIndex: 0,
  arcLengthDays: null,
};

function buildPlanFromArc(arc: ArcConfig, moduleIndex: number): SessionPlan {
  const modules = arc.moduleIds.length ? arc.moduleIds : [DEFAULT_SESSION_PLAN.moduleId];
  const safeIndex = Math.max(0, Math.min(moduleIndex, modules.length - 1));
  const selectedModule = modules[safeIndex] ?? DEFAULT_SESSION_PLAN.moduleId;
  return {
    id: `${arc.id}-${selectedModule}`,
    type: "daily",
    moduleId: selectedModule,
    title: arc.name,
    summary: arc.description,
    expectedDurationMinutes: 8,
    traitPrimary: arc.traitPrimary,
    traitSecondary: arc.traitSecondary,
    canonDomain: arc.canonDomain,
    arcId: arc.id,
    arcDayIndex: safeIndex,
    arcLengthDays: arc.lengthDays ?? modules.length ?? null,
  };
}

export function getFirstSessionPlan(profile: UserProfileSnapshot | null): SessionPlan {
  const nextArc = getNextArcRecommendation(profile);
  return buildPlanFromArc(nextArc, 0);
}

export function getTodayPlan(user: UserProfileSnapshot | null, opts?: { forcedTrait?: CatAxisId | null }): SessionPlan {
  try {
    if (opts?.forcedTrait) {
      const overrideArc = ARC_CONFIGS.find((arc) => arc.traitPrimary === opts.forcedTrait);
      if (overrideArc) {
        return buildPlanFromArc(overrideArc, 0);
      }
    }
    if (user?.activeArcCompleted) {
      const nextArc = getNextArcRecommendation(user);
      return buildPlanFromArc(nextArc, 0);
    }
    const activeArc = getActiveArc(user);
    if (activeArc && user) {
      const dayIndex = user.activeArcDayIndex ?? 0;
      return buildPlanFromArc(activeArc, dayIndex);
    }
    const nextArc = getNextArcRecommendation(user);
    return buildPlanFromArc(nextArc, 0);
  } catch (error) {
    console.warn("[sessionRecommender] Falling back to default plan", error);
    return DEFAULT_SESSION_PLAN;
  }
}
