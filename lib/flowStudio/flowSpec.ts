import type { XYPosition } from "reactflow";
import type {
  FlowChunk,
  FlowComment,
  FlowNodeKind,
  FlowNodePortalConfig,
  FlowNodeInternalStep,
  FlowOverlay,
  LabelMap,
  StepScreenConfig,
} from "@/lib/flowStudio/types";
import { normalizeChunks, UNGROUPED_CHUNK_ID } from "@/lib/flowStudio/chunkUtils";

const FLOW_NODE_KIND_VALUES: FlowNodeKind[] = ["route", "stepScreen"];

export type FlowSpecNode = {
  id: string;
  kind?: FlowNodeKind;
  routeId?: string;
  routePath?: string;
  label?: LabelMap;
  position: XYPosition;
  isStart?: boolean;
  tags?: string[];
  chunkId?: string;
  portal?: FlowNodePortalConfig | null;
  stepScreen?: StepScreenConfig | null;
  internalSteps?: FlowNodeInternalStep[] | null;
};

export type FlowSpecEdge = {
  id: string;
  source: string;
  target: string;
  label?: LabelMap;
  conditionTag?: string;
  eventName?: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  color?: string;
  command?: string;
};

export type FlowSpec = {
  flow: {
    id?: string | null;
    name?: string | null;
    version?: number | null;
    updatedAt?: string | null;
  };
  nodes: FlowSpecNode[];
  edges: FlowSpecEdge[];
  chunks?: FlowChunk[];
  comments?: FlowComment[];
  overlays?: FlowOverlay[];
  diagnostics?: Record<string, unknown>;
};

export type FlowSpecPreview = FlowSpec & {
  warnings: string[];
};

export function parseFlowSpecText(text: string): FlowSpecPreview {
  if (!text.trim()) {
    throw new Error("Spec-ul este gol.");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Spec invalid: JSON-ul nu poate fi interpretat.");
  }
  return normalizeFlowSpecPayload(payload);
}

