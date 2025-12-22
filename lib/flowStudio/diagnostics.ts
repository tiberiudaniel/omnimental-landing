"use client";

import type { FlowIssue, FlowReactEdge, FlowReactNode } from "./types";

type MinimalRouteMap = Map<string, { routePath?: string }>;

export function computeFlowDiagnostics(
  nodes: FlowReactNode[],
  edges: FlowReactEdge[],
  routeMap?: MinimalRouteMap,
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

  return issues;
}
