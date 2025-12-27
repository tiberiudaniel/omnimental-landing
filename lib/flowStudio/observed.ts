"use client";

import { collection, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { flowObservedMap, type FlowObservedMapping, type NodeMetric } from "@/config/flowObservedMap";

const FLOW_STUDIO_DIAG_ENABLED = process.env.NEXT_PUBLIC_FLOW_STUDIO_DIAG === "1";
const OBSERVED_RATE_WINDOW_MS = 60_000;
const OBSERVED_RATE_LIMIT_PER_MIN = 20;

const db = getDb();
const inflightLoads = new Map<string, Promise<ObservedSnapshot>>();
const observedRateState = {
  windowStart: Date.now(),
  fetchesInWindow: 0,
};

export type ObservedWindowKey = "1h" | "6h" | "24h";
export type ObservedSegmentKey = "all" | "premium" | "free";

const WINDOW_TO_MS: Record<ObservedWindowKey, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

export const OBSERVED_WINDOWS: Array<{ key: ObservedWindowKey; label: string }> = [
  { key: "1h", label: "1h" },
  { key: "6h", label: "6h" },
  { key: "24h", label: "24h" },
];

export const OBSERVED_SEGMENTS: Array<{ key: ObservedSegmentKey; label: string }> = [
  { key: "all", label: "Toți" },
  { key: "premium", label: "Premium" },
  { key: "free", label: "Free" },
];

export type ObservedNodeStats = Partial<Record<NodeMetric, number>>;
export type ObservedEdgeStats = {
  count?: number;
};

export type ObservedEvent = {
  id: string;
  event: string;
  userId?: string;
  isPremium?: boolean | null;
  accessTier?: string | null;
  routePath?: string | null;
  sourceRoute?: string | null;
  targetRoute?: string | null;
  ts: Date;
  payload?: Record<string, unknown> | null;
};

export type ObservedSnapshot = {
  nodeStats: Record<string, ObservedNodeStats>;
  edgeStats: Record<string, ObservedEdgeStats>;
  events: ObservedEvent[];
};

function getFieldValue(source: Record<string, unknown> | null | undefined, path?: string) {
  if (!path || !source) return undefined;
  const segments = path.split(".");
  let current: unknown = source;
  for (const segment of segments) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function resolvePath(event: ObservedEvent, path?: string) {
  if (!path) return undefined;
  if (path.startsWith("payload.")) {
    return getFieldValue(event.payload, path.replace(/^payload\./, ""));
  }
  return getFieldValue(event as unknown as Record<string, unknown>, path);
}

function bumpNodeMetric(store: Record<string, ObservedNodeStats>, routePath: string, metric: NodeMetric) {
  if (!store[routePath]) {
    store[routePath] = {};
  }
  store[routePath][metric] = (store[routePath][metric] ?? 0) + 1;
}

function bumpEdgeMetric(store: Record<string, ObservedEdgeStats>, sourceRoute: string, targetRoute: string) {
  const key = `${sourceRoute}->${targetRoute}`;
  if (!store[key]) {
    store[key] = {};
  }
  store[key].count = (store[key].count ?? 0) + 1;
}

function recordObservedRate() {
  if (!FLOW_STUDIO_DIAG_ENABLED) return;
  const now = Date.now();
  if (now - observedRateState.windowStart >= OBSERVED_RATE_WINDOW_MS) {
    observedRateState.windowStart = now;
    observedRateState.fetchesInWindow = 0;
  }
  observedRateState.fetchesInWindow += 1;
  const elapsed = Math.max(now - observedRateState.windowStart, 1);
  const ratePerMinute = (observedRateState.fetchesInWindow / elapsed) * 60_000;
  if (ratePerMinute > OBSERVED_RATE_LIMIT_PER_MIN) {
    console.warn(`[FlowStudioDiag] Observed fetch rate high: ${ratePerMinute.toFixed(1)}/min`);
    console.trace();
  }
}

export async function loadObservedSnapshot(params: { windowKey: ObservedWindowKey; segment: ObservedSegmentKey }) {
  const { windowKey, segment } = params;
  if (FLOW_STUDIO_DIAG_ENABLED) {
    console.count("Observed:load");
  }
  const key = `${windowKey}|${segment}`;
  const existing = inflightLoads.get(key);
  if (existing) {
    return existing;
  }
  const start = Date.now();
  const pending = getDocs(buildObservedQuery(windowKey, segment))
    .then((snapshot) => buildObservedSnapshot(snapshot))
    .then((result) => {
      if (FLOW_STUDIO_DIAG_ENABLED) {
        const durationMs = Date.now() - start;
        console.log("[FlowStudioDiag] Observed load complete", {
          windowKey,
          segment,
          durationMs,
          nodeCount: Object.keys(result.nodeStats).length,
          edgeCount: Object.keys(result.edgeStats).length,
          eventsCount: result.events.length,
        });
        recordObservedRate();
      }
      return result;
    })
    .catch((error) => {
      if (FLOW_STUDIO_DIAG_ENABLED) {
        console.warn("[FlowStudioDiag] Observed load failed", { windowKey, segment, error });
      }
      throw error;
    })
    .finally(() => {
      inflightLoads.delete(key);
    });
  inflightLoads.set(key, pending);
  return pending;
}

function buildObservedQuery(windowKey: ObservedWindowKey, segment: ObservedSegmentKey) {
  const since = Timestamp.fromMillis(Date.now() - WINDOW_TO_MS[windowKey]);
  const conditions = [where("ts", ">=", since), orderBy("ts", "desc"), limit(200)];
  if (segment !== "all") {
    conditions.splice(1, 0, where("isPremium", "==", segment === "premium"));
  }
  return query(collection(db, "telemetryEvents"), ...conditions);
}

function buildObservedSnapshot(snapshot: Awaited<ReturnType<typeof getDocs>>) {
  const nodeStats: Record<string, ObservedNodeStats> = {};
  const edgeStats: Record<string, ObservedEdgeStats> = {};
  const events: ObservedEvent[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const eventName = (data.event as string) ?? "unknown";
    const telemetryEvent: ObservedEvent = {
      id: doc.id,
      event: eventName,
      userId: (data.userId as string) ?? undefined,
      isPremium: (data.isPremium as boolean | null) ?? null,
      accessTier: (data.accessTier as string | null) ?? null,
      routePath: (data.routePath as string | null) ?? null,
      ts: (data.ts instanceof Timestamp ? data.ts.toDate() : new Date()),
      payload: (data.payload as Record<string, unknown>) ?? null,
    };
    events.push(telemetryEvent);

    const mapping = flowObservedMap[eventName] as FlowObservedMapping | undefined;
    if (!mapping) return;
    if (mapping.type === "node") {
      const routeField = mapping.routeField ?? "routePath";
      const resolvedRoute = (routeField === "routePath" ? telemetryEvent.routePath : (resolvePath(telemetryEvent, routeField) as string | undefined)) ?? null;
      if (typeof resolvedRoute === "string" && resolvedRoute.length) {
        telemetryEvent.sourceRoute = resolvedRoute;
        bumpNodeMetric(nodeStats, resolvedRoute, mapping.metric);
      }
    } else if (mapping.type === "edge") {
      const sourceRoute = resolvePath(telemetryEvent, mapping.sourceField ?? "payload.fromRoute") as string | undefined;
      const targetRoute = resolvePath(telemetryEvent, mapping.targetField ?? "payload.toRoute") as string | undefined;
      if (sourceRoute && targetRoute) {
        telemetryEvent.sourceRoute = sourceRoute;
        telemetryEvent.targetRoute = targetRoute;
        bumpEdgeMetric(edgeStats, sourceRoute, targetRoute);
      }
    }
  });

  return {
    nodeStats,
    edgeStats,
    events,
  } as ObservedSnapshot;
}
