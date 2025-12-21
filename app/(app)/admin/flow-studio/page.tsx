"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import clsx from "clsx";
import { getDb } from "@/lib/firebase";
import { getScreenIdForRoute } from "@/lib/routeIds";
import { useFlowStudioConfig, isAdminUser } from "@/lib/adminConfigClient";
import type { CopyFields } from "@/lib/useCopy";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

const DEFAULT_NODE_POSITION = { x: 160, y: 120 };
const EMPTY_COPY: CopyFields = {};

type RouteDoc = {
  id: string;
  routePath: string;
  group: string;
  filePath: string;
};

type StoredNode = {
  id: string;
  routeId: string;
  label?: { ro?: string; en?: string };
  x: number;
  y: number;
  tags?: string[];
};

type StoredEdge = {
  id: string;
  from: string;
  to: string;
  label?: { ro?: string; en?: string };
  conditionTag?: string;
  eventName?: string;
};

type FlowDoc = {
  name: string;
  description?: string;
  nodes?: StoredNode[];
  edges?: StoredEdge[];
  version?: number;
};

type FlowNodeData = {
  routeId: string;
  routePath: string;
  filePath: string;
  screenId: string;
  labelOverrides?: { ro?: string; en?: string };
  tags?: string[];
};

type FlowEdgeData = {
  labelOverrides?: { ro?: string; en?: string };
  conditionTag?: string;
  eventName?: string;
};

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

