"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent as ReactDragEvent } from "react";
import clsx from "clsx";
import type { Edge, Node } from "reactflow";
import type { CopyFields } from "@/lib/useCopy";
import type {
  FlowChunk,
  FlowComment,
  FlowEdgeData,
  FlowIssue,
  FlowNodeData,
  FlowNodeInternalStep,
  FlowNodePortalConfig,
  StepScreenConfig,
  FlowOverlay,
  FlowOverlayStep,
  LabelMap,
  RouteDoc,
} from "@/lib/flowStudio/types";
import type { ObservedEvent } from "@/lib/flowStudio/observed";
import { StepStatusBadge, type StepAvailability } from "./StepStatusBadge";
import { buildStepScreenHref } from "@/lib/flowStudio/stepScreenUtils";
import { getStepsForRoute } from "@/lib/stepManifests/stepRegistry";

const DEBUG_STEPS = process.env.NEXT_PUBLIC_FLOW_STUDIO_DEBUG_STEPS === "true";
const NODE_GATING_NOTES: Record<string, { title: string; entries: string[] }> = {
  "/intro/explore": {
    title: "Gating & shortcuts",
    entries: [
      "Setează intro_explore_completion=cat-lite/axes la final.",
      "Dacă intro_explore_completion este set, route-ul sare direct în Today.",
    ],
  },
  "/onboarding/cat-lite-2": {
    title: "Gating & shortcuts",
    entries: [
      "Rulează doar când needsCatLitePart2 === true.",
      "Dacă needsCatLitePart2 === false, redirect imediat în Today (deep).",
    ],
  },
};

const EDGE_COLOR_FALLBACK = "#0f172a";
const EDGE_COLOR_PALETTE = ["#0f172a", "#0369a1", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];
type JourneyStatus = NonNullable<FlowOverlay["status"]>;
const JOURNEY_STATUS_OPTIONS: Array<{ value: JourneyStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "deprecated", label: "Deprecated" },
  { value: "archived", label: "Archived" },
];

export type FlowStats = {
  nodeCount: number;
  edgeCount: number;
  orphanCount: number;
  unreachableCount: number;
  hasExplicitStart: boolean;
};

export type MissingManifestNode = {
  nodeId: string;
  routePath: string;
  label: string;
};

type InspectorPanelProps = {
  diagnostics: FlowIssue[];
  onSelectIssue: (issue: FlowIssue) => void;
  missingManifestNodes: MissingManifestNode[];
  onSelectMissingManifestNode: (nodeId: string) => void;
  flowStats: FlowStats;
  stepsExpanded: boolean;
  onToggleSteps: () => void;
  stepStatus: StepAvailability;
  canFixRouteMapping: boolean;
  onFixRouteMapping: () => void;
  stepFixError: string | null;
  routeMap: Map<string, RouteDoc>;
  copyDraft: { ro: CopyFields; en: CopyFields };
  onCopyFieldChange: (locale: "ro" | "en", field: keyof CopyFields, value: string) => void;
  onSaveCopy: () => void;
  copyLoading: boolean;
  copyError: string | null;
  setCopyError: (value: string | null) => void;
  selectedNode: Node<FlowNodeData> | null;
  selectedEdge: Edge<FlowEdgeData> | null;
  onLabelChange: (nodeId: string, locale: "ro" | "en", value: string) => void;
  onNodeTagsChange: (nodeId: string, tags: string[]) => void;
  onPortalChange: (nodeId: string, portal: FlowNodePortalConfig | null) => void;
  onStepScreenChange: (nodeId: string, updates: Partial<StepScreenConfig>) => void;
  onEdgeFieldChange: (edgeId: string, updates: Partial<FlowEdgeData>) => void;
  onApplyEdgeColorToGroup: (edgeId: string, color: string) => void;
  onCollapse: () => void;
  observedEnabled: boolean;
  observedEvents: ObservedEvent[];
  debugInfo?: {
    hostNodeId: string;
    routePath: string | null;
    routeMismatch: boolean;
    hasManifest: boolean;
    isExpanded: boolean;
    stepNodeCountForHost: number;
  } | null;
  selectedStepDetails: {
    hostNodeId: string;
    hostLabel: string | null;
    stepId: string;
    stepLabel: string;
    stepKind: string | null;
  } | null;
  chunks: FlowChunk[];
  defaultChunkId: string | null;
  onNodeChunkChange: (nodeId: string, chunkId: string | null) => void;
  onAutoAssignChunks: () => void;
  nodeComments: FlowComment[];
  routeOptions: RouteDoc[];
  portalNodeOptions: PortalNodeOption[];
  onAddNodeComment: (message: string) => void;
  onDeleteNodeComment: (commentId: string) => void;
  onToggleNodeCommentResolved: (commentId: string) => void;
  onExportAuditSnapshot: () => void;
  onPublishIntroStepOrder: () => void;
  publishIntroStepOrderLoading: boolean;
  overlays: FlowOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (overlayId: string | null) => void;
  onCreateOverlay: (name: string) => void;
  onDeleteOverlay: (overlayId: string) => void;
  onOverlayMetadataChange: (
    overlayId: string,
    updates: Partial<Pick<FlowOverlay, "name" | "description" | "status" | "entryRoutePath" | "exitRoutePath">>,
  ) => void;
  onOverlayAddNodes: (overlayId: string, nodeIds: string[]) => void;
  onOverlayRemoveStep: (overlayId: string, index: number) => void;
  onOverlayReorderSteps: (overlayId: string, fromIndex: number, toIndex: number) => void;
  onOverlayStepUpdate: (overlayId: string, index: number, updates: Partial<FlowOverlayStep>) => void;
  onRepairOverlaySteps: (overlayId: string) => void;
  onOverlayStepFocus: (nodeId: string) => void;
  selectedNodeIds: string[];
  nodeLabelMap: Map<string, string>;
  nodeRouteMap: Map<string, string>;
  overlayTabRequest?: { tab: InspectorTab; nonce: number } | null;
  nodeCanExpandSteps: Map<string, boolean>;
  resolveCanonicalNode: (node: Node<FlowNodeData> | null) => Node<FlowNodeData> | null;
  onInternalStepsChange: (nodeId: string, steps: FlowNodeInternalStep[]) => void;
  canEditInternalFlowNode: (node: Node<FlowNodeData>) => boolean;
};

export type InspectorTab = "basics" | "portal" | "diagnostics" | "overlays" | "advanced";

