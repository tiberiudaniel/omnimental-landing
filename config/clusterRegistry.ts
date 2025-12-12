import type { AdaptiveCluster } from "@/types/dailyPath";

export interface ClusterMeta {
  id: AdaptiveCluster;
  label: string;
  order: number;
  kind: "core";
}

const CLUSTER_META: ClusterMeta[] = [
  {
    id: "clarity_cluster",
    label: "clarity",
    order: 1,
    kind: "core",
  },
  {
    id: "emotional_flex_cluster",
    label: "emotional_flex",
    order: 2,
    kind: "core",
  },
  {
    id: "focus_energy_cluster",
    label: "focus_energy",
    order: 3,
    kind: "core",
  },
];

export const CLUSTER_REGISTRY: Record<AdaptiveCluster, ClusterMeta> = CLUSTER_META.reduce(
  (acc, meta) => {
    acc[meta.id] = meta;
    return acc;
  },
  {} as Record<AdaptiveCluster, ClusterMeta>,
);

export const CLUSTER_ROTATION: AdaptiveCluster[] = CLUSTER_META.sort(
  (a, b) => a.order - b.order,
).map((meta) => meta.id);

export function getClusterMeta(cluster: AdaptiveCluster): ClusterMeta {
  const meta = CLUSTER_REGISTRY[cluster];
  if (!meta) {
    throw new Error(`Cluster metadata missing for ${cluster}`);
  }
  return meta;
}
