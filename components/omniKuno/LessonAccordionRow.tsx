"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LessonStripStatus = "done" | "active" | "locked";

export type LessonAccordionRowProps = {
  index: number;
  title: string;
  levelLabel?: string;
  centerLabel?: string;
  durationLabel?: string;
  status: LessonStripStatus;
  lang: "ro" | "en";
  isOpen: boolean;
  onToggle: () => void;
  children?: ReactNode;
};

export default function LessonAccordionRow({
  index,
  title,
  levelLabel,
  centerLabel,
  durationLabel,
  status,
  lang,
  isOpen,
  onToggle,
  children,
}: LessonAccordionRowProps) {
  const isClickable = status === "active";

  const statusLabel =
    status === "done"
      ? lang === "ro"
        ? "FINALIZATĂ"
        : "COMPLETED"
      : status === "active"
        ? lang === "ro"
          ? "ÎN DESFĂȘURARE"
          : "IN PROGRESS"
        : lang === "ro"
          ? "URMEAZĂ"
          : "NEXT";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={isClickable ? onToggle : undefined}
        disabled={!isClickable}
        className={cn(
          "flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition-all md:px-5 md:py-4",
          status === "done" && "border-transparent bg-[var(--omni-surface-card)]/70 text-neutral-700",
          status === "active" && "border-[#F2B39B] bg-[var(--omni-bg-paper)] shadow-sm hover:bg-[var(--omni-bg-paper)]",
          status === "locked" && "border-transparent bg-neutral-100 text-neutral-400",
          !isClickable && "cursor-default",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border text-xs">
            {status === "done" ? "✓" : status === "active" ? "▶" : "🔒"}
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              {index}. {lang === "ro" ? "Lecție" : "Lesson"}
            </span>
            <span className="text-sm font-medium md:text-base">{title}</span>
            {(levelLabel || centerLabel || durationLabel) && (
              <span className="mt-1 text-xs text-neutral-500 md:text-sm">
                {[levelLabel, centerLabel, durationLabel].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 flex flex-col items-end text-[10px] uppercase tracking-[0.18em]">
          <span
            className={cn(
              status === "done" && "text-emerald-500",
              status === "active" && "text-[#F26F4B]",
              status === "locked" && "text-neutral-400",
            )}
          >
            {statusLabel}
          </span>
        </div>
      </button>
      {isOpen && status === "active" ? (
        <div className="mt-3 rounded-3xl border border-[#F2B39B]/60 bg-[var(--omni-surface-card)] p-4 md:p-5">{children}</div>
      ) : null}
    </div>
  );
}