export function normalizeFlowSpecPayload(payload: unknown): FlowSpecPreview {
  if (!isPlainObject(payload)) {
    throw new Error("Spec invalid: structura principala lipseste.");
  }
  const warnings: string[] = [];
  const flowPayload = isPlainObject(payload.flow) ? payload.flow : {};
  const nodesInput = Array.isArray(payload.nodes) ? payload.nodes : null;
  if (!nodesInput) {
    throw new Error('Spec invalid: campul "nodes" lipseste.');
  }
  const edgesInput = Array.isArray(payload.edges) ? payload.edges : null;
  if (!edgesInput) {
    throw new Error('Spec invalid: campul "edges" lipseste.');
  }
  const chunks = normalizeChunksForSpec(payload.chunks, warnings);
  const chunkIds = new Set(chunks.map((chunk) => chunk.id));
  const nodeIdSet: string[] = [];

  const nodes: FlowSpecNode[] = nodesInput.map((nodeRaw, index) => {
    if (!isPlainObject(nodeRaw)) {
      throw new Error(`Nod invalid la pozitia ${index}.`);
    }
    const id = typeof nodeRaw.id === "string" && nodeRaw.id ? nodeRaw.id : `node_${index}`;
    const rawKind = typeof nodeRaw.kind === "string" ? (nodeRaw.kind as FlowNodeKind) : undefined;
    const kind: FlowNodeKind = rawKind && FLOW_NODE_KIND_VALUES.includes(rawKind) ? rawKind : "route";
    const routePath = typeof nodeRaw.routePath === "string" ? nodeRaw.routePath : undefined;
    const routeId = typeof nodeRaw.routeId === "string" ? nodeRaw.routeId : undefined;
    if (!routePath && !routeId) {
      warnings.push(`Nodul ${id} nu are routePath/routeId definit.`);
    }
    const pos = isPlainObject(nodeRaw.position) ? nodeRaw.position : null;
    if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
      throw new Error(`Nodul ${id} nu are o pozitie valida.`);
    }
    const tags = Array.isArray(nodeRaw.tags)
      ? nodeRaw.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      : undefined;
    const rawChunkId = typeof nodeRaw.chunkId === "string" ? nodeRaw.chunkId : undefined;
    const chunkId = rawChunkId && chunkIds.has(rawChunkId) ? rawChunkId : UNGROUPED_CHUNK_ID;
    if (rawChunkId && !chunkIds.has(rawChunkId)) {
      warnings.push(`Nodul ${id} refera chunk necunoscut (${rawChunkId}). Mutat in Ungrouped.`);
    }
    nodeIdSet.push(id);
    const portal = normalizeSpecPortal(nodeRaw.portal);
    const stepScreen = normalizeSpecStepScreen(nodeRaw.stepScreen, routePath);
    const resolvedRoutePath = stepScreen?.hostRoutePath ?? routePath;
    const normalizedNode: FlowSpecNode = {
      id,
      kind,
      routeId,
      routePath: resolvedRoutePath,
      label: isPlainObject(nodeRaw.label) ? (nodeRaw.label as LabelMap) : undefined,
      position: { x: pos.x, y: pos.y },
      isStart: Boolean(nodeRaw.isStart),
      tags,
      chunkId,
    };
    if (portal) {
      normalizedNode.portal = portal;
    }
    if (stepScreen) {
      normalizedNode.stepScreen = stepScreen;
    }
    const internalSteps = normalizeSpecInternalSteps(nodeRaw.internalSteps);
    if (internalSteps) {
      normalizedNode.internalSteps = internalSteps;
    }
    return normalizedNode;
  });

  const edges: FlowSpecEdge[] = edgesInput.map((edgeRaw, index) => {
    if (!isPlainObject(edgeRaw)) {
      throw new Error(`Tranzitie invalida la pozitia ${index}.`);
    }
    const source = typeof edgeRaw.source === "string" ? edgeRaw.source : null;
    const target = typeof edgeRaw.target === "string" ? edgeRaw.target : null;
    if (!source || !target) {
      throw new Error(`Tranzitia ${edgeRaw.id ?? index} nu are sursa/destinatia definite.`);
    }
    return {
      id: typeof edgeRaw.id === "string" && edgeRaw.id ? edgeRaw.id : `edge_${index}`,
      source,
      target,
      label: isPlainObject(edgeRaw.label) ? (edgeRaw.label as LabelMap) : undefined,
      conditionTag: typeof edgeRaw.conditionTag === "string" ? edgeRaw.conditionTag : undefined,
      eventName: typeof edgeRaw.eventName === "string" ? edgeRaw.eventName : undefined,
      sourceHandle: typeof edgeRaw.sourceHandle === "string" ? edgeRaw.sourceHandle : null,
      targetHandle: typeof edgeRaw.targetHandle === "string" ? edgeRaw.targetHandle : null,
      color: typeof edgeRaw.color === "string" ? edgeRaw.color : undefined,
      command: typeof edgeRaw.command === "string" ? edgeRaw.command : undefined,
    };
  });

  const overlays = normalizeSpecOverlays(Array.isArray(payload.overlays) ? payload.overlays : [], new Set(nodeIdSet), warnings);
  return {
    flow: {
      id: typeof flowPayload.id === "string" ? flowPayload.id : null,
      name: typeof flowPayload.name === "string" ? flowPayload.name : null,
      version: typeof flowPayload.version === "number" ? flowPayload.version : null,
      updatedAt: typeof flowPayload.updatedAt === "string" ? flowPayload.updatedAt : null,
    },
    nodes,
    edges,
    comments: normalizeSpecComments(payload.comments, new Set(nodeIdSet), chunkIds, warnings),
    diagnostics: isPlainObject(payload.diagnostics) ? (payload.diagnostics as Record<string, unknown>) : undefined,
    warnings,
    chunks,
    overlays,
  };
}

export function normalizeSpecTags(tags?: string[] | null, isStart?: boolean): string[] | undefined {
  const normalized = Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim())).map((tag) => tag.trim())
    : [];
  if (isStart && !normalized.includes("start")) {
    normalized.push("start");
  }
  const unique = Array.from(new Set(normalized));
  return unique.length ? unique : undefined;
}

function normalizeSpecInternalSteps(input: unknown): FlowNodeInternalStep[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const entries: FlowNodeInternalStep[] = [];
  input.forEach((raw, index) => {
    if (!isPlainObject(raw)) return;
    const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `step_${index + 1}`;
    const label = typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : id;
    const description = typeof raw.description === "string" ? raw.description : undefined;
    const tags = Array.isArray(raw.tags)
      ? raw.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      : undefined;
    entries.push({ id, label, description, tags });
  });
  return entries.length ? entries : undefined;
}

