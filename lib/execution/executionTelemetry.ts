"use client";

import { track } from "@/lib/telemetry/track";
import type { DailyPathConfig, DailyPathNodeConfig } from "@/types/dailyPath";

type BasePayload = {
  userId: string | null;
  moduleKey: string | null | undefined;
  cluster: DailyPathConfig["cluster"];
  mode: DailyPathConfig["mode"];
  lang: DailyPathConfig["lang"];
  skillLabel?: string | null;
  nodeId: string;
  nodeKind: DailyPathNodeConfig["kind"];
  nodeTitle: string;
  xp?: number;
};

export function logExecutionIntent(payload: BasePayload & { intentTimestamp: number }) {
  track("execution_intent_logged", {
    ...payload,
  });
}

export function logExecutionStart(
  payload: BasePayload & { startTimestamp: number; latencyMs?: number },
) {
  track("execution_action_started", {
    ...payload,
  });
}

export function logExecutionCompletion(
  payload: BasePayload & { completeTimestamp: number; durationMs?: number },
) {
  track("execution_action_completed", {
    ...payload,
  });
}

export function logExecutionAbandon(
  payload: BasePayload & { abandonTimestamp: number; elapsedMs?: number },
) {
  track("execution_action_abandoned", {
    ...payload,
  });
}