export default function FlowStudioPage() {
  const navLinks = useNavigationLinks();
  const { user, authReady } = useAuth();
  const { config, loading: configLoading } = useFlowStudioConfig();
  const isAdmin = isAdminUser(user?.email ?? null, config);
  const [menuOpen, setMenuOpen] = useState(false);
  const db = useMemo(() => getDb(), []);

  const [routes, setRoutes] = useState<RouteDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"routes" | "flows">("routes");
  const [routeSearch, setRouteSearch] = useState("");
  const [routeGroup, setRouteGroup] = useState<"all" | "app" | "public">("all");
  const [flowOptions, setFlowOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [flowDoc, setFlowDoc] = useState<FlowDoc | null>(null);
  const [flowNameDraft, setFlowNameDraft] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdgeData>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [copyDraft, setCopyDraft] = useState<{ ro: CopyFields; en: CopyFields }>({ ro: { ...EMPTY_COPY }, en: { ...EMPTY_COPY } });
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setRoutes([]);
      return;
    }
    const routesCol = collection(db, "adminRoutes");
    const unsub = onSnapshot(query(routesCol, orderBy("routePath")), (snapshot) => {
      setRoutes(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<RouteDoc, "id">) })));
    });
    return () => unsub();
  }, [db, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setFlowOptions([]);
      return;
    }
    const flowsCol = collection(db, "adminFlows");
    const unsub = onSnapshot(flowsCol, (snapshot) => {
      setFlowOptions(snapshot.docs.map((docSnap) => ({ id: docSnap.id, name: (docSnap.data().name as string) ?? docSnap.id })));
    });
    return () => unsub();
  }, [db, isAdmin]);

  const routeMap = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes]);

  useEffect(() => {
    if (!isAdmin || !selectedFlowId) {
      const rafId = requestAnimationFrame(() => {
        setFlowDoc(null);
        setNodes([]);
        setEdges([]);
        setFlowNameDraft("");
      });
      return () => cancelAnimationFrame(rafId);
    }
    const flowRef = doc(db, "adminFlows", selectedFlowId);
    const unsub = onSnapshot(flowRef, (snapshot) => {
      if (!snapshot.exists()) {
        setFlowDoc(null);
        setNodes([]);
        setEdges([]);
        setFlowNameDraft("");
        return;
      }
      const data = snapshot.data() as FlowDoc;
      setFlowDoc(data);
      setFlowNameDraft(data.name ?? "");
      const builtNodes = (data.nodes ?? []).map((stored) => buildFlowNode(stored, routeMap));
      const builtEdges = (data.edges ?? []).map(buildFlowEdge);
      setNodes(builtNodes);
      setEdges(builtEdges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    });
    return () => unsub();
  }, [db, selectedFlowId, routeMap, setEdges, setNodes, isAdmin]);

  const filteredRoutes = useMemo(() => {
    const needle = routeSearch.trim().toLowerCase();
    return routes.filter((route) => {
      if (routeGroup !== "all" && route.group !== routeGroup) return false;
      if (!needle) return true;
      return route.routePath.toLowerCase().includes(needle) || route.filePath.toLowerCase().includes(needle);
    });
  }, [routeGroup, routeSearch, routes]);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId) ?? null, [edges, selectedEdgeId]);
  const selectedScreenId = selectedNode?.data.screenId ?? null;

  useEffect(() => {
    if (!isAdmin || !selectedScreenId) {
      setCopyDraft({ ro: { ...EMPTY_COPY }, en: { ...EMPTY_COPY } });
      setCopyError(null);
      setCopyLoading(false);
      return;
    }
    setCopyLoading(true);
    const ref = doc(db, "copyOverrides", selectedScreenId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data() as { ro?: CopyFields; en?: CopyFields } | undefined;
        setCopyDraft({ ro: { ...(data?.ro ?? {}) }, en: { ...(data?.en ?? {}) } });
        setCopyLoading(false);
        setCopyError(null);
      },
      (err) => {
        setCopyError(err.message ?? "Nu am putut încărca override-urile");
        setCopyLoading(false);
      },
    );
    return () => {
      unsub();
    };
  }, [db, selectedScreenId, isAdmin]);

  const handleAddRouteToFlow = useCallback(
    (route: RouteDoc) => {
      if (!selectedFlowId) return;
      const label = route.routePath === "/" ? "root" : route.routePath;
      const screenId = getScreenIdForRoute(route.routePath);
      const nodeId = `node_${randomId()}`;
      setNodes((existing) => [
        ...existing,
        {
          id: nodeId,
          position: {
            x: DEFAULT_NODE_POSITION.x + existing.length * 40,
            y: DEFAULT_NODE_POSITION.y + existing.length * 30,
          },
          data: {
            routeId: route.id,
            routePath: route.routePath,
            filePath: route.filePath,
            screenId,
            labelOverrides: { ro: label, en: label },
            tags: [],
          },
        },
      ]);
      setActiveTab("flows");
    },
    [selectedFlowId, setNodes],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const edgeId = `edge_${randomId()}`;
      setEdges((eds) => addEdge({ ...connection, id: edgeId, data: { labelOverrides: {}, conditionTag: "", eventName: "" } }, eds));
    },
    [setEdges],
  );

  const handleSaveFlow = useCallback(async () => {
    if (!selectedFlowId || !flowNameDraft.trim()) return;
    const storedNodes: StoredNode[] = nodes.map((node) => ({
      id: node.id,
      routeId: node.data.routeId,
      label: node.data.labelOverrides,
      x: node.position.x,
      y: node.position.y,
      tags: node.data.tags ?? [],
    }));
    const storedEdges: StoredEdge[] = edges.map((edge) => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      label: edge.data?.labelOverrides,
      conditionTag: edge.data?.conditionTag,
      eventName: edge.data?.eventName,
    }));
    await setDoc(
      doc(db, "adminFlows", selectedFlowId),
      {
        name: flowNameDraft.trim(),
        nodes: storedNodes,
        edges: storedEdges,
        updatedAt: serverTimestamp(),
        version: (flowDoc?.version ?? 0) + 1,
      },
      { merge: true },
    );
  }, [db, edges, flowDoc?.version, flowNameDraft, nodes, selectedFlowId]);

  const handleCreateFlow = useCallback(async () => {
    const name = prompt("Nume flow nou")?.trim();
    if (!name) return;
    const docRef = await addDoc(collection(db, "adminFlows"), {
      name,
      nodes: [],
      edges: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
    });
    setSelectedFlowId(docRef.id);
    setActiveTab("flows");
  }, [db]);

  const handleCopyFieldChange = useCallback((locale: "ro" | "en", field: keyof CopyFields, value: string) => {
    setCopyDraft((prev) => ({
      ...prev,
      [locale]: {
        ...(prev[locale] ?? {}),
        [field]: value,
      },
    }));
  }, []);

  const handleSaveCopyOverrides = useCallback(async () => {
    if (!selectedScreenId) return;
    await setDoc(
      doc(db, "copyOverrides", selectedScreenId),
      {
        ro: copyDraft.ro,
        en: copyDraft.en,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [copyDraft.en, copyDraft.ro, db, selectedScreenId]);

  const handleNodeLabelChange = useCallback(
    (nodeId: string, locale: "ro" | "en", value: string) => {
      setNodes((existing) =>
        existing.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  labelOverrides: {
                    ...(node.data.labelOverrides ?? {}),
                    [locale]: value,
                  },
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const handleEdgeFieldChange = useCallback(
    (edgeId: string, updates: Partial<FlowEdgeData>) => {
      setEdges((existing) =>
        existing.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  ...updates,
                },
                label:
                  updates.labelOverrides && typeof updates.labelOverrides === "object"
                    ? updates.labelOverrides.ro ?? updates.labelOverrides.en ?? ""
                    : edge.label,
              }
            : edge,
        ),
      );
    },
    [setEdges],
  );

  const flowsTabDisabled = !selectedFlowId;

  if (!authReady || configLoading) {
    return <div className="min-h-screen bg-[var(--omni-bg-main)]" />;
  }

  if (!isAdmin) {
    return (
      <AppShell header={<SiteHeader showMenu={false} onMenuToggle={() => undefined} />}>
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-16 text-center text-[var(--omni-ink)]">
          <p className="text-lg font-semibold">Acces limitat. Doar administratorii pot folosi Flow Studio.</p>
        </div>
      </AppShell>
    );
  }

  const header = <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} />;

  return (
    <AppShell header={header}>
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-8 text-[var(--omni-ink)] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Admin</p>
              <h1 className="text-3xl font-semibold tracking-tight">Flow Studio</h1>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={clsx("rounded-full border px-3 py-1 text-sm font-semibold", activeTab === "routes" ? "bg-[var(--omni-ink)] text-white" : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]")}
                onClick={() => setActiveTab("routes")}
              >
                Routes
              </button>
              <button
                type="button"
                className={clsx("rounded-full border px-3 py-1 text-sm font-semibold", activeTab === "flows" ? "bg-[var(--omni-ink)] text-white" : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]")}
                onClick={() => setActiveTab("flows")}
              >
                Flows
              </button>
            </div>
          </div>

          {activeTab === "routes" ? (
            <RoutesTab
              routes={filteredRoutes}
              search={routeSearch}
              onSearchChange={setRouteSearch}
              groupFilter={routeGroup}
              onGroupFilterChange={setRouteGroup}
              onAddRoute={handleAddRouteToFlow}
              hasActiveFlow={Boolean(selectedFlowId)}
            />
          ) : (
            <FlowsTab
              flowOptions={flowOptions}
              selectedFlowId={selectedFlowId}
              onSelectFlow={setSelectedFlowId}
              onCreateFlow={handleCreateFlow}
              flowName={flowNameDraft}
              onFlowNameChange={setFlowNameDraft}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onSave={handleSaveFlow}
              onNodeSelect={(nodeId) => {
                setSelectedNodeId(nodeId);
                setSelectedEdgeId(null);
              }}
              onEdgeSelect={(edgeId) => {
                setSelectedEdgeId(edgeId);
                setSelectedNodeId(null);
              }}
              routeMap={routeMap}
              flowDoc={flowDoc}
              copyDraft={copyDraft}
              onCopyFieldChange={handleCopyFieldChange}
              onSaveCopy={handleSaveCopyOverrides}
              copyLoading={copyLoading}
              copyError={copyError}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              flowsTabDisabled={flowsTabDisabled}
              setCopyError={setCopyError}
              onLabelChange={handleNodeLabelChange}
              onEdgeFieldChange={handleEdgeFieldChange}
            />
          )}
        </div>
      </div>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </AppShell>
  );
}

function buildFlowNode(stored: StoredNode, routeMap: Map<string, RouteDoc>): Node<FlowNodeData> {
  const route = routeMap.get(stored.routeId);
  const routePath = route?.routePath ?? stored.routeId;
  return {
    id: stored.id,
    position: { x: stored.x ?? DEFAULT_NODE_POSITION.x, y: stored.y ?? DEFAULT_NODE_POSITION.y },
    data: {
      routeId: stored.routeId,
      routePath,
      filePath: route?.filePath ?? "",
      screenId: getScreenIdForRoute(routePath),
      labelOverrides: stored.label ?? {},
      tags: stored.tags ?? [],
    },
  };
}

function buildFlowEdge(edge: StoredEdge): Edge<FlowEdgeData> {
  return {
    id: edge.id,
    source: edge.from,
    target: edge.to,
    data: {
      labelOverrides: edge.label,
      conditionTag: edge.conditionTag,
      eventName: edge.eventName,
    },
    label: edge.label?.ro ?? edge.label?.en ?? edge.conditionTag ?? "",
  };
}

type RoutesTabProps = {
  routes: RouteDoc[];
  search: string;
  onSearchChange: (value: string) => void;
  groupFilter: "all" | "app" | "public";
  onGroupFilterChange: (value: "all" | "app" | "public") => void;
  onAddRoute: (route: RouteDoc) => void;
  hasActiveFlow: boolean;
};

function RoutesTab({ routes, search, onSearchChange, groupFilter, onGroupFilterChange, onAddRoute, hasActiveFlow }: RoutesTabProps) {
  return (
    <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            className="flex-1 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
            placeholder="Caută route..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <select
            className="rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
            value={groupFilter}
            onChange={(event) => onGroupFilterChange(event.target.value as "all" | "app" | "public")}
          >
            <option value="all">Toate</option>
            <option value="app">App</option>
            <option value="public">Public</option>
          </select>
        </div>
        {!hasActiveFlow ? <p className="text-xs text-[var(--omni-muted)]">Selectează un flow în tab-ul „Flows” pentru a adăuga noduri.</p> : null}
      </div>
      <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-[var(--omni-border-soft)]">
        {routes.length === 0 ? (
          <p className="p-4 text-sm text-[var(--omni-muted)]">Nu există rute sincronizate.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)]/50 text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                <th className="px-4 py-2">Route</th>
                <th className="px-4 py-2">Group</th>
                <th className="px-4 py-2">File</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-b border-[var(--omni-border-soft)]">
                  <td className="px-4 py-2 font-semibold">{route.routePath}</td>
                  <td className="px-4 py-2 text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{route.group}</td>
                  <td className="px-4 py-2 text-xs text-[var(--omni-muted)]">{route.filePath}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold"
                      disabled={!hasActiveFlow}
                      onClick={() => onAddRoute(route)}
                    >
                      Adaugă în flow
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

type FlowsTabProps = {
  flowOptions: Array<{ id: string; name: string }>;
  selectedFlowId: string | null;
  onSelectFlow: (id: string | null) => void;
  onCreateFlow: () => void;
  flowName: string;
  onFlowNameChange: (value: string) => void;
  nodes: Node<FlowNodeData>[];
  edges: Edge<FlowEdgeData>[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onSave: () => void;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  routeMap: Map<string, RouteDoc>;
  flowDoc: FlowDoc | null;
  copyDraft: { ro: CopyFields; en: CopyFields };
  onCopyFieldChange: (locale: "ro" | "en", field: keyof CopyFields, value: string) => void;
  onSaveCopy: () => void;
  copyLoading: boolean;
  copyError: string | null;
  selectedNode: Node<FlowNodeData> | null;
  selectedEdge: Edge<FlowEdgeData> | null;
  flowsTabDisabled: boolean;
  setCopyError: (value: string | null) => void;
  onLabelChange: (nodeId: string, locale: "ro" | "en", value: string) => void;
  onEdgeFieldChange: (edgeId: string, updates: Partial<FlowEdgeData>) => void;
};

function FlowsTab({
  flowOptions,
  selectedFlowId,
  onSelectFlow,
  onCreateFlow,
  flowName,
  onFlowNameChange,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSave,
  onNodeSelect,
  onEdgeSelect,
  routeMap,
  flowDoc,
  copyDraft,
  onCopyFieldChange,
  onSaveCopy,
  copyLoading,
  copyError,
  selectedNode,
  selectedEdge,
  flowsTabDisabled,
  setCopyError,
  onLabelChange,
  onEdgeFieldChange,
}: FlowsTabProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
          value={selectedFlowId ?? ""}
          onChange={(event) => onSelectFlow(event.target.value || null)}
        >
          <option value="">Selectează flow</option>
          {flowOptions.map((flow) => (
            <option key={flow.id} value={flow.id}>
              {flow.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] px-3 py-2 text-sm"
          onClick={onCreateFlow}
        >
          Creează flow nou
        </button>
        <input
          type="text"
          className="flex-1 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
          placeholder="Titlu flow"
          value={flowName}
          onChange={(event) => onFlowNameChange(event.target.value)}
          disabled={!selectedFlowId}
        />
        <OmniCtaButton size="sm" onClick={onSave} disabled={!selectedFlowId}>
          Salvează flow
        </OmniCtaButton>
      </div>
      {flowsTabDisabled ? (
        <p className="text-sm text-[var(--omni-muted)]">Selectează sau creează un flow pentru a edita canvas-ul.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[3fr_1fr]">
          <div className="h-[520px] rounded-2xl border border-[var(--omni-border-soft)] bg-white">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              onNodeClick={(_, node) => onNodeSelect(node.id)}
              onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
              onPaneClick={() => {
                onNodeSelect(null);
                onEdgeSelect(null);
              }}
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
          <aside className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-4 text-sm">
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
              />
            ) : selectedEdge ? (
              <EdgeInspector edge={selectedEdge} onFieldChange={onEdgeFieldChange} />
            ) : (
              <p className="text-[var(--omni-muted)]">Selectează un nod sau o tranziție pentru a edita detaliile.</p>
            )}
          </aside>
        </div>
      )}
      {flowDoc?.description ? <p className="text-xs text-[var(--omni-muted)]">{flowDoc.description}</p> : null}
    </section>
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
};

function NodeInspector({ node, routeMap, copyDraft, onCopyFieldChange, onSaveCopy, copyLoading, copyError, setCopyError, onLabelChange }: NodeInspectorProps) {
  const route = routeMap.get(node.data.routeId);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Screen</p>
        <p className="font-semibold">{route?.routePath ?? node.data.routePath}</p>
        {route?.filePath ? <p className="text-xs text-[var(--omni-muted)]">{route.filePath}</p> : null}
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
};

function EdgeInspector({ edge, onFieldChange }: EdgeInspectorProps) {
  const data = edge.data ?? {};
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Edge</p>
      {(["ro", "en"] as const).map((locale) => (
        <input
          key={locale}
          type="text"
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
          placeholder={`Label ${locale}`}
          defaultValue={data.labelOverrides?.[locale] ?? ""}
          onBlur={(event) =>
            onFieldChange(edge.id, {
              labelOverrides: {
                ...(data.labelOverrides ?? {}),
                [locale]: event.target.value,
              },
            })
          }
        />
      ))}
      <input
        type="text"
        className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
        placeholder="Condition tag"
        defaultValue={data.conditionTag ?? ""}
        onBlur={(event) => onFieldChange(edge.id, { conditionTag: event.target.value })}
      />
      <input
        type="text"
        className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
        placeholder="Event name"
        defaultValue={data.eventName ?? ""}
        onBlur={(event) => onFieldChange(edge.id, { eventName: event.target.value })}
      />
    </div>
  );
}
