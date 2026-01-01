"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent as ReactDragEvent } from "react";
import {
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node as ReactFlowNode,
  type NodeChange,
  type ReactFlowInstance,
  type XYPosition,
} from "reactflow";
import "reactflow/dist/style.css";
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import clsx from "clsx";
import dagre from "dagre";
import { getDb } from "@/lib/firebase";
import { getScreenIdForRoute } from "@/lib/routeIds";
import { useFlowStudioConfig, isAdminUser } from "@/lib/adminConfigClient";
import type { CopyFields } from "@/lib/useCopy";
import { computeFlowDiagnostics } from "@/lib/flowStudio/diagnostics";
import {
  loadObservedSnapshot,
  OBSERVED_SEGMENTS,
  OBSERVED_WINDOWS,
  type ObservedSegmentKey,
  type ObservedSnapshot,
  type ObservedWindowKey,
} from "@/lib/flowStudio/observed";
import type {
  CopyOverrideDoc,
  FlowChunk,
  FlowComment,
  FlowDoc,
  FlowEdge,
  FlowEdgeData,
  FlowIssue,
  FlowNode,
  FlowNodeData,
  FlowNodePortalConfig,
  FlowOverlay,
  FlowOverlayStep,
  RouteDoc,
  StepNodeRenderData,
} from "@/lib/flowStudio/types";
import { getStepManifestAvailability, getStepManifestForRoute, type StepManifest } from "@/lib/stepManifests";
import type { StepAvailability } from "@/components/admin/flowStudio/StepStatusBadge";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { RoutesPanel, type RouteDragHandler } from "@/components/admin/flowStudio/RoutesPanel";
import { FlowCanvas } from "@/components/admin/flowStudio/FlowCanvas";
import { InspectorPanel, type FlowStats, type MissingManifestNode, type InspectorTab } from "@/components/admin/flowStudio/InspectorPanel";
import { buildEdgeGroupKey, filterEdgesByNodeSet } from "@/lib/flowStudio/edgeUtils";
import { ChunkPanel, CHUNK_SELECTION_MIME } from "@/components/admin/flowStudio/ChunkPanel";
import {
  autoAssignChunksByRouteGroup,
  buildChunkAutoAssignMap,
  buildChunkGraph,
  computeReachableNodeIds,
  ensureNodesHaveValidChunks,
  normalizeChunks,
  UNGROUPED_CHUNK_ID,
  type ChunkNodeData,
} from "@/lib/flowStudio/chunkUtils";
import { FLOW_STUDIO_CHUNK_SEED_V1, mergeChunksWithSeed, parseChunkImportPayload } from "@/lib/flowStudio/chunkSeed";
import {
  FlowSpec,
  FlowSpecEdge,
  FlowSpecNode,
  FlowSpecPreview,
  formatTimestamp,
  getTimestampMillis,
  normalizeLabelMap,
  normalizeSpecTags,
  normalizeTags,
  parseFlowSpecText,
} from "@/lib/flowStudio/flowSpec";
import { OpenIssuesPanel } from "@/components/admin/flowStudio/OpenIssuesPanel";

const DEBUG_STEPS = process.env.NEXT_PUBLIC_FLOW_STUDIO_DEBUG_STEPS === "true";
const FLOW_STUDIO_DIAG = process.env.NEXT_PUBLIC_FLOW_STUDIO_DIAG === "1";
const logEffect = (label: string, details?: unknown) => {
  if (!FLOW_STUDIO_DIAG) return;
  if (details === undefined) {
    console.log(`[FlowStudioEffect] ${label}`);
  } else {
    console.log(`[FlowStudioEffect] ${label}`, details);
  }
};

const DEFAULT_NODE_POSITION = { x: 160, y: 120 };
const DAGRE_NODE_WIDTH = 220;
const DAGRE_NODE_HEIGHT = 80;
const STEP_NODE_HEIGHT = 50;
const STEP_NODE_WIDTH = 160;
const STEP_NODE_HORIZONTAL_OFFSET = DAGRE_NODE_WIDTH + 140;
const STEP_NODE_VERTICAL_GAP = 80;
const LAST_FLOW_KEY = "flowStudio:lastFlowId";
const EMPTY_COPY: CopyFields = {};
const DEFAULT_EDGE_COLOR = "#0f172a";
const AUTOSAVE_INTERVAL_MS = 3 * 60 * 1000;
const AUTOSAVE_DOC_ID = "autosave";
const autosaveTimeFormatter = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" });
const VIEW_MODE_STORAGE_KEY = "flowStudio:viewMode";
const FOCUSED_CHUNK_STORAGE_KEY = "flowStudio:focusedChunkId";
const SELECTED_CHUNK_STORAGE_KEY = "flowStudio:selectedChunkId";
const TAG_FILTERS_STORAGE_KEY = "flowStudio:tagFilters";
const CHUNK_FOCUS_HIDE_STORAGE_KEY = "flowStudio:focusHide";
const LEFT_SIDEBAR_COLLAPSED_KEY = "flowStudio:leftSidebarCollapsed";
const INSPECTOR_COLLAPSED_KEY = "flowStudio:inspectorCollapsed";
const stripUndefinedDeep = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)).filter((item) => item !== undefined) as unknown as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      if (entry === undefined) return;
      const cleaned = stripUndefinedDeep(entry);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    });
    return result as T;
  }
  return value;
};

type FlowDraftDoc = {
  name?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  chunks?: FlowChunk[];
  comments?: FlowComment[];
  overlays?: FlowOverlay[];
  updatedAt?: unknown;
  updatedAtMs?: number;
  consumedAt?: unknown;
  consumedAtMs?: number;
};

type AddRouteOptions = {
  markAsStart?: boolean;
  labelOverride?: string | null;
  tags?: string[];
  chunkId?: string | null;
  portal?: FlowNodePortalConfig | null;
};

type PortalDraftState = {
  label: string;
  targetRouteId: string;
  chunkId: string;
};

type FlowViewMode = "nodes" | "chunks";
type LeftSidebarTab = "routes" | "worlds" | "issues";

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const sortAndDedupeIds = (list: string[]) => {
  if (list.length <= 1) return list;
  const unique = Array.from(new Set(list));
  unique.sort();
  return unique;
};

const areIdListsEqual = (a: string[], b: string[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
};

export default function FlowStudioPage() {
  const navLinks = useNavigationLinks();
  const { user, authReady } = useAuth();
  const { config, loading: configLoading } = useFlowStudioConfig();
  const isAdmin = isAdminUser(user?.email ?? null, config);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
  const [leftSidebarTab, setLeftSidebarTab] = useState<LeftSidebarTab>("routes");
  const [inspectorCollapsed, setInspectorCollapsed] = useState(true);
  const db = useMemo(() => getDb(), []);
  const [routes, setRoutes] = useState<RouteDoc[]>([]);
  const [routeSearch, setRouteSearch] = useState("");
  const [routeGroup, setRouteGroup] = useState<string>("all");
  const [flowOptions, setFlowOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [flowDoc, setFlowDoc] = useState<FlowDoc | null>(null);
  const [flowNameDraft, setFlowNameDraft] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [, setLastAutosaveAt] = useState<Date | null>(null);
  const [, setAutosaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [, setAutosaveError] = useState<string | null>(null);
  const [lastFlowSaveAt, setLastFlowSaveAt] = useState<Date | null>(null);
  const [, setLastChunkSaveAt] = useState<Date | null>(null);
  const [chunks, setChunks] = useState<FlowChunk[]>(() => normalizeChunks());
  const [viewMode, setViewMode] = useState<FlowViewMode>("nodes");
  const [chunkLayoutOrientation, setChunkLayoutOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [chunkLayoutDensity, setChunkLayoutDensity] = useState<"compact" | "spacious">("compact");
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [focusedChunkId, setFocusedChunkId] = useState<string | null>(null);
  const [chunkFocusHideOthers, setChunkFocusHideOthers] = useState(false);
  const [comments, setComments] = useState<FlowComment[]>([]);
  const [commentFilter, setCommentFilter] = useState<"all" | "open" | "nodes" | "chunks">("open");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [portalCreatorOpen, setPortalCreatorOpen] = useState(false);
  const [portalDraft, setPortalDraft] = useState<PortalDraftState>(() => ({
    label: "PORTAL: To Today",
    targetRouteId: "",
    chunkId: UNGROUPED_CHUNK_ID,
  }));
  const [portalError, setPortalError] = useState<string | null>(null);
  const [autosaveToast, setAutosaveToast] = useState<{ id: number; type: "success" | "error"; message: string } | null>(null);
  type ChunkSaveStatus = "idle" | "pending" | "saving" | "error";
  const [, setChunkSaveStatus] = useState<ChunkSaveStatus>("idle");
  const [chunkSaveError, setChunkSaveError] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<FlowOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [overlayFocusHideOthers, setOverlayFocusHideOthers] = useState(true);
  const [inspectorTabRequest, setInspectorTabRequest] = useState<{ tab: InspectorTab; nonce: number } | null>(null);
  const selectOverlay = useCallback(
    (overlayId: string | null, options?: { enforceViewMode?: boolean }) => {
      setSelectedOverlayId(overlayId);
      if (overlayId) {
        const shouldSwitchView = options?.enforceViewMode ?? true;
        if (shouldSwitchView) {
          setViewMode("nodes");
        }
      } else {
        setOverlayFocusHideOthers(true);
      }
    },
    [setOverlayFocusHideOthers, setSelectedOverlayId, setViewMode],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdgeData>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [copyDraft, setCopyDraft] = useState<{ ro: CopyFields; en: CopyFields }>({ ro: { ...EMPTY_COPY }, en: { ...EMPTY_COPY } });
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [observedEnabled, setObservedEnabled] = useState(false);
  const [observedWindow, setObservedWindow] = useState<ObservedWindowKey>("1h");
  const [observedSegment, setObservedSegment] = useState<ObservedSegmentKey>("all");
  const [, setObservedLoading] = useState(false);
  const [observedSnapshot, setObservedSnapshot] = useState<ObservedSnapshot | null>(null);
  const [expandedStepsMap, setExpandedStepsMap] = useState<Record<string, boolean>>({});
  const [selectedStepNodeId, setSelectedStepNodeId] = useState<string | null>(null);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSpecText, setImportSpecText] = useState("");
  const [importSpecPreview, setImportSpecPreview] = useState<FlowSpecPreview | null>(null);
  const [importSpecError, setImportSpecError] = useState<string | null>(null);
  const [importUpdateCurrent, setImportUpdateCurrent] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [pendingFocusTarget, setPendingFocusTarget] = useState<"map" | "journey" | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [diagnosticsBannerVisible, setDiagnosticsBannerVisible] = useState(true);
  const [stepFixError, setStepFixError] = useState<string | null>(null);
  const [autoLayoutRunning, setAutoLayoutRunning] = useState(false);
  const [zoomingToFit, setZoomingToFit] = useState(false);
  const [centeringSelection, setCenteringSelection] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const pendingFitNodeRef = useRef<string | null>(null);
  const autosavePromptedRef = useRef<string | null>(null);
  const chunkAutosaveTimeoutRef = useRef<number | null>(null);
  const chunkAutosaveInitializedRef = useRef(false);
  const autosaveToastTimeoutRef = useRef<number | null>(null);
  const overlayAutoFitKeyRef = useRef<string | null>(null);
  const overlayScrollRestoreRef = useRef<number | null>(null);
  const viewModeRestoredRef = useRef(false);
  const focusRestoredRef = useRef(false);
  const leftSidebarRestoredRef = useRef(false);
  const inspectorRestoredRef = useRef(false);
  const selectedChunkRestoredRef = useRef(false);
  const tagFiltersRestoredRef = useRef(false);
  const focusHideRestoredRef = useRef(false);
  const latestChunksRef = useRef<FlowChunk[]>(chunks);
  const flowSelectRef = useRef<HTMLSelectElement | null>(null);
  const journeySelectRef = useRef<HTMLSelectElement | null>(null);
  const formatStatusTime = (value: Date | null) => (value ? autosaveTimeFormatter.format(value) : "—");

useEffect(() => {
  if (typeof window === "undefined") return;
  let rafId: number | null = null;
  const run = () => {
    if (!overlays.length) {
      selectOverlay(null, { enforceViewMode: false });
      return;
    }
    setSelectedOverlayId((prev) => {
      if (prev && overlays.some((overlay) => overlay.id === prev)) {
        return prev;
      }
      return overlays[0]?.id ?? null;
    });
  };
  rafId = window.requestAnimationFrame(run);
  return () => {
    if (rafId) window.cancelAnimationFrame(rafId);
  };
}, [overlays, selectOverlay]);

useEffect(() => {
  if (!filtersDrawerOpen) return;
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setFiltersDrawerOpen(false);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [filtersDrawerOpen]);

useEffect(() => {
  if (!selectedFlowId && filtersDrawerOpen) {
    const raf = window.requestAnimationFrame(() => setFiltersDrawerOpen(false));
    return () => window.cancelAnimationFrame(raf);
  }
  return undefined;
}, [filtersDrawerOpen, selectedFlowId]);

useEffect(() => {
  const handleGlobalShortcut = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault();
      setCommandPaletteOpen(true);
      setCommandSearch("");
    }
  };
  window.addEventListener("keydown", handleGlobalShortcut);
  return () => window.removeEventListener("keydown", handleGlobalShortcut);
}, []);

useEffect(() => {
  if (!commandPaletteOpen) return;
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setCommandPaletteOpen(false);
    }
  };
  window.addEventListener("keydown", handleEscape);
  return () => window.removeEventListener("keydown", handleEscape);
}, [commandPaletteOpen]);

useEffect(() => {
  if (!headerMenuOpen) return;
  const handleClickOutside = (event: MouseEvent) => {
    if (!headerMenuRef.current) return;
    const target = event.target;
    if (typeof window !== "undefined" && target instanceof window.Node && !headerMenuRef.current.contains(target)) {
      setHeaderMenuOpen(false);
    }
  };
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setHeaderMenuOpen(false);
    }
  };
  window.addEventListener("mousedown", handleClickOutside);
  window.addEventListener("keydown", handleEscape);
  return () => {
    window.removeEventListener("mousedown", handleClickOutside);
    window.removeEventListener("keydown", handleEscape);
  };
}, [headerMenuOpen]);

useEffect(() => {
  if (!commandPaletteOpen && commandSearch) {
    const raf = window.requestAnimationFrame(() => setCommandSearch(""));
    return () => window.cancelAnimationFrame(raf);
  }
  return undefined;
}, [commandPaletteOpen, commandSearch]);

  const setSingleNodeSelection = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeIds(nodeId ? [nodeId] : []);
  }, []);

  const setSingleEdgeSelection = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedEdgeIds(edgeId ? [edgeId] : []);
  }, []);

  useEffect(() => {
    if (!FLOW_STUDIO_DIAG) return;
    console.log("[FlowStudioDiag] FlowStudio mounted");
    return () => {
      console.log("[FlowStudioDiag] FlowStudio unmounted");
    };
  }, []);

  useEffect(() => {
    latestChunksRef.current = chunks;
  }, [chunks]);

  useEffect(() => {
    if (!FLOW_STUDIO_DIAG) return;
    console.log("[FlowStudioDiag] Observed toggle", { enabled: observedEnabled });
  }, [observedEnabled]);


  useEffect(() => {
    if (!isAdmin) {
      const rafId = requestAnimationFrame(() => setRoutes([]));
      return () => cancelAnimationFrame(rafId);
    }
    const routesCol = collection(db, "adminRoutes");
    const unsub = onSnapshot(query(routesCol, orderBy("routePath")), (snapshot) => {
      setRoutes(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<RouteDoc, "id">) })));
    });
    return () => unsub();
  }, [db, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      const rafId = requestAnimationFrame(() => setFlowOptions([]));
      return () => cancelAnimationFrame(rafId);
    }
    const flowsCol = collection(db, "adminFlows");
    const unsub = onSnapshot(flowsCol, (snapshot) => {
      setFlowOptions(snapshot.docs.map((docSnap) => ({ id: docSnap.id, name: (docSnap.data().name as string) ?? docSnap.id })));
    });
    return () => unsub();
  }, [db, isAdmin]);

useEffect(() => {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(LAST_FLOW_KEY);
  if (stored) {
    startTransition(() => setSelectedFlowId(stored));
  }
}, [setSelectedFlowId]);

  useEffect(() => {
    if (typeof window === "undefined" || viewModeRestoredRef.current) return;
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "nodes" || stored === "chunks") {
      const raf = window.requestAnimationFrame(() => setViewMode(stored));
      viewModeRestoredRef.current = true;
      return () => window.cancelAnimationFrame(raf);
    }
    viewModeRestoredRef.current = true;
  }, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
}, [viewMode]);

useEffect(() => {
  if (overlayScrollRestoreRef.current == null) return;
  if (typeof window === "undefined") return;
  const target = overlayScrollRestoreRef.current;
  overlayScrollRestoreRef.current = null;
  window.requestAnimationFrame(() => window.scrollTo({ top: target }));
}, [selectedOverlayId]);

useEffect(() => {
  if (typeof window === "undefined" || leftSidebarRestoredRef.current) return;
  const stored = window.localStorage.getItem(LEFT_SIDEBAR_COLLAPSED_KEY);
  if (stored === "0" || stored === "1") {
    const raf = window.requestAnimationFrame(() => setLeftSidebarCollapsed(stored === "1"));
    leftSidebarRestoredRef.current = true;
    return () => window.cancelAnimationFrame(raf);
  }
  leftSidebarRestoredRef.current = true;
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEFT_SIDEBAR_COLLAPSED_KEY, leftSidebarCollapsed ? "1" : "0");
}, [leftSidebarCollapsed]);

useEffect(() => {
  if (typeof window === "undefined" || inspectorRestoredRef.current) return;
  const stored = window.localStorage.getItem(INSPECTOR_COLLAPSED_KEY);
  if (stored === "0" || stored === "1") {
    const raf = window.requestAnimationFrame(() => setInspectorCollapsed(stored === "1"));
    inspectorRestoredRef.current = true;
    return () => window.cancelAnimationFrame(raf);
  }
  inspectorRestoredRef.current = true;
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSPECTOR_COLLAPSED_KEY, inspectorCollapsed ? "1" : "0");
}, [inspectorCollapsed]);

useEffect(() => {
  if (typeof window === "undefined") return;
  if (selectedFlowId) {
    window.localStorage.setItem(LAST_FLOW_KEY, selectedFlowId);
  } else {
    window.localStorage.removeItem(LAST_FLOW_KEY);
  }
  chunkAutosaveInitializedRef.current = false;
  selectedChunkRestoredRef.current = false;
  focusHideRestoredRef.current = false;
}, [selectedFlowId]);

useEffect(() => {
  focusRestoredRef.current = false;
}, [selectedFlowId]);

useEffect(() => {
  if (!selectedFlowId || focusRestoredRef.current) return;
  if (typeof window === "undefined") return;
  const key = `${FOCUSED_CHUNK_STORAGE_KEY}:${selectedFlowId}`;
  const stored = window.localStorage.getItem(key);
  if (stored && chunks.some((chunk) => chunk.id === stored)) {
    const raf = window.requestAnimationFrame(() => setFocusedChunkId(stored));
    focusRestoredRef.current = true;
    return () => window.cancelAnimationFrame(raf);
  }
  focusRestoredRef.current = true;
}, [chunks, selectedFlowId]);

useEffect(() => {
  if (!selectedFlowId || typeof window === "undefined") return;
  const key = `${FOCUSED_CHUNK_STORAGE_KEY}:${selectedFlowId}`;
  if (focusedChunkId) {
    window.localStorage.setItem(key, focusedChunkId);
  } else {
    window.localStorage.removeItem(key);
  }
}, [focusedChunkId, selectedFlowId]);

useEffect(() => {
  if (!selectedFlowId || focusHideRestoredRef.current) return;
  if (typeof window === "undefined") return;
  const key = `${CHUNK_FOCUS_HIDE_STORAGE_KEY}:${selectedFlowId}`;
  const stored = window.localStorage.getItem(key);
  if (stored) {
    const raf = window.requestAnimationFrame(() => setChunkFocusHideOthers(stored === "1"));
    focusHideRestoredRef.current = true;
    return () => window.cancelAnimationFrame(raf);
  }
  focusHideRestoredRef.current = true;
}, [selectedFlowId]);

useEffect(() => {
  if (!selectedFlowId || typeof window === "undefined") return;
  const key = `${CHUNK_FOCUS_HIDE_STORAGE_KEY}:${selectedFlowId}`;
  if (focusedChunkId) {
    window.localStorage.setItem(key, chunkFocusHideOthers ? "1" : "0");
  } else {
    window.localStorage.removeItem(key);
  }
}, [chunkFocusHideOthers, focusedChunkId, selectedFlowId]);

useEffect(() => {
  if (!selectedFlowId || selectedChunkRestoredRef.current) return;
  if (typeof window === "undefined") return;
  const key = `${SELECTED_CHUNK_STORAGE_KEY}:${selectedFlowId}`;
  const stored = window.localStorage.getItem(key);
  if (stored && chunks.some((chunk) => chunk.id === stored)) {
    const raf = window.requestAnimationFrame(() => setSelectedChunkId(stored));
    selectedChunkRestoredRef.current = true;
    return () => window.cancelAnimationFrame(raf);
  }
  selectedChunkRestoredRef.current = true;
}, [chunks, selectedFlowId]);

