"use client";

import clsx from "clsx";

export type StepAvailability = "available" | "unavailable" | "route-mismatch" | "unknown";

type StepStatusBadgeProps = {
  status: StepAvailability;
  variant?: "solid" | "ghost";
};

const LABELS: Record<StepAvailability, string> = {
  available: "Flow intern definit",
  unavailable: "Fără flow intern",
  "route-mismatch": "Route mismatch",
  unknown: "Flow necunoscut",
};

export function StepStatusBadge({ status, variant = "ghost" }: StepStatusBadgeProps) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  const palette =
    status === "available"
      ? variant === "solid"
        ? "bg-emerald-500 text-white"
        : "border border-emerald-500/50 text-emerald-600"
      : status === "route-mismatch"
        ? variant === "solid"
          ? "bg-amber-600 text-white"
          : "border border-amber-500/50 text-amber-600"
        : status === "unavailable"
          ? variant === "solid"
            ? "bg-slate-600 text-white"
            : "border border-slate-500/50 text-slate-600"
          : variant === "solid"
            ? "bg-slate-500 text-white"
            : "border border-slate-400/60 text-slate-600";
  return <span className={clsx(base, palette)}>{LABELS[status]}</span>;
}
