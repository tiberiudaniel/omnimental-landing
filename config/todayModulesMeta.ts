import { getModuleSequenceForCluster } from "@/config/dailyPath";
import type { AdaptiveCluster } from "@/types/dailyPath";

const FALLBACK_STARTER_MODULE = "clarity_01_illusion_of_clarity";

const EXTRA_DEEP_MODULES = new Set<string>([
  "clarity_single_intent",
  "clarity_one_important_thing",
  "energy_recovery",
  "energy_congruence",
  "emotional_flex_pause",
  "emotional_flex_naming",
]);

function getModuleOrdinal(moduleId: string): number | null {
  const match = moduleId.match(/_(\d{2})_/);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

export function requiresDeepModule(moduleId: string | null | undefined): boolean {
  if (!moduleId) return false;
  if (EXTRA_DEEP_MODULES.has(moduleId)) return true;
  const ordinal = getModuleOrdinal(moduleId);
  return typeof ordinal === "number" && ordinal >= 4;
}

export function getStarterModuleForCluster(cluster?: AdaptiveCluster | null): string {
  if (cluster) {
    const sequence = getModuleSequenceForCluster(cluster);
    const candidate = sequence.find((moduleKey) => !requiresDeepModule(moduleKey));
    if (candidate) {
      return candidate;
    }
  }
  return FALLBACK_STARTER_MODULE;
}

export function resolveStarterModule(
  preferredKey: string | null | undefined,
  cluster?: AdaptiveCluster | null,
): string {
  if (preferredKey && !requiresDeepModule(preferredKey)) {
    return preferredKey;
  }
  return getStarterModuleForCluster(cluster);
}
