import dagre from "dagre";
import type { Edge, Node } from "reactflow";
import type { FlowChunk, FlowEdgeData, FlowNodeData, RouteDoc } from "@/lib/flowStudio/types";

export const UNGROUPED_CHUNK_ID = "ungrouped";

const CANONICAL_CHUNK_PRESETS: FlowChunk[] = [
  { id: "CH01_public", title: "Public / Acquisition", order: 1, color: "#f1f5f9" },
  { id: "CH02_entry_intro", title: "Entry / Intro", order: 2, color: "#e2e8f0" },
  { id: "CH03_guided_day1", title: "Guided Day-1", order: 3, color: "#fef3c7" },
  { id: "CH04_onboarding", title: "Onboarding / Calibration", order: 4, color: "#fee2e2" },
  { id: "CH05_daily_loop", title: "Daily Loop (Today)", order: 5, color: "#dcfce7" },
  { id: "CH07_progress_map", title: "OS / Progress", order: 6, color: "#e0f2fe" },
  { id: "CH08_training_arenas", title: "Training / Arenas", order: 7, color: "#ffe4e6" },
  { id: "CH09_curriculum_library", title: "Curriculum / Library", order: 8, color: "#ddd6fe" },
  { id: "CH10_module_hubs", title: "Module Hubs", order: 9, color: "#f3e8ff" },
  { id: "CH11_advanced_wizard", title: "Advanced / Wizard / Coaching", order: 10, color: "#fde68a" },
  { id: "CH12_account_admin_legacy", title: "Account / Billing / Admin / Legacy", order: 11, color: "#fed7aa" },
];

const CANONICAL_CHUNK_ID_SET = new Set(CANONICAL_CHUNK_PRESETS.map((chunk) => chunk.id));
const CANONICAL_ORDER_MAP = new Map(CANONICAL_CHUNK_PRESETS.map((chunk) => [chunk.id, chunk.order]));

const ROUTE_GROUP_TO_CANONICAL_CHUNK_ID: Record<string, string> = {
  public: "CH01_public",
  intro: "CH02_entry_intro",
  onboarding: "CH04_onboarding",
  "experience-onboarding": "CH03_guided_day1",
  today: "CH05_daily_loop",
  recommendation: "CH05_daily_loop",
  progress: "CH07_progress_map",
  os: "CH07_progress_map",
  "mission-map": "CH07_progress_map",
  "mental-universe": "CH07_progress_map",
  "omni-scope": "CH07_progress_map",
  omniscop: "CH07_progress_map",
  "omniscop-lite": "CH07_progress_map",
  training: "CH08_training_arenas",
  arenas: "CH08_training_arenas",
  library: "CH09_curriculum_library",
  replay: "CH09_curriculum_library",
  kuno: "CH09_curriculum_library",
  "omni-kuno": "CH09_curriculum_library",
  omnicuno: "CH09_curriculum_library",
  "knowledge-exam": "CH09_curriculum_library",
  "omni-abil": "CH10_module_hubs",
  advanced: "CH11_advanced_wizard",
  wizard: "CH11_advanced_wizard",
  account: "CH12_account_admin_legacy",
  admin: "CH12_account_admin_legacy",
  legacy: "CH12_account_admin_legacy",
  unsubscribe: "CH12_account_admin_legacy",
  upgrade: "CH12_account_admin_legacy",
  auth: "CH12_account_admin_legacy",
};

export type ChunkCounts = {
  total: number;
  start: number;
  unreachable: number;
};

export type ChunkNodeData = {
  type: "chunk";
  chunkId: string;
  title: string;
  counts: ChunkCounts;
  color?: string;
  commentCount?: number;
  overlayStepCount?: number;
  overlayHighlighted?: boolean;
  overlayDimmed?: boolean;
};

export type ChunkGraphResult = {
  nodes: Node<ChunkNodeData>[];
  edges: Edge<FlowEdgeData>[];
  countsByChunk: Map<string, ChunkCounts>;
  chunks: FlowChunk[];
};