function normalizeSpecOverlays(
  overlaysInput: unknown[],
  validNodeIds: Set<string>,
  warnings: string[],
): FlowOverlay[] {
  const sanitized: FlowOverlay[] = [];
  overlaysInput.forEach((overlayRaw, index) => {
      if (!isPlainObject(overlayRaw)) {
        warnings.push(`Journey invalid la pozitia ${index}.`);
        return;
      }
      const id = typeof overlayRaw.id === "string" && overlayRaw.id.trim() ? overlayRaw.id : `overlay_${index}`;
      const stepsInput = Array.isArray(overlayRaw.steps) ? overlayRaw.steps : [];
      const steps: FlowOverlay["steps"] = [];
      stepsInput.forEach((stepRaw, stepIndex) => {
        if (!isPlainObject(stepRaw)) {
          warnings.push(`Journey ${id} are un pas invalid la pozitia ${stepIndex}.`);
          return;
        }
        const nodeId = typeof stepRaw.nodeId === "string" ? stepRaw.nodeId : null;
        if (!nodeId) {
          warnings.push(`Journey ${id} are un pas fara nodeId la pozitia ${stepIndex}.`);
          return;
        }
        if (!validNodeIds.has(nodeId)) {
          warnings.push(`Journey ${id} refera nod necunoscut (${nodeId}).`);
        }
        steps.push({
          nodeId,
          gateTag: typeof stepRaw.gateTag === "string" ? stepRaw.gateTag : null,
          tags: Array.isArray(stepRaw.tags)
            ? stepRaw.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
            : undefined,
          urlPattern: typeof stepRaw.urlPattern === "string" ? stepRaw.urlPattern : null,
          assertTestId: typeof stepRaw.assertTestId === "string" ? stepRaw.assertTestId : null,
          clickTestId: typeof stepRaw.clickTestId === "string" ? stepRaw.clickTestId : null,
        });
      });
      sanitized.push({
        id,
        name: typeof overlayRaw.name === "string" ? overlayRaw.name : "Journey",
        description: typeof overlayRaw.description === "string" ? overlayRaw.description : undefined,
        status: typeof overlayRaw.status === "string" ? (overlayRaw.status as FlowOverlay["status"]) : undefined,
        entryRoutePath: typeof overlayRaw.entryRoutePath === "string" ? overlayRaw.entryRoutePath : undefined,
        exitRoutePath: typeof overlayRaw.exitRoutePath === "string" ? overlayRaw.exitRoutePath : undefined,
        steps,
        edges: Array.isArray(overlayRaw.edges)
          ? overlayRaw.edges
              .map((edge) =>
                isPlainObject(edge) && typeof edge.fromNodeId === "string" && typeof edge.toNodeId === "string"
                  ? { fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId }
                  : null,
              )
              .filter((edge): edge is NonNullable<FlowOverlay["edges"]>[number] => Boolean(edge))
          : undefined,
      });
    });
  return sanitized;
}

function normalizeSpecPortal(portal: unknown): FlowNodePortalConfig | undefined {
  if (!isPlainObject(portal)) return undefined;
  const targetType = portal.targetType === "route" || portal.targetType === "node" ? portal.targetType : null;
  if (!targetType) return undefined;
  const normalized: FlowNodePortalConfig = {
    targetType,
  };
  if (targetType === "route") {
    if (typeof portal.targetRoutePath === "string" && portal.targetRoutePath.trim()) {
      normalized.targetRoutePath = portal.targetRoutePath.trim();
    }
    if (typeof portal.targetRouteId === "string" && portal.targetRouteId.trim()) {
      normalized.targetRouteId = portal.targetRouteId.trim();
    }
  }
  if (targetType === "node") {
    if (typeof portal.targetNodeId === "string" && portal.targetNodeId.trim()) {
      normalized.targetNodeId = portal.targetNodeId.trim();
    }
  }
  if (typeof portal.label === "string" && portal.label.trim()) {
    normalized.label = portal.label.trim();
  }
  return normalized;
}