export function InspectorPanel({
  diagnostics,
  onSelectIssue,
  missingManifestNodes,
  onSelectMissingManifestNode,
  flowStats,
  stepsExpanded,
  onToggleSteps,
  stepStatus,
  canFixRouteMapping,
  onFixRouteMapping,
  stepFixError,
  routeMap,
  copyDraft,
  onCopyFieldChange,
  onSaveCopy,
  copyLoading,
  copyError,
  setCopyError,
  selectedNode,
  selectedEdge,
  onLabelChange,
  onNodeTagsChange,
  onPortalChange,
  onStepScreenChange,
  onEdgeFieldChange,
  onApplyEdgeColorToGroup,
  onCollapse,
  observedEnabled,
  observedEvents,
  debugInfo,
  selectedStepDetails,
  chunks,
  defaultChunkId,
  onNodeChunkChange,
  onAutoAssignChunks,
  nodeComments,
  onAddNodeComment,
  onDeleteNodeComment,
  onToggleNodeCommentResolved,
  routeOptions,
  portalNodeOptions,
  onExportAuditSnapshot,
  onPublishIntroStepOrder,
  publishIntroStepOrderLoading,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onCreateOverlay,
  onDeleteOverlay,
  onOverlayMetadataChange,
  onOverlayAddNodes,
  onOverlayRemoveStep,
  onOverlayReorderSteps,
  onOverlayStepUpdate,
  onRepairOverlaySteps,
  onOverlayStepFocus,
  selectedNodeIds,
  nodeLabelMap,
  nodeRouteMap,
  overlayTabRequest,
  nodeCanExpandSteps,
  resolveCanonicalNode,
  onInternalStepsChange,
  canEditInternalFlowNode,
}: InspectorPanelProps) {
  const canonicalNode = resolveCanonicalNode(selectedNode);
  const canExpandStepsForNode = canonicalNode ? Boolean(nodeCanExpandSteps.get(canonicalNode.id)) : false;
  const selectedNodeIsStepScreen = canonicalNode?.data.kind === "stepScreen";
  const expandTitle =
    !canonicalNode
      ? "Selecteaza un nod."
      : selectedNodeIsStepScreen
        ? "StepScreen-urile se gestionează din nodul host."
          : !canExpandStepsForNode
          ? stepStatus === "route-mismatch"
            ? "Fix mapping pentru a vedea flow-ul intern."
            : "Adaugă FlowDoc internalSteps pentru acest nod."
          : undefined;
  const shouldShowStepStatusBadge = Boolean(canonicalNode && !selectedNodeIsStepScreen);
  const shouldShowStepsButton = Boolean(!selectedNodeIsStepScreen && canExpandStepsForNode);
  const portalEligible = canonicalNode ? nodeLooksLikePortal(canonicalNode) : false;
  const portalTabVisible = Boolean(canonicalNode);
  const [activeTab, setActiveTab] = useState<InspectorTab>("basics");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeTab === "portal" && (!portalTabVisible || !portalEligible)) {
      const raf = window.requestAnimationFrame(() => setActiveTab("basics"));
      return () => window.cancelAnimationFrame(raf);
    }
    if (activeTab === "advanced" && !selectedNode) {
      const raf = window.requestAnimationFrame(() => setActiveTab("basics"));
      return () => window.cancelAnimationFrame(raf);
    }
    return undefined;
  }, [activeTab, portalEligible, portalTabVisible, selectedNode]);
  useEffect(() => {
    if (!overlayTabRequest || typeof window === "undefined") return;
    const raf = window.requestAnimationFrame(() => setActiveTab(overlayTabRequest.tab));
    return () => window.cancelAnimationFrame(raf);
  }, [overlayTabRequest]);

  const internalStepsForDisplay = canonicalNode?.data.internalSteps ?? null;
  const internalFlowEditable = canonicalNode ? canEditInternalFlowNode(canonicalNode) : false;

  const tabs = [
    { key: "basics" as const, label: "Basics" },
    { key: "portal" as const, label: "Portal", disabled: !portalEligible, hidden: !portalTabVisible },
    { key: "overlays" as const, label: "Journeys" },
    { key: "diagnostics" as const, label: "Diagnostics" },
    { key: "advanced" as const, label: "Advanced", disabled: !selectedNode },
  ];
  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  const renderTabContent = () => {
    switch (activeTab) {
      case "basics":
        if (!selectedNode) {
          return <EmptyState message="Selectează un nod pentru a vedea detaliile de bază." />;
        }
        return (
          <NodeBasicsSection
            node={selectedNode}
            routeMap={routeMap}
            chunks={chunks}
            defaultChunkId={defaultChunkId}
            onChunkChange={onNodeChunkChange}
            onAutoAssignChunks={onAutoAssignChunks}
            onLabelChange={onLabelChange}
            onNodeTagsChange={onNodeTagsChange}
            portalNodeOptions={portalNodeOptions}
            onPortalTabRequest={() => setActiveTab("portal")}
            onPortalChange={onPortalChange}
            internalSteps={internalStepsForDisplay}
            onStepScreenChange={onStepScreenChange}
            canEditInternalFlow={internalFlowEditable}
            onInternalStepsChange={onInternalStepsChange}
          />
        );
      case "portal":
        if (!selectedNode) {
          return <EmptyState message="Selectează un nod pentru a configura portalul." />;
        }
        return (
          <NodePortalSection
            node={selectedNode}
            isPortalNode={portalEligible}
            routeOptions={routeOptions}
            portalNodeOptions={portalNodeOptions}
            onPortalChange={onPortalChange}
          />
        );
      case "overlays":
        return (
          <OverlayManagerSection
            overlays={overlays}
            selectedOverlayId={selectedOverlayId}
            onSelectOverlay={onSelectOverlay}
            onCreateOverlay={onCreateOverlay}
            onDeleteOverlay={onDeleteOverlay}
            onOverlayMetadataChange={onOverlayMetadataChange}
            onOverlayAddNodes={onOverlayAddNodes}
            onOverlayRemoveStep={onOverlayRemoveStep}
            onOverlayReorderSteps={onOverlayReorderSteps}
            onOverlayStepUpdate={onOverlayStepUpdate}
            selectedNodeIds={selectedNodeIds}
            nodeLabelMap={nodeLabelMap}
            nodeRouteMap={nodeRouteMap}
            onRepairOverlaySteps={onRepairOverlaySteps}
            onOverlayStepFocus={onOverlayStepFocus}
          />
        );
      case "diagnostics":
        return (
          <DiagnosticsSection
            diagnostics={diagnostics}
            onSelectIssue={onSelectIssue}
            flowStats={flowStats}
            missingManifestNodes={missingManifestNodes}
            onSelectMissingManifestNode={onSelectMissingManifestNode}
            debugInfo={debugInfo}
            observedEnabled={observedEnabled}
            observedEvents={observedEvents}
            onExportAuditSnapshot={onExportAuditSnapshot}
            onPublishIntroStepOrder={onPublishIntroStepOrder}
            publishIntroStepOrderLoading={publishIntroStepOrderLoading}
          />
        );
      case "advanced":
        if (!selectedNode) {
          return <EmptyState message="Selectează un nod pentru opțiunile avansate." />;
        }
        return (
          <NodeAdvancedSection
            comments={nodeComments}
            onAddComment={onAddNodeComment}
            onDeleteComment={onDeleteNodeComment}
            onToggleCommentResolved={onToggleNodeCommentResolved}
            copyDraft={copyDraft}
            onCopyFieldChange={onCopyFieldChange}
            onSaveCopy={onSaveCopy}
            copyLoading={copyLoading}
            copyError={copyError}
            setCopyError={setCopyError}
          />
        );
      default:
        return null;
    }
  };

  return (
    <aside className="space-y-4 rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4 text-sm shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Inspector</p>
        <button
          type="button"
          className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold"
          onClick={onCollapse}
        >
          Ascunde
        </button>
      </div>
      {selectedStepDetails ? (
        <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-xs shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Step selectat</p>
            {selectedStepDetails.stepKind ? (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                {selectedStepDetails.stepKind}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--omni-ink)]">{selectedStepDetails.stepLabel}</p>
          <p className="text-[11px] text-[var(--omni-muted)]">Din: {selectedStepDetails.hostLabel ?? selectedStepDetails.hostNodeId}</p>
          <p className="text-[10px] text-[var(--omni-muted)]">ID: {selectedStepDetails.stepId}</p>
        </div>
      ) : null}
      {selectedNode ? (
        <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {shouldShowStepStatusBadge ? <StepStatusBadge status={stepStatus} variant="solid" /> : null}
            <div className="flex flex-wrap items-center gap-2">
              {shouldShowStepsButton ? (
                <button
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-2 text-xs font-semibold",
                    stepsExpanded ? "border-sky-500 text-sky-500" : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]",
                    !canExpandStepsForNode ? "opacity-60" : "",
                  )}
                  onClick={onToggleSteps}
                  disabled={!canExpandStepsForNode}
                  title={expandTitle}
                >
                  {stepsExpanded ? "Ascunde pasii" : "Expand steps"}
                </button>
              ) : null}
              {stepStatus === "route-mismatch" ? (
                <button
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-2 text-xs font-semibold",
                    canFixRouteMapping ? "border-amber-500 text-amber-600" : "opacity-60",
                  )}
                  disabled={!canFixRouteMapping}
                  onClick={onFixRouteMapping}
                >
                  Fix mapping
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {stepFixError ? <p className="text-xs text-rose-400">{stepFixError}</p> : null}
      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              activeTab === tab.key ? "border-[var(--omni-ink)] bg-[var(--omni-ink)] text-white" : "border-[var(--omni-border-soft)] text-[var(--omni-muted)]",
              tab.disabled ? "cursor-not-allowed opacity-60" : "",
            )}
            onClick={() => !tab.disabled && setActiveTab(tab.key)}
            disabled={Boolean(tab.disabled)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="space-y-4">{renderTabContent()}</div>
      {selectedEdge ? (
        <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
          <EdgeInspector edge={selectedEdge} onFieldChange={onEdgeFieldChange} onApplyColorGroup={onApplyEdgeColorToGroup} />
        </div>
      ) : null}
    </aside>
  );
}

type FlowDiagnosticsPanelProps = {
  issues: FlowIssue[];
  onSelectIssue: (issue: FlowIssue) => void;
  flowStats: FlowStats;
};

