import type { ProgressFact } from "@/lib/progressFacts";
import type { FireTs } from "@/lib/progressFacts/types";

export type SessionEvent = {
  type: string;
  at: Date;
  label?: string | null;
  mode?: string | null;
};

export type SessionSummary = {
  events: SessionEvent[];
  durationMs: number;
  modules: string[];
  unlocks: string[];
  startAt: Date | null;
  endAt: Date | null;
};

const DEFAULT_SUMMARY: SessionSummary = {
  events: [],
  durationMs: 0,
  modules: [],
  unlocks: [],
  startAt: null,
  endAt: null,
};

const MODULE_LABELS: Record<string, string> = {
  mindpacing_completed: "MindPacing",
  vocab_completed: "Vocab",
  today_run_completed: "Today Run",
};

const UNLOCK_LABELS: Record<string, string> = {
  vocab_unlocked: "Vocabulary unlocked",
  arc_unlocked: "New arc unlocked",
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as FireTs).toDate === "function") {
    try {
      return (value as FireTs).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

export function getRecentSessionEvents(progressFacts: ProgressFact | null, windowMinutes = 30): SessionEvent[] {
  const source = progressFacts?.dailyRunner?.events;
  if (!Array.isArray(source) || !source.length) return [];
  const now = Date.now();
  const cutoff = now - windowMinutes * 60 * 1000;
  const mapped = source.reduce<SessionEvent[]>((acc, event) => {
    const at = toDate(event.at);
    if (!at) return acc;
    if (at.getTime() < cutoff) return acc;
    acc.push({
      type: String(event.type || "unknown"),
      at,
      label: (event.label as string | null) ?? null,
      mode: (event.mode as string | null) ?? null,
    });
    return acc;
  }, []);
  return mapped.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function summarizeSessionEvents(events: SessionEvent[]): SessionSummary {
  if (!events.length) return { ...DEFAULT_SUMMARY };
  const startAt = events[0].at;
  const endAt = events[events.length - 1].at;
  const modulesSeen: string[] = [];
  const moduleSet = new Set<string>();
  const unlocks: string[] = [];
  events.forEach((event) => {
    const modLabel = MODULE_LABELS[event.type];
    if (modLabel && !moduleSet.has(modLabel)) {
      moduleSet.add(modLabel);
      modulesSeen.push(modLabel);
    }
    const unlockLabel = UNLOCK_LABELS[event.type];
    if (unlockLabel) {
      unlocks.push(unlockLabel);
    }
  });
  return {
    events,
    durationMs: Math.max(0, endAt.getTime() - startAt.getTime()),
    modules: modulesSeen,
    unlocks,
    startAt,
    endAt,
  };
}
