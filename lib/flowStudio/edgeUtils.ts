"use client";

export function buildEdgeGroupKey(source: string, target: string): string {
  if (source === target) return `${source}::${target}`;
  return [source, target].sort().join("::");
}

export function filterEdgesByNodeSet<T extends { source: string; target: string }>(
  edges: T[],
  allowedNodes: Set<string>,
): T[] {
  if (!allowedNodes.size) return [];
  return edges.filter((edge) => allowedNodes.has(edge.source) && allowedNodes.has(edge.target));
}
