"use client";

import type { ArenaTaskConfig } from "@/config/arenas";
import type { KpiEvent, TelemetrySessionType } from "@/lib/telemetry";
import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";

export type ArenaRun = {
  id: string;
  arenaId: string;
  indicatorId: string;
  canonDomain: CanonDomainId;
  catAxes: CatAxisId[];
  scoreRaw: number;
  scoreNormalized: number;
  timestamp: string;
};

export function buildArenaKpiEvent(
  arena: ArenaTaskConfig,
  userId: string,
  scoreRaw: number,
  source: TelemetrySessionType,
  maybeSelfReport?: number,
): KpiEvent {
  const clamped = Math.max(0, Math.min(100, scoreRaw));
  return {
    userId,
    indicatorId: arena.indicatorId,
    source,
    canonDomain: arena.canonDomain,
    catAxes: arena.catAxes,
    preValue: null,
    postValue: clamped,
    delta: clamped,
    selfReport: maybeSelfReport ?? null,
    timestamp: new Date().toISOString(),
  };
}
