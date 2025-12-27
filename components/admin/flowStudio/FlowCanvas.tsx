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
  nodeCanExpandSteps: Map<string, boolean>;
  onRequestNodeSteps?: (nodeId: string) => void;
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
};

function StepNodeCard({ data, selected, issueCount }: StepNodeCardProps) {
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
    </div>
  );
}

function FlowNodeRenderer(props: NodeProps<FlowNodeData>) {
  const ctx = useFlowNodeContext();
  const availability = ctx.nodeStepAvailability.get(props.id) ?? "unknown";
  const manifestAvailable = Boolean(ctx.nodeCanExpandSteps.get(props.id));
  const canExpand = true; // Temporarily expose Steps for all nodes while diagnostics parity is validated
  if (DEBUG_STEPS) {
    console.log("[FlowCanvas] render FlowNodeCard", {
      nodeId: props.id,
      routePath: props.data.routePath,
      availability,
      manifestAvailable,
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
    />
  );
}

function StepNodeRenderer(props: NodeProps<StepNodeRenderData>) {
  const ctx = useFlowNodeContext();
  return <StepNodeCard {...props} issueCount={ctx.nodeIssueMap.get(props.id) ?? 0} />;
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
  nodes: Node<FlowNodeData | StepNodeRenderData>[];
  edges: Edge<FlowEdgeData>[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onInit: (instance: ReactFlowInstance) => void;
  onNodeSelect: (node: Node<FlowNodeData | StepNodeRenderData>) => void;
  onNodeDoubleClick?: (node: Node<FlowNodeData | StepNodeRenderData>) => void;
  onRequestNodeSteps?: (nodeId: string) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  onCanvasClear: () => void;
  nodeIssueMap: Map<string, number>;
  observedEnabled: boolean;
  observedNodeStats: Map<string, ObservedNodeStats> | null;
  disabled: boolean;
  wrapperRef: React.RefObject<HTMLDivElement>;
  onCanvasDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onCanvasDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
  onAutoLayout: () => void;
  extraHeader?: ReactNode;
  nodeStepAvailability: Map<string, StepAvailability>;
  autoLayoutRunning: boolean;
  nodeCanExpandSteps: Map<string, boolean>;
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
  onEdgeSelect,
  onCanvasClear,
  nodeIssueMap,
  observedEnabled,
  observedNodeStats,
  disabled,
  wrapperRef,
  onCanvasDragOver,
  onCanvasDrop,
  onAutoLayout,
  extraHeader,
  nodeStepAvailability,
  autoLayoutRunning,
  nodeCanExpandSteps,
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
      nodeCanExpandSteps,
      onRequestNodeSteps,
    }),
    [nodeCanExpandSteps, nodeIssueMap, nodeStepAvailability, observedEnabled, observedNodeStats, onRequestNodeSteps],
  );
  const nodeTypes = useMemo<NodeTypes>(() => ({ flowNode: FlowNodeRenderer, stepNode: StepNodeRenderer }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ parallel: ParallelEdge }), []);

  return (
    <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--omni-border-soft)] pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Canvas</p>
          <p className="text-sm text-[var(--omni-muted)]">Drag & drop routes aici pentru a crea noduri.</p>
        </div>
        <div className="flex items-center gap-2">
          {extraHeader}
          <button
            type="button"
            className={clsx(
              "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold",
              disabled || !nodes.length ? "cursor-not-allowed opacity-60" : "",
              autoLayoutRunning ? "bg-[var(--omni-ink)] text-white" : "",
            )}
            onClick={onAutoLayout}
            disabled={disabled || !nodes.length || autoLayoutRunning}
          >
            {autoLayoutRunning ? "Auto layout..." : "Auto layout"}
          </button>
        </div>
      </div>
      {disabled ? (
        <p className="p-6 text-sm text-[var(--omni-muted)]">Selectează sau creează un flow pentru a edita canvas-ul.</p>
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
              onNodeClick={(_, node) => onNodeSelect(node as Node<FlowNodeData | StepNodeRenderData>)}
              onNodeDoubleClick={(_, node) => onNodeDoubleClick?.(node as Node<FlowNodeData | StepNodeRenderData>)}
              onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
              onPaneClick={onCanvasClear}
              defaultEdgeOptions={{
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: "#0f172a",
                },
                interactionWidth: 32,
              }}
            >
              <MiniMap
                pannable
                zoomable
                position="bottom-right"
                className="!bg-white/85 !p-2 !rounded-xl !shadow-lg"
                style={{ width: 200, height: 140 }}
                nodeStrokeColor={(node) => (nodeIssueMap.get(node.id) ? "#f59e0b" : "#0f172a")}
                nodeColor={(node) => (node.selected ? "#e0f2fe" : "#ffffff")}
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