const CHUNK_NODE_WIDTH = 280;
const CHUNK_NODE_HEIGHT = 140;

export function createUngroupedChunk(): FlowChunk {
  return {
    id: UNGROUPED_CHUNK_ID,
    title: "Ungrouped",
    order: 0,
    color: "#cbd5f5",
  };
}

const cloneChunkMeta = (meta?: FlowChunk["meta"]) => {
  if (!meta) return undefined;
  return { ...meta };
};

function mergeCanonicalChunks(input?: FlowChunk[] | null): FlowChunk[] {
  const existingMap = new Map<string, FlowChunk>();
  if (Array.isArray(input)) {
    input.forEach((chunk) => {
      if (!chunk?.id) return;
      existingMap.set(chunk.id, chunk);
    });
  }
  const seeded: FlowChunk[] = CANONICAL_CHUNK_PRESETS.map((preset) => {
    const existing = existingMap.get(preset.id);
    if (!existing) {
      return { ...preset };
    }
    existingMap.delete(preset.id);
    return {
      id: preset.id,
      title: existing.title?.trim() || preset.title,
      order: typeof existing.order === "number" ? existing.order : preset.order,
      color: typeof existing.color === "string" ? existing.color : preset.color,
      collapsedByDefault:
        typeof existing.collapsedByDefault === "boolean" ? existing.collapsedByDefault : preset.collapsedByDefault,
      meta: existing.meta ?? preset.meta,
    };
  });
  const extras = Array.from(existingMap.values()).filter((chunk) => chunk.id && !CANONICAL_CHUNK_ID_SET.has(chunk.id));
  extras.sort((a, b) => {
    const orderA = typeof a.order === "number" ? a.order : CANONICAL_CHUNK_PRESETS.length + 1;
    const orderB = typeof b.order === "number" ? b.order : CANONICAL_CHUNK_PRESETS.length + 1;
    if (orderA !== orderB) return orderA - orderB;
    return a.title?.localeCompare(b.title ?? "") ?? 0;
  });
  return [...seeded, ...extras];
}

