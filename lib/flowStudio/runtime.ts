import type { FlowDoc, FlowNode, FlowNodeInternalStep } from "@/lib/flowStudio/types";
import canonicalFlowDoc from "@/DOCS/FLOW/flowStudio-explore-cat-day1.json";
import type { StepEdge, StepManifest, StepNode } from "@/lib/stepManifests/types";

type RawFlowDoc = Partial<FlowDoc> & {
  flow?: { id?: string | null; name?: string | null; version?: number | null; updatedAt?: string | null };
};

const rawDoc = canonicalFlowDoc as unknown as RawFlowDoc;

const DAY_ONE_FLOW_DOC: FlowDoc = {
  name: rawDoc.flow?.name ?? "Flow",
  version: rawDoc.flow?.version ?? undefined,
  updatedAt: rawDoc.flow?.updatedAt ?? undefined,
  nodes: rawDoc.nodes ?? [],
  edges: rawDoc.edges ?? [],
  chunks: rawDoc.chunks,
  comments: rawDoc.comments,
  overlays: rawDoc.overlays,
  stepOrderOverrides: rawDoc.stepOrderOverrides,
};
const FLOW_DOC_REGISTRY: Record<string, FlowDoc> = {
  day1: DAY_ONE_FLOW_DOC,
};
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function normalizeRoutePath(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  return trimmed.length ? trimmed : null;
}

function getFlowDocForRoute(_routePath?: string | null): FlowDoc {
  void _routePath;
  // TODO: map routePath către doc-uri diferite când vor exista multiple FlowDoc-uri
  return FLOW_DOC_REGISTRY.day1;
}

function findRouteNode(doc: FlowDoc, routePath: string): FlowNode | undefined {
  return doc.nodes?.find((node) => node.kind !== "stepScreen" && normalizeRoutePath(node.routePath) === routePath);
}

function getStepScreenNodes(doc: FlowDoc, hostRoutePath: string): FlowNode[] {
  return (
    doc.nodes?.filter(
      (node) => node.kind === "stepScreen" && normalizeRoutePath(node.stepScreen?.hostRoutePath) === hostRoutePath,
    ) ?? []
  );
}

function normalizeEdgeSource(edge: { source?: string; from?: string } | null | undefined): string | null {
  if (!edge) return null;
  return typeof edge.source === "string" && edge.source.length
    ? edge.source
    : typeof edge.from === "string" && edge.from.length
      ? edge.from
      : null;
}

function normalizeEdgeTarget(edge: { target?: string; to?: string } | null | undefined): string | null {
  if (!edge) return null;
  return typeof edge.target === "string" && edge.target.length
    ? edge.target
    : typeof edge.to === "string" && edge.to.length
      ? edge.to
      : null;
}

function buildManifestFromStepScreens(doc: FlowDoc, hostRoutePath: string): StepManifest | null {
  const stepNodes = getStepScreenNodes(doc, hostRoutePath);
  if (!stepNodes.length) return null;
  const stepNodesById = new Map(stepNodes.map((node) => [node.id, node]));
  const nodes: StepNode[] = stepNodes.map((node) => ({
    id: node.stepScreen?.stepKey ?? node.id,
    label: node.stepScreen?.label ?? node.label?.ro ?? node.label?.en ?? node.id,
  }));
  const manifestEdges: StepEdge[] = [];
  doc.edges?.forEach((edge) => {
    const sourceId = normalizeEdgeSource(edge);
    const targetId = normalizeEdgeTarget(edge);
    if (!sourceId || !targetId) return;
    if (!stepNodesById.has(sourceId) || !stepNodesById.has(targetId)) return;
    const sourceNode = stepNodesById.get(sourceId)!;
    const targetNode = stepNodesById.get(targetId)!;
    const sourceKey = sourceNode.stepScreen?.stepKey ?? sourceNode.id;
    const targetKey = targetNode.stepScreen?.stepKey ?? targetNode.id;
    manifestEdges.push({
      id: edge.id ?? `${sourceKey}-${targetKey}`,
      source: sourceKey,
      target: targetKey,
      variant: "next",
    });
  });

  const incomingCounts = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();
  manifestEdges.forEach((edge) => {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) ?? 0) + 1);
    outgoingCounts.set(edge.source, (outgoingCounts.get(edge.source) ?? 0) + 1);
  });

  const stepKeys = nodes.map((node) => node.id);
  const routeNode = findRouteNode(doc, hostRoutePath);
  let startNodeId: string | null = null;
  if (routeNode) {
    const candidateEdge = doc.edges?.find((edge) => {
      const sourceId = normalizeEdgeSource(edge);
      const targetId = normalizeEdgeTarget(edge);
      return sourceId === routeNode.id && targetId && stepNodesById.has(targetId);
    });
    if (candidateEdge) {
      const targetId = normalizeEdgeTarget(candidateEdge);
      const targetNode = targetId ? stepNodesById.get(targetId) : null;
      startNodeId = targetNode ? targetNode.stepScreen?.stepKey ?? targetNode.id : null;
    }
  }
  if (!startNodeId) {
    startNodeId =
      stepKeys.find((key) => (incomingCounts.get(key) ?? 0) === 0) ??
      (nodes.length ? nodes[0].id : null);
  }

  const terminalNodeIds =
    stepKeys.filter((key) => (outgoingCounts.get(key) ?? 0) === 0) || (nodes.length ? [nodes[nodes.length - 1].id] : []);

  return {
    routePath: hostRoutePath,
    startNodeId: startNodeId ?? undefined,
    terminalNodeIds: terminalNodeIds.length ? terminalNodeIds : undefined,
    nodes,
    edges: manifestEdges,
  };
}

