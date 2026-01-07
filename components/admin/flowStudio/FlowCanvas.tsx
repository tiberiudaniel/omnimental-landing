"use client";

import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  MarkerType,
  MiniMap,
  getSimpleBezierPath,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
  type EdgeTypes,
  type ReactFlowInstance,
} from "reactflow";
import type { ReactNode, DragEvent as ReactDragEvent } from "react";
import { createContext, useContext, useMemo } from "react";
import "reactflow/dist/style.css";
import clsx from "clsx";
import type { FlowEdgeData, FlowNodeData, StepNodeRenderData } from "@/lib/flowStudio/types";
import type { ChunkNodeData } from "@/lib/flowStudio/chunkUtils";
import type { ObservedNodeStats } from "@/lib/flowStudio/observed";
import { FlowNodeCard } from "./FlowNodeCard";
import type { StepAvailability } from "./StepStatusBadge";
import { buildEdgeGroupKey } from "@/lib/flowStudio/edgeUtils";

const DEBUG_STEPS = process.env.NEXT_PUBLIC_FLOW_STUDIO_DEBUG_STEPS === "true";

const FALLBACK_EDGE_COLOR = "#0f172a";
const PARALLEL_EDGE_SPACING = 28;

type FlowNodeContextValue = {
  nodeIssueMap: Map<string, number>;
  observedEnabled: boolean;
  observedNodeStats: Map<string, ObservedNodeStats> | null;
  nodeStepAvailability: Map<string, StepAvailability>;
  onRequestNodeSteps?: (nodeId: string) => void;
  onPinStep?: (payload: { hostNodeId: string; stepId: string; stepLabel: string }) => void;
  commentCountMap: Map<string, number>;
  highlightNodeIds: Set<string> | null;
  dimmedNodeIds: Set<string> | null;
};

const FlowNodeContext = createContext<FlowNodeContextValue | null>(null);

function useFlowNodeContext() {
  const context = useContext(FlowNodeContext);
  if (!context) {
    throw new Error("FlowNode components must be used within FlowNodeContext");
  }
  return context;
}

type StepNodeCardProps = NodeProps<StepNodeRenderData> & {
  issueCount: number;
  onPinStep?: (payload: { hostNodeId: string; stepId: string; stepLabel: string }) => void;
};

