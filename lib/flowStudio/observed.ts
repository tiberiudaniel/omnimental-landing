"use client";

import { collection, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { flowObservedMap, type FlowObservedMapping, type NodeMetric } from "@/config/flowObservedMap";

const db = getDb();

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
  const key = `${sourceRoute}→${targetRoute}`;
  if (!store[key]) {
    store[key] = {};
  }
  store[key].count = (store[key].count ?? 0) + 1;
}

export async function loadObservedSnapshot(params: { windowKey: ObservedWindowKey; segment: ObservedSegmentKey }) {
  const { windowKey, segment } = params;
  const since = Timestamp.fromMillis(Date.now() - WINDOW_TO_MS[windowKey]);
  const conditions = [where("ts", ">=", since), orderBy("ts", "desc"), limit(200)];
  if (segment !== "all") {
    conditions.splice(1, 0, where("isPremium", "==", segment === "premium"));
  }
  const snapshot = await getDocs(query(collection(db, "telemetryEvents"), ...conditions));
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
