import type { CatProfileDoc } from "@/types/cat";
import type { AdaptiveCluster } from "@/types/dailyPath";
import type { CatAxisId } from "@/config/catEngine";

const EMOTIONAL_AXES: CatAxisId[] = ["flex", "emo_stab", "recalib"];
const FOCUS_AXES: CatAxisId[] = ["focus", "energy", "adapt_conf"];

export function deriveAdaptiveClusterFromCat(
  profile: CatProfileDoc | null | undefined,
): { cluster: AdaptiveCluster | null; primaryAxis: CatAxisId | null } {
  if (!profile || !profile.axisScores) {
    return { cluster: null, primaryAxis: null };
  }
  const entries = Object.entries(profile.axisScores) as [CatAxisId, number][];
  if (!entries.length) {
    return { cluster: null, primaryAxis: null };
  }
  const weakest = entries.reduce((min, current) => (current[1] < min[1] ? current : min));
  return { primaryAxis: weakest[0], cluster: mapAxisToCluster(weakest[0]) };
}

export function mapAxisToCluster(axisId: CatAxisId): AdaptiveCluster {
  if (axisId === "clarity") return "clarity_cluster";
  if (EMOTIONAL_AXES.includes(axisId)) return "emotional_flex_cluster";
  if (FOCUS_AXES.includes(axisId)) return "focus_energy_cluster";
  return "focus_energy_cluster";
}