function normalizeSpecStepScreen(stepScreen: unknown, fallbackHost?: string | null): StepScreenConfig | undefined {
  if (!isPlainObject(stepScreen)) return undefined;
  const hostRoutePath =
    typeof stepScreen.hostRoutePath === "string" && stepScreen.hostRoutePath.trim()
      ? stepScreen.hostRoutePath.trim()
      : fallbackHost && typeof fallbackHost === "string"
        ? fallbackHost
        : null;
  const stepKey = typeof stepScreen.stepKey === "string" && stepScreen.stepKey.trim() ? stepScreen.stepKey.trim() : null;
  if (!hostRoutePath || !stepKey) return undefined;
  const normalized: StepScreenConfig = {
    hostRoutePath,
    stepKey,
  };
  if (typeof stepScreen.label === "string" && stepScreen.label.trim()) {
    normalized.label = stepScreen.label.trim();
  }
  if (isPlainObject(stepScreen.queryPreset)) {
    const presetEntries = Object.entries(stepScreen.queryPreset).filter(
      ([key, value]) => typeof key === "string" && typeof value === "string",
    ) as Array<[string, string]>;
    if (presetEntries.length) {
      normalized.queryPreset = presetEntries.reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    }
  }
  return normalized;
}

export function formatTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export function getTimestampMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && value !== null) {
    if ("toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
      try {
        return (value as { toMillis: () => number }).toMillis();
      } catch {
        return null;
      }
    }
    if ("toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
      try {
        return (value as { toDate: () => Date }).toDate().getTime();
      } catch {
        return null;
      }
    }
  }
  const iso = formatTimestamp(value);
  return iso ? new Date(iso).getTime() : null;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeLabelMap(label?: LabelMap | null): LabelMap | undefined {
  if (!label) return undefined;
  const normalized: LabelMap = {};
  if (label.ro !== undefined) normalized.ro = label.ro;
  if (label.en !== undefined) normalized.en = label.en;
  return Object.keys(normalized).length ? normalized : undefined;
}

export function normalizeTags(tags?: string[] | null): string[] | undefined {
  if (!tags || !tags.length) return undefined;
  const normalized = tags.filter((tag): tag is string => typeof tag === "string");
  return normalized.length ? normalized : undefined;
}

function normalizeChunksForSpec(raw: unknown, warnings: string[]): FlowChunk[] {
  if (!Array.isArray(raw)) {
    return normalizeChunks();
  }
  const sanitized: FlowChunk[] = [];
  raw.forEach((chunkRaw, index) => {
    if (!isPlainObject(chunkRaw)) {
      warnings.push(`Chunk invalid la pozitia ${index}.`);
      return;
    }
    const id = typeof chunkRaw.id === "string" && chunkRaw.id.trim() ? chunkRaw.id.trim() : null;
    if (!id) {
      warnings.push(`Chunk fara id la pozitia ${index}.`);
      return;
    }
    const title = typeof chunkRaw.title === "string" && chunkRaw.title.trim() ? chunkRaw.title.trim() : `Chunk ${sanitized.length + 1}`;
    sanitized.push({
      id,
      title,
      order: typeof chunkRaw.order === "number" ? chunkRaw.order : index,
      color: typeof chunkRaw.color === "string" ? chunkRaw.color : undefined,
      collapsedByDefault: typeof chunkRaw.collapsedByDefault === "boolean" ? chunkRaw.collapsedByDefault : undefined,
      meta: isPlainObject(chunkRaw.meta) ? (chunkRaw.meta as FlowChunk["meta"]) : undefined,
    });
  });
  return normalizeChunks(sanitized);
}

function normalizeSpecComments(
  raw: unknown,
  nodeIds: Set<string>,
  chunkIds: Set<string>,
  warnings: string[],
): FlowComment[] {
  if (!Array.isArray(raw)) return [];
  const sanitized: FlowComment[] = [];
  raw.forEach((entry, index) => {
    if (!isPlainObject(entry)) {
      warnings.push(`Comentariu invalid la pozitia ${index}.`);
      return;
    }
    const id = typeof entry.id === "string" && entry.id ? entry.id : `comment_${index}`;
    const targetType = entry.targetType === "chunk" || entry.targetType === "node" ? entry.targetType : null;
    const targetId = typeof entry.targetId === "string" ? entry.targetId : null;
    const message = typeof entry.message === "string" ? entry.message : null;
    if (!targetType || !targetId || !message) {
      warnings.push(`Comentariu ${id} nu are targetType/targetId/message corecte.`);
      return;
    }
    const validTarget = targetType === "chunk" ? chunkIds.has(targetId) : nodeIds.has(targetId);
    if (!validTarget) {
      warnings.push(`Comentariu ${id} refera o tinta necunoscuta (${targetId}). Ignorat.`);
      return;
    }
    sanitized.push({
      id,
      targetType,
      targetId,
      message,
      author: typeof entry.author === "string" ? entry.author : undefined,
      createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
      resolved: Boolean(entry.resolved),
    });
  });
  return sanitized;
}
