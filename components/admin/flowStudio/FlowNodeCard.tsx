"use client";

import clsx from "clsx";
import { Handle, Position, type NodeProps } from "reactflow";
import type { FlowNodeData } from "@/lib/flowStudio/types";
import type { ObservedNodeStats } from "@/lib/flowStudio/observed";
import { StepStatusBadge, type StepAvailability } from "./StepStatusBadge";

type FlowNodeCardProps = NodeProps<FlowNodeData> & {
  issueCount: number;
  observedEnabled: boolean;
  observedStats?: ObservedNodeStats | null;
  stepStatus: StepAvailability;
  canExpandSteps: boolean;
  onExpandSteps?: (nodeId: string) => void;
  commentCount?: number;
};

const handleStyleBase = "h-2 w-2 border-none";

export function FlowNodeCard({
  data,
  id,
  selected,
  issueCount,
  observedEnabled,
  observedStats,
  stepStatus,
  canExpandSteps,
  onExpandSteps,
  commentCount,
}: FlowNodeCardProps) {
  const label = data.labelOverrides?.ro ?? data.routePath;
  const isStart = Boolean(data.tags?.includes("start"));
  const tagHighlights =
    data.tags
      ?.map((tag) => {
        const [category, ...rest] = tag.split(":");
        if (!category || rest.length === 0) return null;
        if (!["engine", "surface", "type"].includes(category)) return null;
        return { category, value: rest.join(":"), raw: tag };
      })
      .filter((entry): entry is { category: string; value: string; raw: string } => Boolean(entry)) ?? [];
  const resolveTagClasses = (category: string) => {
    switch (category) {
      case "engine":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "surface":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "type":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} id="target-left" className={`${handleStyleBase} bg-[var(--omni-ink)]`} />
      <Handle type="target" position={Position.Top} id="target-top" className={`${handleStyleBase} bg-[var(--omni-ink)]`} />
      <Handle type="target" position={Position.Right} id="target-right" className={`${handleStyleBase} bg-[var(--omni-ink)]`} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" className={`${handleStyleBase} bg-[var(--omni-ink)]`} />

      <Handle type="source" position={Position.Left} id="source-left" className={`${handleStyleBase} bg-[var(--omni-energy)]`} />
      <Handle type="source" position={Position.Top} id="source-top" className={`${handleStyleBase} bg-[var(--omni-energy)]`} />
      <Handle type="source" position={Position.Right} id="source-right" className={`${handleStyleBase} bg-[var(--omni-energy)]`} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className={`${handleStyleBase} bg-[var(--omni-energy)]`} />
      <div
        className={clsx(
          "rounded-2xl border px-4 py-2 text-sm font-semibold text-[var(--omni-ink)] shadow-md",
          selected ? "bg-white border-[var(--omni-energy)]" : "bg-white/90 border-[var(--omni-border-soft)]",
          issueCount ? "ring-2 ring-amber-400" : "",
        )}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate select-text">{label}</span>
            <div className="flex items-center gap-1">
              {issueCount ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  {issueCount}
                </span>
              ) : null}
              {commentCount ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                  💬 {commentCount}
                </span>
              ) : null}
              {isStart ? (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">Start</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StepStatusBadge status={stepStatus} variant="ghost" />
            {canExpandSteps ? (
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--omni-ink)]"
                onClick={(event) => {
                  event.stopPropagation();
                  onExpandSteps?.(id);
                }}
              >
                Steps
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[var(--omni-muted)]">
          <a
            href={data.routePath || "#"}
            target="_blank"
            rel="noreferrer"
            className="truncate underline decoration-dotted underline-offset-2"
            onClick={(event) => event.stopPropagation()}
          >
            {data.routePath}
          </a>
          <button
            type="button"
            className="rounded-full border border-[var(--omni-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--omni-ink)]"
            onClick={(event) => {
              event.stopPropagation();
              void navigator.clipboard?.writeText(data.routePath ?? "");
            }}
          >
            Copy
          </button>
        </div>
        {tagHighlights.length ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {tagHighlights.map((tag) => (
              <span
                key={`${id}-${tag.raw}`}
                className={clsx(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  resolveTagClasses(tag.category),
                )}
              >
                {tag.category}:{tag.value}
              </span>
            ))}
          </div>
        ) : null}
        {observedEnabled && observedStats ? (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-emerald-700">
            {typeof observedStats.views === "number" ? <span>Vizualizări: {observedStats.views}</span> : null}
            {typeof observedStats.completions === "number" ? <span>Completări: {observedStats.completions}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
