import durationBenchmarks from "@/generated/duration-benchmarks.json";

export type DurationBenchmarkRecord = {
  avgSeconds: number;
  minSeconds: number;
  sampleSize: number;
  updatedAt: string;
};

const BENCHMARKS = durationBenchmarks as Record<string, DurationBenchmarkRecord>;

export function getDurationBenchmark(moduleId: string | null | undefined): DurationBenchmarkRecord | null {
  if (!moduleId) return null;
  const entry = BENCHMARKS[moduleId];
  if (!entry) return null;
  if (!Number.isFinite(entry.avgSeconds) || entry.avgSeconds <= 0) return null;
  if (!Number.isFinite(entry.sampleSize) || entry.sampleSize <= 0) return null;
  return entry;
}

export function getBenchmarkMinutes(moduleId: string | null | undefined): number | null {
  const entry = getDurationBenchmark(moduleId);
  if (!entry) return null;
  const minutes = entry.avgSeconds / 60;
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return minutes;
}

export function getBenchmarkMinMinutes(moduleId: string | null | undefined): number | null {
  const entry = getDurationBenchmark(moduleId);
  if (!entry) return null;
  const minutes = entry.minSeconds / 60;
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return minutes;
}
