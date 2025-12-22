"use client";

export function buildEdgeGroupKey(source: string, target: string): string {
  if (source === target) return `${source}::${target}`;
  return [source, target].sort().join("::");
}
