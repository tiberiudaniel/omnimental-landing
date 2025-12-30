"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Edge, Node } from "reactflow";
import type { CopyFields } from "@/lib/useCopy";
import type {
  FlowChunk,
  FlowComment,
  FlowEdgeData,
  FlowIssue,
  FlowNodeData,
  FlowNodePortalConfig,
  FlowOverlay,
  FlowOverlayStep,
  LabelMap,
  RouteDoc,
} from "@/lib/flowStudio/types";
import { getStepManifestForRoute, type StepManifest } from "@/lib/stepManifests";
import type { ObservedEvent } from "@/lib/flowStudio/observed";
import { StepStatusBadge, type StepAvailability } from "./StepStatusBadge";

const DEBUG_STEPS = process.env.NEXT_PUBLIC_FLOW_STUDIO_DEBUG_STEPS === "true";

const EDGE_COLOR_FALLBACK = "#0f172a";
const EDGE_COLOR_PALETTE = ["#0f172a", "#0369a1", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

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
  currentManifest: StepManifest | null;
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
  chunks: FlowChunk[];
  defaultChunkId: string;
  onNodeChunkChange: (nodeId: string, chunkId: string) => void;
  onAutoAssignChunks: () => void;
  nodeComments: FlowComment[];
  routeOptions: RouteDoc[];
  portalNodeOptions: PortalNodeOption[];
  onAddNodeComment: (message: string) => void;
  onDeleteNodeComment: (commentId: string) => void;
  onToggleNodeCommentResolved: (commentId: string) => void;
  onExportAuditSnapshot: () => void;
  overlays: FlowOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (overlayId: string | null) => void;
  onCreateOverlay: (name: string) => void;
  onDeleteOverlay: (overlayId: string) => void;
  onOverlayMetadataChange: (overlayId: string, updates: Partial<Pick<FlowOverlay, "name" | "description" | "status">>) => void;
  onOverlayAddNodes: (overlayId: string, nodeIds: string[]) => void;
  onOverlayRemoveStep: (overlayId: string, index: number) => void;
  onOverlayReorderSteps: (overlayId: string, fromIndex: number, toIndex: number) => void;
  onOverlayStepUpdate: (overlayId: string, index: number, updates: Partial<FlowOverlayStep>) => void;
  selectedNodeIds: string[];
  nodeLabelMap: Map<string, string>;
  overlayTabRequest?: { tab: InspectorTab; nonce: number } | null;
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
  currentManifest,
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
  onEdgeFieldChange,
  onApplyEdgeColorToGroup,
  onCollapse,
  observedEnabled,
  observedEvents,
  debugInfo,
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
  overlayTabRequest,
}: InspectorPanelProps) {
  const resolvedRoutePath = selectedNode ? routeMap.get(selectedNode.data.routeId)?.routePath ?? selectedNode.data.routePath ?? null : null;
  const manifestFallback = resolvedRoutePath ? getStepManifestForRoute(resolvedRoutePath, {}) : null;
  const manifestForDisplay = currentManifest ?? manifestFallback;
  const manifestLabel = selectedNode ? selectedNode.data.labelOverrides?.ro ?? selectedNode.data.routePath ?? selectedNode.id : null;
  const canExpandSteps = Boolean(selectedNode);
  const expandTitle =
    !selectedNode
      ? "Selecteaza un nod."
      : !canExpandSteps
        ? stepStatus === "route-mismatch"
          ? "Fix mapping pentru a vedea pasii."
          : "Nu exista manifest pentru acest route."
        : undefined;
  const portalEligible = selectedNode ? nodeLooksLikePortal(selectedNode) : false;
  const portalTabVisible = Boolean(selectedNode);
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

  const tabs = [
    { key: "basics" as const, label: "Basics" },
    { key: "portal" as const, label: "Portal", disabled: !portalEligible, hidden: !portalTabVisible },
    { key: "overlays" as const, label: "Overlays" },
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
            stepsExpanded={stepsExpanded}
            manifest={manifestForDisplay}
            manifestLabel={manifestLabel}
            debugInfo={debugInfo}
            observedEnabled={observedEnabled}
            observedEvents={observedEvents}
            onExportAuditSnapshot={onExportAuditSnapshot}
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
      {selectedNode ? (
        <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StepStatusBadge status={stepStatus} variant="solid" />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={clsx(
                  "rounded-full border px-3 py-2 text-xs font-semibold",
                  stepsExpanded ? "border-sky-500 text-sky-500" : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]",
                  !canExpandSteps ? "opacity-60" : "",
                )}
                onClick={onToggleSteps}
                disabled={!canExpandSteps}
                title={expandTitle}
              >
                {stepsExpanded ? "Ascunde pasii" : "Expand steps"}
              </button>
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
  defaultChunkId: string;
  onChunkChange: (nodeId: string, chunkId: string) => void;
  onAutoAssignChunks: () => void;
  onLabelChange: (nodeId: string, locale: "ro" | "en", value: string) => void;
  onNodeTagsChange: (nodeId: string, tags: string[]) => void;
  portalNodeOptions: PortalNodeOption[];
  onPortalTabRequest: () => void;
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
  stepsExpanded: boolean;
  manifest: StepManifest | null;
  manifestLabel: string | null;
  debugInfo?: InspectorPanelProps["debugInfo"];
  observedEnabled: boolean;
  observedEvents: ObservedEvent[];
  onExportAuditSnapshot: () => void;
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
  onOverlayMetadataChange: (overlayId: string, updates: Partial<Pick<FlowOverlay, "name" | "description" | "status">>) => void;
  onOverlayAddNodes: (overlayId: string, nodeIds: string[]) => void;
  onOverlayRemoveStep: (overlayId: string, index: number) => void;
  onOverlayReorderSteps: (overlayId: string, fromIndex: number, toIndex: number) => void;
  onOverlayStepUpdate: (overlayId: string, index: number, updates: Partial<FlowOverlayStep>) => void;
  selectedNodeIds: string[];
  nodeLabelMap: Map<string, string>;
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
}: NodeBasicsSectionProps) {
  const route = routeMap.get(node.data.routeId);
  const [tagDraft, setTagDraft] = useState(node.data.tags?.join(", ") ?? "");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raf = window.requestAnimationFrame(() => setTagDraft(node.data.tags?.join(", ") ?? ""));
    return () => window.cancelAnimationFrame(raf);
  }, [node.data.tags, node.id]);

  const handleTagsCommit = () => {
    const tags = tagDraft
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length);
    onNodeTagsChange(node.id, tags);
  };

  const handleAutoAssignConfirm = () => {
    if (typeof window === "undefined") return;
    const confirmation = window.prompt("Tastează ASSIGN pentru a auto-atribuie worlds după route.group.");
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

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
      <div className="space-y-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Quick actions</p>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Label override</p>
          {(["ro", "en"] as const).map((locale) => (
            <input
              key={locale}
              type="text"
              className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
              placeholder={`Titlu ${locale}`}
              value={node.data.labelOverrides?.[locale] ?? ""}
              onChange={(event) => onLabelChange(node.id, locale, event.target.value)}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">World</p>
            <select
              className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
              value={node.data.chunkId ?? defaultChunkId}
              onChange={(event) => onChunkChange(node.id, event.target.value)}
            >
              {chunks.map((chunk) => (
                <option key={chunk.id} value={chunk.id}>
                  {chunk.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
              onClick={handleAutoAssignConfirm}
            >
              Auto-assign după route.group
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Tags</p>
            <textarea
              className="h-24 w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
              placeholder="type:portal, surface:today"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
            />
            <button
              type="button"
              className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
              onClick={handleTagsCommit}
            >
              Actualizează tags
            </button>
            <p className="text-[11px] text-[var(--omni-muted)]">Separă tag-urile cu virgulă (ex: engine:vocab, surface:today).</p>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white px-3 py-2 text-[11px]">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Portal target</p>
          {isPortal ? (
            <p className="font-semibold text-[var(--omni-ink)]">{portalTargetLabel ? `Portal → ${portalTargetLabel}` : "Portal configurat"}</p>
          ) : (
            <p className="text-[var(--omni-muted)]">Nodul nu este portal.</p>
          )}
          <button
            type="button"
            className="mt-2 rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
            onClick={onPortalTabRequest}
          >
            {isPortal ? "Editează portal" : "Configurează portal"}
          </button>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Route</p>
        <p className="font-semibold text-[var(--omni-ink)]">{route?.routePath ?? node.data.routePath}</p>
        {route?.filePath ? <p className="text-[11px] text-[var(--omni-muted)]">{route.filePath}</p> : null}
      </div>
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
  stepsExpanded,
  manifest,
  manifestLabel,
  debugInfo,
  observedEnabled,
  observedEvents,
  onExportAuditSnapshot,
}: DiagnosticsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Diagnostic Tools</p>
        <button
          type="button"
          className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold"
          onClick={onExportAuditSnapshot}
        >
          Export Audit Snapshot
        </button>
      </div>
      <FlowDiagnosticsPanel issues={diagnostics} onSelectIssue={onSelectIssue} flowStats={flowStats} />
      {missingManifestNodes.length ? (
        <MissingManifestPanel nodes={missingManifestNodes} onSelectNode={onSelectMissingManifestNode} />
      ) : null}
      {stepsExpanded && manifest && manifestLabel ? <ManifestPreview manifest={manifest} label={manifestLabel} /> : null}
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
}: OverlayManagerSectionProps) {
  const [newOverlayName, setNewOverlayName] = useState("");
  const activeOverlay = selectedOverlayId ? overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null : null;
  const handleCreateOverlay = () => {
    const value = newOverlayName.trim();
    if (!value) return;
    onCreateOverlay(value);
    setNewOverlayName("");
  };
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3 text-xs">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">Overlays</p>
        <select
          className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
          value={selectedOverlayId ?? ""}
          onChange={(event) => onSelectOverlay(event.target.value || null)}
        >
          <option value="">Selectează overlay</option>
          {overlays.map((overlay) => (
            <option key={overlay.id} value={overlay.id}>
              {overlay.name ?? "Overlay"}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
            placeholder="Nume overlay"
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
              placeholder="Rezumat overlay"
              value={activeOverlay.description ?? ""}
              onChange={(event) => onOverlayMetadataChange(activeOverlay.id, { description: event.target.value })}
            />
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
              Șterge overlay
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pași ({activeOverlay.steps?.length ?? 0})</p>
            {activeOverlay.steps?.length ? (
              <ul className="space-y-2">
                {activeOverlay.steps.map((step, index) => {
                  const label = nodeLabelMap.get(step.nodeId) ?? step.nodeId;
                  return (
                    <li key={`${step.nodeId}-${index}`} className="rounded-xl border border-[var(--omni-border-soft)] bg-white p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--omni-ink)]">
                            {index + 1}. {label}
                          </p>
                          <p className="text-[11px] text-[var(--omni-muted)]">{step.nodeId}</p>
                        </div>
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
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[11px] text-[var(--omni-muted)]">Niciun pas definit. Selectează noduri și folosește acțiunea „Adaugă noduri selectate”.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white p-3 text-center text-[var(--omni-muted)]">
          Selectează sau creează un overlay pentru a începe.
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

function ManifestPreview({ manifest, label }: { manifest: StepManifest; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-white/80 p-3 text-xs text-[var(--omni-muted)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
        Flow intern — <span className="text-[var(--omni-ink)]">{label}</span>
      </p>
      <ol className="mt-2 space-y-1">
        {manifest.nodes.map((node, index) => (
          <li key={node.id} className="flex items-center gap-2">
            <span className="rounded bg-slate-900/10 px-2 py-0.5 font-semibold text-[var(--omni-ink)]">{index + 1}</span>
            <span className="font-semibold text-[var(--omni-ink)]">{node.label}</span>
            {index < manifest.nodes.length - 1 ? <span className="text-[var(--omni-muted)]">→</span> : null}
          </li>
        ))}
      </ol>
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
