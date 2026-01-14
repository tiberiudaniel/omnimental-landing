import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";
import type { LessonId, ModuleId, WorldId } from "@/lib/taxonomy/types";
import type { RecallBlock } from "@/lib/initiations/buildRecallBlock";

const STORAGE_KEY = "omnimental:todayPlanV2";
const SCHEMA_VERSION = "initiation_v2_blocks";

export type StoredInitiationBlock =
  | { kind: "core_lesson"; lessonId: LessonId }
  | { kind: "elective_practice"; lessonId: LessonId | null; reason?: string | null }
  | { kind: "recall"; prompt: RecallBlock }
  | { kind: string; lessonId?: LessonId | null; prompt?: RecallBlock | null };

export type StoredTodayPlan = {
  arcId: string | null;
  arcDayIndex?: number | null;
  arcLengthDays?: number | null;
  moduleId?: string | null;
  traitPrimary?: CatAxisId;
  traitSecondary?: CatAxisId[];
  canonDomain?: CanonDomainId;
  initiationModuleId?: ModuleId | null;
  initiationLessonIds?: LessonId[];
  initiationBlocks?: StoredInitiationBlock[];
  initiationRecallPromptId?: string | null;
  initiationElectiveReason?: string | null;
  todayKey: string;
  runId: string | null;
  mindpacingTag?: string | null;
  fallbackReason?: string | undefined;
  worldId: WorldId;
  mode: string;
};

type StoredTodayPlanPayload = StoredTodayPlan & { schemaVersion: string };

function parsePayload(value: string | null): StoredTodayPlan | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StoredTodayPlanPayload;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveTodayPlan(plan: StoredTodayPlan): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredTodayPlanPayload = { ...plan, schemaVersion: SCHEMA_VERSION };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function readTodayPlan(): StoredTodayPlan | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  const parsed = parsePayload(raw);
  if (!parsed && raw) {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return parsed;
}

export function clearTodayPlan(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