useEffect(() => {
  if (!selectedFlowId || typeof window === "undefined") return;
  const key = `${SELECTED_CHUNK_STORAGE_KEY}:${selectedFlowId}`;
  if (selectedChunkId) {
    window.localStorage.setItem(key, selectedChunkId);
  } else {
    window.localStorage.removeItem(key);
  }
}, [selectedChunkId, selectedFlowId]);

  const routeMap = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes]);
  const routeByPath = useMemo(() => new Map(routes.map((route) => [route.routePath, route])), [routes]);
  const resolveNodeRoutePath = useCallback(
    (node: ReactFlowNode<FlowNodeData>) => routeMap.get(node.data.routeId)?.routePath ?? node.data.routePath ?? null,
    [routeMap],
  );

  useEffect(() => {
    if (!isAdmin || !selectedFlowId) {
      const rafId = requestAnimationFrame(() => {
        setFlowDoc(null);
        setNodes([]);
        setEdges([]);
        setFlowNameDraft("");
        setChunks(normalizeChunks());
        setSelectedChunkId(null);
        setFocusedChunkId(null);
        setComments([]);
        setOverlays([]);
        selectOverlay(null, { enforceViewMode: false });
        setSingleNodeSelection(null);
        setSingleEdgeSelection(null);
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
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
        setChunks(normalizeChunks());
        setSelectedChunkId(null);
        setFocusedChunkId(null);
        setComments([]);
        setOverlays([]);
        selectOverlay(null, { enforceViewMode: false });
        setSingleNodeSelection(null);
        setSingleEdgeSelection(null);
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(LAST_FLOW_KEY);
        }
        return;
      }
      const data = snapshot.data() as FlowDoc;
      setFlowDoc(data);
      const docUpdatedAtMs = typeof data.updatedAtMs === "number" ? data.updatedAtMs : getTimestampMillis(data.updatedAt);
      if (docUpdatedAtMs) {
        const docDate = new Date(docUpdatedAtMs);
        setLastFlowSaveAt(docDate);
        setLastChunkSaveAt(docDate);
      }
      setFlowNameDraft(data.name ?? "");
      setChunks(normalizeChunks(data.chunks));
      setOverlays(Array.isArray(data.overlays) ? data.overlays : []);
      setComments(Array.isArray(data.comments) ? data.comments : []);
      const builtNodes = (data.nodes ?? []).map((stored) => buildFlowNode(stored, routeMap, routeByPath));
      const initialEdges = (data.edges ?? []).map(buildFlowEdge);
      const validNodeIds = new Set(builtNodes.map((node) => node.id));
      const builtEdges = filterEdgesByNodeSet(initialEdges, validNodeIds);
      setNodes(builtNodes);
      setEdges(builtEdges);
        setSingleNodeSelection(null);
        setSingleEdgeSelection(null);
        setExpandedStepsMap({});
    });
    return () => unsub();
  }, [db, isAdmin, routeByPath, routeMap, selectOverlay, selectedFlowId, setEdges, setNodes, setSingleEdgeSelection, setSingleNodeSelection]);

  useEffect(() => {
    if (!selectedFlowId || !flowDoc) return;
    if (autosavePromptedRef.current === selectedFlowId) return;
    autosavePromptedRef.current = selectedFlowId;
    let cancelled = false;
    const draftRef = doc(db, "adminFlows", selectedFlowId, "drafts", AUTOSAVE_DOC_ID);
    getDoc(draftRef)
      .then((snapshot) => {
        if (cancelled || !snapshot.exists()) return;
        const draft = snapshot.data() as FlowDraftDoc;
        const draftMs = typeof draft.updatedAtMs === "number" ? draft.updatedAtMs : getTimestampMillis(draft.updatedAt);
        const flowMs = typeof flowDoc.updatedAtMs === "number" ? flowDoc.updatedAtMs : getTimestampMillis(flowDoc.updatedAt);
        const consumedMs = typeof draft.consumedAtMs === "number" ? draft.consumedAtMs : getTimestampMillis(draft.consumedAt);
        if (!draftMs || !flowMs || draftMs <= flowMs || (consumedMs && consumedMs >= draftMs)) return;
        const shouldRestore = window.confirm(`Exista un autosave din ${autosaveTimeFormatter.format(new Date(draftMs))}. Vrei sa il incarci?`);
        if (!shouldRestore) return;
        const nodeSource = draft.nodes ?? flowDoc.nodes ?? [];
        const edgeSource = draft.edges ?? flowDoc.edges ?? [];
        const chunkSource = draft.chunks ?? flowDoc.chunks ?? [];
        const commentSource = draft.comments ?? flowDoc.comments ?? [];
        const overlaySource = draft.overlays ?? flowDoc.overlays ?? [];
        const restoredNodes = nodeSource.map((stored) => buildFlowNode(stored, routeMap, routeByPath));
        const rawEdges = edgeSource.map(buildFlowEdge);
        const validIds = new Set(restoredNodes.map((node) => node.id));
        const restoredEdges = filterEdgesByNodeSet(rawEdges, validIds);
        setNodes(restoredNodes);
        setEdges(restoredEdges);
        setChunks(normalizeChunks(chunkSource));
        setComments(Array.isArray(commentSource) ? commentSource : []);
        setOverlays(Array.isArray(overlaySource) ? overlaySource : []);
        setFlowNameDraft(draft.name ?? flowDoc.name ?? "");
        void setDoc(draftRef, { consumedAt: serverTimestamp(), consumedAtMs: Date.now() }, { merge: true });
      })
      .catch((error) => {
        console.warn("[FlowStudio] failed to load autosave draft", error);
      });
    return () => {
      cancelled = true;
    };
  }, [db, flowDoc, routeByPath, routeMap, selectedFlowId, setEdges, setNodes]);

  useEffect(() => {
    if (FLOW_STUDIO_DIAG) {
      logEffect("ensureNodesHaveValidChunks", { chunkIds: chunks.map((chunk) => chunk.id) });
    }
    setNodes((existing) => ensureNodesHaveValidChunks(existing, chunks));
  }, [chunks, setNodes]);

  useEffect(() => {
    if (focusedChunkId && !chunks.some((chunk) => chunk.id === focusedChunkId)) {
      logEffect("clearFocusedChunkMissing", { focusedChunkId, chunkCount: chunks.length });
      startTransition(() => {
        setFocusedChunkId(null);
        setChunkFocusHideOthers(false);
      });
    }
  }, [chunks, focusedChunkId]);

  const persistChunksOnly = useCallback(async () => {
    if (!selectedFlowId) return;
    const storedChunks = latestChunksRef.current.map((chunk, index) => serializeChunkForSave(chunk, index));
    try {
      setChunkSaveStatus("saving");
      setChunkSaveError(null);
      await setDoc(
        doc(db, "adminFlows", selectedFlowId),
        {
          chunks: storedChunks,
          updatedAt: serverTimestamp(),
          updatedAtMs: Date.now(),
        },
        { merge: true },
      );
      setChunkSaveStatus("idle");
      setLastChunkSaveAt(new Date());
    } catch (error) {
      console.warn("[FlowStudio] failed to persist chunk changes", error);
      setChunkSaveStatus("error");
      setChunkSaveError(error instanceof Error ? error.message : "Nu am putut salva worlds");
    }
  }, [db, selectedFlowId]);

  const routeGroupOptions = useMemo(() => {
    const groups = new Set<string>();
    routes.forEach((route) => {
      if (route.group) {
        groups.add(route.group);
      }
    });
    return Array.from(groups).sort((a, b) => a.localeCompare(b));
  }, [routes]);

  const effectiveRouteGroup = useMemo(() => {
    if (routeGroup === "all") return "all";
    return routeGroupOptions.includes(routeGroup) ? routeGroup : "all";
  }, [routeGroup, routeGroupOptions]);

  const filteredRoutes = useMemo(() => {
    const needle = routeSearch.trim().toLowerCase();
    return routes.filter((route) => {
      if (effectiveRouteGroup !== "all" && route.group !== effectiveRouteGroup) return false;
      if (!needle) return true;
      return route.routePath.toLowerCase().includes(needle) || route.filePath.toLowerCase().includes(needle);
    });
  }, [effectiveRouteGroup, routeSearch, routes]);

  const handleSelectionChange = useCallback(
    (params: { nodes: ReactFlowNode<FlowNodeData | StepNodeRenderData | ChunkNodeData>[]; edges: Edge<FlowEdgeData>[] }) => {
      if (viewMode !== "nodes") {
        return;
      }
      const flowNodeIds = sortAndDedupeIds(params.nodes.filter((node) => node.type === "flowNode").map((node) => node.id));
      setSelectedNodeIds((prev) => (areIdListsEqual(prev, flowNodeIds) ? prev : flowNodeIds));
      const edgeIds = sortAndDedupeIds(params.edges.map((edge) => edge.id));
      setSelectedEdgeIds((prev) => (areIdListsEqual(prev, edgeIds) ? prev : edgeIds));
    },
    [viewMode],
  );
  const tagVocabulary = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((node) => {
      node.data.tags?.forEach((tag) => {
        if (tag) {
          set.add(tag);
        }
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [nodes]);
  const filterValidTags = useCallback(
    (list: string[]) => list.filter((tag) => tagVocabulary.includes(tag)),
    [tagVocabulary],
  );
  const resolvedTagFilters = useMemo(() => filterValidTags(tagFilters), [filterValidTags, tagFilters]);
  const filteredTagOptions = useMemo(() => {
    const needle = tagSearch.trim().toLowerCase();
    if (!needle) return tagVocabulary;
    return tagVocabulary.filter((tag) => tag.toLowerCase().includes(needle));
  }, [tagSearch, tagVocabulary]);
  const handleToggleTagFilter = useCallback(
    (tag: string) => {
      setTagFilters((prev) => {
        const cleaned = filterValidTags(prev);
        if (cleaned.includes(tag)) {
          return cleaned.filter((entry) => entry !== tag);
        }
        return [...cleaned, tag];
      });
    },
    [filterValidTags],
  );
  const handleResetTagFilters = useCallback(() => {
    setTagFilters([]);
  }, []);
  const handleApplyTagSearch = useCallback(() => {
    const normalized = tagSearch.trim();
    if (!normalized) return;
    handleToggleTagFilter(normalized);
    setTagSearch("");
  }, [handleToggleTagFilter, tagSearch]);
  const handleOpenPortalCreator = useCallback(() => {
    if (!selectedFlowId) return;
    const fallbackChunk = focusedChunkId ?? selectedChunkId ?? UNGROUPED_CHUNK_ID;
    setPortalDraft({
      label: "PORTAL: To Today",
      targetRouteId: "",
      chunkId: fallbackChunk,
    });
    setPortalError(null);
    setPortalCreatorOpen(true);
  }, [focusedChunkId, selectedChunkId, selectedFlowId]);
  const handleClosePortalCreator = useCallback(() => {
    setPortalCreatorOpen(false);
    setPortalError(null);
  }, []);
  const pushAutosaveToast = useCallback((type: "success" | "error", message: string) => {
    setAutosaveToast({ id: Date.now(), type, message });
    if (autosaveToastTimeoutRef.current) {
      window.clearTimeout(autosaveToastTimeoutRef.current);
    }
    autosaveToastTimeoutRef.current = window.setTimeout(() => {
      setAutosaveToast(null);
      autosaveToastTimeoutRef.current = null;
    }, 3500);
  }, []);

useEffect(() => {
  return () => {
    if (autosaveToastTimeoutRef.current) {
      window.clearTimeout(autosaveToastTimeoutRef.current);
    }
  };
}, []);

useEffect(() => {
  if (tagFiltersRestoredRef.current || typeof window === "undefined") return;
  const stored = window.localStorage.getItem(TAG_FILTERS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const raf = window.requestAnimationFrame(() =>
          setTagFilters(parsed.filter((tag): tag is string => typeof tag === "string")),
        );
        tagFiltersRestoredRef.current = true;
        return () => window.cancelAnimationFrame(raf);
      }
    } catch {
      // ignore invalid
    }
  }
  tagFiltersRestoredRef.current = true;
}, []);

useEffect(() => {
  if (!tagFiltersRestoredRef.current || typeof window === "undefined") return;
  window.localStorage.setItem(TAG_FILTERS_STORAGE_KEY, JSON.stringify(tagFilters));
}, [tagFilters]);
  const handleDismissAutosaveToast = useCallback(() => {
    setAutosaveToast(null);
    if (autosaveToastTimeoutRef.current) {
      window.clearTimeout(autosaveToastTimeoutRef.current);
      autosaveToastTimeoutRef.current = null;
    }
  }, []);

  const handleAddComment = useCallback(
    (targetType: FlowComment["targetType"], targetId: string, message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      const targetExists = targetType === "node" ? nodes.some((node) => node.id === targetId) : chunks.some((chunk) => chunk.id === targetId);
      if (!targetExists) return;
      const newComment: FlowComment = {
        id: `comment_${randomId()}`,
        targetType,
        targetId,
        author: user?.email ?? user?.uid ?? null,
        message: trimmed,
        createdAt: new Date().toISOString(),
        resolved: false,
      };
      setComments((prev) => [...prev, newComment]);
    },
    [chunks, nodes, user?.email, user?.uid],
  );

  const handleDeleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  }, []);

  const handleToggleCommentResolved = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((comment) => (comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment)),
    );
  }, []);

  const nodeRouteById = useMemo(() => new Map(nodes.map((node) => [node.id, node.data.routePath ?? ""])), [nodes]);
  const nodeChunkIdMap = useMemo(() => new Map(nodes.map((node) => [node.id, node.data.chunkId ?? UNGROUPED_CHUNK_ID])), [nodes]);
  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const selectedNodeResolvedRoutePath = selectedNode ? resolveNodeRoutePath(selectedNode) : null;
  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId) ?? null, [edges, selectedEdgeId]);
  const chunkCommentsMap = useMemo(() => {
    const map = new Map<string, FlowComment[]>();
    comments.forEach((comment) => {
      if (comment.targetType !== "chunk") return;
      map.set(comment.targetId, [...(map.get(comment.targetId) ?? []), comment]);
    });
    return map;
  }, [comments]);
  const nodeCommentsMap = useMemo(() => {
    const map = new Map<string, FlowComment[]>();
    comments.forEach((comment) => {
      if (comment.targetType !== "node") return;
      map.set(comment.targetId, [...(map.get(comment.targetId) ?? []), comment]);
    });
    return map;
  }, [comments]);
  const chunkCommentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    chunkCommentsMap.forEach((list, chunkId) => {
      map.set(chunkId, list.length);
    });
    return map;
  }, [chunkCommentsMap]);
  const nodeCommentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    nodeCommentsMap.forEach((list, nodeId) => {
      map.set(nodeId, list.length);
    });
    return map;
  }, [nodeCommentsMap]);
  const portalNodeOptions = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        label: node.data.labelOverrides?.ro ?? node.data.labelOverrides?.en ?? node.data.routePath ?? node.id,
      })),
    [nodes],
  );
  const selectedScreenId = selectedNode?.data.screenId ?? null;
  const selectedNodeComments = selectedNode ? nodeCommentsMap.get(selectedNode.id) ?? [] : [];
  const chunkFocusedNodeIdSet = useMemo(() => {
    if (!focusedChunkId) return null;
    const ids = nodes.filter((node) => (node.data.chunkId ?? UNGROUPED_CHUNK_ID) === focusedChunkId).map((node) => node.id);
    return new Set(ids);
  }, [focusedChunkId, nodes]);
  const tagFilteredNodeIdSet = useMemo(() => {
    if (!resolvedTagFilters.length) return null;
    const ids = nodes
      .filter((node) => {
        const tags = node.data.tags ?? [];
        return resolvedTagFilters.every((filter) => tags.includes(filter));
      })
      .map((node) => node.id);
    return new Set(ids);
  }, [nodes, resolvedTagFilters]);
  const chunkHideFilterSet = useMemo(() => {
    if (!chunkFocusHideOthers || !chunkFocusedNodeIdSet || !focusedChunkId) return null;
    return chunkFocusedNodeIdSet;
  }, [chunkFocusHideOthers, chunkFocusedNodeIdSet, focusedChunkId]);
  const filteredNodeIdSet = useMemo(() => {
    const filters: Array<Set<string>> = [];
    if (chunkHideFilterSet) filters.push(chunkHideFilterSet);
    if (tagFilteredNodeIdSet) filters.push(tagFilteredNodeIdSet);
    if (!filters.length) return null;
    if (filters.length === 1) return filters[0];
    const [first, ...rest] = filters;
    const intersection = new Set<string>();
    first.forEach((id) => {
      if (rest.every((set) => set.has(id))) {
        intersection.add(id);
      }
    });
    return intersection;
  }, [chunkHideFilterSet, tagFilteredNodeIdSet]);
  const chunkHighlightNodeIdSet = useMemo(() => {
    if (!focusedChunkId || !chunkFocusedNodeIdSet) return null;
    return chunkFocusedNodeIdSet;
  }, [chunkFocusedNodeIdSet, focusedChunkId]);
  const chunkHighlightActive = useMemo(() => Boolean(chunkHighlightNodeIdSet && viewMode === "nodes"), [chunkHighlightNodeIdSet, viewMode]);
  const chunkHighlightDimOthers = chunkHighlightActive && !chunkFocusHideOthers;
  const chunkDimmedNodeIdSet = useMemo(() => {
    if (!chunkHighlightDimOthers || !chunkHighlightNodeIdSet) return null;
    const dimmed = new Set<string>();
    nodes.forEach((node) => {
      if (!chunkHighlightNodeIdSet.has(node.id)) {
        dimmed.add(node.id);
      }
    });
    return dimmed;
  }, [chunkHighlightDimOthers, chunkHighlightNodeIdSet, nodes]);
  const nodeByIdMap = useMemo(() => {
    const map = new Map<string, ReactFlowNode<FlowNodeData>>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);
  const selectedOverlay = selectedOverlayId ? overlays.find((overlay) => overlay.id === selectedOverlayId) ?? null : null;
  const overlayIntegrity = useMemo(() => {
    if (!selectedOverlay?.steps?.length) return null;
    const resolvedNodeIds: string[] = [];
    let missingNodeIdCount = 0;
    let unresolvedNodeCount = 0;
    selectedOverlay.steps.forEach((step) => {
      const candidate = typeof step?.nodeId === "string" ? step.nodeId.trim() : "";
      if (!candidate) {
        missingNodeIdCount += 1;
        return;
      }
      if (!nodeByIdMap.has(candidate)) {
        unresolvedNodeCount += 1;
        return;
      }
      resolvedNodeIds.push(candidate);
    });
    return {
      resolvedNodeIds,
      missingNodeIdCount,
      unresolvedNodeCount,
    };
  }, [nodeByIdMap, selectedOverlay]);
  const overlayNodeIdSet = useMemo(() => {
    if (!overlayIntegrity?.resolvedNodeIds?.length) return null;
    return new Set(overlayIntegrity.resolvedNodeIds);
  }, [overlayIntegrity]);
  const overlayFocusNodes = useMemo(() => {
    if (!overlayNodeIdSet?.size) return [];
    return nodes.filter((node) => overlayNodeIdSet.has(node.id));
  }, [nodes, overlayNodeIdSet]);
  const overlayHighlightActive = useMemo(() => Boolean(overlayNodeIdSet && viewMode === "nodes"), [overlayNodeIdSet, viewMode]);
  const overlayDimmedNodeIdSet = useMemo(() => {
    if (!overlayHighlightActive || !overlayNodeIdSet || !overlayFocusHideOthers) return null;
    const dimmed = new Set<string>();
    nodes.forEach((node) => {
      if (!overlayNodeIdSet.has(node.id)) {
        dimmed.add(node.id);
      }
    });
    return dimmed;
  }, [nodes, overlayFocusHideOthers, overlayHighlightActive, overlayNodeIdSet]);
  const overlayHighlightDimOthers = overlayHighlightActive && overlayFocusHideOthers;
  const activeHighlightNodeIdSet = overlayHighlightActive ? overlayNodeIdSet : chunkHighlightNodeIdSet;
  const highlightDimOthers = overlayHighlightActive ? overlayHighlightDimOthers : chunkHighlightDimOthers;
  const activeDimmedNodeIdSet = overlayHighlightActive ? overlayDimmedNodeIdSet : chunkDimmedNodeIdSet;
  const overlayChunkHighlightMap = useMemo(() => {
    if (!overlayNodeIdSet?.size) return null;
    const map = new Map<string, number>();
    overlayNodeIdSet.forEach((nodeId) => {
      const node = nodeByIdMap.get(nodeId);
      if (!node) return;
      const chunkId = node.data.chunkId || UNGROUPED_CHUNK_ID;
      map.set(chunkId, (map.get(chunkId) ?? 0) + 1);
    });
    return map;
  }, [nodeByIdMap, overlayNodeIdSet]);
  useEffect(() => {
    if (!selectedOverlayId || viewMode !== "nodes") {
      overlayAutoFitKeyRef.current = null;
      return;
    }
    if (!reactFlowInstance || !overlayFocusNodes.length) return;
    const signature = overlayFocusNodes
      .map((node) => `${node.id}:${Math.round(node.position.x)}:${Math.round(node.position.y)}`)
      .join("|");
    if (!signature || overlayAutoFitKeyRef.current === signature) return;
    overlayAutoFitKeyRef.current = signature;
    requestAnimationFrame(() => {
      reactFlowInstance.fitView({ nodes: overlayFocusNodes, padding: 0.25, duration: 350 });
    });
  }, [overlayFocusNodes, reactFlowInstance, selectedOverlayId, viewMode]);
  const nodeByRoutePathMap = useMemo(() => {
    const map = new Map<string, string>();
    nodes.forEach((node) => {
      if (node.data.routePath) {
        map.set(node.data.routePath, node.id);
      }
    });
    return map;
  }, [nodes]);
  const nodeManifestMap = useMemo(() => {
    const map = new Map<string, StepManifest | null>();
    nodes.forEach((node) => {
      const path = resolveNodeRoutePath(node);
      if (!path) {
        map.set(node.id, null);
        return;
      }
      map.set(node.id, getStepManifestForRoute(path, {}));
    });
    return map;
  }, [nodes, resolveNodeRoutePath]);
  const nodeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    nodes.forEach((node) => {
      const label =
        node.data.labelOverrides?.ro ??
        node.data.labelOverrides?.en ??
        node.data.routePath ??
        node.id;
      map.set(node.id, label);
    });
    return map;
  }, [nodes]);
  const nodeCanExpandSteps = useMemo(() => {
    const map = new Map<string, boolean>();
    nodeManifestMap.forEach((manifest, nodeId) => {
      map.set(nodeId, Boolean(manifest));
    });
    return map;
  }, [nodeManifestMap]);
  const currentStepManifest = selectedNode ? nodeManifestMap.get(selectedNode.id) ?? null : null;
  const stepsExpanded = Boolean(selectedNode && expandedStepsMap[selectedNode.id]);
  const nodeStepAvailability = useMemo(() => {
    const map = new Map<string, StepAvailability>();
    nodes.forEach((node) => {
      if (node.data.routeMismatch) {
        map.set(node.id, "route-mismatch");
      } else {
        map.set(node.id, nodeCanExpandSteps.get(node.id) ? "available" : "unavailable");
      }
    });
    return map;
  }, [nodeCanExpandSteps, nodes]);
  useEffect(() => {
    if (!DEBUG_STEPS) return;
    console.groupCollapsed("[FlowStudio] node manifest & availability snapshot");
    nodes.forEach((node) => {
      const path = resolveNodeRoutePath(node);
      const manifest = nodeManifestMap.get(node.id);
      const availability = nodeStepAvailability.get(node.id);
      const inDegree = edges.filter((edge) => edge.target === node.id).length;
      const outDegree = edges.filter((edge) => edge.source === node.id).length;
      console.log({
        nodeId: node.id,
        routeId: node.data.routeId,
        routePath: path,
        routeMismatch: node.data.routeMismatch,
        stepManifest: Boolean(manifest),
        availability,
        inDegree,
        outDegree,
      });
    });
    console.groupEnd();
  }, [edges, nodeManifestMap, nodeStepAvailability, nodes, resolveNodeRoutePath]);
  const missingManifestNodes = useMemo<MissingManifestNode[]>(() => {
    const entries: MissingManifestNode[] = [];
    nodes.forEach((node) => {
      if (node.data.routeMismatch) return;
      const routePath = resolveNodeRoutePath(node);
      if (!routePath) return;
      if (getStepManifestAvailability(routePath) === "missing") {
        const label =
          node.data.labelOverrides?.ro ??
          node.data.labelOverrides?.en ??
          routePath;
        entries.push({ nodeId: node.id, routePath, label });
      }
    });
    return entries;
  }, [nodes, resolveNodeRoutePath]);
  const fixableRouteMappings = useMemo(() => {
    const entries: Array<{ nodeId: string; route: RouteDoc }> = [];
    nodes.forEach((node) => {
      if (!node.data.routeMismatch) return;
      const routePath = node.data.routePath;
      if (!routePath) return;
      const route = routeByPath.get(routePath);
      if (route) {
        entries.push({ nodeId: node.id, route });
      }
    });
    return entries;
  }, [nodes, routeByPath]);
  const selectedNodeStepStatus = selectedNode ? nodeStepAvailability.get(selectedNode.id) ?? "unknown" : "unknown";
  const canFixSelectedNode =
    selectedNodeStepStatus === "route-mismatch" &&
    Boolean(selectedNodeResolvedRoutePath && routeByPath.get(selectedNodeResolvedRoutePath));
  const expandedStepRenderData = useMemo(() => {
    const map = new Map<string, StepRenderData>();
    Object.entries(expandedStepsMap).forEach(([nodeId, expanded]) => {
      if (!expanded) return;
      const manifest = nodeManifestMap.get(nodeId);
      if (!manifest) return;
      const hostNode = nodes.find((node) => node.id === nodeId);
      if (!hostNode) return;
      map.set(nodeId, buildStepRenderData(manifest, hostNode));
    });
    return map;
  }, [expandedStepsMap, nodeManifestMap, nodes]);
  const selectedNodeDebugInfo = useMemo(() => {
    if (!DEBUG_STEPS || !selectedNode) return null;
    const hostNodeId = selectedNode.id;
    const routePath = selectedNodeResolvedRoutePath;
    const routeMismatch = Boolean(selectedNode.data.routeMismatch);
    const hasManifest = Boolean(nodeManifestMap.get(hostNodeId));
    const isExpanded = Boolean(expandedStepsMap[hostNodeId]);
    const stepNodeCountForHost = expandedStepRenderData.get(hostNodeId)?.nodes.length ?? 0;
    return { hostNodeId, routePath, routeMismatch, hasManifest, isExpanded, stepNodeCountForHost };
  }, [expandedStepRenderData, expandedStepsMap, nodeManifestMap, selectedNode, selectedNodeResolvedRoutePath]);
  const stepNodes = useMemo<ReactFlowNode<StepNodeRenderData>[]>(() => {
    const list: ReactFlowNode<StepNodeRenderData>[] = [];
    expandedStepRenderData.forEach((data, hostId) => {
      if (filteredNodeIdSet && !filteredNodeIdSet.has(hostId)) return;
      data.nodes.forEach((node) => {
        list.push({
          ...node,
          selected: node.id === selectedStepNodeId,
        });
      });
    });
    return list;
  }, [expandedStepRenderData, filteredNodeIdSet, selectedStepNodeId]);
  const selectedStepDetails = useMemo(() => {
    if (!selectedStepNodeId) return null;
    const parsed = parseStepNodeReactId(selectedStepNodeId);
    if (!parsed) return null;
    const hostNode = nodeByIdMap.get(parsed.hostNodeId) ?? null;
    const renderData = expandedStepRenderData.get(parsed.hostNodeId);
    const manifestNode = renderData?.meta.get(selectedStepNodeId)?.manifestNode ?? null;
    return {
      hostNodeId: parsed.hostNodeId,
      hostLabel: hostNode?.data.labelOverrides?.ro ?? hostNode?.data.routePath ?? hostNode?.id ?? null,
      stepId: parsed.stepId,
      stepLabel: manifestNode?.label ?? parsed.stepId,
      stepKind: manifestNode?.kind ?? null,
    };
  }, [expandedStepRenderData, nodeByIdMap, selectedStepNodeId]);
  const stepEdgesList = useMemo(() => {
    const list: Edge<FlowEdgeData>[] = [];
    expandedStepRenderData.forEach((data, hostId) => {
      if (filteredNodeIdSet && !filteredNodeIdSet.has(hostId)) return;
      const dimmed = highlightDimOthers && activeHighlightNodeIdSet && !activeHighlightNodeIdSet.has(hostId);
      data.edges.forEach((edge) => {
        if (dimmed) {
          list.push({ ...edge, style: { ...(edge.style ?? {}), opacity: 0.25 } });
        } else {
          list.push(edge);
        }
      });
    });
    return list;
  }, [activeHighlightNodeIdSet, expandedStepRenderData, filteredNodeIdSet, highlightDimOthers]);
  const chunkLayoutOptions = useMemo(() => {
    const compact = chunkLayoutDensity === "compact";
    return {
      rankdir: chunkLayoutOrientation === "horizontal" ? ("LR" as const) : ("TB" as const),
      ranksep: compact ? 120 : 260,
      nodesep: compact ? 90 : 220,
    };
  }, [chunkLayoutDensity, chunkLayoutOrientation]);
  const chunkGraph = useMemo(() => buildChunkGraph(nodes, edges, chunks, chunkLayoutOptions), [chunks, edges, nodes, chunkLayoutOptions]);
  const chunkCountsById = chunkGraph.countsByChunk;
  const chunkLookupMap = useMemo(() => buildChunkAutoAssignMap(chunks), [chunks]);
  const chunkNodesForView = useMemo(() => {
    return chunkGraph.nodes.map((node) => {
      const chunkId = node.data.chunkId;
      const overlayStepCount = overlayChunkHighlightMap?.get(chunkId) ?? 0;
      const overlayHighlighted = Boolean(selectedOverlayId && overlayStepCount);
      const overlayDimmed = Boolean(selectedOverlayId && overlayChunkHighlightMap && !overlayHighlighted);
      return {
        ...node,
        selected: Boolean(selectedChunkId && selectedChunkId === chunkId) || Boolean(focusedChunkId && focusedChunkId === chunkId),
        data: {
          ...node.data,
          commentCount: chunkCommentCountMap.get(chunkId) ?? 0,
          overlayStepCount,
          overlayHighlighted,
          overlayDimmed,
        },
      };
    });
  }, [chunkCommentCountMap, chunkGraph.nodes, focusedChunkId, overlayChunkHighlightMap, selectedChunkId, selectedOverlayId]);
  const focusedChunk = focusedChunkId ? chunks.find((chunk) => chunk.id === focusedChunkId) ?? null : null;
  const nodesForCanvas = useMemo<ReactFlowNode<FlowNodeData | StepNodeRenderData | ChunkNodeData>[]>(() => {
    if (viewMode === "chunks") {
      return chunkNodesForView;
    }
    if (!filteredNodeIdSet) {
      return [...nodes, ...stepNodes];
    }
    const decoratedNodes = nodes.map((node) => {
      const shouldHide = !filteredNodeIdSet.has(node.id);
      if ((node.hidden ?? false) === shouldHide) {
        return node;
      }
      return { ...node, hidden: shouldHide };
    });
    return [...decoratedNodes, ...stepNodes];
  }, [chunkNodesForView, filteredNodeIdSet, nodes, stepNodes, viewMode]);
  useEffect(() => {
    if (viewMode !== "chunks" || !reactFlowInstance || !chunkGraph.nodes.length) return;
    const raf = requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: chunkLayoutDensity === "compact" ? 0.12 : 0.2, duration: 400 });
    });
    return () => cancelAnimationFrame(raf);
  }, [chunkGraph.nodes.length, chunkLayoutDensity, chunkLayoutOrientation, reactFlowInstance, viewMode]);
  const ensureNodeStepsExpanded = useCallback(
    (nodeId: string) => {
      setExpandedStepsMap((prev) => {
        if (DEBUG_STEPS) {
          console.log("[FlowStudio] ensureNodeStepsExpanded", { nodeId, expandedStepsMapBefore: { ...prev } });
        }
        if (prev[nodeId]) return prev;
        pendingFitNodeRef.current = nodeId;
        return { ...prev, [nodeId]: true };
      });
    },
    [],
  );
  const collapseNodeSteps = useCallback(
    (nodeId: string) => {
      setExpandedStepsMap((prev) => {
        if (!prev[nodeId]) return prev;
        const next = { ...prev, [nodeId]: false };
        if (DEBUG_STEPS) {
          console.log("[FlowStudio] collapseNodeSteps", { nodeId, expandedStepsMapBefore: { ...prev }, expandedStepsMapAfter: next });
        }
        return next;
      });
      setSelectedStepNodeId((current) => {
        if (!current) return current;
        const parsed = parseStepNodeReactId(current);
        return parsed?.hostNodeId === nodeId ? null : current;
      });
    },
    [setExpandedStepsMap, setSelectedStepNodeId],
  );
  const fitStepsView = useCallback(
    (hostNodeId: string) => {
      if (typeof window === "undefined" || !reactFlowInstance) {
        if (DEBUG_STEPS) {
          console.log("[FlowStudio] fitStepsView skipped (no reactFlowInstance)", { hostNodeId });
        }
        return;
      }
      requestAnimationFrame(() => {
        const rfNodes = reactFlowInstance
          .getNodes()
          .filter((node) => node.id === hostNodeId || node.id.startsWith(`step:${hostNodeId}:`));
        if (DEBUG_STEPS) {
          console.log("[FlowStudio] fitStepsView", { hostNodeId, candidateCount: rfNodes.length });
        }
        if (!rfNodes.length) return;
        reactFlowInstance.fitView({ nodes: rfNodes, padding: 0.3, duration: 350 });
      });
    },
    [reactFlowInstance],
  );
  const openStepsForNode = useCallback(
    (hostNodeId: string, stepReactId?: string | null) => {
      const node = nodes.find((entry) => entry.id === hostNodeId);
      if (!node) {
        if (DEBUG_STEPS) {
          console.warn("[FlowStudio] openStepsForNode: host node not found", { hostNodeId });
        }
        return;
      }
      if (DEBUG_STEPS) {
        console.log("[FlowStudio] openStepsForNode", {
          hostNodeId,
          stepReactId: stepReactId ?? null,
          selectedNodeIdBefore: selectedNodeId,
          selectedStepNodeIdBefore: selectedStepNodeId,
          expandedStepsMapBefore: { ...expandedStepsMap },
          hasReactFlowInstance: Boolean(reactFlowInstance),
        });
      }
      setSingleNodeSelection(hostNodeId);
      setSingleEdgeSelection(null);
      setSelectedStepNodeId(stepReactId ?? null);
      ensureNodeStepsExpanded(hostNodeId);
      pendingFitNodeRef.current = hostNodeId;
      fitStepsView(hostNodeId);
    },
    [ensureNodeStepsExpanded, expandedStepsMap, fitStepsView, nodes, reactFlowInstance, selectedNodeId, selectedStepNodeId, setSelectedStepNodeId, setSingleEdgeSelection, setSingleNodeSelection],
  );
  const handleRequestExpandSteps = useCallback(
    (nodeId: string) => {
      if (DEBUG_STEPS) {
        console.log("[FlowStudio] handleRequestExpandSteps", { nodeId });
      }
      if (expandedStepsMap[nodeId]) {
        collapseNodeSteps(nodeId);
        return;
      }
      openStepsForNode(nodeId);
    },
    [collapseNodeSteps, expandedStepsMap, openStepsForNode],
  );
  const toggleSelectedNodeSteps = useCallback(() => {
    if (!selectedNode) return;
    handleRequestExpandSteps(selectedNode.id);
  }, [handleRequestExpandSteps, selectedNode]);
  const handleFixSelectedNodeRoute = useCallback(() => {
    if (!selectedNode) return;
    if (!selectedNode.data.routePath) {
      setStepFixError("Nu pot determina routePath pentru nodul selectat.");
      return;
    }
    const route = routeByPath.get(selectedNode.data.routePath);
    if (!route) {
      setStepFixError("Nu exista un adminRoute pentru acest path.");
      return;
    }
    setNodes((existing) =>
      existing.map((node) => {
        if (node.id !== selectedNode.id) return node;
        return applyRouteMapping(node, route);
      }),
    );
    setStepFixError(null);
    ensureNodeStepsExpanded(selectedNode.id);
  }, [ensureNodeStepsExpanded, routeByPath, selectedNode, setNodes, setStepFixError]);
  const handleFixAllRouteMappings = useCallback(() => {
    if (!fixableRouteMappings.length) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Fix ${fixableRouteMappings.length} legacy node(s)?`);
      if (!confirmed) return;
    }
    const mapping = new Map(fixableRouteMappings.map((entry) => [entry.nodeId, entry.route]));
    setNodes((existing) =>
      existing.map((node) => {
        const route = mapping.get(node.id);
        if (!route) return node;
        return applyRouteMapping(node, route);
      }),
    );
    setStepFixError(null);
    if (fixableRouteMappings.length) {
      pendingFitNodeRef.current = fixableRouteMappings[0].nodeId;
    }
  }, [fixableRouteMappings, setNodes, setStepFixError]);
  const flowDiagnostics = useMemo(
    () => computeFlowDiagnostics(nodes, edges, routeMap, chunks, overlays),
    [chunks, edges, nodes, overlays, routeMap],
  );
  const stepDiagnostics = useMemo(() => {
    const issues: FlowIssue[] = [];
    nodes.forEach((node) => {
      const manifest = nodeManifestMap.get(node.id);
      if (!manifest) return;
      issues.push(...computeStepDiagnostics(manifest, node.id));
    });
    return issues;
  }, [nodeManifestMap, nodes]);
  const diagnostics = useMemo(() => [...flowDiagnostics, ...stepDiagnostics], [flowDiagnostics, stepDiagnostics]);

  const nodeIssueMap = useMemo(() => {
    const map = new Map<string, number>();
    diagnostics.forEach((issue) => {
      if ((issue.targetType === "node" || issue.targetType === "stepNode") && issue.targetId) {
        map.set(issue.targetId, (map.get(issue.targetId) ?? 0) + 1);
      }
    });
    return map;
  }, [diagnostics]);
  const edgeIssueMap = useMemo(() => {
    const map = new Map<string, number>();
    diagnostics.forEach((issue) => {
      if (issue.targetType === "edge" && issue.targetId) {
        map.set(issue.targetId, (map.get(issue.targetId) ?? 0) + 1);
      }
    });
    return map;
  }, [diagnostics]);
  const observedNodeStatsMap = useMemo(() => {
    if (!observedEnabled || !observedSnapshot?.nodeStats) return null;
    return new Map(Object.entries(observedSnapshot.nodeStats));
  }, [observedEnabled, observedSnapshot]);
  const observedEdgeStatsMap = useMemo(() => {
    if (!observedEnabled || !observedSnapshot?.edgeStats) return null;
    return new Map(Object.entries(observedSnapshot.edgeStats));
  }, [observedEnabled, observedSnapshot]);
  const baseDisplayEdges = useMemo(() => {
    return edges.map((edge) => {
      let workingEdge: Edge<FlowEdgeData> = edge;
      if (viewMode === "nodes" && filteredNodeIdSet) {
        const shouldHide = !filteredNodeIdSet.has(edge.source) || !filteredNodeIdSet.has(edge.target);
        if ((edge.hidden ?? false) !== shouldHide) {
          workingEdge = { ...edge, hidden: shouldHide };
        }
      }
      if (highlightDimOthers && activeHighlightNodeIdSet && viewMode === "nodes") {
        const inFocus = activeHighlightNodeIdSet.has(edge.source) && activeHighlightNodeIdSet.has(edge.target);
        workingEdge = {
          ...workingEdge,
          style: {
            ...(workingEdge.style ?? {}),
            opacity: inFocus ? 1 : 0.25,
          },
        };
      }
      const issues = edgeIssueMap.get(edge.id) ?? 0;
      if (issues) {
        workingEdge = {
          ...workingEdge,
          style: {
            ...(workingEdge.style ?? {}),
            stroke: "#f97316",
            strokeWidth: 2,
          },
          labelStyle: {
            ...(workingEdge.labelStyle ?? {}),
            fill: "#c2410c",
            fontWeight: 600,
          },
        };
      }
      if (observedEnabled && observedEdgeStatsMap) {
        const sourceRoute = nodeRouteById.get(edge.source);
        const targetRoute = nodeRouteById.get(edge.target);
        if (sourceRoute && targetRoute) {
          const stats = observedEdgeStatsMap.get(`${sourceRoute}->${targetRoute}`);
          if (stats?.count) {
            const baseLabel =
              workingEdge.label ??
              workingEdge.data?.labelOverrides?.ro ??
              workingEdge.data?.labelOverrides?.en ??
              "";
            const obsLabel = `Obs: ${stats.count}`;
            workingEdge = {
              ...workingEdge,
              label: baseLabel ? `${baseLabel} - ${obsLabel}` : obsLabel,
            };
          }
        }
      }
      return workingEdge;
    });
  }, [
    activeHighlightNodeIdSet,
    edgeIssueMap,
    edges,
    filteredNodeIdSet,
    highlightDimOthers,
    nodeRouteById,
    observedEdgeStatsMap,
    observedEnabled,
    viewMode,
  ]);
  const edgesForCanvas = useMemo(() => {
    if (viewMode === "chunks") {
      return chunkGraph.edges;
    }
    return [...baseDisplayEdges, ...stepEdgesList];
  }, [baseDisplayEdges, chunkGraph.edges, stepEdgesList, viewMode]);
  const handleAssignNodesToChunk = useCallback(
    (nodeIds: string[], chunkId: string) => {
      if (!nodeIds?.length) return;
      const valid = chunks.some((chunk) => chunk.id === chunkId);
      if (!valid) return;
      const idSet = new Set(nodeIds);
      setNodes((existing) =>
        existing.map((node) => (idSet.has(node.id) ? { ...node, data: { ...node.data, chunkId } } : node)),
      );
    },
    [chunks, setNodes],
  );

  const handleAddChunk = useCallback(() => {
    setChunks((existing) => {
      const newChunk = {
        id: `chunk_${randomId()}`,
        title: `Chunk ${existing.length + 1}`,
        order: existing.length,
        color: "#e0e7ff",
      } satisfies FlowChunk;
      const normalized = normalizeChunks([...existing, newChunk]);
      const created = normalized.find((chunk) => chunk.id === newChunk.id) ?? newChunk;
      setSelectedChunkId(created.id);
      return normalized;
    });
  }, [setChunks, setSelectedChunkId]);
  const handleUpdateChunk = useCallback((chunkId: string, updates: Partial<FlowChunk>) => {
    setChunks((existing) => normalizeChunks(existing.map((chunk) => (chunk.id === chunkId ? { ...chunk, ...updates } : chunk))));
  }, [setChunks]);
  const handleFocusChunk = useCallback(
    (chunkId: string | null, options?: { drillIntoNodes?: boolean }) => {
      if (!chunkId) {
        setFocusedChunkId(null);
        setChunkFocusHideOthers(false);
        return;
      }
      setFocusedChunkId(chunkId);
      setChunkFocusHideOthers(false);
      if (options?.drillIntoNodes) {
        setViewMode("nodes");
      }
    },
    [setViewMode],
  );
  const handleFocusSelectedChunk = useCallback(() => {
    if (!selectedChunkId) return;
    handleFocusChunk(selectedChunkId, { drillIntoNodes: true });
  }, [handleFocusChunk, selectedChunkId]);
  const handleClearChunkFocus = useCallback(() => {
    handleFocusChunk(null);
  }, [handleFocusChunk]);
  const handleToggleChunkFocusHide = useCallback(() => {
    setChunkFocusHideOthers((prev) => !prev);
  }, []);
  const handleNodeDoubleClick = useCallback(
    (node: ReactFlowNode<FlowNodeData | StepNodeRenderData | ChunkNodeData>) => {
      if (DEBUG_STEPS) {
        console.log("[FlowStudio] double-click on node", {
          nodeId: node.id,
          type: node.type,
          routePath:
            node.type === "stepNode" || node.type === "chunkNode"
              ? null
              : (node.data as FlowNodeData).routePath,
        });
      }
      if (node.type === "chunkNode") {
        const chunkData = node.data as ChunkNodeData;
        handleFocusChunk(chunkData.chunkId, { drillIntoNodes: true });
        return;
      }
      if (node.type === "stepNode") {
        const stepData = node.data as StepNodeRenderData;
        openStepsForNode(stepData.parentNodeId, node.id);
        return;
      }
      handleRequestExpandSteps(node.id);
    },
    [handleFocusChunk, handleRequestExpandSteps, openStepsForNode],
  );
  const handleCreateChunkFromSelection = useCallback(() => {
    if (!selectedNodeIds.length) {
      window.alert("Selectează cel puțin un nod pentru a crea un world.");
      return;
    }
    const baseName = `Chunk ${chunks.length + 1}`;
    const newChunkId = `chunk_${randomId()}`;
    const nextChunk: FlowChunk = {
      id: newChunkId,
      title: baseName,
      order: chunks.length,
      color: "#fef3c7",
    };
    setChunks((existing) => normalizeChunks([...existing, nextChunk]));
    handleAssignNodesToChunk(selectedNodeIds, newChunkId);
    setSelectedChunkId(newChunkId);
    handleFocusChunk(newChunkId);
    const rename = window.prompt("Nume world", baseName)?.trim();
    if (rename) {
      setChunks((existing) => existing.map((chunk) => (chunk.id === newChunkId ? { ...chunk, title: rename } : chunk)));
    }
  }, [chunks.length, handleAssignNodesToChunk, handleFocusChunk, selectedNodeIds]);

  const handleSeedCanonicalChunks = useCallback(() => {
    const seededChunks = normalizeChunks(mergeChunksWithSeed(latestChunksRef.current, FLOW_STUDIO_CHUNK_SEED_V1));
    setChunks(seededChunks);
    const lookup = buildChunkAutoAssignMap(seededChunks);
    setNodes((existing) => autoAssignChunksByRouteGroup(existing, routeMap, lookup));
    setSelectedChunkId(null);
    setFocusedChunkId(null);
  }, [routeMap, setChunks, setNodes]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "g") {
        event.preventDefault();
        handleCreateChunkFromSelection();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCreateChunkFromSelection]);
  const handleDeleteChunk = useCallback(
    (chunkId: string) => {
      if (chunkId === UNGROUPED_CHUNK_ID) return;
      setChunks((existing) => normalizeChunks(existing.filter((chunk) => chunk.id !== chunkId)));
      setNodes((existing) =>
        existing.map((node) => (node.data.chunkId === chunkId ? { ...node, data: { ...node.data, chunkId: UNGROUPED_CHUNK_ID } } : node)),
      );
      setSelectedChunkId((current) => (current === chunkId ? null : current));
      setFocusedChunkId((current) => (current === chunkId ? null : current));
    },
    [setChunks, setNodes],
  );
  const handleMoveChunk = useCallback((chunkId: string, direction: "up" | "down") => {
    setChunks((existing) => {
      const index = existing.findIndex((chunk) => chunk.id === chunkId);
      if (index <= 0) return existing;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 1 || targetIndex >= existing.length) return existing;
      const next = [...existing];
      const [removed] = next.splice(index, 1);
      next.splice(targetIndex, 0, removed);
      return normalizeChunks(next.map((chunk, order) => ({ ...chunk, order })));
    });
  }, [setChunks]);
  const handleSelectChunkFromPanel = useCallback(
    (chunkId: string | null) => {
      setSelectedChunkId(chunkId);
    },
    [],
  );
  const handleCommentFocus = useCallback(
    (comment: FlowComment) => {
      if (comment.targetType === "chunk") {
        setSelectedChunkId(comment.targetId);
        handleFocusChunk(comment.targetId);
        return;
      }
      const node = nodes.find((entry) => entry.id === comment.targetId);
      if (!node) return;
      setViewMode("nodes");
      handleFocusChunk(null);
      setSingleNodeSelection(node.id);
      setSelectedStepNodeId(null);
      pendingFitNodeRef.current = node.id;
    },
    [handleFocusChunk, nodes, setSingleNodeSelection, setViewMode],
  );
  const handleMoveSelectionToChunk = useCallback(
    (chunkId: string, explicitIds?: string[]) => {
      const ids = explicitIds && explicitIds.length ? explicitIds : selectedNodeIds;
      handleAssignNodesToChunk(ids, chunkId);
    },
    [handleAssignNodesToChunk, selectedNodeIds],
  );
  const handleImportChunkPayload = useCallback(
    (rawPayload: string) => {
      try {
        const payload = parseChunkImportPayload(rawPayload);
        const merged = normalizeChunks(mergeChunksWithSeed(latestChunksRef.current, payload));
        setChunks(merged);
        return { ok: true as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Payload invalid.";
        return { ok: false as const, error: message };
      }
    },
    [setChunks],
  );
  const handleSelectionDragStart = useCallback(
    (event: ReactDragEvent<HTMLButtonElement>) => {
      if (!selectedNodeIds.length) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(CHUNK_SELECTION_MIME, JSON.stringify(selectedNodeIds));
      event.dataTransfer.effectAllowed = "move";
    },
    [selectedNodeIds],
  );
  const handleNodeChunkChange = useCallback(
    (nodeId: string, chunkId: string | null) => {
      const resolved = chunkId ?? UNGROUPED_CHUNK_ID;
      const validChunkId = chunks.some((chunk) => chunk.id === resolved) ? resolved : UNGROUPED_CHUNK_ID;
      setNodes((existing) =>
        existing.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, chunkId: validChunkId } } : node)),
      );
    },
    [chunks, setNodes],
  );
  const handleAutoAssignChunks = useCallback(() => {
    setNodes((existing) => autoAssignChunksByRouteGroup(existing, routeMap, chunkLookupMap));
  }, [chunkLookupMap, routeMap, setNodes]);
  const handleNodesChangeWrapped = useCallback(
    (changes: NodeChange[]) => {
      if (viewMode === "chunks") return;
      onNodesChange(changes);
    },
    [onNodesChange, viewMode],
  );
  const handleEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      if (viewMode === "chunks") return;
      onEdgesChange(changes);
    },
    [onEdgesChange, viewMode],
  );

  const flowStats = useMemo(() => computeFlowStats(nodes, edges), [edges, nodes]);
  const observedEventsForSelection = useMemo(() => {
    if (!observedEnabled || !observedSnapshot?.events?.length) return [];
    if (selectedNode) {
      const route = selectedNode.data.routePath;
      return observedSnapshot.events.filter((event) => event.routePath === route || event.sourceRoute === route).slice(0, 8);
    }
    if (selectedEdge) {
      const sourceRoute = nodeRouteById.get(selectedEdge.source);
      const targetRoute = nodeRouteById.get(selectedEdge.target);
      if (!sourceRoute || !targetRoute) return [];
      return observedSnapshot.events
        .filter((event) => event.sourceRoute === sourceRoute && event.targetRoute === targetRoute)
        .slice(0, 8);
    }
    return [];
  }, [observedEnabled, observedSnapshot, selectedEdge, selectedNode, nodeRouteById]);

  useEffect(() => {
    if (!stepsExpanded) {
      const rafId = requestAnimationFrame(() => setSelectedStepNodeId(null));
      return () => cancelAnimationFrame(rafId);
    }
    return undefined;
  }, [setSelectedStepNodeId, stepsExpanded]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setStepFixError(null));
    return () => cancelAnimationFrame(rafId);
  }, [setStepFixError, selectedNodeId]);

  useEffect(() => {
    if (!reactFlowInstance || !focusedChunkId || viewMode !== "nodes") return;
    const targetIds = new Set(nodes.filter((node) => (node.data.chunkId ?? UNGROUPED_CHUNK_ID) === focusedChunkId).map((node) => node.id));
    if (!targetIds.size) return;
    requestAnimationFrame(() => {
      const rfNodes = reactFlowInstance
        .getNodes()
        .filter((node) => {
          if (targetIds.has(node.id)) return true;
          if (node.id.startsWith("step:")) {
            const parsed = parseStepNodeReactId(node.id);
            return parsed ? targetIds.has(parsed.hostNodeId) : false;
          }
          return false;
        });
      if (!rfNodes.length) return;
      reactFlowInstance.fitView({ nodes: rfNodes, padding: 0.25, duration: 350 });
    });
  }, [focusedChunkId, nodes, reactFlowInstance, viewMode]);

  useEffect(() => {
    if (!observedEnabled) {
      if (FLOW_STUDIO_DIAG) {
        console.log("[FlowStudioDiag] Observed disabled – clearing snapshot");
      }
      const rafId = requestAnimationFrame(() => setObservedSnapshot(null));
      return () => cancelAnimationFrame(rafId);
    }
    let active = true;
    if (FLOW_STUDIO_DIAG) {
      console.count("Observed:schedule");
      console.log("[FlowStudioDiag] Observed schedule", { windowKey: observedWindow, segment: observedSegment });
    }
    const loadingRaf = requestAnimationFrame(() => setObservedLoading(true));
    const loadPromise = loadObservedSnapshot({ windowKey: observedWindow, segment: observedSegment })
      .then((data) => {
        if (active) {
          setObservedSnapshot(data);
        }
      })
      .finally(() => {
        if (active) {
          setObservedLoading(false);
        }
      });
    return () => {
      active = false;
      cancelAnimationFrame(loadingRaf);
      if (FLOW_STUDIO_DIAG) {
        console.log("[FlowStudioDiag] Observed schedule cleanup", { windowKey: observedWindow, segment: observedSegment });
      }
      void loadPromise;
    };
  }, [observedEnabled, observedSegment, observedWindow]);

  useEffect(() => {
    if (!selectedStepNodeId || !reactFlowInstance) return;
    const parsed = parseStepNodeReactId(selectedStepNodeId);
    if (!parsed) return;
    const data = expandedStepRenderData.get(parsed.hostNodeId);
    const meta = data?.meta.get(selectedStepNodeId);
    if (!meta) return;
    reactFlowInstance.setCenter(meta.position.x + STEP_NODE_WIDTH / 2, meta.position.y + STEP_NODE_HEIGHT / 2, { zoom: 1.1, duration: 400 });
  }, [expandedStepRenderData, reactFlowInstance, selectedStepNodeId]);

  useEffect(() => {
    if (!reactFlowInstance || !pendingFitNodeRef.current) return;
    const hostId = pendingFitNodeRef.current;
    const data = expandedStepRenderData.get(hostId);
    if (!data) return;
    const targetIds = new Set<string>([hostId, ...data.nodes.map((node) => node.id)]);
    const targetNodes = reactFlowInstance.getNodes().filter((node) => targetIds.has(node.id));
    if (!targetNodes.length) return;
    reactFlowInstance.fitView({ nodes: targetNodes, padding: 0.25, duration: 350 });
    pendingFitNodeRef.current = null;
  }, [expandedStepRenderData, reactFlowInstance]);

  useEffect(() => {
    if (!isAdmin || !selectedScreenId) {
      const rafId = requestAnimationFrame(() => {
        setCopyDraft({ ro: { ...EMPTY_COPY }, en: { ...EMPTY_COPY } });
        setCopyError(null);
        setCopyLoading(false);
      });
      return () => cancelAnimationFrame(rafId);
    }
    const loadingRaf = requestAnimationFrame(() => setCopyLoading(true));
    const ref = doc(db, "copyOverrides", selectedScreenId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data() as CopyOverrideDoc | undefined;
        setCopyDraft({ ro: { ...(data?.ro ?? {}) }, en: { ...(data?.en ?? {}) } });
        setCopyLoading(false);
        setCopyError(null);
      },
      (err) => {
        setCopyError(err.message ?? "Nu am putut incarca override-urile");
        setCopyLoading(false);
      },
    );
    return () => {
      unsub();
      cancelAnimationFrame(loadingRaf);
    };
  }, [db, selectedScreenId, isAdmin]);

  const addRouteNode = useCallback(
    (route: RouteDoc, position?: XYPosition, options?: AddRouteOptions) => {
      if (!selectedFlowId) return;
      const defaultLabel = route.routePath === "/" ? "root" : route.routePath;
      const labelOverride = options?.labelOverride?.trim();
      const label = labelOverride && labelOverride.length ? labelOverride : defaultLabel;
      const screenId = getScreenIdForRoute(route.routePath);
      const nodeId = `node_${randomId()}`;
      const baseTags = options?.tags ? [...options.tags] : [];
      const tags =
        options?.markAsStart && !baseTags.includes("start")
          ? [...baseTags, "start"]
          : baseTags.length
            ? baseTags
            : options?.markAsStart
              ? ["start"]
              : [];
      const chunkId = options?.chunkId ?? UNGROUPED_CHUNK_ID;
      setNodes((existing) => [
        ...existing,
        {
          id: nodeId,
          type: "flowNode",
          position:
            position ?? {
              x: DEFAULT_NODE_POSITION.x + existing.length * 40,
              y: DEFAULT_NODE_POSITION.y + existing.length * 30,
            },
          data: {
            routeId: route.id,
            routePath: route.routePath,
            filePath: route.filePath,
            screenId,
            labelOverrides: { ro: label, en: label },
            tags,
            chunkId,
            portal: options?.portal ?? null,
          },
        },
      ]);
    },
    [selectedFlowId, setNodes],
  );

  const handleQuickAddRoute = useCallback(
    (route: RouteDoc, options?: AddRouteOptions) => {
      if (!reactFlowInstance || !canvasWrapperRef.current) {
        addRouteNode(route, undefined, options);
        return;
      }
      const bounds = canvasWrapperRef.current.getBoundingClientRect();
      const center = reactFlowInstance.project({
        x: bounds.width / 2,
        y: bounds.height / 2,
      });
      const MIN_DISTANCE = 120;
      const offsets: Array<{ x: number; y: number }> = [
        { x: 0, y: 0 },
        { x: MIN_DISTANCE, y: 0 },
        { x: -MIN_DISTANCE, y: 0 },
        { x: 0, y: MIN_DISTANCE },
        { x: 0, y: -MIN_DISTANCE },
        { x: MIN_DISTANCE, y: MIN_DISTANCE },
        { x: -MIN_DISTANCE, y: -MIN_DISTANCE },
        { x: -MIN_DISTANCE, y: MIN_DISTANCE },
        { x: MIN_DISTANCE, y: -MIN_DISTANCE },
        { x: MIN_DISTANCE * 1.5, y: MIN_DISTANCE / 2 },
        { x: -MIN_DISTANCE * 1.5, y: -MIN_DISTANCE / 2 },
      ];
      const isOccupied = (position: XYPosition) =>
        nodes.some((node) => Math.hypot(node.position.x - position.x, node.position.y - position.y) < MIN_DISTANCE * 0.8);
      const resolvedPosition =
        offsets.map((offset) => ({ x: center.x + offset.x, y: center.y + offset.y })).find((candidate) => !isOccupied(candidate)) ??
        {
          x: center.x + (Math.random() - 0.5) * MIN_DISTANCE,
          y: center.y + (Math.random() - 0.5) * MIN_DISTANCE,
        };
      addRouteNode(route, resolvedPosition, options);
    },
    [addRouteNode, nodes, reactFlowInstance],
  );
  const handleCreatePortalFromDraft = useCallback(() => {
    if (!portalDraft.targetRouteId) {
      setPortalError("Selectează ruta țintă.");
      return;
    }
    const route = routes.find((entry) => entry.id === portalDraft.targetRouteId);
    if (!route) {
      setPortalError("Ruta selectată nu mai este disponibilă.");
      return;
    }
    const rawLabel = portalDraft.label.trim();
    const normalizedLabel =
      rawLabel.length === 0
        ? `PORTAL: ${route.routePath}`
        : rawLabel.toUpperCase().startsWith("PORTAL:")
          ? rawLabel
          : `PORTAL: ${rawLabel}`;
    const chunkExists = chunks.some((chunk) => chunk.id === portalDraft.chunkId);
    const chunkId = chunkExists ? portalDraft.chunkId : UNGROUPED_CHUNK_ID;
    const portalConfig: FlowNodePortalConfig = {
      targetType: "route",
      targetRouteId: route.id,
      targetRoutePath: route.routePath,
      label: normalizedLabel,
    };
    handleQuickAddRoute(route, { labelOverride: normalizedLabel, tags: ["type:portal"], chunkId, portal: portalConfig });
    setPortalCreatorOpen(false);
    setPortalError(null);
  }, [chunks, handleQuickAddRoute, portalDraft, routes]);
  const handleDeleteSelection = useCallback(() => {
    if (selectedNodeIds.length) {
      const idSet = new Set(selectedNodeIds);
      setNodes((existing) => existing.filter((node) => !idSet.has(node.id)));
      setEdges((existing) => existing.filter((edge) => !idSet.has(edge.source) && !idSet.has(edge.target)));
      setSingleNodeSelection(null);
      setSingleEdgeSelection(null);
      return;
    }
    if (selectedNodeId) {
      setNodes((existing) => existing.filter((node) => node.id !== selectedNodeId));
      setEdges((existing) => existing.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
      setSingleNodeSelection(null);
      setSingleEdgeSelection(null);
      return;
    }
    if (selectedEdgeIds.length) {
      const edgeSet = new Set(selectedEdgeIds);
      setEdges((existing) => existing.filter((edge) => !edgeSet.has(edge.id)));
      setSingleEdgeSelection(null);
      return;
    }
    if (selectedEdgeId) {
      setEdges((existing) => existing.filter((edge) => edge.id !== selectedEdgeId));
      setSingleEdgeSelection(null);
    }
  }, [selectedEdgeId, selectedEdgeIds, selectedNodeId, selectedNodeIds, setEdges, setNodes, setSingleEdgeSelection, setSingleNodeSelection]);

  const handleDuplicateSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    let duplicatedId: string | null = null;
    setNodes((existing) => {
      const target = existing.find((node) => node.id === selectedNodeId);
      if (!target) return existing;
      duplicatedId = `node_${randomId()}`;
      const clone = {
        ...target,
        id: duplicatedId,
        position: {
          x: target.position.x + 60,
          y: target.position.y + 40,
        },
        selected: false,
      };
      return [...existing, clone];
    });
    if (duplicatedId) {
      setSingleNodeSelection(duplicatedId);
      setSingleEdgeSelection(null);
    }
  }, [selectedNodeId, setNodes, setSingleEdgeSelection, setSingleNodeSelection]);

  const handleZoomToFit = useCallback(() => {
    if (!reactFlowInstance) return;
    setZoomingToFit(true);
    reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    window.setTimeout(() => setZoomingToFit(false), 450);
  }, [reactFlowInstance, setZoomingToFit]);
  const handleResetChunkLayout = useCallback(() => {
    setChunkLayoutOrientation("vertical");
    setChunkLayoutDensity("compact");
    if (!reactFlowInstance) return;
    requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    });
  }, [reactFlowInstance]);

  const handleCenterOnSelection = useCallback(() => {
    if (!reactFlowInstance) return;
    setCenteringSelection(true);
    if (selectedNode) {
      reactFlowInstance.setCenter(
        selectedNode.position.x + DAGRE_NODE_WIDTH / 2,
        selectedNode.position.y + DAGRE_NODE_HEIGHT / 2,
        { zoom: 1.1, duration: 400 },
      );
      window.setTimeout(() => setCenteringSelection(false), 420);
      return;
    }
    if (selectedEdge) {
      const source = nodes.find((entry) => entry.id === selectedEdge.source);
      const target = nodes.find((entry) => entry.id === selectedEdge.target);
      if (source && target) {
        const centerX = (source.position.x + target.position.x) / 2 + DAGRE_NODE_WIDTH / 2;
        const centerY = (source.position.y + target.position.y) / 2 + DAGRE_NODE_HEIGHT / 2;
        reactFlowInstance.setCenter(centerX, centerY, { zoom: 1.05, duration: 400 });
      }
    }
    window.setTimeout(() => setCenteringSelection(false), 420);
  }, [nodes, reactFlowInstance, selectedEdge, selectedNode, setCenteringSelection]);
  const handleMarkDivergenceNodes = useCallback(() => {
    const targetIds = selectedNodeIds.filter((id) => !id.startsWith("step:"));
    if (!targetIds.length) return;
    setNodes((current) =>
      current.map((node) => {
        if (!targetIds.includes(node.id)) return node;
        let tags = node.data.tags ?? [];
        if (!tags.includes("journey:branch")) {
          tags = [...tags.filter((tag) => tag !== "journey:divergence"), "journey:branch"];
        }
        return { ...node, data: { ...node.data, tags } };
      }),
    );
  }, [selectedNodeIds, setNodes]);
  const handleCenterOnNodeId = useCallback(
    (nodeId: string) => {
      const target = nodeByIdMap.get(nodeId);
      if (!target || !reactFlowInstance) return;
      setViewMode("nodes");
      setSingleEdgeSelection(null);
      setSingleNodeSelection(nodeId);
      setSelectedStepNodeId(null);
      const centerX = target.position.x + DAGRE_NODE_WIDTH / 2;
      const centerY = target.position.y + DAGRE_NODE_HEIGHT / 2;
      reactFlowInstance.setCenter(centerX, centerY, { zoom: 1.1, duration: 360 });
    },
    [nodeByIdMap, reactFlowInstance, setSelectedStepNodeId, setSingleEdgeSelection, setSingleNodeSelection, setViewMode],
  );
  const handleOverlayStepFocus = useCallback(
    (nodeId: string) => {
      handleCenterOnNodeId(nodeId);
    },
    [handleCenterOnNodeId],
  );

  useEffect(() => {
    if (!pendingFocusTarget) return;
    const target = pendingFocusTarget === "map" ? flowSelectRef.current : journeySelectRef.current;
    if (target) {
      target.focus();
    }
    const timeout = window.setTimeout(() => setPendingFocusTarget(null), 0);
    return () => window.clearTimeout(timeout);
  }, [pendingFocusTarget]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (viewMode !== "nodes") return;
      if (!connection.source || !connection.target) return;
      const edgeId = `edge_${randomId()}`;
      const newEdge: Edge<FlowEdgeData> = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        data: { labelOverrides: {}, conditionTag: "", eventName: "", color: DEFAULT_EDGE_COLOR },
        type: "parallel",
      };
      setEdges((eds) => [...eds, newEdge]);
    },
    [setEdges, viewMode],
  );
  const handleEdgeUpdate = useCallback(
    (oldEdge: Edge<FlowEdgeData>, newConnection: Connection) => {
      if (viewMode !== "nodes") return;
      if (!newConnection.source || !newConnection.target) return;
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== oldEdge.id) return edge;
          return {
            ...edge,
            source: newConnection.source ?? edge.source,
            target: newConnection.target ?? edge.target,
            sourceHandle: newConnection.sourceHandle ?? edge.sourceHandle,
            targetHandle: newConnection.targetHandle ?? edge.targetHandle,
          };
        }),
      );
    },
    [setEdges, viewMode],
  );

  const serializeFlow = useCallback(() => {
    const storedNodes: FlowNode[] = nodes.map((node) => {
      const stored: FlowNode = {
        id: node.id,
        routeId: node.data.routeId,
        x: node.position.x,
        y: node.position.y,
      };
      if (node.data.routePath) {
        stored.routePath = node.data.routePath;
      }
      const label = normalizeLabelMap(node.data.labelOverrides);
      const tags = normalizeTags(node.data.tags);
      stored.chunkId = node.data.chunkId ?? UNGROUPED_CHUNK_ID;
      if (label) stored.label = label;
      if (tags) stored.tags = tags;
      if (node.data.portal) {
        stored.portal = { ...node.data.portal };
      }
      return stored;
    });
    const storedEdges: FlowEdge[] = edges.map((edge) => {
      const stored: FlowEdge = {
        id: edge.id,
        from: edge.source,
        to: edge.target,
      };
      if (edge.sourceHandle) stored.sourceHandle = edge.sourceHandle;
      if (edge.targetHandle) stored.targetHandle = edge.targetHandle;
      const label = normalizeLabelMap(edge.data?.labelOverrides);
      if (label) stored.label = label;
      if (edge.data?.conditionTag) stored.conditionTag = edge.data.conditionTag;
      if (edge.data?.eventName) stored.eventName = edge.data.eventName;
      if (edge.data?.color) stored.color = edge.data.color;
      if (edge.data?.command) stored.command = edge.data.command;
      return stored;
    });
    const storedChunks = chunks.map((chunk, index) => serializeChunkForSave(chunk, index));
    const storedComments = comments.map((comment) => ({
      id: comment.id,
      targetType: comment.targetType,
      targetId: comment.targetId,
      author: comment.author ?? null,
      message: comment.message,
      createdAt: comment.createdAt ?? new Date().toISOString(),
      resolved: Boolean(comment.resolved),
    }));
    const storedOverlays = overlays.map((overlay) => {
      const id = overlay.id || randomId();
      const steps = (overlay.steps ?? [])
        .filter((step) => step.nodeId)
        .map((step) =>
          stripUndefinedDeep({
            nodeId: step.nodeId,
            gateTag: step.gateTag ? step.gateTag : undefined,
            tags: step.tags && step.tags.length ? step.tags : undefined,
          }),
        );
      const edgesList = overlay.edges
        ?.filter((edge) => edge.fromNodeId && edge.toNodeId)
        .map((edge) => ({ fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId }));
      return stripUndefinedDeep({
        id,
        name: overlay.name ?? "Journey",
        description: overlay.description,
        status: overlay.status,
        steps,
        edges: edgesList && edgesList.length ? edgesList : undefined,
      });
    });
    return { storedNodes, storedEdges, storedChunks, storedComments, storedOverlays };
  }, [chunks, comments, edges, nodes, overlays]);

  const serializedFlow = useMemo(() => serializeFlow(), [serializeFlow]);

  const flowGraphSignature = useMemo(() => {
    return JSON.stringify({
      name: flowNameDraft.trim(),
      nodes: serializedFlow.storedNodes,
      edges: serializedFlow.storedEdges,
      comments: serializedFlow.storedComments,
      overlays: serializedFlow.storedOverlays,
    });
  }, [flowNameDraft, serializedFlow]);

  const chunkSignature = useMemo(() => JSON.stringify(serializedFlow.storedChunks), [serializedFlow]);

  const persistedFlowSignature = useMemo(() => {
    if (!selectedFlowId || !flowDoc) return "";
    return JSON.stringify({
      name: flowDoc.name ?? "",
      nodes: flowDoc.nodes ?? [],
      edges: flowDoc.edges ?? [],
      comments: flowDoc.comments ?? [],
      overlays: flowDoc.overlays ?? [],
    });
  }, [flowDoc, selectedFlowId]);

  const persistedChunkSignature = useMemo(() => {
    if (!selectedFlowId || !flowDoc) return "";
    const normalized = normalizeChunks(flowDoc.chunks);
    const stored = normalized.map((chunk, index) => serializeChunkForSave(chunk, index));
    return JSON.stringify(stored);
  }, [flowDoc, selectedFlowId]);

  const hasFlowUnsavedChanges = useMemo(() => {
    if (!selectedFlowId || !persistedFlowSignature) return false;
    return persistedFlowSignature !== flowGraphSignature;
  }, [flowGraphSignature, persistedFlowSignature, selectedFlowId]);

  const hasChunkUnsavedChanges = useMemo(() => {
    if (!selectedFlowId || !persistedChunkSignature) return false;
    return persistedChunkSignature !== chunkSignature;
  }, [chunkSignature, persistedChunkSignature, selectedFlowId]);

  useEffect(() => {
    let rafId: number | null = null;
    const scheduleStatusUpdate = (status: ChunkSaveStatus, error: string | null) => {
      if (typeof window === "undefined") {
        setChunkSaveStatus(status);
        setChunkSaveError(error);
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        setChunkSaveStatus(status);
        setChunkSaveError(error);
        rafId = null;
      });
    };
    if (!selectedFlowId) {
      scheduleStatusUpdate("idle", null);
      return () => {
        if (chunkAutosaveTimeoutRef.current) {
          window.clearTimeout(chunkAutosaveTimeoutRef.current);
        }
        if (rafId) {
          window.cancelAnimationFrame(rafId);
        }
      };
    }
    if (!chunkAutosaveInitializedRef.current) {
      chunkAutosaveInitializedRef.current = true;
      return () => {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
        }
      };
    }
    if (!hasChunkUnsavedChanges) {
      scheduleStatusUpdate("idle", null);
      return () => {
        if (chunkAutosaveTimeoutRef.current) {
          window.clearTimeout(chunkAutosaveTimeoutRef.current);
        }
        if (rafId) {
          window.cancelAnimationFrame(rafId);
        }
      };
    }
    scheduleStatusUpdate("pending", chunkSaveError);
    if (chunkAutosaveTimeoutRef.current) {
      window.clearTimeout(chunkAutosaveTimeoutRef.current);
    }
    chunkAutosaveTimeoutRef.current = window.setTimeout(() => {
      chunkAutosaveTimeoutRef.current = null;
      void persistChunksOnly();
    }, 800);
    return () => {
      if (chunkAutosaveTimeoutRef.current) {
        window.clearTimeout(chunkAutosaveTimeoutRef.current);
      }
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [chunkSaveError, chunks, hasChunkUnsavedChanges, persistChunksOnly, selectedFlowId]);

  const buildFlowSpec = useCallback((): FlowSpec | null => {
    if (!selectedFlowId) return null;
    const specNodes: FlowSpecNode[] = nodes.map((node) => ({
      id: node.id,
      routeId: node.data.routeId,
      routePath: node.data.routePath,
      label: node.data.labelOverrides,
      position: { x: node.position.x, y: node.position.y },
      isStart: Boolean(node.data.tags?.includes("start")),
      tags: node.data.tags ?? [],
      chunkId: node.data.chunkId ?? UNGROUPED_CHUNK_ID,
      portal: node.data.portal ?? undefined,
    }));
    const specEdges: FlowSpecEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.labelOverrides,
      conditionTag: edge.data?.conditionTag,
      eventName: edge.data?.eventName,
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
      color: edge.data?.color,
      command: edge.data?.command,
    }));
    return {
      flow: {
        id: selectedFlowId,
        name: flowNameDraft.trim() || flowDoc?.name || "Flow",
        version: flowDoc?.version ?? null,
        updatedAt: formatTimestamp(flowDoc?.updatedAt),
      },
      nodes: specNodes,
      edges: specEdges,
      comments: comments.map((comment) => ({ ...comment })),
      chunks: chunks.map((chunk, index) => ({ ...chunk, order: index })),
      diagnostics: {
        issues: diagnostics.length,
        nodes: flowStats.nodeCount,
        edges: flowStats.edgeCount,
        orphans: flowStats.orphanCount,
        unreachable: flowStats.unreachableCount,
        hasStart: flowStats.hasExplicitStart,
        exportedAt: new Date().toISOString(),
      },
    };
  }, [chunks, comments, diagnostics.length, edges, flowDoc?.name, flowDoc?.updatedAt, flowDoc?.version, flowNameDraft, flowStats, nodes, selectedFlowId]);

  const handleDownloadFlowSpec = useCallback(() => {
    const spec = buildFlowSpec();
    if (!spec) return;
    const json = JSON.stringify(spec, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeName = (spec.flow.name ?? "flow").replace(/\s+/g, "_");
    link.download = `${safeName}-spec.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [buildFlowSpec]);
  const buildAuditSnapshot = useCallback(() => {
    if (!selectedFlowId) return null;
    const reachableIds = computeReachableNodeIds(nodes, edges);
    const chunkSummary = chunks.map((chunk) => {
      const chunkNodes = nodes.filter((node) => (node.data.chunkId ?? UNGROUPED_CHUNK_ID) === chunk.id);
      const mapNode = (node: ReactFlowNode<FlowNodeData>) => ({
        id: node.id,
        label: node.data.labelOverrides?.ro ?? node.data.labelOverrides?.en ?? node.data.routePath ?? node.id,
        routePath: node.data.routePath,
      });
      return {
        chunkId: chunk.id,
        title: chunk.title,
        nodeCount: chunkNodes.length,
        startNodes: chunkNodes.filter((node) => node.data.tags?.includes("start")).map(mapNode),
        unreachableNodes: chunkNodes.filter((node) => !reachableIds.has(node.id)).map(mapNode),
      };
    });
    const crossChunkEdges = edges
      .filter(
        (edge) =>
          (nodeChunkIdMap.get(edge.source) ?? UNGROUPED_CHUNK_ID) !==
          (nodeChunkIdMap.get(edge.target) ?? UNGROUPED_CHUNK_ID),
      )
      .map((edge) => ({
        id: edge.id,
        source: {
          nodeId: edge.source,
          routePath: nodeRouteById.get(edge.source) ?? "",
          chunkId: nodeChunkIdMap.get(edge.source) ?? UNGROUPED_CHUNK_ID,
        },
        target: {
          nodeId: edge.target,
          routePath: nodeRouteById.get(edge.target) ?? "",
          chunkId: nodeChunkIdMap.get(edge.target) ?? UNGROUPED_CHUNK_ID,
        },
      }));
    const flowName = flowNameDraft.trim() || flowDoc?.name || "Flow";
    const overlaySummary = overlays.map((overlay) => ({
      id: overlay.id,
      name: overlay.name ?? "Journey",
      stepCount: overlay.steps?.length ?? 0,
      nodes: overlay.steps?.map((step) => ({
        nodeId: step.nodeId,
        routePath: nodeRouteById.get(step.nodeId) ?? "",
      })),
    }));
    return {
      generatedAt: new Date().toISOString(),
      flow: {
        id: selectedFlowId,
        name: flowName,
      },
      stats: {
        nodes: nodes.length,
        edges: edges.length,
      },
      chunkSummary,
      crossChunkEdges,
      lintWarnings: diagnostics.filter((issue) => issue.severity === "warning"),
      overlays: overlaySummary,
    };
  }, [chunks, diagnostics, edges, flowDoc?.name, flowNameDraft, nodeChunkIdMap, nodeRouteById, nodes, overlays, selectedFlowId]);
  const handleExportAuditSnapshot = useCallback(() => {
    const snapshot = buildAuditSnapshot();
    if (!snapshot) return;
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const safeName = (snapshot.flow.name ?? "flow").replace(/\s+/g, "_");
    link.download = `${safeName}-audit.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [buildAuditSnapshot]);

  const handleSaveFlow = useCallback(async () => {
    if (!selectedFlowId || !flowNameDraft.trim()) return;
    const { storedNodes, storedEdges, storedChunks, storedComments, storedOverlays } = serializeFlow();
    setSaveStatus("saving");
    setSaveMessage(null);
    try {
      await setDoc(
        doc(db, "adminFlows", selectedFlowId),
        {
          name: flowNameDraft.trim(),
          nodes: storedNodes,
          edges: storedEdges,
          chunks: storedChunks,
          comments: storedComments,
          overlays: storedOverlays,
          updatedAt: serverTimestamp(),
          updatedAtMs: Date.now(),
          version: (flowDoc?.version ?? 0) + 1,
        },
        { merge: true },
      );
      setSaveStatus("success");
      setSaveMessage("Salvat");
      const now = new Date();
      setLastFlowSaveAt(now);
      setAutosaveError(null);
      window.setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save flow", error);
      setSaveStatus("error");
      setSaveMessage(error instanceof Error ? error.message : "Nu am putut salva map-ul");
    }
  }, [db, flowDoc, flowNameDraft, selectedFlowId, serializeFlow]);

  const handleCreateFlow = useCallback(async () => {
    const name = prompt("Nume map nou")?.trim();
    if (!name) return;
    const docRef = await addDoc(collection(db, "adminFlows"), {
      name,
      nodes: [],
      edges: [],
      overlays: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
    });
    setSelectedFlowId(docRef.id);
  }, [db]);

  const handleDuplicateFlow = useCallback(async () => {
    if (!selectedFlowId) return;
    const { storedNodes, storedEdges, storedChunks, storedComments, storedOverlays } = serializeFlow();
    const name = flowNameDraft ? `${flowNameDraft} (copy)` : `${flowDoc?.name ?? "Flow"} (copy)`;
    const docRef = await addDoc(collection(db, "adminFlows"), {
      name,
      description: flowDoc?.description ?? "",
      nodes: storedNodes,
      edges: storedEdges,
      chunks: storedChunks,
      comments: storedComments,
      overlays: storedOverlays,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: (flowDoc?.version ?? 0) + 1,
    });
    setSelectedFlowId(docRef.id);
    setFlowNameDraft(name);
  }, [db, flowDoc?.description, flowDoc?.name, flowDoc?.version, flowNameDraft, selectedFlowId, serializeFlow]);

  const performAutosave = useCallback(async () => {
    if (!selectedFlowId || !flowNameDraft.trim() || !hasFlowUnsavedChanges) return;
    try {
      setAutosaveStatus("saving");
      setAutosaveError(null);
      const { storedNodes, storedEdges, storedChunks, storedComments, storedOverlays } = serializeFlow();
      await setDoc(
        doc(db, "adminFlows", selectedFlowId, "drafts", AUTOSAVE_DOC_ID),
        {
          name: flowNameDraft.trim(),
          nodes: storedNodes,
          edges: storedEdges,
          chunks: storedChunks,
          comments: storedComments,
          overlays: storedOverlays,
          updatedAt: serverTimestamp(),
          updatedAtMs: Date.now(),
        },
        { merge: true },
      );
      const timestamp = new Date();
      setLastAutosaveAt(timestamp);
      setAutosaveStatus("idle");
      pushAutosaveToast("success", `Autosalvat la ${autosaveTimeFormatter.format(timestamp)}`);
    } catch (error) {
      console.error("[FlowStudio] autosave failed", error);
      setAutosaveStatus("error");
      setAutosaveError(error instanceof Error ? error.message : "Autosave esuat");
      pushAutosaveToast("error", "Autosave eșuat");
    }
  }, [db, flowNameDraft, hasFlowUnsavedChanges, pushAutosaveToast, selectedFlowId, serializeFlow]);

  useEffect(() => {
    if (!selectedFlowId) return undefined;
    const intervalId = window.setInterval(() => {
      void performAutosave();
    }, AUTOSAVE_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [performAutosave, selectedFlowId]);

  const handleOpenImportModal = useCallback(() => {
    setImportModalOpen(true);
    setImportSpecText("");
    setImportSpecPreview(null);
    setImportSpecError(null);
    setImportUpdateCurrent(false);
  }, []);

  const handleCloseImportModal = useCallback(() => {
    setImportModalOpen(false);
  }, []);

  const handleValidateImportSpec = useCallback(() => {
    try {
      const preview = parseFlowSpecText(importSpecText);
      setImportSpecPreview(preview);
      setImportSpecError(null);
    } catch (error) {
      setImportSpecPreview(null);
      setImportSpecError(error instanceof Error ? error.message : "Spec invalid");
    }
  }, [importSpecText]);

  const handleApplyImportSpec = useCallback(async () => {
    if (!importSpecPreview) {
      setImportSpecError("Valideaza spec-ul inainte de a aplica schimbarile.");
      return;
    }
    if (importUpdateCurrent && !selectedFlowId) {
      setImportSpecError("Selecteaza un map pentru actualizare sau importa ca unul nou.");
      return;
    }
    const normalizedNodes: FlowNode[] = importSpecPreview.nodes.map((node, index) => {
      const fallbackId = node.id || `node_${index}_${randomId()}`;
      const routeFromId = node.routeId ? routeMap.get(node.routeId) : null;
      const routeFromPath = node.routePath ? routeByPath.get(node.routePath) : null;
      const resolvedRoute = routeFromId ?? routeFromPath;
      const resolvedRouteId = resolvedRoute?.id ?? node.routeId ?? node.routePath ?? fallbackId;
      const normalized: FlowNode = {
        id: fallbackId,
        routeId: resolvedRouteId,
        x: typeof node.position?.x === "number" ? node.position.x : 0,
        y: typeof node.position?.y === "number" ? node.position.y : 0,
        chunkId: node.chunkId ?? UNGROUPED_CHUNK_ID,
      };
      const label = normalizeLabelMap(node.label);
      const tags = normalizeSpecTags(node.tags, node.isStart);
      if (label) {
        normalized.label = label;
      }
      if (tags) {
        normalized.tags = tags;
      }
      if (node.portal) {
        normalized.portal = node.portal;
      }
      return normalized;
    });
    const normalizedEdges: FlowEdge[] = importSpecPreview.edges.map((edge, index) => {
      const normalized: FlowEdge = {
        id: edge.id || `edge_${index}_${randomId()}`,
        from: edge.source,
        to: edge.target,
      };
      if (edge.sourceHandle) normalized.sourceHandle = edge.sourceHandle;
      if (edge.targetHandle) normalized.targetHandle = edge.targetHandle;
      if (edge.label) normalized.label = edge.label;
      if (edge.conditionTag) normalized.conditionTag = edge.conditionTag;
      if (edge.eventName) normalized.eventName = edge.eventName;
      if (edge.color) normalized.color = edge.color;
      if (edge.command) normalized.command = edge.command;
      return normalized;
    });
    const normalizedChunks = normalizeChunks(importSpecPreview.chunks);
    const normalizedComments = Array.isArray(importSpecPreview.comments) ? importSpecPreview.comments : [];
    const flowName = importSpecPreview.flow?.name?.trim() || "Imported map";
    const incomingVersion = importSpecPreview.flow?.version ?? 1;
    const payload = {
      name: flowName,
      nodes: normalizedNodes,
      edges: normalizedEdges,
      chunks: normalizedChunks,
      comments: normalizedComments,
      updatedAt: serverTimestamp(),
      version: incomingVersion,
    };
    if (importUpdateCurrent && selectedFlowId) {
      await setDoc(doc(db, "adminFlows", selectedFlowId), payload, { merge: true });
    } else {
      const docRef = await addDoc(collection(db, "adminFlows"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      setSelectedFlowId(docRef.id);
    }
    setFlowNameDraft(flowName);
    setComments(normalizedComments);
    setImportSpecText("");
    setImportSpecPreview(null);
    setImportSpecError(null);
    setImportUpdateCurrent(false);
    setImportModalOpen(false);
  }, [db, importSpecPreview, importUpdateCurrent, routeByPath, routeMap, selectedFlowId]);

  useEffect(() => {
    if (!selectedFlowId) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget = Boolean(target?.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"));
      if (isEditableTarget) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        if (!selectedNodeId && !selectedEdgeId) return;
        event.preventDefault();
        handleDeleteSelection();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSaveFlow();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        handleDuplicateSelectedNode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleDeleteSelection, handleDuplicateSelectedNode, handleSaveFlow, selectedEdgeId, selectedFlowId, selectedNodeId]);

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
  const handleNodeTagsChange = useCallback(
    (nodeId: string, tags: string[]) => {
      const normalized = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
      setNodes((existing) =>
        existing.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  tags: normalized,
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );
  const handleNodePortalChange = useCallback(
    (nodeId: string, portalDraft: FlowNodePortalConfig | null) => {
      setNodes((existing) =>
        existing.map((node) => {
          if (node.id !== nodeId) return node;
          let resolvedPortal: FlowNodePortalConfig | null = null;
          if (portalDraft) {
            if (portalDraft.targetType === "route") {
              const routePath = portalDraft.targetRoutePath?.trim();
              if (routePath) {
                const route = routeByPath.get(routePath);
                resolvedPortal = {
                  targetType: "route",
                  targetRoutePath: routePath,
                  targetRouteId: route?.id,
                  label: portalDraft.label ?? route?.routePath ?? routePath,
                };
              }
            } else if (portalDraft.targetType === "node") {
              const targetNodeId = portalDraft.targetNodeId?.trim();
              if (targetNodeId) {
                resolvedPortal = {
                  targetType: "node",
                  targetNodeId,
                  label: portalDraft.label,
                };
              }
            }
          }
          return {
            ...node,
            data: {
              ...node.data,
              portal: resolvedPortal,
            },
          };
        }),
      );
    },
    [routeByPath, setNodes],
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

  const handleApplyEdgeColorToGroup = useCallback(
    (edgeId: string, color: string) => {
      setEdges((existing) => {
        const target = existing.find((edge) => edge.id === edgeId);
        if (!target) return existing;
        const key = buildEdgeGroupKey(target.source, target.target);
        return existing.map((edge) =>
          buildEdgeGroupKey(edge.source, edge.target) === key
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  color,
                },
              }
            : edge,
        );
      });
    },
    [setEdges],
  );

  const mutateOverlay = useCallback((overlayId: string, mutator: (overlay: FlowOverlay) => FlowOverlay | null) => {
    setOverlays((existing) => {
      let changed = false;
      const next: FlowOverlay[] = [];
      existing.forEach((overlay) => {
        if (overlay.id !== overlayId) {
          next.push(overlay);
          return;
        }
        const updated = mutator(overlay);
        changed = true;
        if (updated) {
          next.push(updated);
        }
      });
      return changed ? next : existing;
    });
  }, []);

  const handleCreateOverlay = useCallback(
    (name: string) => {
      const overlay: FlowOverlay = {
        id: randomId(),
        name: name.trim() || "Journey",
        steps: [],
      };
      setOverlays((existing) => [...existing, overlay]);
      selectOverlay(overlay.id);
    },
    [selectOverlay],
  );

  const handleDeleteOverlay = useCallback(
    (overlayId: string) => {
      setOverlays((existing) => existing.filter((overlay) => overlay.id !== overlayId));
      setSelectedOverlayId((prev) => {
        if (prev === overlayId) {
          setOverlayFocusHideOthers(true);
          return null;
        }
        return prev;
      });
    },
    [],
  );

  const handleOverlayMetadataChange = useCallback(
    (overlayId: string, updates: Partial<Pick<FlowOverlay, "name" | "description" | "status">>) => {
      mutateOverlay(overlayId, (overlay) => ({
        ...overlay,
        ...updates,
      }));
    },
    [mutateOverlay],
  );

  const handleOverlayAddNodes = useCallback(
    (overlayId: string, nodeIds: string[]) => {
      if (!nodeIds.length) return;
      mutateOverlay(overlayId, (overlay) => {
        const existingSteps = overlay.steps ?? [];
        const existingIds = new Set(existingSteps.map((step) => step.nodeId));
        const nextSteps = [...existingSteps];
        nodeIds.forEach((nodeId) => {
          if (!nodeId || existingIds.has(nodeId)) return;
          existingIds.add(nodeId);
          nextSteps.push({ nodeId });
        });
        return { ...overlay, steps: nextSteps };
      });
    },
    [mutateOverlay],
  );

  const handleOverlayRemoveStep = useCallback(
    (overlayId: string, index: number) => {
      mutateOverlay(overlayId, (overlay) => {
        if (!overlay.steps?.length || index < 0 || index >= overlay.steps.length) return overlay;
        const nextSteps = overlay.steps.filter((_, stepIndex) => stepIndex !== index);
        return { ...overlay, steps: nextSteps };
      });
    },
    [mutateOverlay],
  );

  const handleOverlayReorderSteps = useCallback(
    (overlayId: string, fromIndex: number, toIndex: number) => {
      mutateOverlay(overlayId, (overlay) => {
        const steps = overlay.steps ?? [];
        if (fromIndex < 0 || fromIndex >= steps.length || toIndex < 0 || toIndex >= steps.length) {
          return overlay;
        }
        const nextSteps = [...steps];
        const [moved] = nextSteps.splice(fromIndex, 1);
        nextSteps.splice(toIndex, 0, moved);
        return { ...overlay, steps: nextSteps };
      });
    },
    [mutateOverlay],
  );

  const handleOverlayStepUpdate = useCallback(
    (overlayId: string, index: number, updates: Partial<FlowOverlayStep>) => {
      mutateOverlay(overlayId, (overlay) => {
        if (!overlay.steps?.length || index < 0 || index >= overlay.steps.length) return overlay;
        const nextSteps = overlay.steps.map((step, stepIndex) =>
          stepIndex === index
            ? {
                ...step,
                ...updates,
              }
            : step,
        );
        return { ...overlay, steps: nextSteps };
      });
    },
    [mutateOverlay],
  );

  const handleRepairSelectedOverlaySteps = useCallback(() => {
    if (!selectedOverlay) return;
    let repairedCount = 0;
    mutateOverlay(selectedOverlay.id, (overlay) => {
      if (!overlay.steps?.length) return overlay;
      let changed = false;
      const repairedSteps = overlay.steps.map((step) => {
        const normalizedId = typeof step.nodeId === "string" ? step.nodeId.trim() : "";
        if (normalizedId && nodeByIdMap.has(normalizedId)) {
          if (normalizedId === step.nodeId) {
            return step;
          }
          changed = true;
          repairedCount += 1;
          return { ...step, nodeId: normalizedId };
        }
        const legacy = step as FlowOverlayStep & Record<string, unknown>;
        const idCandidates = [
          typeof legacy.id === "string" ? legacy.id : null,
          typeof legacy.node === "string" ? legacy.node : null,
          typeof legacy.targetNodeId === "string" ? legacy.targetNodeId : null,
        ].filter((value): value is string => Boolean(value));
        let resolvedId: string | null = null;
        for (const candidate of idCandidates) {
          if (nodeByIdMap.has(candidate)) {
            resolvedId = candidate;
            break;
          }
        }
        if (!resolvedId) {
          const routeCandidates = [
            typeof legacy.routePath === "string" ? legacy.routePath : null,
            typeof legacy.targetRoutePath === "string" ? legacy.targetRoutePath : null,
            typeof legacy.path === "string" ? legacy.path : null,
          ].filter((value): value is string => Boolean(value));
          for (const routeCandidate of routeCandidates) {
            const mappedId = nodeByRoutePathMap.get(routeCandidate);
            if (mappedId) {
              resolvedId = mappedId;
              break;
            }
          }
        }
        if (!resolvedId) {
          return step;
        }
        changed = true;
        repairedCount += 1;
        return { ...step, nodeId: resolvedId };
      });
      if (!changed) return overlay;
      return { ...overlay, steps: repairedSteps };
    });
    if (repairedCount > 0) {
      pushAutosaveToast("success", `Am reparat ${repairedCount} pași pentru ${selectedOverlay.name ?? "Journey"}.`);
    } else {
      pushAutosaveToast("error", "Nu am reușit să repar pașii acestui Journey. Verifică manual.");
    }
  }, [mutateOverlay, nodeByIdMap, nodeByRoutePathMap, pushAutosaveToast, selectedOverlay]);
  const handleClearOverlayFocus = useCallback(() => {
    selectOverlay(null, { enforceViewMode: false });
  }, [selectOverlay]);
  const handleToggleOverlayFocusHide = useCallback(() => {
    setOverlayFocusHideOthers((prev) => {
      const next = !prev;
      if (next) {
        setViewMode("nodes");
      }
      return next;
    });
  }, [setViewMode]);
  const handleOverlayFitView = useCallback(() => {
    if (!reactFlowInstance || !overlayFocusNodes.length) return;
    setViewMode("nodes");
    requestAnimationFrame(() => {
      if (!reactFlowInstance) return;
      reactFlowInstance.fitView({ nodes: overlayFocusNodes, padding: 0.25, duration: 350 });
    });
  }, [overlayFocusNodes, reactFlowInstance, setViewMode]);

  const flowsTabDisabled = !selectedFlowId;
  const autoLayoutDisabled = autoLayoutRunning || viewMode === "chunks" || flowsTabDisabled;
  const hasSelection = Boolean(selectedNode || selectedEdge);
  const canvasNodeCount = viewMode === "chunks" ? chunkGraph.nodes.length : nodes.length;
  const zoomButtonDisabled = flowsTabDisabled || !canvasNodeCount || zoomingToFit;
  const centerButtonDisabled = viewMode === "chunks" || flowsTabDisabled || !hasSelection || centeringSelection;
  const viewToggle = (
    <div className="flex items-center rounded-full border border-[var(--omni-border-soft)] bg-white p-0.5 text-xs font-semibold shadow-sm">
      {(["nodes", "chunks"] as FlowViewMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          className={clsx(
            "rounded-full px-3 py-1",
            viewMode === mode ? "bg-[var(--omni-ink)] text-white" : "text-[var(--omni-muted)]",
          )}
          onClick={() => setViewMode(mode)}
        >
          {mode === "nodes" ? "Nodes" : "World Map"}
        </button>
      ))}
    </div>
  );
  const handleOverlaySelectChange = useCallback(
    (overlayId: string | null) => {
      if (typeof window !== "undefined") {
        overlayScrollRestoreRef.current = window.scrollY;
      }
      selectOverlay(overlayId);
    },
    [selectOverlay],
  );
  const handleOpenOverlayManager = useCallback(() => {
    setInspectorCollapsed(false);
    setInspectorTabRequest({ tab: "overlays", nonce: Date.now() });
  }, []);
  const overlaySelector = (
    <div className="flex items-center gap-2 rounded-full border border-[var(--omni-border-soft)] bg-white px-3 py-1 text-xs font-semibold shadow-sm">
      <span className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Journey</span>
      <select
        ref={journeySelectRef}
        className="rounded-full border border-[var(--omni-border-soft)] bg-white px-2 py-1 text-xs font-semibold text-[var(--omni-ink)]"
        value={selectedOverlayId ?? ""}
        onChange={(event) => handleOverlaySelectChange(event.target.value || null)}
      >
        <option value="">None</option>
        {overlays.map((overlay) => (
          <option key={overlay.id} value={overlay.id}>
            {overlay.name ?? "Journey"}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="rounded-full border border-[var(--omni-border-soft)] px-2 py-1 text-[10px] font-semibold"
        onClick={handleOpenOverlayManager}
      >
        Journeys
      </button>
    </div>
  );
  const unresolvedOverlayStepCount = (overlayIntegrity?.missingNodeIdCount ?? 0) + (overlayIntegrity?.unresolvedNodeCount ?? 0);
  const overlayNeedsRepair = unresolvedOverlayStepCount > 0;
  const overlayFocusChip = selectedOverlay ? (
    <div className="flex flex-wrap items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900">
      <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-600">
        Journey tools
        <span className="sr-only"> pentru {selectedOverlay.name ?? selectedOverlay.id}</span>
      </span>
      {overlayNeedsRepair ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
          {unresolvedOverlayStepCount} pași lipsă
        </span>
      ) : null}
      <button
        type="button"
        className="rounded-full border border-indigo-300 px-2 py-0.5 text-[10px] font-semibold"
        disabled={!overlayFocusNodes.length}
        onClick={handleOverlayFitView}
      >
        Fit
      </button>
          <button
            type="button"
            className={clsx(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              overlayFocusHideOthers ? "border-indigo-400 text-indigo-900" : "border-dashed border-indigo-300 text-indigo-600",
            )}
            onClick={handleToggleOverlayFocusHide}
            disabled={!overlayFocusNodes.length}
          >
            {overlayFocusHideOthers ? "Hide others" : "Show all"}
          </button>
      {overlayNeedsRepair ? (
        <button
          type="button"
          className="rounded-full border border-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
          onClick={handleRepairSelectedOverlaySteps}
        >
          Repair steps
        </button>
      ) : null}
      <button
        type="button"
        className="rounded-full border border-indigo-300 px-2 py-0.5 text-[10px] font-semibold text-indigo-900"
        onClick={handleClearOverlayFocus}
      >
        Clear
      </button>
    </div>
  ) : null;
  const worldFocusControls = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={clsx(
          "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
          selectedChunkId ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]" : "cursor-not-allowed border-dashed text-[var(--omni-muted)]",
        )}
        onClick={handleFocusSelectedChunk}
        disabled={!selectedChunkId}
        title={selectedChunkId ? "Focus pe world-ul selectat" : "Selectează un world din tab"}
      >
        🌍 Focus World
      </button>
      {focusedChunk ? (
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
          <span className="flex items-center gap-1">
            <span role="img" aria-hidden>
              🎯
            </span>
            {focusedChunk.title}
          </span>
          <button
            type="button"
            className={clsx(
              "rounded-full border px-2 py-0.5 text-[10px] uppercase",
              chunkFocusHideOthers ? "border-[var(--omni-ink)] bg-[var(--omni-ink)] text-white" : "border-sky-300 text-sky-800",
            )}
            onClick={handleToggleChunkFocusHide}
            title={chunkFocusHideOthers ? "Afișează toate worlds" : "Estompează restul"}
          >
            {chunkFocusHideOthers ? "Show all" : "Hide"}
          </button>
          <button type="button" className="text-[10px] uppercase text-sky-800 underline" onClick={handleClearChunkFocus}>
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );

  const handleAutoLayout = useCallback(() => {
    if (viewMode !== "nodes") return;
    setAutoLayoutRunning(true);
    setNodes((current) => {
      if (!current.length) return current;
      const graph = new dagre.graphlib.Graph();
      graph.setGraph({ rankdir: "LR", nodesep: 140, ranksep: 160 });
      graph.setDefaultEdgeLabel(() => ({}));
      current.forEach((node) => {
        graph.setNode(node.id, { width: DAGRE_NODE_WIDTH, height: DAGRE_NODE_HEIGHT });
      });
      edges.forEach((edge) => {
        graph.setEdge(edge.source, edge.target);
      });
      dagre.layout(graph);
      return current.map((node) => {
        const layout = graph.node(node.id);
        if (!layout) return node;
        return {
          ...node,
          position: {
            x: layout.x - DAGRE_NODE_WIDTH / 2,
            y: layout.y - DAGRE_NODE_HEIGHT / 2,
          },
        };
      });
    });
    requestAnimationFrame(() => {
      reactFlowInstance?.fitView({ padding: 0.2, duration: 500 });
      window.setTimeout(() => setAutoLayoutRunning(false), 550);
    });
  }, [edges, reactFlowInstance, setNodes, viewMode]);

  const viewZoomControls = (
    <div className="flex flex-wrap items-center gap-2">
      {viewToggle}
      <button
        type="button"
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--omni-border-soft)] text-base",
          zoomButtonDisabled ? "cursor-not-allowed opacity-50" : "",
          zoomingToFit ? "bg-[var(--omni-ink)] text-white" : "",
        )}
        title="Zoom to fit"
        aria-label="Zoom to fit"
        disabled={zoomButtonDisabled}
        onClick={handleZoomToFit}
      >
        <span className="sr-only">{zoomingToFit ? "Se ajustează..." : "Zoom to fit"}</span>
        <span aria-hidden>{zoomingToFit ? "⏳" : "🔍"}</span>
      </button>
      <button
        type="button"
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--omni-border-soft)] text-base",
          centerButtonDisabled ? "cursor-not-allowed opacity-50" : "",
          centeringSelection ? "bg-[var(--omni-ink)] text-white" : "",
        )}
        title="Centreaza selecția"
        aria-label="Centreaza selecția"
        disabled={centerButtonDisabled}
        onClick={handleCenterOnSelection}
      >
        <span className="sr-only">{centeringSelection ? "Centrez..." : "Centreaza selectia"}</span>
        <span aria-hidden>{centeringSelection ? "⏳" : "🎯"}</span>
      </button>
    </div>
  );
  const filtersControls = filtersDrawerOpen ? (
    <div className="flex min-w-[260px] flex-1 flex-col gap-2 rounded-2xl border border-[var(--omni-border-soft)] bg-white/90 p-3 text-xs shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="px-2 text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">Filtre tags</span>
          <p className="text-[10px] text-[var(--omni-muted)]">engine / surface / cluster / gate / type</p>
        </div>
        <button
          type="button"
          className="text-[10px] uppercase text-[var(--omni-muted)] underline"
          onClick={() => setFiltersDrawerOpen(false)}
        >
          Închide
        </button>
      </div>
      <div className="flex flex-1 items-center gap-1">
        <input
          type="text"
          list="flow-studio-tag-options"
          className="flex-1 rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[var(--omni-ink)]"
          placeholder="Caută sau tastează tag"
          value={tagSearch}
          onChange={(event) => setTagSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleApplyTagSearch();
            }
          }}
        />
        <datalist id="flow-studio-tag-options">
          {tagVocabulary.map((tag) => (
            <option key={tag} value={tag} />
          ))}
        </datalist>
        <button
          type="button"
          className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[10px] font-semibold text-[var(--omni-ink)]"
          onClick={handleApplyTagSearch}
          disabled={!tagSearch.trim()}
        >
          Adaugă
        </button>
        {resolvedTagFilters.length ? (
          <button
            type="button"
            className="rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-[10px] font-semibold text-[var(--omni-ink)]"
            onClick={handleResetTagFilters}
          >
            Curăță
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1">
        {filteredTagOptions.length ? (
          filteredTagOptions.map((tag) => {
            const active = resolvedTagFilters.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={clsx(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition",
                  active
                    ? "border-[var(--omni-ink)] bg-[var(--omni-ink)] text-white"
                    : "border-[var(--omni-border-soft)] text-[var(--omni-muted)] hover:text-[var(--omni-ink)]",
                )}
                onClick={() => handleToggleTagFilter(tag)}
                title={`Filtrează după ${tag}`}
              >
                {tag}
              </button>
            );
          })
        ) : tagVocabulary.length ? (
          <span className="px-2 py-0.5 text-[11px] text-[var(--omni-muted)]">Niciun tag pentru filtrul curent.</span>
        ) : (
          <span className="px-2 py-0.5 text-[11px] text-[var(--omni-muted)]">Nu există tag-uri sincronizate.</span>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold text-[var(--omni-ink)]"
        onClick={() => setFiltersDrawerOpen(true)}
        disabled={!selectedFlowId}
      >
        {`Filtre tags${resolvedTagFilters.length ? ` (${resolvedTagFilters.length})` : ""}`}
      </button>
      {resolvedTagFilters.length ? (
        <div className="flex flex-wrap items-center gap-1">
          {resolvedTagFilters.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-[var(--omni-bg-paper)] px-2 py-0.5 text-[10px] font-semibold text-[var(--omni-muted)]">
              {tag}
            </span>
          ))}
          {resolvedTagFilters.length > 3 ? (
            <span className="rounded-full bg-[var(--omni-bg-paper)] px-2 py-0.5 text-[10px] font-semibold text-[var(--omni-muted)]">
              +{resolvedTagFilters.length - 3}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
  const addSelectionToJourneyControl =
    selectedOverlayId && selectedNodeIds.length
      ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-900"
          onClick={() => handleOverlayAddNodes(selectedOverlayId, selectedNodeIds)}
        >
          ➕ Journey ({selectedNodeIds.length})
        </button>
      )
      : null;
  const canvasPrimaryActions = (
    <OmniCtaButton size="sm" onClick={handleSaveFlow} disabled={!selectedFlowId || !flowNameDraft.trim()}>
      Salveaza
    </OmniCtaButton>
  );
  const selectableCanvasNodeIds = useMemo(() => selectedNodeIds.filter((id) => !id.startsWith("step:")), [selectedNodeIds]);
  const canvasHeaderActions = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {overlaySelector}
        {overlayFocusChip}
        {addSelectionToJourneyControl}
      </div>
      {worldFocusControls}
      {viewZoomControls}
      {filtersControls}
      <button
        type="button"
        className={clsx(
          "rounded-full border px-3 py-1 text-xs font-semibold",
          selectedFlowId ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]" : "cursor-not-allowed border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)]",
        )}
        onClick={handleOpenPortalCreator}
        disabled={!selectedFlowId}
      >
        + Portal
      </button>
      <button
        type="button"
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-full border text-lg",
          selectableCanvasNodeIds.length ? "border-amber-300 text-amber-700" : "cursor-not-allowed border-dashed text-[var(--omni-muted)]",
        )}
        onClick={handleMarkDivergenceNodes}
        disabled={!selectableCanvasNodeIds.length}
        title="Marchează nodurile selectate ca punct de bifurcație"
        aria-label="Marchează divergență"
      >
        ⤢
      </button>
      {viewMode === "chunks" ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-full border border-[var(--omni-border-soft)] bg-white p-0.5 text-xs">
            <span className="px-2 text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">Direcție</span>
            {(["vertical", "horizontal"] as Array<"vertical" | "horizontal">).map((orientation) => (
              <button
                key={orientation}
                type="button"
                className={clsx(
                  "rounded-full px-2 py-1 font-semibold",
                  chunkLayoutOrientation === orientation ? "bg-[var(--omni-ink)] text-white" : "text-[var(--omni-muted)]",
                )}
                disabled={flowsTabDisabled}
                onClick={() => setChunkLayoutOrientation(orientation)}
              >
                {orientation === "vertical" ? "Vertical" : "Orizontal"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-[var(--omni-border-soft)] bg-white p-0.5">
            <span className="px-2 text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">Spațiere</span>
            {(["compact", "spacious"] as Array<"compact" | "spacious">).map((density) => (
              <button
                key={density}
                type="button"
                className={clsx(
                  "rounded-full px-2 py-1 font-semibold",
                  chunkLayoutDensity === density ? "bg-[var(--omni-ink)] text-white" : "text-[var(--omni-muted)]",
                )}
                disabled={flowsTabDisabled}
                onClick={() => setChunkLayoutDensity(density)}
              >
                {density === "compact" ? "Compact" : "Spațiat"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={clsx(
              "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
              flowsTabDisabled ? "cursor-not-allowed opacity-60" : "",
            )}
            onClick={handleResetChunkLayout}
            disabled={flowsTabDisabled}
          >
            Reset layout
          </button>
        </div>
      ) : null}
      {focusedChunk && viewMode === "nodes" ? (
        <button
          type="button"
          className="rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--omni-ink)]"
          onClick={() => handleFocusChunk(null)}
        >
          Chunk activ: {focusedChunk.title}
        </button>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-2 py-1 text-xs font-semibold text-[var(--omni-muted)] transition hover:text-[var(--omni-ink)]"
          onClick={() => setLeftSidebarCollapsed((prev) => !prev)}
          title={leftSidebarCollapsed ? "Afișează panoul lateral" : "Ascunde panoul lateral"}
        >
          <span aria-hidden className="text-base leading-none">{leftSidebarCollapsed ? "☰" : "⟵"}</span>
          <span className="sr-only">{leftSidebarCollapsed ? "Arată panoul lateral" : "Ascunde panoul lateral"}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-2 py-1 text-xs font-semibold text-[var(--omni-muted)] transition hover:text-[var(--omni-ink)]"
          onClick={() => setInspectorCollapsed((prev) => !prev)}
          title={inspectorCollapsed ? "Afișează inspectorul" : "Ascunde inspectorul"}
        >
          <span aria-hidden className="text-base leading-none">{inspectorCollapsed ? "☰" : "⟶"}</span>
          <span className="sr-only">{inspectorCollapsed ? "Arată Inspector" : "Ascunde Inspector"}</span>
        </button>
      </div>
    </div>
  );

  const handleCanvasClear = useCallback(() => {
    setSingleNodeSelection(null);
    setSingleEdgeSelection(null);
    setSelectedStepNodeId(null);
    setSelectedChunkId(null);
    setFocusedChunkId(null);
  }, [setSingleEdgeSelection, setSingleNodeSelection]);

  const handleRouteDragStart = useCallback<RouteDragHandler>((event, route) => {
    if (!selectedFlowId) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("application/json", JSON.stringify({ routeId: route.id }));
    event.dataTransfer.effectAllowed = "copy";
  }, [selectedFlowId]);

  const handleCanvasDragOver = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
    if (!selectedFlowId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, [selectedFlowId]);

  const handleCanvasDrop = useCallback(
    (event: ReactDragEvent<HTMLDivElement>) => {
      if (!selectedFlowId || !reactFlowInstance) return;
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/json");
      if (!raw) return;
      let payload: { routeId?: string } | null = null;
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = null;
      }
      if (!payload?.routeId) return;
      const route = routes.find((entry) => entry.id === payload!.routeId);
      if (!route) return;
      const bounds = canvasWrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      addRouteNode(route, position);
    },
    [addRouteNode, reactFlowInstance, routes, selectedFlowId],
  );

  const handleSelectIssue = useCallback(
    (issue: FlowIssue) => {
      setViewMode("nodes");
      if (issue.targetType === "chunk" && issue.targetId) {
        handleFocusChunk(issue.targetId);
        setSelectedChunkId(issue.targetId);
        return;
      }
      handleFocusChunk(null);
      if (!reactFlowInstance) return;
      if (issue.targetType === "node" && issue.targetId) {
        openStepsForNode(issue.targetId);
        return;
      }
      if (issue.targetType === "stepNode" && issue.targetId) {
        const parsed = parseStepNodeReactId(issue.targetId);
        if (!parsed) return;
        openStepsForNode(parsed.hostNodeId, issue.targetId);
        return;
      }
      if (issue.targetType === "edge" && issue.targetId) {
        setSingleEdgeSelection(issue.targetId);
        setSingleNodeSelection(null);
        setSelectedStepNodeId(null);
        const edge = edges.find((entry) => entry.id === issue.targetId);
        if (edge) {
          const rfNodes = reactFlowInstance.getNodes().filter((node) => node.id === edge.source || node.id === edge.target);
          if (rfNodes.length) {
            reactFlowInstance.fitView({ nodes: rfNodes, padding: 0.3, duration: 300 });
          }
        }
      }
    },
    [
      edges,
      handleFocusChunk,
      openStepsForNode,
      reactFlowInstance,
      setSelectedChunkId,
      setSelectedStepNodeId,
      setViewMode,
      setSingleEdgeSelection,
      setSingleNodeSelection,
    ],
  );
  const handleSelectMissingManifestNode = useCallback(
    (nodeId: string) => {
      setViewMode("nodes");
      handleFocusChunk(null);
      setSingleNodeSelection(nodeId);
      setSingleEdgeSelection(null);
      setSelectedStepNodeId(null);
      const node = nodes.find((entry) => entry.id === nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(
          node.position.x + DAGRE_NODE_WIDTH / 2,
          node.position.y + DAGRE_NODE_HEIGHT / 2,
          { zoom: 1.1, duration: 500 },
        );
      }
    },
    [handleFocusChunk, nodes, reactFlowInstance, setViewMode, setSingleEdgeSelection, setSingleNodeSelection],
  );

  const runCommandAndClose = useCallback(
    (action: () => void) => {
      action();
      setCommandPaletteOpen(false);
    },
    [setCommandPaletteOpen],
  );

  const commandActions = useMemo<Array<{ id: string; label: string; icon: string; disabled?: boolean; run: () => void }>>(
    () => [
      {
        id: "select-map",
        label: "Select Map",
        icon: "🗺️",
        disabled: !flowOptions.length,
        run: () => runCommandAndClose(() => setPendingFocusTarget("map")),
      },
      {
        id: "select-journey",
        label: "Select Journey",
        icon: "🧭",
        disabled: overlays.length === 0,
        run: () => runCommandAndClose(() => setPendingFocusTarget("journey")),
      },
      {
        id: "focus-world",
        label: "Focus World",
        icon: "🎯",
        disabled: !selectedChunkId,
        run: () => runCommandAndClose(() => handleFocusSelectedChunk()),
      },
      {
        id: "zoom-fit",
        label: "Zoom to fit",
        icon: "🔎",
        disabled: zoomButtonDisabled,
        run: () => runCommandAndClose(() => handleZoomToFit()),
      },
      {
        id: "auto-layout",
        label: "Auto-layout",
        icon: "✨",
        disabled: autoLayoutDisabled,
        run: () => runCommandAndClose(() => handleAutoLayout()),
      },
      {
        id: "export-spec",
        label: "Export spec",
        icon: "📤",
        disabled: !selectedFlowId,
        run: () => runCommandAndClose(() => handleDownloadFlowSpec()),
      },
      {
        id: "import-spec",
        label: "Import spec",
        icon: "📥",
        run: () => runCommandAndClose(() => handleOpenImportModal()),
      },
    ],
    [
      autoLayoutDisabled,
      flowOptions.length,
      handleAutoLayout,
      handleDownloadFlowSpec,
      handleFocusSelectedChunk,
      handleOpenImportModal,
      handleZoomToFit,
      overlays.length,
      selectedChunkId,
      selectedFlowId,
      zoomButtonDisabled,
      runCommandAndClose,
      setPendingFocusTarget,
    ],
  );
  const filteredCommandActions = useMemo(() => {
    const query = commandSearch.trim().toLowerCase();
    if (!query) return commandActions;
    return commandActions.filter((action) => action.label.toLowerCase().includes(query));
  }, [commandActions, commandSearch]);
  const headerMenu = headerMenuOpen ? (
    <div
      ref={headerMenuRef}
      className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-[var(--omni-border-soft)] bg-white/95 p-3 shadow-xl"
    >
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Map actions</p>
        <button
          type="button"
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm font-semibold text-[var(--omni-ink)]"
          onClick={() => {
            setHeaderMenuOpen(false);
            handleCreateFlow();
          }}
        >
          Creeaza nou
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm disabled:opacity-40"
          onClick={() => {
            setHeaderMenuOpen(false);
            handleDuplicateFlow();
          }}
          disabled={!selectedFlowId}
        >
          Duplica map
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm"
          onClick={() => {
            setHeaderMenuOpen(false);
            handleOpenImportModal();
          }}
        >
          Importa spec
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm disabled:opacity-40"
          onClick={() => {
            setHeaderMenuOpen(false);
            handleDownloadFlowSpec();
          }}
          disabled={!selectedFlowId}
        >
          Exporta spec
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-left text-sm disabled:opacity-40"
          onClick={() => {
            setHeaderMenuOpen(false);
            handleFixAllRouteMappings();
          }}
          disabled={!fixableRouteMappings.length}
        >
          Fix legacy mappings ({fixableRouteMappings.length})
        </button>
      </div>
      <div className="mt-3 space-y-2 border-t border-[var(--omni-border-soft)] pt-3">
        <label className="flex items-center justify-between text-xs font-semibold text-[var(--omni-muted)]">
          Observed analytics
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--omni-border-soft)]"
            checked={observedEnabled}
            onChange={(event) => setObservedEnabled(event.target.checked)}
          />
        </label>
        {observedEnabled ? (
          <div className="space-y-2 text-xs">
            <select
              className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-2 py-1"
              value={observedWindow}
              onChange={(event) => setObservedWindow(event.target.value as ObservedWindowKey)}
            >
              {OBSERVED_WINDOWS.map((window) => (
                <option key={window.key} value={window.key}>
                  {window.label}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-2 py-1"
              value={observedSegment}
              onChange={(event) => setObservedSegment(event.target.value as ObservedSegmentKey)}
            >
              {OBSERVED_SEGMENTS.map((segment) => (
                <option key={segment.key} value={segment.key}>
                  {segment.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <label className="mt-2 flex items-center justify-between text-xs font-semibold text-[var(--omni-muted)]">
          Diagnostics banner
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[var(--omni-border-soft)]"
            checked={diagnosticsBannerVisible}
            onChange={(event) => setDiagnosticsBannerVisible(event.target.checked)}
          />
        </label>
      </div>
    </div>
  ) : null;

  if (!authReady || configLoading) {
    return <div className="min-h-screen bg-[var(--omni-bg-main)]" />;
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-16 text-center text-[var(--omni-ink)]">
          <p className="text-lg font-semibold">Acces limitat. Doar administratorii pot folosi Flow Studio.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 pb-10 pt-6 text-[var(--omni-ink)] sm:px-6 lg:px-10">
        <div className="flex w-full flex-col gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Map management</p>
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--omni-ink)] shadow-sm"
                onClick={() => setMenuOpen(true)}
              >
                Meniu
              </button>
            </div>
            <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
              <div className="relative space-y-3">
                <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)_auto]">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Map</span>
                    <select
                      ref={flowSelectRef}
                      className="w-full rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
                      value={selectedFlowId ?? ""}
                      onChange={(event) => setSelectedFlowId(event.target.value || null)}
                    >
                      <option value="">Alege map</option>
                      {flowOptions.map((flow) => (
                        <option key={flow.id} value={flow.id}>
                          {flow.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Nume map</span>
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm"
                      placeholder="Titlu map"
                      value={flowNameDraft}
                      onChange={(event) => setFlowNameDraft(event.target.value)}
                      disabled={!selectedFlowId}
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Status</span>
                    <p
                      className={clsx(
                        "rounded-2xl border px-3 py-2 text-[11px] font-semibold",
                        hasFlowUnsavedChanges
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : saveStatus === "saving"
                            ? "border-[var(--omni-border-soft)] bg-white text-[var(--omni-muted)]"
                            : saveStatus === "error"
                              ? "border-rose-200 bg-rose-50 text-rose-600"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {saveStatus === "saving"
                        ? "Se salvează..."
                        : saveStatus === "error"
                          ? saveMessage ?? "Eroare la salvare"
                          : hasFlowUnsavedChanges
                            ? "Modificări locale"
                            : `Salvat la ${formatStatusTime(lastFlowSaveAt)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-[var(--omni-border-soft)] px-3 py-2 text-sm font-semibold text-[var(--omni-ink)]"
                      onClick={() => setHeaderMenuOpen((prev) => !prev)}
                      aria-haspopup="menu"
                      aria-expanded={headerMenuOpen}
                    >
                      More ▾
                    </button>
                  </div>
                </div>
                {headerMenu}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-5 xl:flex-row">
            {!leftSidebarCollapsed ? (
              <div className="w-full space-y-3 xl:w-[340px] xl:space-y-4 xl:sticky xl:top-[180px] xl:max-h-[calc(100vh-220px)] xl:overflow-y-auto">
                <div className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-2 text-xs font-semibold shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      {[
                        { key: "routes", label: "Routes" },
                        { key: "worlds", label: "Worlds" },
                        { key: "issues", label: "Issues" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          className={clsx(
                            "flex-1 rounded-full border px-3 py-1 text-center text-[11px]",
                            leftSidebarTab === tab.key
                              ? "border-[var(--omni-ink)] bg-[var(--omni-ink)] text-white"
                              : "border-[var(--omni-border-soft)] text-[var(--omni-muted)]",
                          )}
                          onClick={() => setLeftSidebarTab(tab.key as LeftSidebarTab)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-2 py-1 text-[10px] text-[var(--omni-muted)] hover:text-[var(--omni-ink)]"
                      onClick={() => setLeftSidebarCollapsed(true)}
                      title="Ascunde panoul lateral"
                    >
                      ⤫
                    </button>
                  </div>
                </div>
                {leftSidebarTab === "routes" ? (
                  <RoutesPanel
                    routes={filteredRoutes}
                    search={routeSearch}
                    onSearchChange={setRouteSearch}
                    groupFilter={effectiveRouteGroup}
                    groupOptions={routeGroupOptions}
                    onGroupFilterChange={setRouteGroup}
                    onQuickAddRoute={handleQuickAddRoute}
                    hasActiveFlow={Boolean(selectedFlowId)}
                    onRouteDragStart={handleRouteDragStart}
                  />
                ) : null}
                {leftSidebarTab === "worlds" ? (
                  <ChunkPanel
                    chunks={chunks}
                    countsByChunk={chunkCountsById}
                    onAddChunk={handleAddChunk}
                    onSeedCanonicalChunks={handleSeedCanonicalChunks}
                    onImportChunks={handleImportChunkPayload}
                    onUpdateChunk={handleUpdateChunk}
                    onDeleteChunk={handleDeleteChunk}
                    onMoveChunk={handleMoveChunk}
                    onSelectChunk={handleSelectChunkFromPanel}
                    selectedChunkId={selectedChunkId}
                    disabled={flowsTabDisabled}
                    defaultChunkId={UNGROUPED_CHUNK_ID}
                    onClearFocus={handleClearChunkFocus}
                    focusActive={Boolean(focusedChunkId)}
                    selectedNodeIds={selectedNodeIds}
                    onSelectionDragStart={handleSelectionDragStart}
                    onMoveSelectionToChunk={(chunkId, nodeIds) => handleMoveSelectionToChunk(chunkId, nodeIds)}
                    chunkComments={chunkCommentsMap}
                    onAddComment={(chunkId, message) => handleAddComment("chunk", chunkId, message)}
                    onDeleteComment={handleDeleteComment}
                    onToggleCommentResolved={handleToggleCommentResolved}
                    onFocusComment={handleCommentFocus}
                    onCreateChunkFromSelection={handleCreateChunkFromSelection}
                    focusedChunkId={focusedChunkId}
                    onFocusChunk={(chunkId) => handleFocusChunk(chunkId, { drillIntoNodes: true })}
                  />
                ) : null}
                {leftSidebarTab === "issues" ? (
                  <OpenIssuesPanel
                    comments={comments}
                    filter={commentFilter}
                    onFilterChange={setCommentFilter}
                    onSelectComment={handleCommentFocus}
                    onToggleResolved={handleToggleCommentResolved}
                    onDeleteComment={handleDeleteComment}
                  />
                ) : null}
              </div>
            ) : null}
            <div className="order-first flex-1 space-y-5 xl:order-none">
              <FlowCanvas
                nodes={nodesForCanvas}
                edges={edgesForCanvas}
                onNodesChange={handleNodesChangeWrapped}
                onEdgesChange={handleEdgesChangeWrapped}
                onConnect={handleConnect}
                onInit={(instance) => setReactFlowInstance(instance)}
                onNodeSelect={(node) => {
                  if (node.type === "chunkNode") {
                    const chunkData = node.data as ChunkNodeData;
                    setSingleNodeSelection(null);
                    setSingleEdgeSelection(null);
                    setSelectedStepNodeId(null);
                    setSelectedChunkId(chunkData.chunkId);
                    return;
                  }
                  if (node.type === "stepNode") {
                    const stepData = node.data as StepNodeRenderData;
                    setSingleNodeSelection(stepData.parentNodeId);
                    setSelectedStepNodeId(node.id);
                    setSingleEdgeSelection(null);
                    ensureNodeStepsExpanded(stepData.parentNodeId);
                    setInspectorCollapsed(false);
                    setInspectorTabRequest({ tab: "basics", nonce: Date.now() });
                  } else {
                    setSingleNodeSelection(node.id);
                    setSingleEdgeSelection(null);
                    setSelectedStepNodeId(null);
                  }
                  setSelectedChunkId(null);
                }}
                onEdgeSelect={(edgeId) => {
                  setSingleEdgeSelection(edgeId);
                  setSingleNodeSelection(null);
                  setSelectedStepNodeId(null);
                }}
                onCanvasClear={handleCanvasClear}
                nodeIssueMap={nodeIssueMap}
                observedEnabled={observedEnabled}
                observedNodeStats={observedNodeStatsMap}
                disabled={flowsTabDisabled}
                wrapperRef={canvasWrapperRef}
                onCanvasDragOver={handleCanvasDragOver}
                onCanvasDrop={handleCanvasDrop}
                onAutoLayout={handleAutoLayout}
                primaryHeaderActions={canvasPrimaryActions}
                extraHeader={canvasHeaderActions}
                onEdgeUpdate={handleEdgeUpdate}
                nodeStepAvailability={nodeStepAvailability}
                nodeCanExpandSteps={nodeCanExpandSteps}
                autoLayoutRunning={autoLayoutRunning}
                viewMode={viewMode}
                autoLayoutDisabled={viewMode === "chunks"}
                onSelectionChange={handleSelectionChange}
                nodeCommentCounts={nodeCommentCountMap}
                onNodeDoubleClick={handleNodeDoubleClick}
                onRequestNodeSteps={(nodeId) => handleRequestExpandSteps(nodeId)}
                highlightNodeIds={activeHighlightNodeIdSet}
                dimmedNodeIds={activeDimmedNodeIdSet}
              />
            </div>
      {!inspectorCollapsed ? (
        <div className="w-full space-y-3 xl:w-[360px]">
          {diagnosticsBannerVisible ? (
            <div className="rounded-3xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-xs text-[var(--omni-muted)] shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between gap-2">
                <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]", diagnostics.length ? "bg-amber-200/90 text-amber-800" : "bg-emerald-100 text-emerald-700")}>
                  {diagnostics.length ? `${diagnostics.length} avertizari` : "Fara avertizari"}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">Inspector</span>
              </div>
              <p className="mt-1 text-[11px]">Deschide tab-ul „Diagnostics” pentru detalii și export audit.</p>
            </div>
          ) : null}
          <InspectorPanel
                  diagnostics={diagnostics}
                  onSelectIssue={handleSelectIssue}
                  missingManifestNodes={missingManifestNodes}
                  onSelectMissingManifestNode={handleSelectMissingManifestNode}
                  flowStats={flowStats}
                  stepsExpanded={stepsExpanded}
                  onToggleSteps={toggleSelectedNodeSteps}
                  stepStatus={selectedNodeStepStatus}
                  canFixRouteMapping={canFixSelectedNode}
                  onFixRouteMapping={handleFixSelectedNodeRoute}
                  stepFixError={stepFixError}
                  currentManifest={currentStepManifest}
                  routeMap={routeMap}
                  copyDraft={copyDraft}
                  onCopyFieldChange={handleCopyFieldChange}
                  onSaveCopy={handleSaveCopyOverrides}
                  copyLoading={copyLoading}
                  copyError={copyError}
                  setCopyError={setCopyError}
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  onLabelChange={handleNodeLabelChange}
                  onNodeTagsChange={handleNodeTagsChange}
                  onPortalChange={handleNodePortalChange}
                onEdgeFieldChange={handleEdgeFieldChange}
                onApplyEdgeColorToGroup={handleApplyEdgeColorToGroup}
                observedEnabled={observedEnabled}
                observedEvents={observedEventsForSelection}
                debugInfo={selectedNodeDebugInfo}
                selectedStepDetails={selectedStepDetails}
                onCollapse={() => setInspectorCollapsed(true)}
                  chunks={chunks}
                  defaultChunkId={UNGROUPED_CHUNK_ID}
                  onNodeChunkChange={handleNodeChunkChange}
                  onAutoAssignChunks={handleAutoAssignChunks}
                  nodeComments={selectedNodeComments}
                  routeOptions={routes}
                  portalNodeOptions={portalNodeOptions}
                  onAddNodeComment={(message) => {
                    if (selectedNode) {
                      handleAddComment("node", selectedNode.id, message);
                    }
                  }}
                  onDeleteNodeComment={handleDeleteComment}
                  onToggleNodeCommentResolved={handleToggleCommentResolved}
                  onExportAuditSnapshot={handleExportAuditSnapshot}
                  overlays={overlays}
                  selectedOverlayId={selectedOverlayId}
                  onSelectOverlay={handleOverlaySelectChange}
                  onCreateOverlay={handleCreateOverlay}
                  onDeleteOverlay={handleDeleteOverlay}
                  onOverlayMetadataChange={handleOverlayMetadataChange}
                  onOverlayAddNodes={handleOverlayAddNodes}
                  onOverlayRemoveStep={handleOverlayRemoveStep}
                  onOverlayReorderSteps={handleOverlayReorderSteps}
                  onOverlayStepUpdate={handleOverlayStepUpdate}
                  onRepairOverlaySteps={handleRepairSelectedOverlaySteps}
                  onOverlayStepFocus={handleOverlayStepFocus}
                  selectedNodeIds={selectedNodeIds}
                  nodeLabelMap={nodeLabelMap}
                  overlayTabRequest={inspectorTabRequest}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      {commandPaletteOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-16"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[var(--omni-border-soft)] bg-white p-4 text-sm shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">Command palette</p>
              <button
                type="button"
                className="text-[10px] uppercase text-[var(--omni-muted)] underline"
                onClick={() => setCommandPaletteOpen(false)}
              >
                Închide
              </button>
            </div>
            <input
              type="text"
              className="mt-3 w-full rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 text-sm text-[var(--omni-ink)]"
              placeholder="Tastează o comandă (Ctrl+K)"
              value={commandSearch}
              onChange={(event) => setCommandSearch(event.target.value)}
              autoFocus
            />
            <ul className="mt-3 max-h-64 overflow-y-auto space-y-1">
              {filteredCommandActions.length ? (
                filteredCommandActions.map((action) => (
                  <li key={action.id}>
                    <button
                      type="button"
                      className={clsx(
                        "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition",
                        action.disabled
                          ? "cursor-not-allowed border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)]"
                          : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]",
                      )}
                      onClick={() => {
                        if (action.disabled) return;
                        action.run();
                      }}
                      disabled={action.disabled}
                      >
                        <span className="flex items-center gap-2">
                          <span>{action.icon}</span>
                          {action.label}
                        </span>
                      {action.disabled ? (
                        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">Indisponibil</span>
                      ) : null}
                    </button>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] px-3 py-2 text-sm text-[var(--omni-muted)]">
                  Nicio comandă găsită.
                </li>
              )}
            </ul>
          </div>
        </div>
      ) : null}
      {portalCreatorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 text-sm shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Portal</p>
                <h2 className="text-xl font-semibold text-[var(--omni-ink)]">Adaugă portal</h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold text-[var(--omni-muted)]"
                onClick={handleClosePortalCreator}
              >
                Închide
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                Label portal
                <input
                  type="text"
                  className="rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm text-[var(--omni-ink)]"
                  placeholder="PORTAL: To Today"
                  value={portalDraft.label}
                  onChange={(event) => setPortalDraft((prev) => ({ ...prev, label: event.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                Ruta țintă
                <select
                  className="rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm text-[var(--omni-ink)]"
                  value={portalDraft.targetRouteId}
                  onChange={(event) => setPortalDraft((prev) => ({ ...prev, targetRouteId: event.target.value }))}
                >
                  <option value="">Selectează route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.routePath}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                Chunk
                <select
                  className="rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm text-[var(--omni-ink)]"
                  value={portalDraft.chunkId}
                  onChange={(event) => setPortalDraft((prev) => ({ ...prev, chunkId: event.target.value }))}
                >
                  {chunks.map((chunk) => (
                    <option key={chunk.id} value={chunk.id}>
                      {chunk.title}
                    </option>
                  ))}
                </select>
              </label>
              {portalError ? <p className="text-xs font-semibold text-rose-600">{portalError}</p> : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-4 py-2 text-xs font-semibold text-[var(--omni-muted)]"
                onClick={handleClosePortalCreator}
              >
                Renunță
              </button>
              <button
                type="button"
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold text-white",
                  portalDraft.targetRouteId ? "bg-[var(--omni-ink)]" : "bg-[var(--omni-muted)]/60 cursor-not-allowed",
                )}
                disabled={!portalDraft.targetRouteId}
                onClick={handleCreatePortalFromDraft}
              >
                Creează portal
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {importModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 text-sm shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Import spec</p>
                <h2 className="text-xl font-semibold text-[var(--omni-ink)]">Lipeste JSON-ul exportat</h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold"
                onClick={handleCloseImportModal}
              >
                Inchide
              </button>
            </div>
            <textarea
              className="mt-4 h-48 w-full rounded-2xl border border-[var(--omni-border-soft)] bg-white px-3 py-2 font-mono text-xs text-[var(--omni-ink)]"
              placeholder='{ "flow": { ... }, "nodes": [], "edges": [] }'
              value={importSpecText}
              onChange={(event) => setImportSpecText(event.target.value)}
            />
            {importSpecError ? <p className="mt-2 text-xs text-rose-400">{importSpecError}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold"
                onClick={handleValidateImportSpec}
              >
                Valideaza spec
              </button>
              <button
                type="button"
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold text-white",
                  importSpecPreview ? "bg-[var(--omni-ink)]" : "bg-[var(--omni-border-soft)] opacity-60",
                )}
                disabled={!importSpecPreview}
                onClick={handleApplyImportSpec}
              >
                Aplica importul
              </button>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--omni-border-soft)]"
                  checked={importUpdateCurrent}
                  onChange={(event) => setImportUpdateCurrent(event.target.checked)}
                  disabled={!selectedFlowId}
                />
                Actualizeaza map curent
              </label>
              {!selectedFlowId ? <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">Nu este selectat niciun map</span> : null}
            </div>
            {importSpecPreview ? (
              <div className="mt-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3 text-xs text-[var(--omni-muted)]">
                <p className="font-semibold text-[var(--omni-ink)]">Previzualizare</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <span className="rounded-full bg-slate-900/10 px-2 py-0.5">Map: {importSpecPreview.flow.name ?? "-"}</span>
                  <span className="rounded-full bg-slate-900/10 px-2 py-0.5">Noduri: {importSpecPreview.nodes.length}</span>
                  <span className="rounded-full bg-slate-900/10 px-2 py-0.5">Tranzitii: {importSpecPreview.edges.length}</span>
                </div>
                {importSpecPreview.warnings.length ? (
                  <div className="mt-3 space-y-1 rounded-xl border border-amber-500/40 bg-amber-900/20 p-3 text-amber-100">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em]">Avertizari</p>
                    <ul className="list-disc pl-4">
                      {importSpecPreview.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-xs text-[var(--omni-muted)]">Lipeste un spec valid si apasa &quot;Valideaza&quot; pentru a vedea sumarul.</p>
            )}
          </div>
        </div>
      ) : null}
      {autosaveToast ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={clsx(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl",
              autosaveToast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900",
            )}
          >
            <span>{autosaveToast.message}</span>
            <button
              type="button"
              className="rounded-full border border-white/40 px-2 py-0.5 text-xs uppercase tracking-wide"
              onClick={handleDismissAutosaveToast}
            >
              Închide
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function serializeChunkForSave(chunk: FlowChunk, order: number): FlowChunk {
  const entry: FlowChunk = {
    id: chunk.id,
    title: chunk.title ?? "Chunk",
    order,
  };
  if (typeof chunk.color === "string") {
    entry.color = chunk.color;
  }
  if (typeof chunk.collapsedByDefault === "boolean") {
    entry.collapsedByDefault = chunk.collapsedByDefault;
  }
  if (chunk.meta) {
    const cleanedMeta = stripUndefinedDeep(chunk.meta);
    if (cleanedMeta && Object.keys(cleanedMeta).length) {
      entry.meta = cleanedMeta;
    }
  }
  return entry;
}

const LEGACY_RECOMMENDATION_CHUNK_IDS = new Set(["recommendation", "ch06_recommendation"]);

function migrateLegacyWorldAssignment(
  chunkId: string | null | undefined,
  tags: string[],
): { chunkId: string | null | undefined; tags: string[] } {
  if (!chunkId) return { chunkId, tags };
  const normalized = chunkId.toLowerCase();
  if (!LEGACY_RECOMMENDATION_CHUNK_IDS.has(normalized)) {
    return { chunkId, tags };
  }
  const nextChunkId = chunkId.startsWith("CH") ? "CH05_daily_loop" : "daily_loop";
  const nextTags = tags.includes("engine:recommendation") ? tags : [...tags, "engine:recommendation"];
  return { chunkId: nextChunkId, tags: nextTags };
}

function buildFlowNode(stored: FlowNode, routeMap: Map<string, RouteDoc>, routeByPath: Map<string, RouteDoc>): ReactFlowNode<FlowNodeData> {
  let route = routeMap.get(stored.routeId);
  let routeMismatch = false;
  const fallbackPathCandidate = stored.routeId;
  if (!route) {
    const fallbackRoute = routeByPath.get(fallbackPathCandidate);
    if (fallbackRoute) {
      route = fallbackRoute;
    } else if (routeMap.size) {
      routeMismatch = true;
      console.warn("Flow Studio: route not found for stored node", stored.routeId);
    }
  }
  const routePath = stored.routePath ?? route?.routePath ?? fallbackPathCandidate;
  const rawTags = Array.isArray(stored.tags) ? [...stored.tags] : [];
  const migration = migrateLegacyWorldAssignment(stored.chunkId, rawTags);
  const resolvedChunkId = migration.chunkId ?? stored.chunkId;
  const normalizedChunkId = resolvedChunkId ?? UNGROUPED_CHUNK_ID;
  return {
    id: stored.id,
    type: "flowNode",
    position: { x: stored.x ?? DEFAULT_NODE_POSITION.x, y: stored.y ?? DEFAULT_NODE_POSITION.y },
    data: {
      routeId: route?.id ?? stored.routeId,
      routePath,
      filePath: route?.filePath ?? "",
      screenId: getScreenIdForRoute(routePath),
      labelOverrides: stored.label ?? {},
      tags: migration.tags,
      routeMismatch,
      chunkId: normalizedChunkId,
      portal: stored.portal ?? null,
    },
  };
}

function buildFlowEdge(edge: FlowEdge): Edge<FlowEdgeData> {
  return {
    id: edge.id,
    source: edge.from,
    target: edge.to,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    data: {
      labelOverrides: edge.label,
      conditionTag: edge.conditionTag,
      eventName: edge.eventName,
      color: edge.color,
      command: edge.command,
    },
    label: edge.label?.ro ?? edge.label?.en ?? edge.conditionTag ?? "",
  };
}

function applyRouteMapping(node: ReactFlowNode<FlowNodeData>, route: RouteDoc): ReactFlowNode<FlowNodeData> {
  return {
    ...node,
    data: {
      ...node.data,
      routeId: route.id,
      routePath: route.routePath,
      filePath: route.filePath ?? "",
      screenId: getScreenIdForRoute(route.routePath),
      routeMismatch: false,
    },
  };
}

function computeFlowStats(nodes: ReactFlowNode<FlowNodeData>[], edges: Edge<FlowEdgeData>[]): FlowStats {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const startNodeIds = nodes.filter((node) => node.data.tags?.includes("start")).map((node) => node.id);
  const hasExplicitStart = startNodeIds.length > 0;
  const incomingCounts = new Map<string, number>();
  edges.forEach((edge) => {
    incomingCounts.set(edge.target, (incomingCounts.get(edge.target) ?? 0) + 1);
  });
  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  });
  let seedIds = startNodeIds;
  if (!seedIds.length) {
    seedIds = nodes.filter((node) => (incomingCounts.get(node.id) ?? 0) === 0).map((node) => node.id);
  }
  if (!seedIds.length && nodes.length) {
    seedIds = [nodes[0].id];
  }
  const visited = new Set<string>();
  const queue = [...seedIds];
  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const neighbors = adjacency.get(current);
    if (neighbors) {
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }
  }
  const orphanCount = nodes.reduce((count, node) => {
    const connected = edges.some((edge) => edge.source === node.id || edge.target === node.id);
    return connected ? count : count + 1;
  }, 0);
  const unreachableCount = nodeCount ? Math.max(nodeCount - visited.size, 0) : 0;
  return { nodeCount, edgeCount, orphanCount, unreachableCount, hasExplicitStart };
}


type StepRenderMeta = {
  manifestNode: StepManifest["nodes"][number];
  position: XYPosition;
};

type StepRenderData = {
  nodes: ReactFlowNode<StepNodeRenderData>[];
  edges: Edge<FlowEdgeData>[];
  meta: Map<string, StepRenderMeta>;
};

function buildStepRenderData(manifest: StepManifest, hostNode: ReactFlowNode<FlowNodeData>): StepRenderData {
  const nodes: ReactFlowNode<StepNodeRenderData>[] = [];
  const edges: Edge<FlowEdgeData>[] = [];
  const meta = new Map<string, StepRenderMeta>();
  manifest.nodes.forEach((stepNode, index) => {
    const id = buildStepNodeReactId(hostNode.id, stepNode.id);
    const position = {
      x: hostNode.position.x + STEP_NODE_HORIZONTAL_OFFSET,
      y: hostNode.position.y + index * STEP_NODE_VERTICAL_GAP,
    };
    meta.set(id, { manifestNode: stepNode, position });
    nodes.push({
      id,
      type: "stepNode",
      position,
      data: { type: "step", stepId: stepNode.id, parentNodeId: hostNode.id, label: stepNode.label },
      draggable: false,
      selectable: true,
      connectable: false,
    });
  });
  manifest.edges.forEach((edge) => {
    const sourceId = buildStepNodeReactId(hostNode.id, edge.source);
    const targetId = buildStepNodeReactId(hostNode.id, edge.target);
    if (!meta.has(sourceId) || !meta.has(targetId)) return;
    edges.push({
      id: `${hostNode.id}-step-edge-${edge.id}`,
      source: sourceId,
      target: targetId,
      type: "smoothstep",
      label: edge.label,
      style: { stroke: "#475569", strokeDasharray: "6 3" },
      data: {},
    });
  });
  return { nodes, edges, meta };
}

function buildStepNodeReactId(hostNodeId: string, stepId: string) {
  return `step:${hostNodeId}:${stepId}`;
}

function parseStepNodeReactId(nodeId: string): { hostNodeId: string; stepId: string } | null {
  if (!nodeId.startsWith("step:")) return null;
  const [, hostNodeId, stepId] = nodeId.split(":");
  if (!hostNodeId || !stepId) return null;
  return { hostNodeId, stepId };
}

function computeStepDiagnostics(manifest: StepManifest, hostNodeId: string): FlowIssue[] {
  const issues: FlowIssue[] = [];
  const startStepId = manifest.startNodeId ?? manifest.nodes[0]?.id ?? null;
  const adjacency = new Map<string, string[]>();
  manifest.edges.forEach((edge) => {
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  });
  if (!startStepId) {
    issues.push({
      id: `${hostNodeId}-step-no-start`,
      message: "Step flow missing explicit start",
      severity: "warning",
      targetType: "stepNode",
      targetId: buildStepNodeReactId(hostNodeId, manifest.nodes[0]?.id ?? "unknown"),
    });
    return issues;
  }
  const reachable = new Set<string>();
  const queue = [startStepId];
  while (queue.length) {
    const current = queue.shift();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    const neighbors = adjacency.get(current);
    if (neighbors) {
      neighbors.forEach((neighbor) => {
        if (!reachable.has(neighbor)) queue.push(neighbor);
      });
    }
  }
  manifest.nodes.forEach((node) => {
    if (!reachable.has(node.id)) {
      issues.push({
        id: `${hostNodeId}-step-unreachable-${node.id}`,
        message: `Step "${node.label}" unreachable`,
        severity: "warning",
        targetType: "stepNode",
        targetId: buildStepNodeReactId(hostNodeId, node.id),
      });
    }
  });
  const terminalIds = new Set(manifest.terminalNodeIds ?? []);
  if (!terminalIds.size) {
    manifest.nodes.forEach((node) => {
      const outgoing = adjacency.get(node.id)?.length ?? 0;
      if (outgoing === 0 && node.id !== startStepId) {
        terminalIds.add(node.id);
      }
    });
  }
  manifest.nodes.forEach((node) => {
    const outgoing = adjacency.get(node.id)?.length ?? 0;
    const isTerminal = terminalIds.has(node.id);
    if (!isTerminal && outgoing === 0) {
      issues.push({
        id: `${hostNodeId}-step-deadend-${node.id}`,
        message: `Step "${node.label}" has no exit`,
        severity: "warning",
        targetType: "stepNode",
        targetId: buildStepNodeReactId(hostNodeId, node.id),
      });
    }
  });
  return issues;
}