function StepNodeCard({ data, selected, issueCount, onPinStep }: StepNodeCardProps) {
  return (
    <div
      className={clsx(
        "min-w-[140px] rounded-xl border border-dashed border-slate-400/70 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-inner",
        selected ? "border-slate-500 bg-white" : "",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate">{data.label}</span>
        {issueCount ? (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{issueCount}</span>
        ) : null}
      </div>
      {onPinStep ? (
        <button
          type="button"
          className="mt-2 w-full rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-500"
          onClick={(event) => {
            event.stopPropagation();
            onPinStep({ hostNodeId: data.parentNodeId, stepId: data.stepId, stepLabel: data.label });
          }}
        >
          Pin to journey
        </button>
      ) : null}
    </div>
  );
}

function ChunkNodeCard({ data, selected }: NodeProps<ChunkNodeData>) {
  const overlayHighlighted = Boolean(data.overlayHighlighted);
  const overlayDimmed = Boolean(data.overlayDimmed);
  const overlayStepCount = data.overlayStepCount ?? 0;
  return (
    <div
      className={clsx(
        "w-52 rounded-2xl border-2 px-3 py-2 text-left shadow-md transition",
        selected ? "shadow-[0_12px_24px_rgba(15,23,42,0.25)]" : "shadow-[0_6px_16px_rgba(15,23,42,0.15)]",
        overlayHighlighted ? "border-indigo-400 ring-2 ring-indigo-200" : "",
        overlayDimmed ? "opacity-30" : "",
      )}
      style={{
        borderColor: data.color ?? "var(--omni-border-soft)",
        background: "#fff",
      }}
    >
      <p className="text-sm font-semibold text-[var(--omni-ink)]">{data.title}</p>
      <p className="text-xs text-[var(--omni-muted)]">Total: {data.counts.total}</p>
      {overlayStepCount ? <p className="text-xs font-semibold text-indigo-700">Journey nodes: {overlayStepCount}</p> : null}
    </div>
  );
}

function FlowNodeRenderer(props: NodeProps<FlowNodeData>) {
  const ctx = useFlowNodeContext();
  const availability = ctx.nodeStepAvailability.get(props.id) ?? "unknown";
  const isStepScreen = props.data.kind === "stepScreen";
  const canExpand = availability === "available" && !isStepScreen;
  const dimmed = ctx.dimmedNodeIds ? ctx.dimmedNodeIds.has(props.id) : false;
  const highlighted = ctx.highlightNodeIds ? ctx.highlightNodeIds.has(props.id) : false;
  if (DEBUG_STEPS) {
    console.log("[FlowCanvas] render FlowNodeCard", {
      nodeId: props.id,
      routePath: props.data.routePath,
      availability,
      canExpand,
    });
  }
  return (
    <FlowNodeCard
      {...props}
      issueCount={ctx.nodeIssueMap.get(props.id) ?? 0}
      observedEnabled={ctx.observedEnabled}
      observedStats={ctx.observedNodeStats?.get(props.data.routePath ?? "")}
      stepStatus={availability}
      canExpandSteps={canExpand}
      onExpandSteps={(nodeId) => ctx.onRequestNodeSteps?.(nodeId)}
      commentCount={ctx.commentCountMap.get(props.id) ?? 0}
      dimmed={dimmed}
      highlighted={highlighted}
    />
  );
}

function StepNodeRenderer(props: NodeProps<StepNodeRenderData>) {
  const ctx = useFlowNodeContext();
  return (
    <StepNodeCard
      {...props}
      issueCount={ctx.nodeIssueMap.get(props.id) ?? 0}
      onPinStep={ctx.onPinStep}
    />
  );
}

type ParallelEdgeProps = EdgeProps<FlowEdgeData>;

function ParallelEdge(props: ParallelEdgeProps) {
  const offset = props.data?.renderOffset ?? 0;
  const dx = props.targetX - props.sourceX;
  const dy = props.targetY - props.sourceY;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const perpX = (-dy / length) * offset;
  const perpY = (dx / length) * offset;
  const sourceX = props.sourceX + perpX;
  const sourceY = props.sourceY + perpY;
  const targetX = props.targetX + perpX;
  const targetY = props.targetY + perpY;
  const color = props.data?.color ?? FALLBACK_EDGE_COLOR;
  const [path, labelX, labelY] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition: props.sourcePosition,
    targetX,
    targetY,
    targetPosition: props.targetPosition,
  });
  const label = props.data?.command ?? props.label;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        markerStart={props.markerStart}
        interactionWidth={props.interactionWidth ?? 42}
        style={{ ...(props.style ?? {}), stroke: color, strokeWidth: 2 }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <button
            type="button"
            className={clsx(
              "rounded-full border px-2 py-0.5 text-[11px] font-semibold shadow-sm",
              props.selected ? "border-[var(--omni-energy)] bg-white text-[var(--omni-ink)]" : "border-white/70 bg-white/80 text-[var(--omni-muted)]",
            )}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
              minWidth: 60,
            }}
            onClick={(event) => {
              event.stopPropagation();
              props.data?.runtime?.onLabelSelect?.(props.id);
            }}
          >
            {label}
          </button>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