function FlowDiagnosticsPanel({ issues, onSelectIssue, flowStats }: FlowDiagnosticsPanelProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Flow diagnostics</p>
      <ul className="space-y-2 text-xs">
        <li className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[var(--omni-ink)]">Nodes: {flowStats.nodeCount}</span>
          <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[var(--omni-ink)]">Edges: {flowStats.edgeCount}</span>
          <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[var(--omni-ink)]">Orphans: {flowStats.orphanCount}</span>
          <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[var(--omni-ink)]">Unreachable: {flowStats.unreachableCount}</span>
        </li>
      </ul>
      {issues.length ? (
        <ul className="space-y-1">
          {issues.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                className="w-full rounded-xl border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-left text-xs"
                onClick={() => onSelectIssue(issue)}
              >
                <span className="font-semibold text-[var(--omni-ink)]">{issue.type}</span>: {issue.message}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--omni-muted)]">Nu există probleme raportate.</p>
      )}
    </div>
  );
}

function MissingManifestPanel({
  nodes,
  onSelectNode,
}: {
  nodes: MissingManifestNode[];
  onSelectNode: (nodeId: string) => void;
}) {
  if (!nodes.length) return null;
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Missing manifests</p>
      <ul className="space-y-1 text-xs">
        {nodes.map((entry) => (
          <li key={entry.nodeId}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border px-3 py-1"
              onClick={() => onSelectNode(entry.nodeId)}
            >
              <span className="font-semibold text-[var(--omni-ink)]">{entry.label}</span>
              {entry.routePath ? <span className="text-[var(--omni-muted)]">{entry.routePath}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DebugInfoPanel({ info }: { info?: InspectorPanelProps["debugInfo"] }) {
  if (!info) return null;
  return (
    <div className="rounded-2xl border border-dashed border-amber-500/60 bg-white/95 p-3 text-xs text-[var(--omni-muted)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">Debug</p>
      <ul className="mt-2 space-y-1 font-mono text-[11px] text-[var(--omni-ink)]">
        <li>hostNodeId: {info.hostNodeId}</li>
        <li>routePath: {info.routePath ?? "n/a"}</li>
        <li>routeMismatch: {info.routeMismatch ? "true" : "false"}</li>
        <li>hasManifest: {info.hasManifest ? "true" : "false"}</li>
        <li>isExpanded: {info.isExpanded ? "true" : "false"}</li>
        <li>stepNodesForHost: {info.stepNodeCountForHost}</li>
      </ul>
    </div>
  );
}

type PortalNodeOption = {
  id: string;
  label: string;
};

type NodeBasicsSectionProps = {
  node: Node<FlowNodeData>;
  routeMap: Map<string, RouteDoc>;
  chunks: FlowChunk[];
  defaultChunkId: string | null;
  onChunkChange: (nodeId: string, chunkId: string | null) => void;
  onAutoAssignChunks: () => void;
  onLabelChange: (nodeId: string, locale: "ro" | "en", value: string) => void;
  onNodeTagsChange: (nodeId: string, tags: string[]) => void;
  portalNodeOptions: PortalNodeOption[];
  onPortalTabRequest: () => void;
  onPortalChange: (nodeId: string, portal: FlowNodePortalConfig | null) => void;
  internalSteps?: FlowNodeInternalStep[] | null;
  onStepScreenChange?: (nodeId: string, updates: Partial<StepScreenConfig>) => void;
  canEditInternalFlow?: boolean;
  onInternalStepsChange?: (nodeId: string, steps: FlowNodeInternalStep[]) => void;
};

type StepScreenPresetRow = { key: string; value: string };

const buildPresetRows = (preset?: Record<string, string> | null): StepScreenPresetRow[] => {
  const entries = preset ? Object.entries(preset) : [];
  if (!entries.length) {
    return [{ key: "", value: "" }];
  }
  return entries.map(([key, value]) => ({ key, value }));
};

const presetRowsEqual = (a: StepScreenPresetRow[], b: StepScreenPresetRow[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index].key !== b[index].key || a[index].value !== b[index].value) {
      return false;
    }
  }
  return true;
};

type NodePortalSectionProps = {
  node: Node<FlowNodeData>;
  isPortalNode: boolean;
  routeOptions: RouteDoc[];
  portalNodeOptions: PortalNodeOption[];
  onPortalChange: (nodeId: string, portal: FlowNodePortalConfig | null) => void;
};

type DiagnosticsSectionProps = {
  diagnostics: FlowIssue[];
  onSelectIssue: (issue: FlowIssue) => void;
  flowStats: FlowStats;
  missingManifestNodes: MissingManifestNode[];
  onSelectMissingManifestNode: (nodeId: string) => void;
  debugInfo?: InspectorPanelProps["debugInfo"];
  observedEnabled: boolean;
  observedEvents: ObservedEvent[];
  onExportAuditSnapshot: () => void;
  onPublishIntroStepOrder: () => void;
  publishIntroStepOrderLoading: boolean;
};

type NodeAdvancedSectionProps = {
  comments: FlowComment[];
  onAddComment: (message: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleCommentResolved: (commentId: string) => void;
  copyDraft: { ro: CopyFields; en: CopyFields };
  onCopyFieldChange: (locale: "ro" | "en", field: keyof CopyFields, value: string) => void;
  onSaveCopy: () => void;
  copyLoading: boolean;
  copyError: string | null;
  setCopyError: (value: string | null) => void;
};

type OverlayManagerSectionProps = {
  overlays: FlowOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (overlayId: string | null) => void;
  onCreateOverlay: (name: string) => void;
  onDeleteOverlay: (overlayId: string) => void;
  onOverlayMetadataChange: (
    overlayId: string,
    updates: Partial<Pick<FlowOverlay, "name" | "description" | "status" | "entryRoutePath" | "exitRoutePath">>,
  ) => void;
  onOverlayAddNodes: (overlayId: string, nodeIds: string[]) => void;
  onOverlayRemoveStep: (overlayId: string, index: number) => void;
  onOverlayReorderSteps: (overlayId: string, fromIndex: number, toIndex: number) => void;
  onOverlayStepUpdate: (overlayId: string, index: number, updates: Partial<FlowOverlayStep>) => void;
  selectedNodeIds: string[];
  nodeLabelMap: Map<string, string>;
  nodeRouteMap: Map<string, string>;
  onRepairOverlaySteps: (overlayId: string) => void;
  onOverlayStepFocus: (nodeId: string) => void;
};

function NodeBasicsSection({
  node,
  routeMap,
  chunks,
  defaultChunkId,
  onChunkChange,
  onAutoAssignChunks,
  onLabelChange,
  onNodeTagsChange,
  portalNodeOptions,
  onPortalTabRequest,
  onPortalChange,
  internalSteps,
  onStepScreenChange,
  canEditInternalFlow = false,
  onInternalStepsChange,
}: NodeBasicsSectionProps) {
  const route = node.data.routeId ? routeMap.get(node.data.routeId) : undefined;
  const [tagDraft, setTagDraft] = useState(node.data.tags?.join(", ") ?? "");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raf = window.requestAnimationFrame(() => setTagDraft(node.data.tags?.join(", ") ?? ""));
    return () => window.cancelAnimationFrame(raf);
  }, [node.data.tags, node.id]);

  const isStepScreen = node.data.kind === "stepScreen";
  const stepScreenConfig = isStepScreen ? node.data.stepScreen ?? null : null;
  const hostRoutePath = stepScreenConfig?.hostRoutePath ?? node.data.routePath ?? "";
  const stepOptions = useMemo(() => {
    if (!isStepScreen || !hostRoutePath) return [];
    return getStepsForRoute(hostRoutePath);
  }, [hostRoutePath, isStepScreen]);
  const stepExists = !isStepScreen || !stepScreenConfig?.stepKey
    ? true
    : stepOptions.some((entry) => entry.stepKey === stepScreenConfig.stepKey);
  const [stepPresetRows, setStepPresetRows] = useState<StepScreenPresetRow[]>(() =>
    buildPresetRows(stepScreenConfig?.queryPreset ?? null),
  );
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setStepPresetRows((prev) => {
        const next = buildPresetRows(stepScreenConfig?.queryPreset ?? null);
        return presetRowsEqual(prev, next) ? prev : next;
      });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [node.id, stepScreenConfig?.queryPreset]);
  const previewHref = stepScreenConfig ? buildStepScreenHref(stepScreenConfig) : null;
  const commitPresetRows = useCallback(
    (rows: StepScreenPresetRow[]) => {
      if (!onStepScreenChange || !isStepScreen) return;
      const normalized = rows
        .map(({ key, value }) => ({ key: key.trim(), value: value.trim() }))
        .filter((entry) => entry.key.length);
      if (!normalized.length) {
        onStepScreenChange(node.id, { queryPreset: undefined });
        return;
      }
      const preset: Record<string, string> = {};
      normalized.forEach(({ key, value }) => {
        preset[key] = value;
      });
      onStepScreenChange(node.id, { queryPreset: preset });
    },
    [isStepScreen, node.id, onStepScreenChange],
  );
  const handlePresetRowChange = useCallback(
    (index: number, field: "key" | "value", value: string) => {
      setStepPresetRows((prev) => {
        const next = [...prev];
        const target = next[index] ?? { key: "", value: "" };
        next[index] = { ...target, [field]: value };
        commitPresetRows(next);
        return next;
      });
    },
    [commitPresetRows],
  );
  const handleAddPresetRow = useCallback(() => {
    setStepPresetRows((prev) => [...prev, { key: "", value: "" }]);
  }, []);
  const handleRemovePresetRow = useCallback(
    (index: number) => {
      setStepPresetRows((prev) => {
        if (prev.length === 1) {
          const cleared = [{ key: "", value: "" }];
          commitPresetRows(cleared);
          return cleared;
        }
        const next = prev.filter((_, idx) => idx !== index);
        commitPresetRows(next);
        return next.length ? next : [{ key: "", value: "" }];
      });
    },
    [commitPresetRows],
  );
  const handleStepKeySelect = useCallback(
    (value: string) => {
      if (!onStepScreenChange || !isStepScreen) return;
      const entry = stepOptions.find((option) => option.stepKey === value);
      onStepScreenChange(node.id, {
        stepKey: value,
        label: entry?.label ?? stepScreenConfig?.label,
      });
      if (entry?.label) {
        onLabelChange(node.id, "ro", entry.label);
      }
    },
    [isStepScreen, node.id, onLabelChange, onStepScreenChange, stepOptions, stepScreenConfig?.label],
  );

  const handleTagsCommit = () => {
    const tags = tagDraft
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length);
    onNodeTagsChange(node.id, tags);
  };

  const handleAutoAssignConfirm = () => {
    if (typeof window === "undefined") return;
    const confirmation = window.prompt("Tastează ASSIGN pentru a auto-atribuie zone după route.group.");
    if (!confirmation) return;
    if (confirmation.trim().toUpperCase() !== "ASSIGN") return;
    onAutoAssignChunks();
  };
  const isPortal = nodeLooksLikePortal(node);
  const portalTargetLabel = (() => {
    const portalConfig = node.data.portal;
    if (!portalConfig) return null;
    if (portalConfig.targetType === "route") {
      return portalConfig.targetRoutePath ?? portalConfig.targetRouteId ?? null;
    }
    if (!portalConfig.targetNodeId) return null;
    const option = portalNodeOptions.find((entry) => entry.id === portalConfig.targetNodeId);
    return option?.label ?? portalConfig.targetNodeId;
  })();

  const nodeInternalSteps = internalSteps ?? node.data.internalSteps ?? null;

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
      <NodeInternalFlowSection
        nodeId={node.id}
        steps={nodeInternalSteps}
        editable={canEditInternalFlow}
        onStepsChange={
          canEditInternalFlow && onInternalStepsChange ? (next) => onInternalStepsChange(node.id, next) : undefined
        }
      />
      <div className="space-y-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Quick actions</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Label override</p>
            {(["ro", "en"] as const).map((locale) => (
              <input
                key={locale}
                type="text"
                className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                placeholder={`Titlu ${locale}`}
                value={node.data.labelOverrides?.[locale] ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  onLabelChange(node.id, locale, value);
                  if (onStepScreenChange && isStepScreen && locale === "ro") {
                    onStepScreenChange(node.id, { label: value || undefined });
                  }
                }}
              />
            ))}
          </div>
          <div className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Zone</p>
            <select
              className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
              value={node.data.chunkId ?? defaultChunkId ?? ""}
              onChange={(event) => onChunkChange(node.id, event.target.value ? event.target.value : null)}
            >
              {chunks.map((chunk) => (
                <option key={chunk.id} value={chunk.id}>
                  {chunk.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="w-full rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
              onClick={handleAutoAssignConfirm}
            >
              Auto-assign după route.group
            </button>
          </div>
        </div>
        <div className="space-y-1 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Tags</p>
            <button
              type="button"
              className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
              onClick={handleTagsCommit}
            >
              Actualizează
            </button>
          </div>
          <textarea
            className="h-28 w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
            placeholder="type:portal, surface:today"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
          />
          <p className="text-[11px] text-[var(--omni-muted)]">Separă tag-urile cu virgulă (ex: engine:vocab, surface:today).</p>
        </div>
        {isStepScreen ? (
          <div className="space-y-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-800">Step screen</p>
              {previewHref ? (
                <a
                  href={previewHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-indigo-700 underline decoration-dotted underline-offset-2"
                >
                  Deschide preview
                </a>
              ) : null}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--omni-ink)]">{hostRoutePath || "Host route absent"}</p>
              <p className="text-[11px] text-[var(--omni-muted)]">Host route</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Step ID</label>
              <select
                className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
                value={stepScreenConfig?.stepKey ?? ""}
                onChange={(event) => handleStepKeySelect(event.target.value)}
              >
                <option value="">{stepOptions.length ? "Selectează pas" : "Nicio definiție"}</option>
                {stepOptions.map((step) => (
                  <option key={step.stepKey} value={step.stepKey}>
                    {step.label}
                  </option>
                ))}
              </select>
              {stepOptions.length === 0 ? (
                <p className="text-xs text-amber-600">Manifestul nu are pași disponibili pentru {hostRoutePath || "ruta aceasta"}.</p>
              ) : null}
              {stepScreenConfig?.stepKey && !stepExists ? (
                <p className="text-xs text-amber-600">Pasul selectat nu mai există în manifest. Alege o altă opțiune.</p>
              ) : null}
            </div>
            <div className="space-y-2 rounded-2xl border border-white bg-white/80 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Query preset</p>
                <button
                  type="button"
                  className="rounded-full border border-[var(--omni-border-soft)] px-3 py-0.5 text-[10px] font-semibold"
                  onClick={handleAddPresetRow}
                >
                  Adaugă parametru
                </button>
              </div>
              {stepPresetRows.map((row, index) => (
                <div key={`${node.id}-preset-${index}`} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2">
                  <input
                    type="text"
                    className="rounded-xl border border-[var(--omni-border-soft)] px-2 py-1 text-[12px]"
                    placeholder="param (source)"
                    value={row.key}
                    onChange={(event) => handlePresetRowChange(index, "key", event.target.value)}
                  />
                  <span className="self-center text-xs text-[var(--omni-muted)]">=</span>
                  <input
                    type="text"
                    className="rounded-xl border border-[var(--omni-border-soft)] px-2 py-1 text-[12px]"
                    placeholder="valoare"
                    value={row.value}
                    onChange={(event) => handlePresetRowChange(index, "value", event.target.value)}
                  />
                  <button
                    type="button"
                    className="self-center rounded-full border border-transparent px-2 py-0.5 text-[10px] font-semibold text-[var(--omni-muted)] hover:text-rose-600"
                    onClick={() => handleRemovePresetRow(index)}
                    aria-label="Șterge parametrul"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <p className="text-[11px] text-[var(--omni-muted)]">
                Parametrii sunt aplicați automat la URL-ul StepRunner (ex: source=guided_day1, returnTo=/today).
              </p>
            </div>
          </div>
        ) : null}
        <div className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white px-3 py-2 text-[11px]">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Portal target</p>
          {isPortal ? (
            <p className="font-semibold text-[var(--omni-ink)]">{portalTargetLabel ? `Portal → ${portalTargetLabel}` : "Portal configurat"}</p>
          ) : (
            <p className="text-[var(--omni-muted)]">Nodul nu este portal.</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
              onClick={onPortalTabRequest}
            >
              {isPortal ? "Editează portal" : "Configurează portal"}
            </button>
            {isPortal ? (
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
                onClick={() => onPortalChange(node.id, null)}
              >
                Resetează
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Route</p>
        <p className="font-semibold text-[var(--omni-ink)]">{route?.routePath ?? node.data.routePath}</p>
        {route?.filePath ? <p className="text-[11px] text-[var(--omni-muted)]">{route.filePath}</p> : null}
        <NodeGatingNotes routePath={route?.routePath ?? node.data.routePath} />
      </div>
    </div>
  );
}

function NodeGatingNotes({ routePath }: { routePath?: string }) {
  if (!routePath) return null;
  const noteEntry = NODE_GATING_NOTES[routePath.toLowerCase()];
  if (!noteEntry) return null;
  return (
    <div className="mt-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">{noteEntry.title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-[var(--omni-ink)]/80">
        {noteEntry.entries.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
  );
}

function NodePortalSection({ node, isPortalNode, routeOptions, portalNodeOptions, onPortalChange }: NodePortalSectionProps) {
  const portalTargetType: FlowNodePortalConfig["targetType"] = node.data.portal?.targetType ?? "route";
  const portalTargetNodeId = node.data.portal?.targetNodeId ?? "";
  const portalRouteValue = node.data.portal?.targetRoutePath ?? "";
  const routeListId = `portal-route-options-${node.id}`;

  if (!isPortalNode) {
    return (
      <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3 text-xs text-[var(--omni-muted)]">
        <p>
          Adaugă tag-ul <code>type:portal</code> și prefixează numele cu „PORTAL:” pentru a configura un portal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[var(--omni-ink)]">
        {(["route", "node"] as Array<FlowNodePortalConfig["targetType"]>).map((targetType) => (
          <label key={targetType} className="inline-flex items-center gap-1">
            <input
              type="radio"
              className="h-3 w-3"
              checked={portalTargetType === targetType}
              onChange={() => {
                if (targetType === "route") {
                  onPortalChange(node.id, { targetType: "route", targetRoutePath: portalRouteValue });
                } else {
                  onPortalChange(node.id, portalTargetNodeId ? { targetType: "node", targetNodeId: portalTargetNodeId } : null);
                }
              }}
            />
            <span>{targetType === "route" ? "Route" : "Node"}</span>
          </label>
        ))}
      </div>
      {portalTargetType === "route" ? (
        <>
          <input
            type="text"
            className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
            placeholder="/today"
            list={routeListId}
            value={portalRouteValue}
            onChange={(event) => {
              const value = event.target.value;
              onPortalChange(node.id, value ? { targetType: "route", targetRoutePath: value } : null);
            }}
          />
          <datalist id={routeListId}>
            {routeOptions.map((route) => (
              <option key={route.id} value={route.routePath}>
                {route.routePath}
              </option>
            ))}
          </datalist>
        </>
      ) : (
        <select
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
          value={portalTargetNodeId}
          onChange={(event) => {
            const value = event.target.value;
            onPortalChange(node.id, value ? { targetType: "node", targetNodeId: value } : null);
          }}
        >
          <option value="">Selectează nod</option>
          {portalNodeOptions
            .filter((option) => option.id !== node.id)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
        </select>
      )}
      <button
        type="button"
        className="rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
        onClick={() => onPortalChange(node.id, null)}
      >
        Resetează portal target
      </button>
    </div>
  );
}

function DiagnosticsSection({
  diagnostics,
  onSelectIssue,
  flowStats,
  missingManifestNodes,
  onSelectMissingManifestNode,
  debugInfo,
  observedEnabled,
  observedEvents,
  onExportAuditSnapshot,
  onPublishIntroStepOrder,
  publishIntroStepOrderLoading,
}: DiagnosticsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Diagnostic Tools</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold disabled:opacity-50"
            onClick={onPublishIntroStepOrder}
            disabled={publishIntroStepOrderLoading}
          >
            {publishIntroStepOrderLoading ? "Se publică…" : "Publish intro step order"}
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold"
            onClick={onExportAuditSnapshot}
          >
            Export Audit Snapshot
          </button>
        </div>
      </div>
      <FlowDiagnosticsPanel issues={diagnostics} onSelectIssue={onSelectIssue} flowStats={flowStats} />
      {missingManifestNodes.length ? (
        <MissingManifestPanel nodes={missingManifestNodes} onSelectNode={onSelectMissingManifestNode} />
      ) : null}
      {DEBUG_STEPS && debugInfo ? <DebugInfoPanel info={debugInfo} /> : null}
      {observedEnabled ? <ObservedEventsPanel events={observedEvents} /> : null}
    </div>
  );
}

function NodeAdvancedSection({
  comments,
  onAddComment,
  onDeleteComment,
  onToggleCommentResolved,
  copyDraft,
  onCopyFieldChange,
  onSaveCopy,
  copyLoading,
  copyError,
  setCopyError,
}: NodeAdvancedSectionProps) {
  const [commentDraft, setCommentDraft] = useState("");
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Notițe</p>
        {comments.length ? (
          <ul className="mt-2 space-y-2 text-[12px]">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-[var(--omni-border-soft)] bg-white p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[var(--omni-ink)]">{comment.author ?? "Anonim"}</span>
                  <span className="text-[10px] text-[var(--omni-muted)]">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleString("ro-RO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })
                      : null}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[var(--omni-ink)]">{comment.message}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    className={clsx(
                      "rounded-full border px-2 py-0.5",
                      comment.resolved ? "border-emerald-200 text-emerald-700" : "border-amber-200 text-amber-700",
                    )}
                    onClick={() => onToggleCommentResolved(comment.id)}
                  >
                    {comment.resolved ? "Rezolvat" : "Deschis"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-rose-200 px-2 py-0.5 text-rose-600"
                    onClick={() => onDeleteComment(comment.id)}
                  >
                    Șterge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] text-[var(--omni-muted)]">Nu există note pentru acest nod.</p>
        )}
        <textarea
          className="mt-2 w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-2 py-1 text-sm"
          placeholder="Adaugă notă"
          value={commentDraft}
          onChange={(event) => setCommentDraft(event.target.value)}
        />
        <button
          type="button"
          className="mt-2 rounded-full bg-[var(--omni-ink)] px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => {
            onAddComment(commentDraft);
            setCommentDraft("");
          }}
          disabled={!commentDraft.trim().length}
        >
          Adaugă notă
        </button>
      </div>
      <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Copy overrides</p>
        {copyError ? <p className="text-[11px] text-rose-500">{copyError}</p> : null}
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          {(["ro", "en"] as const).map((locale) => (
            <div key={locale} className="space-y-2">
              <textarea
                className="h-24 w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                placeholder={`Headline ${locale}`}
                value={copyDraft[locale].h1 ?? ""}
                onChange={(event) => onCopyFieldChange(locale, "h1", event.target.value)}
              />
              <textarea
                className="h-24 w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                placeholder={`Subtitle ${locale}`}
                value={copyDraft[locale].subtitle ?? ""}
                onChange={(event) => onCopyFieldChange(locale, "subtitle", event.target.value)}
              />
              <input
                type="text"
                className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                placeholder={`CTA primar ${locale}`}
                value={copyDraft[locale].ctaPrimary ?? ""}
                onChange={(event) => onCopyFieldChange(locale, "ctaPrimary", event.target.value)}
              />
              <input
                type="text"
                className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                placeholder={`CTA secundar ${locale}`}
                value={copyDraft[locale].ctaSecondary ?? ""}
                onChange={(event) => onCopyFieldChange(locale, "ctaSecondary", event.target.value)}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-full bg-[var(--omni-ink)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => {
            setCopyError(null);
            onSaveCopy();
          }}
          disabled={copyLoading}
        >
          {copyLoading ? "Se salvează..." : "Salvează copy"}
        </button>
      </div>
    </div>
  );
}

function OverlayManagerSection({
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onCreateOverlay,
  onDeleteOverlay,
  onOverlayMetadataChange,
  onOverlayAddNodes,
  onOverlayRemoveStep,
  onOverlayReorderSteps,
  onOverlayStepUpdate,
  selectedNodeIds,
  nodeLabelMap,
  nodeRouteMap,
  onRepairOverlaySteps,
  onOverlayStepFocus,
}: OverlayManagerSectionProps) {
  const [newOverlayName, setNewOverlayName] = useState("");
  const activeOverlay = selectedOverlayId ? overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null : null;
  const overlayStatus = (activeOverlay?.status ?? "draft") as JourneyStatus;
  const overlayIsActive = overlayStatus === "active";
  const handleCreateOverlay = () => {
    const value = newOverlayName.trim();
    if (!value) return;
    onCreateOverlay(value);
    setNewOverlayName("");
  };
  const handleAutoSuggestStep = (index: number) => {
    if (!activeOverlay?.steps?.length) return;
    const step = activeOverlay.steps[index];
    if (!step?.nodeId) return;
    const routePath = nodeRouteMap.get(step.nodeId) ?? "";
    if (!routePath) return;
    const slug = routePath
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "") || "journey-step";
    const updates: Partial<FlowOverlayStep> = {};
    if (!step.urlPattern) {
      updates.urlPattern = `${routePath}(.*)$`;
    }
    if (!step.assertTestId) {
      updates.assertTestId = `${slug}-root`;
    }
    if (!step.clickTestId) {
      updates.clickTestId = `${slug}-action`;
    }
    if (Object.keys(updates).length) {
      onOverlayStepUpdate(activeOverlay.id, index, updates);
    }
  };
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3 text-xs">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Journeys</p>
        <select
          className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
          value={selectedOverlayId ?? ""}
          onChange={(event) => onSelectOverlay(event.target.value || null)}
        >
          <option value="">Selectează journey</option>
          {overlays.map((overlay) => (
            <option key={overlay.id} value={overlay.id}>
              {overlay.name ?? "Journey"}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
            placeholder="Nume journey"
            value={newOverlayName}
            onChange={(event) => setNewOverlayName(event.target.value)}
          />
          <button
            type="button"
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              newOverlayName.trim() ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]" : "cursor-not-allowed border-dashed text-[var(--omni-muted)]",
            )}
            onClick={handleCreateOverlay}
            disabled={!newOverlayName.trim()}
          >
            Creează
          </button>
        </div>
      </div>
      {activeOverlay ? (
        <div className="space-y-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white/80 p-3">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Titlu</label>
            <input
              type="text"
              className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
              value={activeOverlay.name ?? ""}
              onChange={(event) => onOverlayMetadataChange(activeOverlay.id, { name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Descriere</label>
            <textarea
              className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
              placeholder="Rezumat journey"
              value={activeOverlay.description ?? ""}
              onChange={(event) => onOverlayMetadataChange(activeOverlay.id, { description: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Status</label>
            <select
              className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
              value={overlayStatus}
              onChange={(event) =>
                onOverlayMetadataChange(activeOverlay.id, { status: event.target.value as JourneyStatus })
              }
            >
              {JOURNEY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className={clsx("text-[11px]", overlayIsActive ? "text-rose-700" : "text-[var(--omni-muted)]")}>
              {overlayIsActive
                ? "Journeys ACTIVE trebuie să aibă entry/exit și contract complet (URL + testIds)."
                : "Poți păstra status Draft până completezi contractul și validezi traseul."}
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Entry route</label>
              <input
                type="text"
                className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                placeholder="/intro?e2e=1"
                value={activeOverlay.entryRoutePath ?? ""}
                onChange={(event) => onOverlayMetadataChange(activeOverlay.id, { entryRoutePath: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Exit route</label>
              <input
                type="text"
                className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                placeholder="/session/complete"
                value={activeOverlay.exitRoutePath ?? ""}
                onChange={(event) => onOverlayMetadataChange(activeOverlay.id, { exitRoutePath: event.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={clsx(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                selectedNodeIds.length ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]" : "cursor-not-allowed border-dashed text-[var(--omni-muted)]",
              )}
              disabled={!selectedNodeIds.length}
              onClick={() => onOverlayAddNodes(activeOverlay.id, selectedNodeIds)}
            >
              Adaugă {selectedNodeIds.length || ""} noduri selectate
            </button>
            <button
              type="button"
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
              onClick={() => onDeleteOverlay(activeOverlay.id)}
            >
              Șterge journey
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                Flow intern — journey ({activeOverlay.steps?.length ?? 0})
              </p>
              {activeOverlay.steps?.length ? (
                <button
                  type="button"
                  className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--omni-ink)]"
                  onClick={() => onRepairOverlaySteps(activeOverlay.id)}
                >
                  Repair steps
                </button>
              ) : null}
            </div>
            {activeOverlay.steps?.length ? (
              <ul className="space-y-2">
                {activeOverlay.steps.map((step, index) => {
                  const nodeExists = Boolean(step.nodeId && nodeLabelMap.has(step.nodeId));
                  const label = nodeExists ? nodeLabelMap.get(step.nodeId!) ?? step.nodeId : step.nodeId || "Fără nod";
                  const routePath = step.nodeId ? nodeRouteMap.get(step.nodeId) ?? "" : "";
                  const hasUrl = Boolean(step.urlPattern);
                  const hasAssert = Boolean(step.assertTestId);
                  const hasClick = Boolean(step.clickTestId);
                  const contractComplete = hasUrl && hasAssert && hasClick;
                  const contractWarning = overlayIsActive && !contractComplete;
                  return (
                    <li
                      key={`${step.nodeId ?? "step"}-${index}`}
                      className={clsx(
                        "rounded-xl border p-3",
                        nodeExists ? "border-[var(--omni-border-soft)] bg-white" : "border-amber-200 bg-amber-50",
                        contractWarning ? "ring-1 ring-rose-200" : "",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className={clsx("flex-1 text-left", nodeExists ? "text-[var(--omni-ink)]" : "text-amber-700")}
                          onClick={() => nodeExists && step.nodeId && onOverlayStepFocus(step.nodeId)}
                          disabled={!nodeExists || !step.nodeId}
                        >
                          <p className="text-sm font-semibold">{index + 1}. {label}</p>
                          <p className="text-[11px] text-[var(--omni-muted)]">{routePath || step.nodeId || "—"}</p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            {step.gateTag ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                                Gate: {step.gateTag}
                              </span>
                            ) : null}
                            {step.tags?.map((tag) => (
                              <span key={`${step.nodeId}-${tag}`} className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-800">
                                {tag}
                              </span>
                            ))}
                            {step.assertTestId ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                                assert:{step.assertTestId}
                              </span>
                            ) : null}
                            {step.clickTestId ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                                click:{step.clickTestId}
                              </span>
                            ) : null}
                          </div>
                          {step.urlPattern ? (
                            <p className="mt-1 truncate rounded-lg bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-600">
                              {step.urlPattern}
                            </p>
                          ) : null}
                          {!nodeExists ? <p className="text-[11px] text-amber-700">Nod inexistent — repară Journey-ul.</p> : null}
                        </button>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            className={clsx(
                              "rounded-full border px-2 py-0.5",
                              index === 0 ? "cursor-not-allowed border-dashed text-[var(--omni-muted)]" : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]",
                            )}
                            onClick={() => onOverlayReorderSteps(activeOverlay.id, index, index - 1)}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className={clsx(
                              "rounded-full border px-2 py-0.5",
                              index === (activeOverlay.steps?.length ?? 1) - 1
                                ? "cursor-not-allowed border-dashed text-[var(--omni-muted)]"
                                : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]",
                            )}
                            onClick={() => onOverlayReorderSteps(activeOverlay.id, index, index + 1)}
                            disabled={index === (activeOverlay.steps?.length ?? 1) - 1}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-rose-200 px-2 py-0.5 text-rose-600"
                            onClick={() => onOverlayRemoveStep(activeOverlay.id, index)}
                          >
                            Șterge
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        className="mt-2 w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-1 text-sm"
                        placeholder="Gate tag"
                        value={step.gateTag ?? ""}
                        onChange={(event) =>
                          onOverlayStepUpdate(activeOverlay.id, index, {
                            gateTag: event.target.value || null,
                          })
                        }
                      />
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-1 text-sm"
                          placeholder="URL pattern (ex: /intro/guided.*)"
                          value={step.urlPattern ?? ""}
                          onChange={(event) =>
                            onOverlayStepUpdate(activeOverlay.id, index, {
                              urlPattern: event.target.value || null,
                            })
                          }
                        />
                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            type="text"
                            className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-1 text-sm"
                            placeholder="Assert testId"
                            value={step.assertTestId ?? ""}
                            onChange={(event) =>
                              onOverlayStepUpdate(activeOverlay.id, index, {
                                assertTestId: event.target.value || null,
                              })
                            }
                          />
                          <input
                            type="text"
                            className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-1 text-sm"
                            placeholder="CTA testId"
                            value={step.clickTestId ?? ""}
                            onChange={(event) =>
                              onOverlayStepUpdate(activeOverlay.id, index, {
                                clickTestId: event.target.value || null,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span
                          className={clsx(
                            "rounded-full px-2 py-0.5 font-semibold",
                            contractComplete
                              ? "bg-emerald-100 text-emerald-800"
                              : overlayIsActive
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {contractComplete ? "Contract complet" : overlayIsActive ? "Completează contractul" : "Contract opțional"}
                        </span>
                        <button
                          type="button"
                          className={clsx(
                            "rounded-full border px-3 py-0.5 text-[10px] font-semibold",
                            nodeExists && routePath
                              ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]"
                              : "cursor-not-allowed border-dashed text-[var(--omni-muted)]",
                          )}
                          onClick={() => handleAutoSuggestStep(index)}
                          disabled={!nodeExists || !routePath}
                        >
                          Auto-suggest
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[11px] text-[var(--omni-muted)]">Niciun pas definit. Selectează noduri și folosește acțiunea „Adaugă noduri selectate”.</p>
            )}
            {activeOverlay.edges?.length ? (
              <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Flow intern — edges ({activeOverlay.edges.length})</p>
                <ul className="mt-2 space-y-1 text-[11px] text-[var(--omni-ink)]/80">
                  {activeOverlay.edges.map((edge) => {
                    const sourceLabel = edge.fromNodeId ? nodeLabelMap.get(edge.fromNodeId) ?? edge.fromNodeId : edge.fromNodeId ?? "—";
                    const targetLabel = edge.toNodeId ? nodeLabelMap.get(edge.toNodeId) ?? edge.toNodeId : edge.toNodeId ?? "—";
                    return (
                      <li key={`${edge.fromNodeId ?? "from"}-${edge.toNodeId ?? "to"}`}>
                        {sourceLabel} →
                        <span className="font-semibold"> {targetLabel}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white p-3 text-center text-[var(--omni-muted)]">
          Selectează sau creează un journey pentru a începe.
        </p>
      )}
    </div>
  );
}

function ObservedEventsPanel({ events }: { events: ObservedEvent[] }) {
  return (
    <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Evenimente recente</p>
      {events && events.length ? (
        <ul className="mt-2 space-y-2 text-xs">
          {events.slice(0, 8).map((event) => (
            <li key={event.id} className="rounded-xl border border-[var(--omni-border-soft)] px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--omni-ink)]">{event.event}</span>
                <span className="text-[var(--omni-muted)]">
                  {event.ts.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-[var(--omni-muted)]">
                {event.routePath ?? event.sourceRoute}
                {event.targetRoute ? ` → ${event.targetRoute}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[var(--omni-muted)]">Nu există evenimente în fereastra selectată.</p>
      )}
    </div>
  );
}

type NodeInternalFlowSectionProps = {
  nodeId: string;
  steps?: FlowNodeInternalStep[] | null;
  editable?: boolean;
  onStepsChange?: (steps: FlowNodeInternalStep[]) => void;
};

const inspectorRandomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tmp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};
const inspectorStepId = () => `screen_${inspectorRandomId()}`;
const inspectorCardId = () => `card_${inspectorRandomId()}`;

function NodeInternalFlowSection({ steps, editable = false, onStepsChange }: NodeInternalFlowSectionProps) {
  const safeSteps = useMemo(() => steps ?? [], [steps]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const applyStepsChange = useCallback(
    (mutator: (draft: FlowNodeInternalStep[]) => void) => {
      if (!onStepsChange) return;
      const draft = safeSteps.map((step) => ({
        ...step,
        flags: step.flags ? [...step.flags] : undefined,
        tags: step.tags ? [...step.tags] : undefined,
        cards: step.cards ? step.cards.map((card) => ({ ...card })) : undefined,
      }));
      mutator(draft);
      onStepsChange(draft);
    },
    [onStepsChange, safeSteps],
  );
  const handleAddStep = useCallback(() => {
    if (!editable) return;
    applyStepsChange((draft) => {
      draft.push({
        id: inspectorStepId(),
        label: "Screen nou",
        description: "",
      });
    });
  }, [applyStepsChange, editable]);
  const handleRemoveStep = useCallback(
    (index: number) => {
      if (!editable) return;
      applyStepsChange((draft) => {
        draft.splice(index, 1);
      });
    },
    [applyStepsChange, editable],
  );
  const handleDragStart = useCallback(
    (event: ReactDragEvent<HTMLButtonElement>, index: number) => {
      if (!editable) return;
      setDragIndex(index);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
    },
    [editable],
  );
  const handleDragOver = useCallback(
    (event: ReactDragEvent<HTMLLIElement>) => {
      if (!editable) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [editable],
  );
  const handleDragEnd = useCallback(() => setDragIndex(null), []);
  const handleDrop = useCallback(
    (event: ReactDragEvent<HTMLLIElement>, overIndex: number) => {
      if (!editable) return;
      event.preventDefault();
      const fromData = event.dataTransfer.getData("text/plain");
      const fromIndex = dragIndex ?? (fromData ? Number(fromData) : null);
      setDragIndex(null);
      if (fromIndex === null || Number.isNaN(fromIndex) || fromIndex === overIndex) return;
      applyStepsChange((draft) => {
        const [moved] = draft.splice(fromIndex, 1);
        draft.splice(overIndex, 0, moved);
      });
    },
    [applyStepsChange, dragIndex, editable],
  );
  const handleStepFieldChange = useCallback(
    (index: number, field: "label" | "description", value: string) => {
      if (!editable) return;
      applyStepsChange((draft) => {
        const target = draft[index];
        if (!target) return;
        if (field === "label") {
          target.label = value;
        } else {
          target.description = value;
        }
      });
    },
    [applyStepsChange, editable],
  );
  const handleStepListFieldChange = useCallback(
    (index: number, field: "flags" | "tags", raw: string) => {
      if (!editable) return;
      const parsed = raw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
      applyStepsChange((draft) => {
        const target = draft[index];
        if (!target) return;
        if (parsed.length) {
          target[field] = parsed;
        } else {
          delete target[field];
        }
      });
    },
    [applyStepsChange, editable],
  );
  const handleCardFieldChange = useCallback(
    (stepIndex: number, cardIndex: number, field: "label" | "actionTag", value: string) => {
      if (!editable) return;
      applyStepsChange((draft) => {
        const target = draft[stepIndex];
        if (!target) return;
        const cards = target.cards ? [...target.cards] : [];
        const existing = cards[cardIndex] ?? { id: inspectorCardId(), label: "" };
        const updated = { ...existing };
        if (field === "label") {
          updated.label = value;
        } else {
          updated.actionTag = value;
        }
        cards[cardIndex] = updated;
        target.cards = cards;
      });
    },
    [applyStepsChange, editable],
  );
  const handleCardAdd = useCallback(
    (stepIndex: number) => {
      if (!editable) return;
      applyStepsChange((draft) => {
        const target = draft[stepIndex];
        if (!target) return;
        const cards = target.cards ? [...target.cards] : [];
        cards.push({
          id: inspectorCardId(),
          label: "Card nou",
        });
        target.cards = cards;
      });
    },
    [applyStepsChange, editable],
  );
  const handleCardRemove = useCallback(
    (stepIndex: number, cardIndex: number) => {
      if (!editable) return;
      applyStepsChange((draft) => {
        const target = draft[stepIndex];
        if (!target || !target.cards) return;
        const cards = [...target.cards];
        cards.splice(cardIndex, 1);
        target.cards = cards.length ? cards : undefined;
      });
    },
    [applyStepsChange, editable],
  );
  const count = safeSteps.length;
  const showAddButton = editable;
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Flow intern — nod ({count})</p>
        {showAddButton ? (
          <button
            type="button"
            className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
            onClick={handleAddStep}
          >
            Adaugă screen
          </button>
        ) : null}
      </div>
      {count ? (
        <ol className="space-y-2">
          {safeSteps.map((step, index) => {
            const cards = step.cards ?? [];
            const isDragging = dragIndex === index;
            if (editable) {
              const tagsValue = step.tags?.join(", ") ?? "";
              const flagsValue = step.flags?.join(", ") ?? "";
              return (
                <li
                  key={`${step.id}-${index}`}
                  className={clsx(
                    "space-y-3 rounded-2xl border bg-white px-3 py-2 text-sm",
                    isDragging ? "border-dashed border-[var(--omni-ink)]" : "border-[var(--omni-border-soft)]",
                  )}
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDrop(event, index)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="cursor-grab rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--omni-muted)]"
                      draggable={editable}
                      aria-label="Reordonează screen"
                      onDragStart={(event) => handleDragStart(event, index)}
                      onDragEnd={handleDragEnd}
                    >
                      ↕
                    </button>
                    <span className="rounded bg-slate-900/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--omni-ink)]">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      className="flex-1 rounded-xl border border-[var(--omni-border-soft)] px-3 py-1 text-sm"
                      value={step.label}
                      onChange={(event) => handleStepFieldChange(index, "label", event.target.value)}
                      placeholder="Titlu screen"
                    />
                    <button
                      type="button"
                      className="rounded-full border border-red-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700"
                      onClick={() => handleRemoveStep(index)}
                    >
                      Șterge
                    </button>
                  </div>
                  <textarea
                    className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                    placeholder="Descriere"
                    value={step.description ?? ""}
                    onChange={(event) => handleStepFieldChange(index, "description", event.target.value)}
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Tags</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-1 text-sm"
                        placeholder="surface:today, persona:burnout"
                        value={tagsValue}
                        onChange={(event) => handleStepListFieldChange(index, "tags", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Flags</label>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-1 text-sm"
                        placeholder="Day1, Hero"
                        value={flagsValue}
                        onChange={(event) => handleStepListFieldChange(index, "flags", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl border border-dashed border-[var(--omni-border-soft)] px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                        Carduri ({cards.length})
                      </p>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        onClick={() => handleCardAdd(index)}
                      >
                        Adaugă card
                      </button>
                    </div>
                    {cards.length ? (
                      <div className="space-y-2">
                        {cards.map((card, cardIndex) => (
                          <div
                            key={`${card.id}-${cardIndex}`}
                            className="space-y-2 rounded-xl border border-[var(--omni-border-soft)] bg-white/70 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-[var(--omni-ink)]">Card {cardIndex + 1}</p>
                              <button
                                type="button"
                                className="rounded-full border border-red-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700"
                                onClick={() => handleCardRemove(index, cardIndex)}
                              >
                                Șterge
                              </button>
                            </div>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-[var(--omni-border-soft)] px-2 py-1 text-sm"
                              value={card.label}
                              placeholder="Titlu card"
                              onChange={(event) => handleCardFieldChange(index, cardIndex, "label", event.target.value)}
                            />
                            <input
                              type="text"
                              className="w-full rounded-xl border border-[var(--omni-border-soft)] px-2 py-1 text-sm"
                              value={card.actionTag ?? ""}
                              placeholder="actionTag (ex: cta_explore_cat_day1)"
                              onChange={(event) => handleCardFieldChange(index, cardIndex, "actionTag", event.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[var(--omni-muted)]">Nu există carduri definite pentru acest screen.</p>
                    )}
                  </div>
                </li>
              );
            }
            return (
              <li key={`${step.id}-${index}`} className="rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-900/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--omni-ink)]">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-[var(--omni-ink)]">{step.label}</p>
                </div>
                {step.description ? (
                  <p className="mt-1 text-[12px] text-[var(--omni-muted)]">{step.description}</p>
                ) : null}
                {step.tags?.length ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
                    {step.tags.map((tag) => (
                      <span
                        key={`${step.id}-${tag}`}
                        className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 font-semibold text-[var(--omni-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {step.flags?.length ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
                    {step.flags.map((flag) => (
                      <span
                        key={`${step.id}-flag-${flag}`}
                        className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {step.cards?.length ? (
                  <div className="mt-2 space-y-1 rounded-xl border border-dashed border-[var(--omni-border-soft)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                      Carduri ({step.cards.length})
                    </p>
                    <ul className="space-y-1 text-xs text-[var(--omni-ink)]/85">
                      {step.cards.map((card) => (
                        <li key={`${step.id}-card-${card.id}`} className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{card.label}</span>
                          {card.actionTag ? (
                            <span className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--omni-muted)]">
                              {card.actionTag}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-xs text-[var(--omni-muted)]">
          Nod fără flow intern definit încă.
          {editable ? " Adaugă un screen pentru a începe structurarea nodului." : null}
        </p>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] px-3 py-4 text-center text-[var(--omni-muted)]">{message}</p>
  );
}

function nodeLooksLikePortal(node: Node<FlowNodeData>): boolean {
  const labelCandidate = node.data.labelOverrides?.ro ?? node.data.labelOverrides?.en ?? node.data.routePath ?? node.id;
  return Boolean(node.data.tags?.includes("type:portal") || labelCandidate.toUpperCase().startsWith("PORTAL:"));
}

type EdgeInspectorProps = {
  edge: Edge<FlowEdgeData>;
  onFieldChange: (edgeId: string, updates: Partial<FlowEdgeData>) => void;
  onApplyColorGroup: (edgeId: string, color: string) => void;
};

type EdgeDraft = {
  labelOverrides: LabelMap;
  conditionTag: string;
  eventName: string;
  color: string;
  command: string;
};

function EdgeInspector({ edge, onFieldChange, onApplyColorGroup }: EdgeInspectorProps) {
  const [draft, setDraft] = useState<EdgeDraft>(() => ({
    labelOverrides: {
      ro: edge.data?.labelOverrides?.ro ?? "",
      en: edge.data?.labelOverrides?.en ?? "",
    },
    conditionTag: edge.data?.conditionTag ?? "",
    eventName: edge.data?.eventName ?? "",
    color: edge.data?.color ?? EDGE_COLOR_FALLBACK,
    command: edge.data?.command ?? "",
  }));

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setDraft({
        labelOverrides: {
          ro: edge.data?.labelOverrides?.ro ?? "",
          en: edge.data?.labelOverrides?.en ?? "",
        },
        conditionTag: edge.data?.conditionTag ?? "",
        eventName: edge.data?.eventName ?? "",
        color: edge.data?.color ?? EDGE_COLOR_FALLBACK,
        command: edge.data?.command ?? "",
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [edge.id, edge.data]);

  const handleLabelChange = (locale: "ro" | "en", value: string) => {
    setDraft((prev) => ({
      ...prev,
      labelOverrides: {
        ...prev.labelOverrides,
        [locale]: value,
      },
    }));
  };

  const handleSave = () => {
    onFieldChange(edge.id, {
      labelOverrides: {
        ...draft.labelOverrides,
      },
      conditionTag: draft.conditionTag,
      eventName: draft.eventName,
      color: draft.color,
      command: draft.command,
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Edge</p>
      {(["ro", "en"] as const).map((locale) => (
        <input
          key={locale}
          type="text"
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
          placeholder={`Label ${locale}`}
          value={draft.labelOverrides[locale] ?? ""}
          onChange={(event) => handleLabelChange(locale, event.target.value)}
        />
      ))}
      <input
        type="text"
        className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
        placeholder="Condition tag"
        value={draft.conditionTag}
        onChange={(event) => setDraft((prev) => ({ ...prev, conditionTag: event.target.value }))}
      />
      <input
        type="text"
        className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
        placeholder="Event name"
        value={draft.eventName}
        onChange={(event) => setDraft((prev) => ({ ...prev, eventName: event.target.value }))}
      />
      <input
        type="text"
        className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
        placeholder="Command label"
        value={draft.command ?? ""}
        onChange={(event) => setDraft((prev) => ({ ...prev, command: event.target.value }))}
      />
      <div className="space-y-1">
        <p className="text-[var(--omni-muted)]">Culoare</p>
        <div className="flex flex-wrap gap-2">
          {EDGE_COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className={clsx("h-6 w-6 rounded-full border-2", draft.color === color ? "border-[var(--omni-ink)]" : "border-transparent")}
              style={{ backgroundColor: color }}
              onClick={() => setDraft((prev) => ({ ...prev, color }))}
            >
              <span className="sr-only">{color}</span>
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="w-full rounded-full bg-[var(--omni-ink)] px-3 py-2 text-sm font-semibold text-white" onClick={handleSave}>
        Salvează edge
      </button>
      <button
        type="button"
        className="w-full rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-2 text-xs font-semibold text-[var(--omni-ink)]"
        onClick={() => onApplyColorGroup(edge.id, draft.color)}
      >
        Aplică culoarea pe toate traseele paralele
      </button>
    </div>
  );
}
