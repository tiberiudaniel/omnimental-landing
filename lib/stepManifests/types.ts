"use client";

export type StepNode = {
  id: string;
  label: string;
  kind?: string;
};

export type StepEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  variant?: "start" | "next" | "skip" | "finish";
};

export type StepManifest = {
  routePath: string;
  nodes: StepNode[];
  edges: StepEdge[];
  startNodeId?: string | null;
  terminalNodeIds?: string[];
};

export type StepManifestContext = {
  locale?: string;
  variant?: string;
};