type FlowCanvasProps = {
  nodes: Node<FlowNodeData | StepNodeRenderData | ChunkNodeData>[];
  edges: Edge<FlowEdgeData>[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onInit: (instance: ReactFlowInstance) => void;
  onNodeSelect: (node: Node<FlowNodeData | StepNodeRenderData | ChunkNodeData>) => void;
  onNodeDoubleClick?: (node: Node<FlowNodeData | StepNodeRenderData | ChunkNodeData>) => void;
  onRequestNodeSteps?: (nodeId: string) => void;
  onPinStep?: (payload: { hostNodeId: string; stepId: string; stepLabel: string }) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  onEdgeUpdate?: (oldEdge: Edge<FlowEdgeData>, newConnection: Connection) => void;
  onCanvasClear: () => void;
  nodeIssueMap: Map<string, number>;
  observedEnabled: boolean;
  observedNodeStats: Map<string, ObservedNodeStats> | null;
  disabled: boolean;
  wrapperRef: React.RefObject<HTMLDivElement>;
  onCanvasDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onCanvasDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
  onAutoLayout: () => void;
  primaryHeaderActions?: ReactNode;
  extraHeader?: ReactNode;
  nodeStepAvailability: Map<string, StepAvailability>;
  autoLayoutRunning: boolean;
  viewMode: "nodes" | "chunks";
  autoLayoutDisabled?: boolean;
  onSelectionChange?: (params: { nodes: Node<FlowNodeData | StepNodeRenderData | ChunkNodeData>[]; edges: Edge<FlowEdgeData>[] }) => void;
  nodeCommentCounts: Map<string, number>;
  highlightNodeIds?: Set<string> | null;
  dimmedNodeIds?: Set<string> | null;
};

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onNodeSelect,
  onNodeDoubleClick,
  onRequestNodeSteps,
  onPinStep,
  onEdgeSelect,
  onEdgeUpdate,
  onCanvasClear,
  nodeIssueMap,
  observedEnabled,
  observedNodeStats,
  disabled,
  wrapperRef,
  onCanvasDragOver,
  onCanvasDrop,
  onAutoLayout,
  primaryHeaderActions,
  extraHeader,
  nodeStepAvailability,
  autoLayoutRunning,
  viewMode,
  autoLayoutDisabled,
  onSelectionChange,
  nodeCommentCounts,
  highlightNodeIds = null,
  dimmedNodeIds = null,
}: FlowCanvasProps) {
  const decoratedEdges = useMemo(() => {
    if (!edges.length) return edges;
    const clones = edges.map((edge) => {
      const color = edge.data?.color ?? FALLBACK_EDGE_COLOR;
      return {
        ...edge,
        type: "parallel",
        data: {
          ...(edge.data ?? {}),
          runtime: {
            ...(edge.data?.runtime ?? {}),
            onLabelSelect: (edgeId: string) => onEdgeSelect(edgeId),
          },
        },
        style: {
          ...(edge.style ?? {}),
          stroke: color,
        },
        markerEnd: edge.markerEnd ?? { type: MarkerType.ArrowClosed, color },
      };
    });
    const groups = new Map<string, number[]>();
    clones.forEach((edge, index) => {
      const undirectedKey = buildEdgeGroupKey(edge.source, edge.target);
      const current = groups.get(undirectedKey);
      if (current) {
        current.push(index);
      } else {
        groups.set(undirectedKey, [index]);
      }
    });
    groups.forEach((indexes) => {
      if (indexes.length < 2) return;
      const center = (indexes.length - 1) / 2;
      indexes.forEach((edgeIndex, position) => {
        const ref = clones[edgeIndex];
        const baseOffset = (position - center) * PARALLEL_EDGE_SPACING;
        const canonicalKey = ref.source <= ref.target;
        const offset = canonicalKey ? baseOffset : -baseOffset;
        clones[edgeIndex] = {
          ...ref,
          data: {
            ...(ref.data ?? {}),
            renderOffset: offset,
          },
        };
      });
    });
    return clones;
  }, [edges, onEdgeSelect]);
  const nodeContextValue = useMemo(
    () => ({
      nodeIssueMap,
      observedEnabled,
      observedNodeStats,
      nodeStepAvailability,
      onRequestNodeSteps,
      onPinStep,
      commentCountMap: nodeCommentCounts,
      highlightNodeIds,
      dimmedNodeIds,
    }),
    [
      dimmedNodeIds,
      highlightNodeIds,
      nodeCommentCounts,
      nodeIssueMap,
      nodeStepAvailability,
      observedEnabled,
      observedNodeStats,
      onRequestNodeSteps,
      onPinStep,
    ],
  );
  const nodeTypes = useMemo<NodeTypes>(() => ({ flowNode: FlowNodeRenderer, stepNode: StepNodeRenderer, chunkNode: ChunkNodeCard }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ parallel: ParallelEdge }), []);
  const defaultEdgeOptions = useMemo(
    () => ({
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#0f172a",
      },
      interactionWidth: 32,
    }),
    [],
  );
  const layoutButtonDisabled = disabled || !nodes.length || autoLayoutRunning || autoLayoutDisabled;

  return (
    <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--omni-border-soft)] pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Canvas</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {primaryHeaderActions}
          <button
            type="button"
            className={clsx(
              "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold",
              layoutButtonDisabled ? "cursor-not-allowed opacity-60" : "",
              autoLayoutRunning ? "bg-[var(--omni-ink)] text-white" : "",
            )}
            onClick={onAutoLayout}
            disabled={layoutButtonDisabled}
            title={autoLayoutDisabled ? "Disponibil doar in modul Nodes" : undefined}
            >
              {autoLayoutRunning ? "Auto layout..." : "Auto layout"}
            </button>
        </div>
      </div>
      {extraHeader ? <div className="mt-3">{extraHeader}</div> : null}
      {disabled ? (
        <p className="p-6 text-sm text-[var(--omni-muted)]">Selectează sau creează un map pentru a edita canvas-ul.</p>
      ) : (
        <FlowNodeContext.Provider value={nodeContextValue}>
          <div ref={wrapperRef} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop} className="mt-4 h-[560px] rounded-2xl border border-[var(--omni-border-soft)] bg-white">
            <ReactFlow
              nodes={nodes}
              edges={decoratedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={onInit}
              fitView
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodesDraggable={viewMode === "nodes"}
              nodesConnectable={viewMode === "nodes"}
              onNodeClick={(_, node) => onNodeSelect(node as Node<FlowNodeData | StepNodeRenderData | ChunkNodeData>)}
              onNodeDoubleClick={(_, node) => onNodeDoubleClick?.(node as Node<FlowNodeData | StepNodeRenderData | ChunkNodeData>)}
              onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
              onPaneClick={onCanvasClear}
              onSelectionChange={(params) =>
                onSelectionChange?.({
                  nodes: params.nodes as Node<FlowNodeData | StepNodeRenderData | ChunkNodeData>[],
                  edges: params.edges as Edge<FlowEdgeData>[],
                })
              }
              edgesUpdatable={viewMode === "nodes"}
              onEdgeUpdate={viewMode === "nodes" ? onEdgeUpdate : undefined}
              edgeUpdaterRadius={24}
              defaultEdgeOptions={defaultEdgeOptions}
              minZoom={0.1}
            >
              <MiniMap
                pannable
                zoomable
                position="bottom-right"
                className="!bg-white/85 !p-2 !rounded-xl !shadow-lg"
                style={{ width: 200, height: 140 }}
                nodeStrokeColor={(node) => {
                  if (node.type === "chunkNode") {
                    const data = node.data as ChunkNodeData;
                    return data.color ?? "#0f172a";
                  }
                  return nodeIssueMap.get(node.id) ? "#f59e0b" : "#0f172a";
                }}
                nodeColor={(node) => {
                  if (node.type === "chunkNode") {
                    const data = node.data as ChunkNodeData;
                    return data.color ?? "#f8fafc";
                  }
                  return node.selected ? "#e0f2fe" : "#ffffff";
                }}
              />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </FlowNodeContext.Provider>
      )}
    </section>
  );
}