export function normalizeChunks(input?: FlowChunk[] | null): FlowChunk[] {
  const seen = new Set<string>();
  const baseList = mergeCanonicalChunks(input);
  let nextExtraOrder = CANONICAL_CHUNK_PRESETS.length + 1;
  const sanitized: FlowChunk[] = baseList
    .filter((entry): entry is FlowChunk => Boolean(entry?.id))
    .map((entry) => ({
      id: entry.id.trim(),
      title: entry.title?.trim() || "Chunk",
      order:
        typeof entry.order === "number"
          ? entry.order
          : typeof CANONICAL_ORDER_MAP.get(entry.id) === "number"
            ? (CANONICAL_ORDER_MAP.get(entry.id) as number)
            : nextExtraOrder++,
      color: entry.color,
      collapsedByDefault: entry.collapsedByDefault,
      meta: cloneChunkMeta(entry.meta),
    }))
    .filter((entry) => {
      if (!entry.id) return false;
      if (seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  if (!sanitized.some((chunk) => chunk.id === UNGROUPED_CHUNK_ID)) {
    sanitized.push(createUngroupedChunk());
  }
  return sanitized
    .sort((a, b) => {
      if (a.id === UNGROUPED_CHUNK_ID) return -1;
      if (b.id === UNGROUPED_CHUNK_ID) return 1;
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    })
    .map((chunk, index) => ({ ...chunk, order: index }));
}

export function getCanonicalChunks(): FlowChunk[] {
  return normalizeChunks(CANONICAL_CHUNK_PRESETS);
}

export function buildChunkAutoAssignMap(chunks: FlowChunk[]): Map<string, FlowChunk> {
  const map = new Map<string, FlowChunk>();
  const chunkById = new Map<string, FlowChunk>();
  chunks.forEach((chunk) => {
    const normalizedId = chunk.id.toLowerCase();
    chunkById.set(normalizedId, chunk);
    map.set(normalizedId, chunk);
    if (chunk.title) {
      map.set(chunk.title.toLowerCase(), chunk);
    }
    if (Array.isArray(chunk.meta?.routeGroups)) {
      chunk.meta.routeGroups.forEach((group) => {
        if (typeof group === "string" && group.trim()) {
          map.set(group.toLowerCase(), chunk);
        }
      });
    }
  });
  Object.entries(ROUTE_GROUP_TO_CANONICAL_CHUNK_ID).forEach(([routeGroup, chunkId]) => {
    const chunk = chunkById.get(chunkId.toLowerCase());
    if (chunk) {
      map.set(routeGroup.toLowerCase(), chunk);
    }
  });
  return map;
}

function ensureChunkMap(chunks: FlowChunk[]): Map<string, FlowChunk> {
  return new Map(chunks.map((chunk) => [chunk.id, chunk]));
}

export type ChunkLayoutOptions = {
  rankdir?: "LR" | "TB";
  nodesep?: number;
  ranksep?: number;
};

export function buildChunkGraph(
  nodes: Node<FlowNodeData>[],
  edges: Edge<FlowEdgeData>[],
  rawChunks: FlowChunk[] | null | undefined,
  layoutOptions?: ChunkLayoutOptions,
): ChunkGraphResult {
  const chunks = normalizeChunks(rawChunks);
  const chunkMap = ensureChunkMap(chunks);
  const reachable = computeReachableNodeIds(nodes, edges);
  const countsByChunk = new Map<string, ChunkCounts>();
  const nodeChunkMap = new Map<string, string>();

  const ensureCounts = (chunkId: string) => {
    const current = countsByChunk.get(chunkId);
    if (current) return current;
    const blank: ChunkCounts = { total: 0, start: 0, unreachable: 0 };
    countsByChunk.set(chunkId, blank);
    return blank;
  };

  nodes.forEach((node) => {
    const requestedChunkId = node.data.chunkId ?? null;
    const chunkId = requestedChunkId && chunkMap.has(requestedChunkId) ? requestedChunkId : UNGROUPED_CHUNK_ID;
    nodeChunkMap.set(node.id, chunkId);
    const stats = ensureCounts(chunkId);
    stats.total += 1;
    if (node.data.tags?.includes("start")) {
      stats.start += 1;
    }
    if (!reachable.has(node.id)) {
      stats.unreachable += 1;
    }
  });

  chunks.forEach((chunk) => {
    ensureCounts(chunk.id);
  });

  const edgeBuckets = new Map<string, { source: string; target: string; weight: number }>();
  edges.forEach((edge) => {
    const sourceChunk = nodeChunkMap.get(edge.source) ?? UNGROUPED_CHUNK_ID;
    const targetChunk = nodeChunkMap.get(edge.target) ?? UNGROUPED_CHUNK_ID;
    if (sourceChunk === targetChunk) return;
    const key = `${sourceChunk}->${targetChunk}`;
    const entry = edgeBuckets.get(key);
    if (entry) {
      entry.weight += 1;
    } else {
      edgeBuckets.set(key, { source: sourceChunk, target: targetChunk, weight: 1 });
    }
  });

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: layoutOptions?.rankdir ?? "LR",
    nodesep: layoutOptions?.nodesep ?? 240,
    ranksep: layoutOptions?.ranksep ?? 240,
  });
  graph.setDefaultEdgeLabel(() => ({}));
  chunks.forEach((chunk) => {
    graph.setNode(chunk.id, { width: CHUNK_NODE_WIDTH, height: CHUNK_NODE_HEIGHT });
  });
  edgeBuckets.forEach(({ source, target }) => graph.setEdge(source, target));
  dagre.layout(graph);

  const chunkNodes: Node<ChunkNodeData>[] = chunks.map((chunk) => {
    const layout = graph.node(chunk.id);
    const position = layout
      ? { x: layout.x - CHUNK_NODE_WIDTH / 2, y: layout.y - CHUNK_NODE_HEIGHT / 2 }
      : { x: 0, y: 0 };
    return {
      id: `chunk:${chunk.id}`,
      type: "chunkNode",
      position,
      data: {
        type: "chunk",
        chunkId: chunk.id,
        title: chunk.title,
        counts: countsByChunk.get(chunk.id) ?? { total: 0, start: 0, unreachable: 0 },
        color: chunk.color,
      },
      draggable: false,
      selectable: false,
      focusable: false,
      connectable: false,
    };
  });

  const chunkEdges: Edge<FlowEdgeData>[] = Array.from(edgeBuckets.entries()).map(([key, bucket]) => ({
    id: `chunk-edge:${key}`,
    source: `chunk:${bucket.source}`,
    target: `chunk:${bucket.target}`,
    type: "parallel",
    label: `${bucket.weight}`,
    data: {
      color: "#0f172a",
    },
    selectable: false,
    focusable: false,
  }));

  return { nodes: chunkNodes, edges: chunkEdges, countsByChunk, chunks };
}

export function computeReachableNodeIds(nodes: Node<FlowNodeData>[], edges: Edge<FlowEdgeData>[]) {
  const incomingCounts = new Map<string, number>();
  edges.forEach((edge) => {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) ?? 0) + 1);
  });
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  });
  let seeds = nodes.filter((node) => node.data.tags?.includes("start")).map((node) => node.id);
  if (!seeds.length) {
    seeds = nodes.filter((node) => (incomingCounts.get(node.id) ?? 0) === 0).map((node) => node.id);
  }
  if (!seeds.length && nodes.length) {
    seeds = [nodes[0].id];
  }
  const visited = new Set<string>();
  const queue = [...seeds];
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const neighbors = adjacency.get(current);
    neighbors?.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }
  return visited;
}

