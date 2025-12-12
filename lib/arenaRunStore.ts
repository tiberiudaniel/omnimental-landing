import type { ArenaId } from "@/config/arenaModules/v1/types";

const STORAGE_KEY = "omnimental_arena_runs_v1";
const MAX_RECORDS = 500;

export type ArenaRunRecord = {
  id: string;
  arenaId: ArenaId;
  moduleId: string;
  drillId: string;
  duration: "30s" | "90s" | "3m";
  startedAt: number;
  completedAt: number;
  dayKey: string;
  totalTrials: number;
  correctCount: number;
  incorrectCount: number;
  timeoutCount: number;
  accuracy: number;
  meanRTms: number | null;
  score: number;
  interpretation: string;
};

export interface ArenaRunFilters {
  arenaId?: ArenaId;
  moduleId?: string;
  drillId?: string;
  dayKey?: string;
  limit?: number;
}

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function readRecords(): ArenaRunRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error("Failed to read arena run records", error);
    return [];
  }
}

function writeRecords(records: ArenaRunRecord[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Failed to persist arena run records", error);
  }
}

export function saveArenaRun(record: ArenaRunRecord) {
  if (!isBrowser()) return;
  const existing = readRecords();
  const updated = [record, ...existing].slice(0, MAX_RECORDS);
  writeRecords(updated);
}

export function getArenaRuns(filters: ArenaRunFilters = {}): ArenaRunRecord[] {
  const records = readRecords();
  const filtered = records.filter((record) => {
    if (filters.arenaId && record.arenaId !== filters.arenaId) return false;
    if (filters.moduleId && record.moduleId !== filters.moduleId) return false;
    if (filters.drillId && record.drillId !== filters.drillId) return false;
    if (filters.dayKey && record.dayKey !== filters.dayKey) return false;
    return true;
  });
  filtered.sort((a, b) => b.completedAt - a.completedAt);
  return typeof filters.limit === "number" ? filtered.slice(0, filters.limit) : filtered;
}

export function toDayKeyLocal(ts: number): string {
  const date = new Date(ts);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
