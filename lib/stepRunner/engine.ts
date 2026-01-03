import type { StepManifest, StepNode } from "@/lib/stepManifests/types";

function hasNodeWithId(manifest: StepManifest, nodeId: string | null | undefined): boolean {
  if (!nodeId) return false;
  return manifest.nodes.some((node) => node.id === nodeId);
}

function resolveFallbackStepId(manifest: StepManifest): string | null {
  if (manifest.startNodeId && hasNodeWithId(manifest, manifest.startNodeId)) {
    return manifest.startNodeId;
  }
  return manifest.nodes[0]?.id ?? null;
}

export function resolveValidStepId(
  manifest: StepManifest,
  requestedId: string | null | undefined,
): string | null {
  if (requestedId && hasNodeWithId(manifest, requestedId)) {
    return requestedId;
  }
  return resolveFallbackStepId(manifest);
}

export function applyStepOrderOverride(
  manifest: StepManifest,
  overrideOrder: string[] | null | undefined,
): StepManifest {
  if (!overrideOrder?.length) return manifest;
  const normalizedOrder: string[] = [];
  overrideOrder.forEach((id) => {
    if (typeof id !== "string") return;
    const trimmed = id.trim();
    if (!trimmed) return;
    if (!normalizedOrder.includes(trimmed)) {
      normalizedOrder.push(trimmed);
    }
  });
  if (!normalizedOrder.length) return manifest;
  const nodeMap = new Map<string, StepNode>();
  manifest.nodes.forEach((node) => nodeMap.set(node.id, node));
  const orderedNodes: StepNode[] = [];
  normalizedOrder.forEach((id) => {
    const node = nodeMap.get(id);
    if (node) {
      orderedNodes.push(node);
      nodeMap.delete(id);
    }
  });
  if (!orderedNodes.length) return manifest;
  manifest.nodes.forEach((node) => {
    if (nodeMap.has(node.id)) {
      orderedNodes.push(node);
      nodeMap.delete(node.id);
    }
  });
  const identical =
    orderedNodes.length === manifest.nodes.length &&
    orderedNodes.every((node, index) => node === manifest.nodes[index]);
  if (identical) {
    return manifest;
  }
  return {
    ...manifest,
    nodes: orderedNodes,
  };
}

export function resolveNextStepId(
  manifest: StepManifest,
  currentId: string | null,
  variant: string = "next",
): string | null {
  const nodes = manifest.nodes;
  if (!nodes.length) return null;
  const activeVariant = variant || "next";
  const normalizedEdges = manifest.edges ?? [];
  const matchingEdge = normalizedEdges.find(
    (edge) =>
      edge.source === currentId &&
      (edge.variant ?? "next") === activeVariant,
  );
  if (matchingEdge) {
    return matchingEdge.target;
  }
  if (!currentId) {
    return resolveFallbackStepId(manifest);
  }
  const currentIndex = nodes.findIndex((node) => node.id === currentId);
  if (activeVariant === "next" && currentIndex >= 0 && currentIndex + 1 < nodes.length) {
    return nodes[currentIndex + 1].id;
  }
  if (activeVariant === "back" && currentIndex > 0) {
    return nodes[currentIndex - 1].id;
  }
  return null;
}
