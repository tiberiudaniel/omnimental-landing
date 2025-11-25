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
}: LessonAccordionItemProps) {
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
  const icon = status === "done" ? "✓" : status === "active" ? "▶" : "🔒";

  const progressDots = Array.from({ length: Math.max(1, totalSteps) }, (_, idx) => idx < currentStep - 1);

  return (
    <div id={containerId} className="rounded-3xl border border-transparent bg-transparent">
      <motion.button
        type="button"
        disabled={!isClickable}
        onClick={isClickable ? onToggle : undefined}
        className={cn(
          "flex w-full items-start justify-between rounded-3xl px-4 py-4 text-left transition md:px-6",
          status === "done" && "bg-white text-neutral-700",
          status === "active" && "bg-[#FFF8F4] text-[#2C2C2C] shadow-[0_15px_35px_rgba(242,114,75,0.25)]",
          status === "locked" && "bg-[#FCFBF9] text-neutral-400 opacity-40",
          !isClickable && "cursor-default",
          justActivated && status === "active" ? "ring-2 ring-[#F5A47E]/70" : "",
        )}
        animate={
          justActivated && status === "active"
            ? { scale: [1, 1.02, 1], boxShadow: "0 18px 36px rgba(242,114,75,0.28)" }
            : { scale: 1 }
        }
        transition={{ duration: justActivated ? 0.6 : 0.2 }}
      >
        <div className="flex flex-1 items-start gap-3">
          <div
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm",
              status === "done" && "border-[#82C29B] text-[#2F7A4D] bg-white",
              status === "active" && "border-[#F5A47E] text-[#D55D2A] bg-white",
              status === "locked" && "border-neutral-200 text-[#6B6B6B] bg-white/80",
            )}
          >
            <motion.span
              key={status}
              initial={{ scale: 0.7, rotate: status === "done" ? -90 : 0, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {icon}
            </motion.span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">
              {index}. Lecție
            </span>
            <span className="text-base font-semibold text-[#2C2C2C]">{title}</span>
            <span className="mt-1 text-sm text-neutral-600">{description}</span>
          </div>
        </div>
        <div className="ml-4 flex flex-col items-end text-right text-xs text-neutral-500">
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
                status === "done" && "text-emerald-500",
                status === "active" && "text-[#F26F4B]",
                status === "locked" && "text-neutral-300",
              )}
            >
              {statusLabel}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && status === "active" ? (
          <motion.div
            key="accordion-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-3xl border border-[#F2B39B]/60 bg-[#FFF8F4] shadow-[0_20px_45px_rgba(242,114,75,0.18)]"
          >
            <div className="px-4 py-5 md:px-6">
              <div className="flex flex-col gap-2 text-xs text-neutral-600">
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
                            : "h-2 w-2 bg-neutral-200",
                      )}
                    />
                  ))}
                </div>
                <p className="text-neutral-500">{`Pas ${Math.min(currentStep, totalSteps)} din ${Math.max(
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
