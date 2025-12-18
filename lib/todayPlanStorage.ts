import type { CanonDomainId, CatAxisId } from "@/lib/profileEngine";

const STORAGE_KEY = "omnimental:todayPlanV1";

export type StoredTodayPlan = {
  arcId: string | null;
  arcDayIndex?: number | null;
  arcLengthDays?: number | null;
  moduleId?: string | null;
  traitPrimary?: CatAxisId;
  traitSecondary?: CatAxisId[];
  canonDomain?: CanonDomainId;
};

export function saveTodayPlan(plan: StoredTodayPlan): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // ignore
  }
}

export function readTodayPlan(): StoredTodayPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTodayPlan;
  } catch {
    return null;
  }
}

export function clearTodayPlan(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
