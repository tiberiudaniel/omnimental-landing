import type { ArenaId } from "@/config/arenaModules/v1/types";
import { getTodayKey } from "@/lib/time/todayKey";

const STORAGE_KEY = "omnimental_arena_runs_v1";
const MAX_RECORDS = 500;

export type ArenaRunRecord = {
  id: string;
  arenaId: ArenaId;
  moduleId: string;
  drillId: string;
  duration: "30s" | "90s" | "3m";
  durationSec?: number;
  startedAt: number;
  completedAt: number;
  dayKey: string;
  selfReport?: number | null;
  totalTrials?: number;
  correctCount?: number;
  incorrectCount?: number;
  timeoutCount?: number;
  accuracy?: number;
  meanRTms?: number | null;
  score?: number;
  interpretation?: string;
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

export function updateArenaRun(recordId: string, patch: Partial<ArenaRunRecord>) {
  if (!isBrowser()) return;
  const records = readRecords();
  const updated = records.map((record) =>
    record.id === recordId ? { ...record, ...patch } : record,
  );
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

/** @deprecated Use getTodayKey(new Date(ts)) for Canary-consistent keys. */
export function toDayKeyLocal(ts: number): string {
  return getTodayKey(new Date(ts));
}
