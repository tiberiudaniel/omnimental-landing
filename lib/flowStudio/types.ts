"use client";

import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from "reactflow";
import type { CopyFields } from "@/lib/useCopy";

export type LabelMap = { ro?: string; en?: string };

export type RouteDoc = {
  id: string;
  routePath: string;
  group: string;
  filePath: string;
};

export type FlowNode = {
  id: string;
  routeId: string;
  routePath?: string;
  label?: LabelMap;
  x: number;
  y: number;
  tags?: string[];
  chunkId?: string;
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

export type FlowDoc = {
  name: string;
  description?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  chunks?: FlowChunk[];
  comments?: FlowComment[];
  version?: number;
  updatedAt?: unknown;
  createdAt?: unknown;
};

export type FlowNodeData = {
  routeId: string;
  routePath: string;
  filePath: string;
  screenId: string;
  labelOverrides?: LabelMap;
  tags?: string[];
  routeMismatch?: boolean;
  chunkId?: string | null;
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

export type CopyOverrideDoc = {
  ro?: CopyFields;
  en?: CopyFields;
  updatedAt?: unknown;
};

export type FlowIssue = {
  id: string;
  message: string;
  severity: "info" | "warning";
  targetType?: "node" | "edge" | "stepNode";
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
