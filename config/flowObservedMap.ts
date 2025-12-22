"use client";

export type NodeMetric = "views" | "completions";
export type EdgeMetric = "count";

export type NodeObservedMapping = {
  type: "node";
  metric: NodeMetric;
  routeField?: string;
};

export type EdgeObservedMapping = {
  type: "edge";
  metric: EdgeMetric;
  sourceField?: string;
  targetField?: string;
};

export type FlowObservedMapping = NodeObservedMapping | EdgeObservedMapping;

export const flowObservedMap: Record<string, FlowObservedMapping> = {
  screen_view: {
    type: "node",
    metric: "views",
    routeField: "routePath",
  },
  session_completed: {
    type: "node",
    metric: "completions",
    routeField: "payload.routePath",
  },
  flow_edge_transition: {
    type: "edge",
    metric: "count",
    sourceField: "payload.fromRoute",
    targetField: "payload.toRoute",
  },
};
