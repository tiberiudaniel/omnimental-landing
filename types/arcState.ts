import type { ArcDomain, ArcLevel } from "@/types/arcs";

export type ArcStatus = "active" | "completed";

export interface ArcProgress {
  xp: number;
  daysCompleted: number;
  lastDayCompleted?: string;
}

export interface CurrentArcState {
  id: string;
  level: ArcLevel;
  domain: ArcDomain;
  startedAt: string;
  status: ArcStatus;
}

export interface ArcState {
  current?: CurrentArcState;
  progress?: Record<string, ArcProgress>;
}
