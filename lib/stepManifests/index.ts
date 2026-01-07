"use client";

import type { StepManifest, StepManifestContext } from "./types";
import { getIntroManifest } from "./intro";
import { getGuidedDayOneManifest } from "./guidedDay1";

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
  { type: "exact", value: "/guided/day1", getManifest: getGuidedDayOneManifest },
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
