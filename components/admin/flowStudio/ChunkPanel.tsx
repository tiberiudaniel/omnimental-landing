"use client";

import { useEffect, useMemo, useState, type DragEvent as ReactDragEvent } from "react";
import clsx from "clsx";
import type { FlowChunk, FlowComment } from "@/lib/flowStudio/types";
import type { ChunkCounts } from "@/lib/flowStudio/chunkUtils";

export const CHUNK_SELECTION_MIME = "application/x-flow-node-selection";

type ChunkPanelProps = {
  chunks: FlowChunk[];
  countsByChunk: Map<string, ChunkCounts>;
  onAddChunk: () => void;
  onSeedCanonicalChunks: () => void;
  onSyncCanonicalChunks: () => void;
  onImportChunks: (payload: string) => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
  onPreviewAutoAssign: () => void;
  onUpdateChunk: (chunkId: string, updates: Partial<FlowChunk>) => void;
  onDeleteChunk: (chunkId: string) => void;
  onMoveChunk: (chunkId: string, direction: "up" | "down") => void;
  onSelectChunk: (chunkId: string | null) => void;
  selectedChunkId: string | null;
  disabled: boolean;
  defaultChunkId: string;
  onClearFocus: () => void;
  focusActive: boolean;
  selectedNodeIds: string[];
  onSelectionDragStart: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onMoveSelectionToChunk: (chunkId: string, nodeIds?: string[]) => void;
  chunkComments: Map<string, FlowComment[]>;
  onAddComment: (chunkId: string, message: string) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleCommentResolved: (commentId: string) => void;
  onFocusComment: (comment: FlowComment) => void;
  onCreateChunkFromSelection: () => void;
  focusedChunkId: string | null;
  onFocusChunk: (chunkId: string) => void;
};

