"use client";

import { getStepManifestForRoute, type StepManifestContext } from "./index";

export type StepRegistryEntry = {
  stepKey: string;
  label: string;
  kind?: string;
};

export function getStepsForRoute(routePath: string, context?: StepManifestContext): StepRegistryEntry[] {
  if (!routePath) return [];
  const manifest = getStepManifestForRoute(routePath, context);
  if (!manifest) return [];
  return manifest.nodes.map((node) => ({
    stepKey: node.id,
    label: node.label,
    kind: node.kind,
  }));
}
