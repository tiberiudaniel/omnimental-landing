"use client";

import type { CatAxisId } from "@/lib/profileEngine";

export const CAT_LITE_CORE_AXES: CatAxisId[] = ["clarity", "focus", "energy", "emotionalStability"];

export const CAT_LITE_EXTENDED_AXES: CatAxisId[] = ["recalibration", "flexibility", "adaptiveConfidence"];

export function hasExtendedCatAxes(profile: { axes: Record<CatAxisId, { score: number | null }> } | null | undefined) {
  if (!profile) return false;
  return CAT_LITE_EXTENDED_AXES.every((axis) => typeof profile.axes[axis]?.score === "number");
}
