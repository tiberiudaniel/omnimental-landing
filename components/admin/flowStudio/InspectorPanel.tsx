"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Edge, Node } from "reactflow";
import type { CopyFields } from "@/lib/useCopy";
import type { FlowEdgeData, FlowIssue, FlowNodeData, LabelMap, RouteDoc } from "@/lib/flowStudio/types";
import { getStepManifestForRoute, type StepManifest } from "@/lib/stepManifests";
import type { ObservedEvent } from "@/lib/flowStudio/observed";
import { StepStatusBadge, type StepAvailability } from "./StepStatusBadge";

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
  onEdgeFieldChange: (edgeId: string, updates: Partial<FlowEdgeData>) => void;
  onApplyEdgeColorToGroup: (edgeId: string, color: string) => void;
  onCollapse: () => void;
  observedEnabled: boolean;
  observedEvents: ObservedEvent[];
};

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
  onEdgeFieldChange,
  onApplyEdgeColorToGroup,
  onCollapse,
  observedEnabled,
  observedEvents,
}: InspectorPanelProps) {
  const resolvedRoutePath = selectedNode ? routeMap.get(selectedNode.data.routeId)?.routePath ?? selectedNode.data.routePath ?? null : null;
  const manifestFallback = resolvedRoutePath ? getStepManifestForRoute(resolvedRoutePath, {}) : null;
  const manifestForDisplay = currentManifest ?? manifestFallback;
  const canExpandSteps = Boolean(selectedNode && manifestForDisplay);
  const expandDisabled = !canExpandSteps;
  const expandTitle =
    !selectedNode
      ? "Selecteaza un nod."
      : stepStatus === "route-mismatch"
        ? "Fix mapping pentru a vedea pasii."
        : stepStatus === "unavailable"
          ? "Nu exista manifest pentru acest route."
          : undefined;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StepStatusBadge status={selectedNode ? stepStatus : "unknown"} variant="solid" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={clsx(
              "rounded-full border px-3 py-2 text-xs font-semibold",
              stepsExpanded ? "border-sky-500 text-sky-500" : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]",
              expandDisabled ? "opacity-60" : "",
            )}
            onClick={onToggleSteps}
            disabled={expandDisabled}
            title={expandTitle}
          >
            {stepsExpanded ? "Ascunde pasii" : "Expand steps"}
          </button>
          {selectedNode && stepStatus === "route-mismatch" ? (
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
      {selectedNode && stepStatus === "route-mismatch" && !canFixRouteMapping ? (
        <p className="text-[10px] text-amber-600">Route-ul nu exista in adminRoutes. Ruleaza sync si reincearca.</p>
      ) : null}
      {stepFixError ? <p className="text-xs text-rose-400">{stepFixError}</p> : null}
      {missingManifestNodes.length ? (
        <MissingManifestPanel nodes={missingManifestNodes} onSelectNode={onSelectMissingManifestNode} />
      ) : null}
      {stepsExpanded && manifestForDisplay && selectedNode ? (
        <div className="rounded-2xl border border-slate-700 bg-white/80 p-3 text-xs text-[var(--omni-muted)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            Flow intern —{" "}
            <span className="text-[var(--omni-ink)]">
              {routeMap.get(selectedNode.data.routeId)?.routePath ?? selectedNode.data.routePath ?? selectedNode.id}
            </span>
          </p>
          <ol className="mt-2 space-y-1">
            {manifestForDisplay.nodes.map((node, index) => (
              <li key={node.id} className="flex items-center gap-2">
                <span className="rounded bg-slate-900/10 px-2 py-0.5 font-semibold text-[var(--omni-ink)]">{index + 1}</span>
                <span className="font-semibold text-[var(--omni-ink)]">{node.label}</span>
                {index < manifestForDisplay.nodes.length - 1 ? <span className="text-[var(--omni-muted)]">→</span> : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <FlowDiagnosticsPanel issues={diagnostics} onSelectIssue={onSelectIssue} flowStats={flowStats} />
      {selectedNode ? (
        <NodeInspector
          node={selectedNode}
          routeMap={routeMap}
          copyDraft={copyDraft}
          onCopyFieldChange={onCopyFieldChange}
          onSaveCopy={onSaveCopy}
          copyLoading={copyLoading}
          copyError={copyError}
          setCopyError={setCopyError}
          onLabelChange={onLabelChange}
          stepStatus={stepStatus}
        />
      ) : selectedEdge ? (
        <EdgeInspector edge={selectedEdge} onFieldChange={onEdgeFieldChange} onApplyColorGroup={onApplyEdgeColorToGroup} />
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] px-3 py-4 text-center text-[var(--omni-muted)]">
          Selectează un nod sau o tranziție pentru a edita detaliile.
        </p>
      )}
      {observedEnabled ? (
        <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Evenimente recente</p>
          {observedEvents && observedEvents.length ? (
            <ul className="mt-2 space-y-2 text-xs">
              {observedEvents.slice(0, 8).map((event) => (
                <li key={event.id} className="rounded-xl border border-[var(--omni-border-soft)] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--omni-ink)]">{event.event}</span>
                    <span className="text-[var(--omni-muted)]">{event.ts.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</span>
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
      ) : null}
    </aside>
  );
}

function FlowDiagnosticsPanel({
  issues,
  onSelectIssue,
  flowStats,
}: {
  issues: FlowIssue[];
  onSelectIssue: (issue: FlowIssue) => void;
  flowStats: FlowStats;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Diagnostics</p>
        <span className={clsx("rounded-full px-3 py-0.5 text-[11px] font-semibold", issues.length ? "bg-amber-900/60 text-amber-200" : "bg-emerald-900/40 text-emerald-200")}>
          {issues.length ? `${issues.length} probleme` : "OK"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[var(--omni-muted)]">
        <span className="rounded-full bg-slate-900/10 px-2 py-0.5">Noduri: {flowStats.nodeCount}</span>
        <span className="rounded-full bg-slate-900/10 px-2 py-0.5">Tranziții: {flowStats.edgeCount}</span>
        <span className="rounded-full bg-slate-900/10 px-2 py-0.5">Orfani: {flowStats.orphanCount}</span>
        <span className="rounded-full bg-slate-900/10 px-2 py-0.5">Neatinse: {flowStats.unreachableCount}</span>
        <span
          className={clsx(
            "rounded-full px-2 py-0.5 uppercase",
            flowStats.hasExplicitStart ? "bg-emerald-900/40 text-emerald-200" : "bg-rose-900/40 text-rose-200",
          )}
        >
          Start: {flowStats.hasExplicitStart ? "DA" : "NU"}
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="text-xs text-[var(--omni-muted)]">Nicio anomalie majoră detectată.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {issues.map((issue) => (
            <li key={issue.id} className="rounded-xl border border-amber-500/30 bg-amber-900/20 p-2 text-amber-100">
              <button
                type="button"
                className="text-left font-semibold underline-offset-2 hover:underline"
                onClick={() => onSelectIssue(issue)}
              >
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
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
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Missing Step Manifests in this flow</p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{nodes.length}</span>
      </div>
      <p className="mt-1 text-[11px] text-amber-800">Click pe un route pentru a selecta nodul și a prioritiza manifestul lipsă.</p>
      <ul className="mt-2 space-y-2 text-xs">
        {nodes.map((entry) => (
          <li key={entry.nodeId}>
            <button
              type="button"
              className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-left shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]"
              onClick={() => onSelectNode(entry.nodeId)}
            >
              <span className="block font-semibold text-[var(--omni-ink)]">{entry.routePath}</span>
              {entry.label && entry.label !== entry.routePath ? (
                <span className="text-[var(--omni-muted)]">{entry.label}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type NodeInspectorProps = {
  node: Node<FlowNodeData>;
  routeMap: Map<string, RouteDoc>;
  copyDraft: { ro: CopyFields; en: CopyFields };
  onCopyFieldChange: (locale: "ro" | "en", field: keyof CopyFields, value: string) => void;
  onSaveCopy: () => void;
  copyLoading: boolean;
  copyError: string | null;
  setCopyError: (value: string | null) => void;
  onLabelChange: (nodeId: string, locale: "ro" | "en", value: string) => void;
  stepStatus: StepAvailability;
};

function NodeInspector({
  node,
  routeMap,
  copyDraft,
  onCopyFieldChange,
  onSaveCopy,
  copyLoading,
  copyError,
  setCopyError,
  onLabelChange,
  stepStatus,
}: NodeInspectorProps) {
  const route = routeMap.get(node.data.routeId);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Screen</p>
        <p className="font-semibold">{route?.routePath ?? node.data.routePath}</p>
        {route?.filePath ? <p className="text-xs text-[var(--omni-muted)]">{route.filePath}</p> : null}
        <div className="mt-2">
          <StepStatusBadge status={stepStatus} variant="ghost" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Label override</p>
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
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Copy override</p>
        {copyError ? <p className="text-xs text-red-500">{copyError}</p> : null}
        {(["ro", "en"] as const).map((locale) => (
          <div key={locale} className="space-y-1 rounded-xl border border-[var(--omni-border-soft)] p-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{locale.toUpperCase()}</p>
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--omni-border-soft)] px-2 py-1 text-sm"
              placeholder="H1"
              value={copyDraft[locale].h1 ?? ""}
              onChange={(event) => onCopyFieldChange(locale, "h1", event.target.value)}
            />
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--omni-border-soft)] px-2 py-1 text-sm"
              placeholder="Subtitle"
              value={copyDraft[locale].subtitle ?? ""}
              onChange={(event) => onCopyFieldChange(locale, "subtitle", event.target.value)}
            />
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--omni-border-soft)] px-2 py-1 text-sm"
              placeholder="CTA primar"
              value={copyDraft[locale].ctaPrimary ?? ""}
              onChange={(event) => onCopyFieldChange(locale, "ctaPrimary", event.target.value)}
            />
            <input
              type="text"
              className="w-full rounded-lg border border-[var(--omni-border-soft)] px-2 py-1 text-sm"
              placeholder="CTA secundar"
              value={copyDraft[locale].ctaSecondary ?? ""}
              onChange={(event) => onCopyFieldChange(locale, "ctaSecondary", event.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          className="w-full rounded-full bg-[var(--omni-ink)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
              className={clsx(
                "h-6 w-6 rounded-full border-2",
                draft.color === color ? "border-[var(--omni-ink)]" : "border-transparent",
              )}
              style={{ backgroundColor: color }}
              onClick={() => setDraft((prev) => ({ ...prev, color }))}
            >
              <span className="sr-only">{color}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="w-full rounded-full bg-[var(--omni-ink)] px-3 py-2 text-sm font-semibold text-white"
        onClick={handleSave}
      >
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
