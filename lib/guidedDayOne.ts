import type { CatAxisId } from "@/lib/profileEngine";

export type GuidedClusterParam = "clarity" | "energy" | "emotional_flex";

const AXIS_TO_CLUSTER: Record<CatAxisId, GuidedClusterParam> = {
  clarity: "clarity",
  focus: "energy",
  energy: "energy",
  adaptiveConfidence: "energy",
  emotionalStability: "emotional_flex",
  flexibility: "emotional_flex",
  recalibration: "clarity",
};

export function getGuidedClusterParam(axis: CatAxisId | null | undefined): GuidedClusterParam | null {
  if (!axis) return null;
  return AXIS_TO_CLUSTER[axis] ?? null;
}

export function isGuidedDayOneLane(source?: string | null, lane?: string | null): boolean {
  const normalizedSource = (source ?? "").toLowerCase();
  const normalizedLane = (lane ?? "").toLowerCase();
  return normalizedLane === "guided_day1" || normalizedSource === "guided_day1";
}
