"use client";

import { UNGROUPED_CHUNK_ID } from "@/lib/flowStudio/chunkUtils";
import type { FlowChunk, FlowIssue, FlowOverlay, FlowReactEdge, FlowReactNode } from "./types";

type MinimalRouteMap = Map<string, { routePath?: string }>;

const getNodeLabel = (node: FlowReactNode) =>
  node.data?.labelOverrides?.ro ?? node.data?.labelOverrides?.en ?? node.data?.routePath ?? node.id;

const labelLooksLikePortal = (label: string) => label.trim().toUpperCase().startsWith("PORTAL:");

const nodeLooksLikePortal = (node: FlowReactNode) => {
  const nodeLabel = getNodeLabel(node);
  return Boolean(node.data?.tags?.includes("type:portal") || labelLooksLikePortal(nodeLabel));
};

export function computeFlowDiagnostics(
  nodes: FlowReactNode[],
  edges: FlowReactEdge[],
  routeMap?: MinimalRouteMap,
  chunks?: FlowChunk[],
  overlays?: FlowOverlay[],
): FlowIssue[] {
  const issues: FlowIssue[] = [];

  if (!nodes.length) {
    issues.push({
      id: "empty-flow",
      message: "Flow-ul nu are niciun nod.",
      severity: "warning",
    });
    return issues;
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const nodeChunkMap = new Map<string, string>();
  nodes.forEach((node) => {
    nodeChunkMap.set(node.id, node.data?.chunkId ?? UNGROUPED_CHUNK_ID);
  });

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push({
        id: `edge-${edge.id}-dangling`,
        message: `Tranziția ${edge.id} are capete lipsă.`,
        severity: "warning",
        targetType: "edge",
        targetId: edge.id,
      });
    }
  });

  const outgoingByNode = new Map<string, number>();
  const incomingByNode = new Map<string, number>();
  edges.forEach((edge) => {
    outgoingByNode.set(edge.source, (outgoingByNode.get(edge.source) ?? 0) + 1);
    incomingByNode.set(edge.target, (incomingByNode.get(edge.target) ?? 0) + 1);
  });

  const routeBuckets = new Map<string, FlowReactNode[]>();
  nodes.forEach((node) => {
    if (nodeLooksLikePortal(node)) return;
    const routeKey = node.data?.routePath ?? node.data?.routeId;
    if (!routeKey) return;
    routeBuckets.set(routeKey, [...(routeBuckets.get(routeKey) ?? []), node]);
  });
  routeBuckets.forEach((bucket, routeKey) => {
    if (bucket.length <= 1) return;
    bucket.forEach((node) => {
      issues.push({
        id: `duplicate-route-${routeKey}-${node.id}`,
        message: `Ruta ${routeKey} este mapată de ${bucket.length} ori.`,
        severity: "warning",
        targetType: "node",
        targetId: node.id,
      });
    });
  });

  nodes.forEach((node) => {
    if (routeMap && node.data?.routeId && !routeMap.has(node.data.routeId)) {
      issues.push({
        id: `route-missing-${node.id}`,
        message: `Ruta pentru nodul ${node.data.routePath ?? node.id} nu este sincronizată.`,
        severity: "warning",
        targetType: "node",
        targetId: node.id,
      });
    }
    const chunkId = node.data?.chunkId ?? UNGROUPED_CHUNK_ID;
    if (!chunkId || chunkId === UNGROUPED_CHUNK_ID) {
      issues.push({
        id: `missing-chunk-${node.id}`,
        message: `Nodul ${node.data?.routePath ?? node.id} nu are chunk definit.`,
        severity: "warning",
        targetType: "node",
        targetId: node.id,
      });
    }
    const nodeLabel = getNodeLabel(node);
    const hasPortalTag = node.data?.tags?.includes("type:portal") ?? false;
    const labelIsPortal = labelLooksLikePortal(nodeLabel);
    const isPortal = hasPortalTag || labelIsPortal;
    if (hasPortalTag && !labelIsPortal) {
      issues.push({
        id: `portal-label-${node.id}`,
        message: `Nodul ${nodeLabel} este portal, dar nu respectă convenția „PORTAL: …”.`,
        severity: "info",
        targetType: "node",
        targetId: node.id,
      });
    }
    if (!hasPortalTag && labelIsPortal) {
      issues.push({
        id: `portal-tag-${node.id}`,
        message: `Nodul ${nodeLabel} pare portal, dar nu are tag-ul type:portal.`,
        severity: "warning",
        targetType: "node",
        targetId: node.id,
      });
    }
    if (isPortal) {
      const portalConfig = node.data?.portal;
      const hasRouteTarget =
        portalConfig?.targetType === "route" && Boolean(portalConfig.targetRoutePath || portalConfig.targetRouteId);
      const hasNodeTarget = portalConfig?.targetType === "node" && Boolean(portalConfig.targetNodeId);
      if (!hasRouteTarget && !hasNodeTarget) {
        issues.push({
          id: `portal-target-${node.id}`,
          message: `Portalul ${nodeLabel} nu are target configurat.`,
          severity: "warning",
          targetType: "node",
          targetId: node.id,
        });
      }
    }
    const outgoing = outgoingByNode.get(node.id) ?? 0;
    const incoming = incomingByNode.get(node.id) ?? 0;
    if (outgoing === 0 && nodes.length > 1) {
      issues.push({
        id: `dangling-${node.id}`,
        message: `Nodul ${node.data?.routePath ?? node.id} nu are ieșiri.`,
        severity: "warning",
        targetType: "node",
        targetId: node.id,
      });
    }
    if (incoming === 0 && nodes.length > 1) {
      issues.push({
        id: `orphan-${node.id}`,
        message: `Nodul ${node.data?.routePath ?? node.id} nu are intrări.`,
        severity: "info",
        targetType: "node",
        targetId: node.id,
      });
    }
  });

  if (chunks?.length) {
    const chunkMap = new Map<string, FlowChunk>();
    chunks.forEach((chunk) => chunkMap.set(chunk.id, chunk));
    const chunkNodesMap = new Map<string, FlowReactNode[]>();
    nodes.forEach((node) => {
      const chunkId = node.data?.chunkId ?? UNGROUPED_CHUNK_ID;
      chunkNodesMap.set(chunkId, [...(chunkNodesMap.get(chunkId) ?? []), node]);
    });
    const chunkHasExit = new Map<string, boolean>();
    edges.forEach((edge) => {
      const sourceChunk = nodeChunkMap.get(edge.source) ?? UNGROUPED_CHUNK_ID;
      const targetChunk = nodeChunkMap.get(edge.target) ?? UNGROUPED_CHUNK_ID;
      if (sourceChunk !== targetChunk) {
        chunkHasExit.set(sourceChunk, true);
      }
    });
    chunkMap.forEach((chunk, chunkId) => {
      if (chunkId === UNGROUPED_CHUNK_ID) return;
      const chunkNodes = chunkNodesMap.get(chunkId) ?? [];
      if (!chunkNodes.length) return;
      const hasStart = chunkNodes.some((node) => node.data?.tags?.includes("start"));
      if (!hasStart) {
        issues.push({
          id: `chunk-${chunkId}-entry`,
          message: `Chunk-ul ${chunk.title ?? chunk.id} nu are niciun nod de start.`,
          severity: "info",
          targetType: "chunk",
          targetId: chunkId,
        });
      }
      if (!chunkHasExit.get(chunkId)) {
        issues.push({
          id: `chunk-${chunkId}-exit`,
          message: `Chunk-ul ${chunk.title ?? chunk.id} nu are ieșiri spre alte lumi.`,
          severity: "info",
          targetType: "chunk",
          targetId: chunkId,
        });
      }
    });
  }

  if (overlays?.length) {
    const nodeIds = new Set(nodes.map((node) => node.id));
    overlays.forEach((overlay) => {
      if (!overlay.steps?.length) {
        issues.push({
          id: `overlay-${overlay.id}-empty`,
          message: `Overlay ${overlay.name} nu are pași definiți.`,
          severity: "info",
          targetType: "overlay",
          targetId: overlay.id,
        });
        return;
      }
      overlay.steps.forEach((step, index) => {
        if (!nodeIds.has(step.nodeId)) {
          issues.push({
            id: `overlay-${overlay.id}-missing-${index}`,
            message: `Overlay ${overlay.name} face referire la un nod inexistent (${step.nodeId}).`,
            severity: "warning",
            targetType: "overlay",
            targetId: overlay.id,
          });
        }
      });
    });
  }

  return issues;
}
