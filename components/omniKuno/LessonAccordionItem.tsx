"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type LessonAccordionItemProps = {
  id: string;
  containerId?: string;
  index: number;
  title: string;
  description: string;
  level: string;
  center: string;
  duration: string;
  status: "done" | "active" | "locked";
  currentStep: number;
  totalSteps: number;
  isOpen: boolean;
  onToggle: () => void;
  lang: "ro" | "en";
  justActivated?: boolean;
  children?: ReactNode;
  forceActive?: boolean;
};

export default function LessonAccordionItem({
  containerId,
  index,
  title,
  description,
  level,
  center,
  duration,
  status,
  currentStep,
  totalSteps,
  isOpen,
  onToggle,
  children,
  lang,
  justActivated = false,
  forceActive = false,
}: LessonAccordionItemProps) {
  const effectiveStatus = forceActive ? "active" : status;
  const isClickable = effectiveStatus === "active";
  const statusLabel =
    effectiveStatus === "done"
      ? lang === "ro"
        ? "FINALIZATĂ"
        : "COMPLETED"
      : effectiveStatus === "active"
        ? lang === "ro"
          ? "ÎN DESFĂȘURARE"
          : "IN PROGRESS"
        : lang === "ro"
          ? "URMEAZĂ"
          : "NEXT";
  const icon = effectiveStatus === "done" ? "✓" : effectiveStatus === "active" ? "▶" : "🔒";

  const progressDots = Array.from({ length: Math.max(1, totalSteps) }, (_, idx) => idx < currentStep - 1);

  return (
    <div
      id={containerId}
      className="rounded-card border border-transparent bg-transparent"
      data-testid="kuno-lesson-item"
    >
      <motion.button
        type="button"
        disabled={!isClickable}
        onClick={isClickable ? onToggle : undefined}
        className={cn(
          "flex w-full items-start justify-between rounded-card px-4 py-4 text-left transition md:px-6",
          status === "done" && "bg-[var(--omni-surface-card)] text-[var(--omni-ink-soft)]",
          effectiveStatus === "active" && "bg-[var(--omni-bg-paper)] text-[var(--omni-ink)] shadow-[0_12px_28px_rgba(0,0,0,0.08)]",
          effectiveStatus === "locked" && "bg-[var(--omni-bg-paper)] text-[var(--omni-muted)] opacity-40",
          !isClickable && "cursor-default",
          justActivated && effectiveStatus === "active" ? "ring-2 ring-[#F5A47E]/70" : "",
        )}
        whileHover={
          isClickable
            ? {
                x: 4,
                boxShadow: "0 18px 36px rgba(242,114,75,0.25)",
              }
            : {}
        }
        data-testid="kuno-lesson-trigger"
        transition={{
          duration: justActivated ? 0.9 : 0.25,
          ease: justActivated ? "easeOut" : "easeInOut",
        }}
        animate={
          justActivated && status === "active"
            ? { scale: [1, 1.02, 1], boxShadow: "0 18px 36px rgba(242,114,75,0.28)" }
            : { scale: 1 }
        }
      >
        <div className="flex flex-1 items-start gap-3">
          <div
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm",
          effectiveStatus === "done" && "border-[#82C29B] text-[#2F7A4D] bg-[var(--omni-surface-card)]",
          effectiveStatus === "active" && "border-[#F5A47E] text-[#D55D2A] bg-[var(--omni-surface-card)]",
          effectiveStatus === "locked" && "border-[var(--omni-border-soft)] text-[color-mix(in srgb,var(--omni-ink-soft),#c8b9ac)] bg-[var(--omni-surface-card)]/80",
        )}
      >
        <motion.span
          key={effectiveStatus}
          initial={{ scale: 0.7, rotate: effectiveStatus === "done" ? -90 : 0, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {icon}
            </motion.span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--omni-muted)]">
              {index}. Lecție
            </span>
            <span className="text-base font-semibold text-[var(--omni-ink)]">{title}</span>
            <span className="mt-1 text-sm text-[color-mix(in srgb,var(--omni-ink-soft)_80%,#ffffff)]">{description}</span>
          </div>
        </div>
        <div className="ml-4 flex flex-col items-end text-right text-xs text-[var(--omni-muted)]">
          <span>{[level, center, duration].filter(Boolean).join(" · ")}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={statusLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "mt-2 text-[10px] font-semibold uppercase tracking-[0.25em]",
                effectiveStatus === "done" && "text-emerald-500",
                effectiveStatus === "active" && "text-[#F26F4B]",
                effectiveStatus === "locked" && "text-[color-mix(in srgb,var(--omni-muted)_45%,white)]",
              )}
            >
              {statusLabel}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (effectiveStatus === "active" || forceActive) ? (
          <motion.div
            key="accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-2 overflow-hidden rounded-[26px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] shadow-[0_18px_40px_rgba(0,0,0,0.12)] md:mx-4 lg:mx-6"
          >
            <div className="px-4 py-5 md:px-6">
              <div className="flex flex-col gap-2 text-xs text-[color-mix(in srgb,var(--omni-ink-soft)_80%,#ffffff)]">
                <div className="flex gap-1">
                  {progressDots.map((filled, idx) => (
                    <span
                      key={`dot-${idx}`}
                      className={cn(
                        "rounded-full transition-all",
                        idx === currentStep - 1
                          ? "h-2.5 w-2.5 bg-[#F26F4B]"
                          : filled
                            ? "h-2 w-2 bg-[#F5BAA7]"
                          : "h-2 w-2 bg-[var(--omni-border-soft)]",
                      )}
                    />
                  ))}
                </div>
                <p className="text-[var(--omni-muted)]">{`Pas ${Math.min(currentStep, totalSteps)} din ${Math.max(
                  totalSteps,
                  1,
                )}`}</p>
              </div>
              <div className="mt-4">{children}</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