export function getScreensForRoute(routePath: string): FlowNodeInternalStep[] {
  const normalizedPath = normalizeRoutePath(routePath);
  if (!normalizedPath) return [];
  const doc = getFlowDocForRoute(normalizedPath);
  const node = doc.nodes?.find((entry) => normalizeRoutePath(entry.routePath) === normalizedPath);
  return node?.internalSteps?.map((step) => ({ ...step })) ?? [];
}

export function getNodeInternalStepsForRoute(routePath: string): FlowNodeInternalStep[] {
  return getScreensForRoute(routePath);
}

const introManifestFallback: StepManifest = {
  routePath: "/intro",
  startNodeId: "cinematic",
  terminalNodeIds: ["handoff"],
  nodes: [
    { id: "cinematic", label: "Intro cinematic" },
    { id: "mindpacing", label: "MindPacing" },
    { id: "vocab", label: "Vocab primer" },
    { id: "handoff", label: "Handoff" },
  ],
  edges: [
    { id: "cinematic-mindpacing", source: "cinematic", target: "mindpacing", variant: "next" },
    { id: "mindpacing-vocab", source: "mindpacing", target: "vocab", variant: "next" },
    { id: "vocab-handoff", source: "vocab", target: "handoff", variant: "next" },
  ],
};

const guidedManifestFallback: StepManifest = {
  routePath: "/guided/day1",
  startNodeId: "guided_day1_session",
  terminalNodeIds: ["guided_day1_complete"],
  nodes: [
    { id: "guided_day1_session", label: "Guided Day 1 · Session" },
    { id: "guided_day1_complete", label: "Guided Day 1 · Complete" },
  ],
  edges: [
    {
      id: "guided-day1-session-complete",
      source: "guided_day1_session",
      target: "guided_day1_complete",
      variant: "next",
    },
  ],
};

function ensureManifest(manifest: StepManifest | null, fallback: StepManifest, label: string): StepManifest {
  if (manifest) return manifest;
  if (IS_PRODUCTION) {
    throw new Error(`[flowDocRuntime] Missing ${label} manifest derived from FlowDoc.`);
  }
  console.warn(`[flowDocRuntime] Missing ${label} manifest from FlowDoc. Using development fallback.`);
  return fallback;
}

export function getIntroManifestFromFlowDoc(): StepManifest {
  const manifest = buildManifestFromStepScreens(getFlowDocForRoute("/intro"), "/intro");
  return ensureManifest(manifest, introManifestFallback, "intro");
}

export function getGuidedDayOneManifestFromFlowDoc(): StepManifest {
  const manifest = buildManifestFromStepScreens(getFlowDocForRoute("/guided/day1"), "/guided/day1");
  return ensureManifest(manifest, guidedManifestFallback, "guided_day1");
}

export function getStepScreenKeysForRoute(routePath: string): string[] {
  return getStepScreenNodes(getFlowDocForRoute(routePath), routePath).map(
    (node) => node.stepScreen?.stepKey ?? node.id,
  );
}
