// /lib/progressAdapter.ts
// Converts raw firestore progressFacts into the dashboard-ready structure.

import type { InsightTheme } from "./insights";

export interface ProgressIndex {
  clarity: number;
  calm: number;
  energy: number;
}

export interface DashboardStrengths {
  strengths: string[];
  weaknesses: string[];
  dominantTheme: InsightTheme;
}

export interface ProgressData {
  indices: ProgressIndex;
  strengths: DashboardStrengths;
  reflectionCount: number;
  breathingCount: number;
  drillsCount: number;
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function toPercent(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

type FactsShape = {
  evaluation?: { scores?: Record<string, unknown> };
  recommendation?: { dimensionScores?: Record<string, unknown> };
  practiceSessions?: Array<{ type?: unknown }>;
  reflectionsCount?: unknown;
  breathingCount?: unknown;
  drillsCount?: unknown;
};

export function adaptProgressFacts(facts: unknown): ProgressData {
  if (!facts || typeof facts !== "object") {
    return {
      indices: { clarity: 30, calm: 30, energy: 30 },
      strengths: { strengths: [], weaknesses: [], dominantTheme: "Calm" },
      reflectionCount: 0,
      breathingCount: 0,
      drillsCount: 0,
    };
  }

  const f = (facts as FactsShape) || {};
  const evalObj: Record<string, unknown> =
    f.evaluation && typeof f.evaluation.scores === "object" && f.evaluation.scores ? f.evaluation.scores : {};

  // Prefer dimension scores (0..5 scale). Map focus -> clarity.
  type DimsPartial = { focus?: unknown; calm?: unknown; energy?: unknown } | undefined;
  const dims: DimsPartial = (f.recommendation?.dimensionScores as DimsPartial) ?? undefined;
  let clarity = 0;
  let calm = 0;
  let energy = 0;
  if (dims) {
    const dClarity = num(dims?.focus, NaN);
    const dCalm = num(dims?.calm, NaN);
    const dEnergy = num(dims?.energy, NaN);
    if (Number.isFinite(dClarity) || Number.isFinite(dCalm) || Number.isFinite(dEnergy)) {
      clarity = toPercent(clamp01(dClarity / 5) * 100);
      calm = toPercent(clamp01(dCalm / 5) * 100);
      energy = toPercent(clamp01(dEnergy / 5) * 100);
    }
  }
  // Fallback to evaluation totals. Normalize using typical ranges.
  if (clarity === 0 && calm === 0 && energy === 0) {
    // If explicit [0..1] values exist, use them
    const get = (k: string) => (evalObj as Record<string, unknown>)[k];
    const cDirect = num(get("clarity"), NaN);
    const calmDirect = num(get("calm"), NaN);
    const eDirect = num(get("energy"), NaN);
    const fromDirect = Number.isFinite(cDirect) || Number.isFinite(calmDirect) || Number.isFinite(eDirect);
    if (fromDirect) {
      clarity = toPercent(clamp01(cDirect) * 100);
      calm = toPercent(clamp01(calmDirect) * 100);
      energy = toPercent(clamp01(eDirect) * 100);
    } else {
      const gse = num(get("gseTotal") ?? get("gse"), 0); // 0..40
      const maas = num(get("maasTotal") ?? get("maas"), 0); // 0..90
      const svs = num(get("svs") ?? get("svsTotal"), 0); // 0..24
      clarity = toPercent(clamp01(gse / 40) * 100);
      calm = toPercent(clamp01(maas / 90) * 100);
      energy = toPercent(clamp01(svs / 24) * 100);
    }
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (clarity > 60) strengths.push("Claritate mentală");
  else weaknesses.push("Claritate scăzută");

  if (calm > 60) strengths.push("Calm emoțional");
  else weaknesses.push("Calm redus");

  if (energy > 60) strengths.push("Vitalitate");
  else weaknesses.push("Energy scăzută");

  const dominantTheme: InsightTheme =
    clarity >= calm && clarity >= energy
      ? "Clarity"
      : calm >= clarity && calm >= energy
      ? "Calm"
      : "Energy";

  // Activity counts: prefer explicit counters, else infer from practiceSessions
  const explicitRef = num(f.reflectionsCount ?? 0);
  const explicitBreath = num(f.breathingCount ?? 0);
  const explicitDrill = num(f.drillsCount ?? 0);
  let reflectionCount = explicitRef;
  let breathingCount = explicitBreath;
  let drillsCount = explicitDrill;
  if (!(explicitRef || explicitBreath || explicitDrill)) {
    const sessions = Array.isArray(f.practiceSessions) ? f.practiceSessions : [];
    reflectionCount = sessions.filter((s) => (s?.type as string) === "reflection").length;
    breathingCount = sessions.filter((s) => (s?.type as string) === "breathing").length;
    drillsCount = sessions.filter((s) => (s?.type as string) === "drill").length;
  }

  return {
    indices: { clarity, calm, energy },
    strengths: { strengths, weaknesses, dominantTheme },
    reflectionCount,
    breathingCount,
    drillsCount,
  };
}
