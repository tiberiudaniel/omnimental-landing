import type { AdaptiveCluster, DailyPathLanguage, DailyPathMode } from "@/types/dailyPath";
import { getCurrentDateKey, markDailyPracticeCompleted, markDailyPracticeStart } from "@/lib/dailyPracticeStore";

export type DailyPathEventType = "start" | "node_completed" | "completed";

export interface DailyPathEventPayload {
  configId: string;
  cluster: AdaptiveCluster;
  mode: DailyPathMode;
  lang: DailyPathLanguage;
  event: DailyPathEventType;
  nodeId?: string;
  xpDelta?: number;
}

const SHOULD_DEBUG_EVENTS = (() => {
  const flag = (process.env.NEXT_PUBLIC_DEBUG_DAILY_PATH_EVENTS || "").toLowerCase();
  return flag === "true" || flag === "1";
})();

export async function recordDailyPathEvent(userId: string | null, payload: DailyPathEventPayload) {
  if (SHOULD_DEBUG_EVENTS) {
    console.log("[dailyPath event]", { userId, ...payload });
  }
  if (!userId) return;
  const dateKey = getCurrentDateKey();
  if (payload.event === "start") {
    await markDailyPracticeStart({
      userId,
      configId: payload.configId,
      cluster: payload.cluster,
      mode: payload.mode,
      lang: payload.lang,
      date: dateKey,
    });
    return;
  }
  if (payload.event === "completed") {
    await markDailyPracticeCompleted({
      userId,
      configId: payload.configId,
      cluster: payload.cluster,
      mode: payload.mode,
      lang: payload.lang,
      xpEarned: payload.xpDelta ?? 0,
      date: dateKey,
    });
  }
}
