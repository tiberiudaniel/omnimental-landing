"use client";

import { useMemo } from "react";
import clsx from "clsx";
import type { FlowComment } from "@/lib/flowStudio/types";

type CommentFilter = "open" | "all" | "nodes" | "chunks";

type OpenIssuesPanelProps = {
  comments: FlowComment[];
  filter: CommentFilter;
  onFilterChange: (filter: CommentFilter) => void;
  onSelectComment: (comment: FlowComment) => void;
  onToggleResolved: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
};

export function OpenIssuesPanel({
  comments,
  filter,
  onFilterChange,
  onSelectComment,
  onToggleResolved,
  onDeleteComment,
}: OpenIssuesPanelProps) {
  const filtered = useMemo(() => {
    return comments.filter((comment) => {
      if (filter === "open") return !comment.resolved;
      if (filter === "nodes") return comment.targetType === "node";
      if (filter === "chunks") return comment.targetType === "chunk";
      return true;
    });
  }, [comments, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [filtered]);

  return (
    <section className="rounded-3xl border border-[var(--omni-border-soft)] bg-white p-4 text-sm shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Open issues</p>
          <p className="text-[var(--omni-muted)]">Note și comentarii pentru acest flow.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          {(
            [
              { key: "open", label: "Neînchise" },
              { key: "all", label: "Toate" },
              { key: "nodes", label: "Nodes" },
              { key: "chunks", label: "Chunks" },
            ] as Array<{ key: CommentFilter; label: string }>
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              className={clsx(
                "rounded-full border px-3 py-1",
                filter === option.key ? "border-[var(--omni-ink)] text-[var(--omni-ink)]" : "border-[var(--omni-border-soft)] text-[var(--omni-muted)]",
              )}
              onClick={() => onFilterChange(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {sorted.length ? (
        <ul className="mt-4 space-y-3">
          {sorted.map((comment) => {
            const createdAt = comment.createdAt ? new Date(comment.createdAt) : null;
            return (
              <li key={comment.id} className="rounded-2xl border border-[var(--omni-border-soft)] bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--omni-muted)]">
                      {comment.targetType === "chunk" ? "Chunk" : "Node"} · {comment.targetId}
                    </p>
                    <p className="text-base font-semibold text-[var(--omni-ink)]">{comment.message}</p>
                    <p className="text-[11px] text-[var(--omni-muted)]">{comment.author ?? "Anonim"}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-[11px]">
                    {createdAt ? <span>{createdAt.toLocaleString("ro-RO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span> : null}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        className={clsx(
                          "rounded-full border px-2 py-0.5",
                          comment.resolved
                            ? "border-emerald-200 text-emerald-700"
                            : "border-amber-200 text-amber-700",
                        )}
                        onClick={() => onToggleResolved(comment.id)}
                      >
                        {comment.resolved ? "Rezolvat" : "Deschis"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5"
                        onClick={() => onSelectComment(comment)}
                      >
                        Deschide
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-rose-200 px-2 py-0.5 text-rose-600"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-[var(--omni-muted)]">Nu există comentarii pentru filtrul selectat.</p>
      )}
    </section>
  );
}