export function ChunkPanel({
  chunks,
  countsByChunk,
  onAddChunk,
  onUpdateChunk,
  onDeleteChunk,
  onMoveChunk,
  onSelectChunk,
  selectedChunkId,
  disabled,
  defaultChunkId,
  onClearFocus,
  focusActive,
  selectedNodeIds,
  onSelectionDragStart,
  onMoveSelectionToChunk,
  chunkComments,
  onAddComment,
  onDeleteComment,
  onToggleCommentResolved,
  onFocusComment,
  onCreateChunkFromSelection,
  onSeedCanonicalChunks,
  onSyncCanonicalChunks,
  onPreviewAutoAssign,
  onImportChunks,
  focusedChunkId,
  onFocusChunk,
}: ChunkPanelProps) {
  const [expandedCommentsChunk, setExpandedCommentsChunk] = useState<string | null>(null);
  const [activeDropChunk, setActiveDropChunk] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [seedConfirmInput, setSeedConfirmInput] = useState("");
  const [importPayload, setImportPayload] = useState("");
  const [importFeedback, setImportFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  useEffect(() => {
    if (!advancedOpen) {
      setImportPanelOpen(false);
      setSeedConfirmOpen(false);
      setSeedConfirmInput("");
    }
  }, [advancedOpen]);
  const formatMetaText = (value?: { ro?: string; en?: string }) => {
    if (!value) return "";
    if (typeof value.ro === "string" && value.ro.trim()) return value.ro;
    if (typeof value.en === "string" && value.en.trim()) return value.en;
    return "";
  };
  const META_TEXT_FIELDS: Array<{ key: "target" | "challenge" | "reward" | "proof" | "exitGate"; label: string }> = [
    { key: "target", label: "Țintă" },
    { key: "challenge", label: "Provocare" },
    { key: "reward", label: "Câștig" },
    { key: "proof", label: "Dovadă" },
    { key: "exitGate", label: "Exit Gate" },
  ];

  const selectedNodeCount = selectedNodeIds.length;
  const chunkColorMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    chunks.forEach((chunk) => {
      map.set(chunk.id, chunk.color);
    });
    return map;
  }, [chunks]);

  const handleChunkCommentSubmit = (chunkId: string) => {
    const draft = commentDrafts[chunkId]?.trim();
    if (!draft) return;
    onAddComment(chunkId, draft);
    setCommentDrafts((prev) => ({ ...prev, [chunkId]: "" }));
  };
  const totalWorlds = chunks.length;
  const totalNodes = Array.from(countsByChunk.values()).reduce((sum, entry) => sum + (entry?.total ?? 0), 0);
  const totalStarts = Array.from(countsByChunk.values()).reduce((sum, entry) => sum + (entry?.start ?? 0), 0);

  const handleDropOnChunk = (chunkId: string, event: ReactDragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(CHUNK_SELECTION_MIME)) return;
    event.preventDefault();
    setActiveDropChunk(null);
    const payload = event.dataTransfer.getData(CHUNK_SELECTION_MIME);
    let nodeIds: string[] | undefined;
    try {
      const parsed = JSON.parse(payload);
      if (Array.isArray(parsed)) {
        nodeIds = parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      nodeIds = undefined;
    }
    onMoveSelectionToChunk(chunkId, nodeIds);
  };

  const handleImportSubmit = async () => {
    if (!importPayload.trim()) {
      setImportFeedback({ status: "error", message: "Introdu payload-ul JSON pentru import." });
      return;
    }
    setImportFeedback(null);
    setImportLoading(true);
    try {
      const result = await Promise.resolve(onImportChunks(importPayload));
      if (result?.ok) {
        setImportPayload("");
        setImportFeedback({ status: "success", message: "World-urile au fost importate." });
      } else {
        setImportFeedback({
          status: "error",
          message: result?.error ?? "Importul a eșuat. Verifică payload-ul.",
        });
      }
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <>
      <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4 shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Worlds</p>
          <p className="text-sm text-[var(--omni-muted)]">Organizează experiența în worlds coerente.</p>
          <div className="mt-2 flex gap-2 text-[11px] text-[var(--omni-muted)]">
            <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold text-[var(--omni-ink)]">🌐 {totalWorlds} worlds</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold text-[var(--omni-ink)]">🧩 {totalNodes} nodes</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 font-semibold text-[var(--omni-ink)]">🚀 {totalStarts} start</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={clsx(
              "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold",
              selectedNodeCount ? "" : "opacity-60",
            )}
            onClick={onCreateChunkFromSelection}
            disabled={!selectedNodeCount}
          >
            Creează world din selecție
          </button>
          <button
            type="button"
            className={clsx(
              "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold",
              disabled ? "cursor-not-allowed opacity-50" : "",
            )}
            onClick={onAddChunk}
            disabled={disabled}
          >
            Adaugă world
          </button>
          <button
            type="button"
            className={clsx(
              "rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-xs font-semibold",
              disabled ? "cursor-not-allowed opacity-50" : "",
            )}
            onClick={() => {
              if (disabled) return;
              setAdvancedOpen((prev) => !prev);
            }}
            disabled={disabled}
          >
            {advancedOpen ? "Ascunde advanced" : "Advanced actions"}
          </button>
        </div>
      </div>
      {advancedOpen ? (
        <div className="mt-3 space-y-3 rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white/80 p-3 text-xs">
          <p className="font-semibold text-[var(--omni-ink)]">Advanced / Dangerous actions</p>
          <p className="text-[var(--omni-muted)]">Aceste acțiuni pot rescrie Worlds sau pot importa structuri externe. Continuă doar dacă ești sigur.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={clsx(
                "rounded-full border border-rose-300 px-3 py-1 font-semibold text-rose-600",
                disabled ? "cursor-not-allowed opacity-50" : "",
              )}
              onClick={() => {
                if (disabled) return;
                setSeedConfirmInput("");
                setSeedConfirmOpen(true);
              }}
              disabled={disabled}
            >
              Seed Worlds v1
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                disabled ? "cursor-not-allowed opacity-50" : "",
              )}
              onClick={() => {
                if (disabled) return;
                onSyncCanonicalChunks();
              }}
              disabled={disabled}
            >
              Sync Worlds (Overwrite)
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                disabled ? "cursor-not-allowed opacity-50" : "",
              )}
              onClick={() => {
                if (disabled) return;
                onPreviewAutoAssign();
              }}
              disabled={disabled}
            >
              Preview auto-assign
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                disabled ? "cursor-not-allowed opacity-50" : "",
              )}
              onClick={() => setImportPanelOpen((prev) => !prev)}
              disabled={disabled}
            >
              {importPanelOpen ? "Ascunde import" : "Import Worlds JSON"}
            </button>
          </div>
          {importPanelOpen ? (
            <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white/70 p-3">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                Payload JSON
              </label>
              <textarea
                className="mt-2 w-full rounded-xl border border-[var(--omni-border-soft)] bg-white/80 p-3 text-xs font-mono"
                rows={4}
                value={importPayload}
                onChange={(event) => setImportPayload(event.target.value)}
                placeholder='{"version":"chunks-v1","chunks":[...]}'
                disabled={disabled || importLoading}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  className={clsx(
                    "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                    disabled ? "cursor-not-allowed opacity-50" : "",
                  )}
                  onClick={handleImportSubmit}
                  disabled={disabled || importLoading}
                >
                  {importLoading ? "Import..." : "Aplică import"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 font-semibold"
                  onClick={() => {
                    setImportPayload("");
                    setImportFeedback(null);
                  }}
                  disabled={importLoading}
                >
                  Curăță
                </button>
                {importFeedback ? (
                  <span
                    className={clsx(
                      "text-xs font-semibold",
                      importFeedback.status === "success" ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {importFeedback.message}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          className={clsx(
            "rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
            selectedNodeCount ? "bg-white" : "opacity-60",
          )}
          draggable={Boolean(selectedNodeCount)}
          onDragStart={onSelectionDragStart}
          disabled={!selectedNodeCount}
        >
          Selecție: {selectedNodeCount} noduri
        </button>
        {focusActive ? (
          <button
            type="button"
            className="rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold"
            onClick={onClearFocus}
          >
            Clear World Focus
          </button>
        ) : null}
      </div>
      {disabled ? (
        <p className="mt-4 text-xs text-[var(--omni-muted)]">Selectează un map pentru a edita worlds.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {chunks.map((chunk, index) => {
            const stats = countsByChunk.get(chunk.id) ?? { total: 0, start: 0, unreachable: 0 };
            const isDefault = chunk.id === defaultChunkId;
            const canMoveUp = index > 1;
            const canMoveDown = index < chunks.length - 1;
            const commentsForChunk = chunkComments.get(chunk.id) ?? [];
            const commentDraft = commentDrafts[chunk.id] ?? "";
            const isExpanded = expandedCommentsChunk === chunk.id;
            const isDropActive = activeDropChunk === chunk.id;
            const meta = chunk.meta;
            const isFocused = focusedChunkId === chunk.id;
            return (
              <li key={chunk.id}>
                <div
                  className={clsx(
                    "space-y-3 rounded-2xl border px-4 py-3 transition",
                    selectedChunkId === chunk.id ? "border-[var(--omni-energy)] bg-white" : "border-[var(--omni-border-soft)] bg-white/70",
                    isDropActive ? "ring-2 ring-[var(--omni-energy)]" : "",
                  )}
                  onClick={() => onSelectChunk(selectedChunkId === chunk.id ? null : chunk.id)}
                  onDragOver={(event) => {
                    if (!event.dataTransfer.types.includes(CHUNK_SELECTION_MIME)) return;
                    event.preventDefault();
                    setActiveDropChunk(chunk.id);
                  }}
                  onDragLeave={() => {
                    if (activeDropChunk === chunk.id) {
                      setActiveDropChunk(null);
                    }
                  }}
                  onDrop={(event) => handleDropOnChunk(chunk.id, event)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input
                      type="text"
                      className="flex-1 rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
                      value={chunk.title}
                      onChange={(event) => onUpdateChunk(chunk.id, { title: event.target.value })}
                      disabled={disabled}
                      onClick={(event) => event.stopPropagation()}
                    />
                    <input
                      type="color"
                      className="h-10 w-16 cursor-pointer rounded-xl border border-[var(--omni-border-soft)]"
                      value={chunk.color ?? chunkColorMap.get(chunk.id) ?? "#94a3b8"}
                      onChange={(event) => onUpdateChunk(chunk.id, { color: event.target.value })}
                      disabled={disabled}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--omni-muted)]">
                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5 font-semibold text-[var(--omni-ink)]">Total: {stats.total}</span>
                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5">Start: {stats.start}</span>
                    <span className="rounded-full bg-slate-900/5 px-2 py-0.5">Neatinse: {stats.unreachable}</span>
                    {commentsForChunk.length ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[var(--omni-ink)]">💬 {commentsForChunk.length}</span>
                    ) : null}
                    {isDefault ? (
                      <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[var(--omni-ink)]">World implicit</span>
                    ) : null}
                  </div>
                  {selectedChunkId === chunk.id ? (
                    <div
                      className="rounded-xl border border-dashed border-[var(--omni-border-soft)] bg-white/80 px-3 py-3 text-xs"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {meta ? (
                        <>
                          <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                            <span>
                              Tier min:{" "}
                              <span className="font-semibold text-[var(--omni-ink)]">{meta.tierMin ?? "—"}</span>
                            </span>
                            <span>
                              Meniu:{" "}
                              <span className="font-semibold text-[var(--omni-ink)]">{meta.menuState ?? "—"}</span>
                            </span>
                          </div>
                          <dl className="mt-2 space-y-2 text-[13px] text-[var(--omni-ink)]">
                            {META_TEXT_FIELDS.map(({ key, label }) => {
                              const textEntry = meta ? (meta[key] as { ro?: string; en?: string } | undefined) : undefined;
                              const value = formatMetaText(textEntry);
                              return (
                                <div key={key}>
                                  <dt className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">{label}</dt>
                                  <dd>{value || "—"}</dd>
                                </div>
                              );
                            })}
                          </dl>
                          {meta.description ? (
                            <div className="mt-2">
                              <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Descriere</p>
                              <p className="text-[13px] text-[var(--omni-ink)]">{formatMetaText(meta.description) || "—"}</p>
                            </div>
                          ) : null}
                          {Array.isArray(meta.routeGroups) && meta.routeGroups.length ? (
                            <p className="mt-2 text-[11px] text-[var(--omni-muted)]">
                              Route groups:{" "}
                              <span className="font-semibold text-[var(--omni-ink)]">{meta.routeGroups.join(", ")}</span>
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-[11px] text-[var(--omni-muted)]">Nu există metadata pentru acest world.</p>
                      )}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full border px-3 py-1 font-semibold",
                        isFocused ? "border-sky-500 bg-sky-50 text-sky-800" : "border-[var(--omni-border-soft)]",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (isFocused) {
                          onClearFocus();
                        } else {
                          onFocusChunk(chunk.id);
                        }
                      }}
                      >
                        {isFocused ? "World focused" : "Focus world"}
                    </button>
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                        !canMoveUp ? "cursor-not-allowed opacity-50" : "",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canMoveUp) onMoveChunk(chunk.id, "up");
                      }}
                      disabled={!canMoveUp}
                    >
                      Mută sus
                    </button>
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                        !canMoveDown ? "cursor-not-allowed opacity-50" : "",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canMoveDown) onMoveChunk(chunk.id, "down");
                      }}
                      disabled={!canMoveDown}
                    >
                      Mută jos
                    </button>
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-500",
                        isDefault ? "cursor-not-allowed opacity-40" : "",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isDefault) onDeleteChunk(chunk.id);
                      }}
                      disabled={isDefault}
                    >
                      Șterge
                    </button>
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full border border-dashed border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                        selectedNodeCount ? "" : "opacity-60",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        onMoveSelectionToChunk(chunk.id);
                      }}
                      disabled={!selectedNodeCount}
                    >
                      Mută selecția aici
                    </button>
                    <button
                      type="button"
                      className={clsx(
                        "rounded-full border border-[var(--omni-border-soft)] px-3 py-1 font-semibold",
                        commentsForChunk.length ? "text-[var(--omni-ink)]" : "text-[var(--omni-muted)]",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        setExpandedCommentsChunk(isExpanded ? null : chunk.id);
                      }}
                    >
                      Note ({commentsForChunk.length})
                    </button>
                  </div>
                  {isExpanded ? (
                    <div className="space-y-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white/70 p-3 text-[12px]">
                      {commentsForChunk.length ? (
                        <ul className="space-y-2">
                          {commentsForChunk.map((comment) => {
                            const createdAt = comment.createdAt ? new Date(comment.createdAt) : null;
                            return (
                              <li key={comment.id} className="rounded-xl border border-[var(--omni-border-soft)] bg-white p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-[var(--omni-ink)]">{comment.author ?? "Anonim"}</p>
                                  <div className="flex items-center gap-2 text-[10px] text-[var(--omni-muted)]">
                                    {createdAt ? createdAt.toLocaleString("ro-RO", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : null}
                                    <button
                                      type="button"
                                      className="rounded-full border border-dashed border-[var(--omni-border-soft)] px-2 py-0.5"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onFocusComment(comment);
                                      }}
                                    >
                                      Deschide
                                    </button>
                                  </div>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-[var(--omni-ink)]">{comment.message}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                                  <button
                                    type="button"
                                    className={clsx(
                                      "rounded-full border px-2 py-0.5 font-semibold",
                                      comment.resolved
                                        ? "border-emerald-200 text-emerald-700"
                                        : "border-amber-200 text-amber-700",
                                    )}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onToggleCommentResolved(comment.id);
                                    }}
                                  >
                                    {comment.resolved ? "Rezolvat" : "Deschis"}
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full border border-rose-200 px-2 py-0.5 font-semibold text-rose-600"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onDeleteComment(comment.id);
                                    }}
                                  >
                                    Șterge
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-[var(--omni-muted)]">Nu există note pentru acest world.</p>
                      )}
                      <textarea
                        className="w-full rounded-xl border border-[var(--omni-border-soft)] bg-white px-2 py-1 text-sm"
                        placeholder="Adaugă o notă"
                        value={commentDraft}
                        onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [chunk.id]: event.target.value }))}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <button
                        type="button"
                        className="rounded-full bg-[var(--omni-ink)] px-3 py-1 text-sm font-semibold text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChunkCommentSubmit(chunk.id);
                        }}
                        disabled={!commentDraft.trim()}
                      >
                        Adaugă notă
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
      {seedConfirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-6 text-sm shadow-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Confirm Seed</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--omni-ink)]">Seed Worlds v1</h2>
            <p className="mt-3 text-[var(--omni-muted)]">
              Această acțiune suprascrie structura worlds cu presetul strategic. Tastează <strong>SEED</strong> pentru a confirma.
            </p>
            <input
              type="text"
              className="mt-4 w-full rounded-xl border border-[var(--omni-border-soft)] px-3 py-2 text-sm"
              placeholder="SEED"
              value={seedConfirmInput}
              onChange={(event) => setSeedConfirmInput(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-4 py-2 text-xs font-semibold text-[var(--omni-muted)]"
                onClick={() => {
                  setSeedConfirmOpen(false);
                  setSeedConfirmInput("");
                }}
              >
                Anulează
              </button>
              <button
                type="button"
                className={clsx(
                  "rounded-full px-4 py-2 text-xs font-semibold text-white",
                  seedConfirmInput.trim().toUpperCase() === "SEED" ? "bg-[var(--omni-ink)]" : "bg-[var(--omni-muted)]/60",
                )}
                disabled={seedConfirmInput.trim().toUpperCase() !== "SEED"}
                onClick={() => {
                  onSeedCanonicalChunks();
                  setSeedConfirmOpen(false);
                  setSeedConfirmInput("");
                }}
              >
                Confirmă
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
