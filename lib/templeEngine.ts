"use client";

import type { UserProfileSnapshot } from "@/lib/profileEngine";
import type { TempleConfig } from "@/config/temples";
import { getArcById } from "@/config/arcs";

export function getTempleProgress(user: UserProfileSnapshot | null, temple: TempleConfig) {
  const arcsTotal = temple.arcIds.length;
  const isActive = user?.activeArcId && temple.arcIds.includes(user.activeArcId);
  const activeArc = isActive ? getArcById(user!.activeArcId as string) : null;
  return {
    arcsTotal,
    activeArcId: isActive ? user?.activeArcId ?? null : null,
    activeArcLabel: activeArc?.name ?? null,
    activeArcDayIndex: isActive ? user?.activeArcDayIndex ?? 0 : null,
    arcLengthDays: isActive ? activeArc?.lengthDays ?? null : null,
  };
}