export function ensureNodesHaveValidChunks(nodes: Node<FlowNodeData>[], chunks: FlowChunk[]): Node<FlowNodeData>[] {
  if (!nodes.length) return nodes;
  const validIds = new Set(chunks.map((chunk) => chunk.id));
  let mutated = false;
  const next = nodes.map((node) => {
    const existing = node.data.chunkId ?? UNGROUPED_CHUNK_ID;
    if (validIds.has(existing)) {
      return node;
    }
    mutated = true;
    return {
      ...node,
      data: {
        ...node.data,
        chunkId: UNGROUPED_CHUNK_ID,
      },
    };
  });
  return mutated ? next : nodes;
}

export function autoAssignChunksByRouteGroup(
  nodes: Node<FlowNodeData>[],
  routeMap: Map<string, RouteDoc>,
  chunkLookupMap: Map<string, FlowChunk>,
): Node<FlowNodeData>[] {
  if (!nodes.length || !chunkLookupMap.size) return nodes;
  let mutated = false;
  const next = nodes.map((node) => {
    const existing = node.data.chunkId ?? UNGROUPED_CHUNK_ID;
    if (existing && existing !== UNGROUPED_CHUNK_ID) {
      return node;
    }
    const route = routeMap.get(node.data.routeId);
    const specialPath = route?.routePath ?? node.data.routePath ?? "";
    if (specialPath && specialPath.startsWith("/intro/guided")) {
      const guidedChunk = chunkLookupMap.get("ch03_guided_day1");
      if (guidedChunk) {
        mutated = true;
        return {
          ...node,
          data: {
            ...node.data,
            chunkId: guidedChunk.id,
          },
        };
      }
    }
    const groupKey = route?.group?.toLowerCase?.();
    if (!groupKey) return node;
    const match = chunkLookupMap.get(groupKey);
    if (!match) return node;
    mutated = true;
    return {
      ...node,
      data: {
        ...node.data,
        chunkId: match.id,
      },
    };
  });
  return mutated ? next : nodes;
}
