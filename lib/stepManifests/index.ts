"use client";

import type { StepManifest, StepManifestContext } from "./types";
import { getTodayRunManifest } from "./todayRun";
import { getIntroManifest } from "./intro";
import { getIntroGuidedManifest } from "./introGuided";
import { getMindPacingManifest } from "./mindPacing";
import { getOnboardingManifest } from "./onboarding";
import { getOnboardingCatLiteManifest } from "./onboardingCatLite";
import { getTodayOverviewManifest } from "./todayOverview";
import { getUpgradeManifest } from "./upgrade";
import { getArenaRunManifest } from "./arenaRun";

type ManifestFactory = (context?: StepManifestContext) => StepManifest;

type ManifestRegistryEntry =
  | {
      type: "exact";
      value: string;
      getManifest: ManifestFactory;
    }
  | {
      type: "prefix";
      value: string;
      getManifest: ManifestFactory;
      predicate?: (routePath: string) => boolean;
    };

const MANIFEST_REGISTRY: ManifestRegistryEntry[] = [
  { type: "exact", value: "/intro", getManifest: getIntroManifest },
  { type: "exact", value: "/intro/explore", getManifest: getIntroManifest },
  { type: "exact", value: "/intro/guided", getManifest: getIntroGuidedManifest },
  { type: "exact", value: "/intro/mindpacing", getManifest: getMindPacingManifest },
  { type: "exact", value: "/onboarding", getManifest: getOnboardingManifest },
  { type: "exact", value: "/onboarding/cat-baseline", getManifest: getOnboardingManifest },
  { type: "exact", value: "/onboarding/cat-baseline/result", getManifest: getOnboardingManifest },
  { type: "exact", value: "/onboarding/cat-lite-2", getManifest: getOnboardingCatLiteManifest },
  { type: "exact", value: "/onboarding/pillars", getManifest: getOnboardingManifest },
  { type: "exact", value: "/onboarding/style", getManifest: getOnboardingManifest },
  { type: "exact", value: "/today", getManifest: getTodayOverviewManifest },
  { type: "exact", value: "/today/run", getManifest: getTodayRunManifest },
  { type: "exact", value: "/upgrade", getManifest: getUpgradeManifest },
  { type: "exact", value: "/upgrade/cancel", getManifest: getUpgradeManifest },
  { type: "exact", value: "/upgrade/success", getManifest: getUpgradeManifest },
  { type: "exact", value: "/arenas/[arenaId]/[moduleId]/run", getManifest: getArenaRunManifest },
  {
    type: "prefix",
    value: "/arenas/",
    predicate: (routePath) => routePath.endsWith("/run"),
    getManifest: getArenaRunManifest,
  },
];

function findRegistryEntry(routePath: string | null | undefined) {
  if (!routePath) return undefined;
  return MANIFEST_REGISTRY.find((entry) => {
    if (entry.type === "exact") {
      return routePath === entry.value;
    }
    if (!routePath.startsWith(entry.value)) return false;
    return entry.predicate ? entry.predicate(routePath) : true;
  });
}

export function getStepManifestForRoute(routePath: string, context?: StepManifestContext): StepManifest | null {
  const entry = findRegistryEntry(routePath);
  return entry ? entry.getManifest(context) : null;
}

export type StepManifestAvailability = "available" | "missing";

export function getStepManifestAvailability(routePath: string): StepManifestAvailability {
  return findRegistryEntry(routePath) ? "available" : "missing";
}

export type { StepManifest, StepManifestContext } from "./types";
export type { StepRegistryEntry } from "./stepRegistry";
export { getStepsForRoute } from "./stepRegistry";
