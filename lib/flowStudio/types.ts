"use client";

import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from "reactflow";
import type { CopyFields } from "@/lib/useCopy";

export type LabelMap = { ro?: string; en?: string };

export type FlowScreenCard = {
  id: string;
  label: string;
  actionTag?: string;
};

export type FlowScreen = {
  id: string;
  label: string;
  description?: string;
  tags?: string[];
  copyKey?: string;
  flags?: string[];
  cards?: FlowScreenCard[];
};

export type FlowNodeInternalStep = FlowScreen;

export type RouteDoc = {
  id: string;
  routePath: string;
  group: string;
  filePath: string;
};

export type FlowNodeKind = "route" | "stepScreen";

export type StepScreenConfig = {
  hostRoutePath: string;
  stepKey: string;
  label?: string;
  queryPreset?: Record<string, string>;
};

export type FlowNode = {
  id: string;
  kind?: FlowNodeKind;
  routeId?: string;
  routePath?: string;
  label?: LabelMap;
  x: number;
  y: number;
  tags?: string[];
  chunkId?: string;
  portal?: FlowNodePortalConfig | null;
  stepScreen?: StepScreenConfig | null;
  internalSteps?: FlowNodeInternalStep[] | null;
};

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  label?: LabelMap;
  conditionTag?: string;
  eventName?: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  color?: string;
  command?: string;
};

export type FlowOverlayStep = {
  nodeId: string;
  gateTag?: string | null;
  tags?: string[];
  urlPattern?: string | null;
  assertTestId?: string | null;
  clickTestId?: string | null;
};

export type FlowOverlayEdge = {
  fromNodeId: string;
  toNodeId: string;
};

export type FlowOverlay = {
  id: string;
  name: string;
  description?: string;
  status?: "draft" | "active" | "deprecated" | "archived";
  entryRoutePath?: string;
  exitRoutePath?: string;
  steps: FlowOverlayStep[];
  edges?: FlowOverlayEdge[];
};

export type FlowDoc = {
  flow?: {
    id?: string | null;
    name?: string | null;
    version?: number | null;
    updatedAt?: string | null;
  };
  name: string;
  description?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  chunks?: FlowChunk[];
  comments?: FlowComment[];
  overlays?: FlowOverlay[];
  stepOrderOverrides?: Record<string, string[]>;
  version?: number;
  updatedAt?: unknown;
  updatedAtMs?: number;
  createdAt?: unknown;
};

export type FlowNodeData = {
  kind: FlowNodeKind;
  routeId?: string;
  routePath: string;
  filePath: string;
  screenId: string;
  labelOverrides?: LabelMap;
  tags?: string[];
  routeMismatch?: boolean;
  chunkId?: string | null;
  portal?: FlowNodePortalConfig | null;
  stepScreen?: StepScreenConfig | null;
  internalSteps?: FlowNodeInternalStep[] | null;
};

export type FlowEdgeData = {
  labelOverrides?: LabelMap;
  conditionTag?: string;
  eventName?: string;
  color?: string;
  command?: string;
  renderOffset?: number;
  runtime?: {
    onLabelSelect?: (edgeId: string) => void;
  };
};

export type StepNodeRenderData = {
  type: "step";
  stepId: string;
  label: string;
  parentNodeId: string;
};

export type FlowReactNode = ReactFlowNode<FlowNodeData>;
export type FlowReactEdge = ReactFlowEdge<FlowEdgeData>;

export type FlowNodePortalConfig = {
  targetType: "route" | "node";
  targetNodeId?: string;
  targetRouteId?: string;
  targetRoutePath?: string;
  label?: string;
};

export type CopyOverrideDoc = {
  ro?: CopyFields;
  en?: CopyFields;
  updatedAt?: unknown;
};

export type FlowIssue = {
  id: string;
  message: string;
  severity: "info" | "warning";
  type?: string;
  targetType?: "node" | "edge" | "stepNode" | "chunk" | "overlay";
  targetId?: string;
};

export type FlowChunkText = {
  ro: string;
  en?: string;
};

export type FlowChunkMeta = {
  tierMin?: number;
  menuState?: "OFF" | "MINIMAL" | "CORE" | "EXPANDED";
  description?: FlowChunkText;
  target?: FlowChunkText;
  challenge?: FlowChunkText;
  reward?: FlowChunkText;
  proof?: FlowChunkText;
  exitGate?: FlowChunkText;
  routeGroups?: string[];
  routePrefixes?: string[];
} & Record<string, unknown>;

export type FlowChunk = {
  id: string;
  title: string;
  order: number;
  color?: string;
  collapsedByDefault?: boolean;
  meta?: FlowChunkMeta;
};

export type FlowComment = {
  id: string;
  targetType: "node" | "chunk";
  targetId: string;
  author?: string | null;
  message: string;
  createdAt: string;
  resolved?: boolean;
};
