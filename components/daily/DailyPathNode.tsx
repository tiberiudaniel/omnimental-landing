"use client";

import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import type { DailyPathNodeConfig } from "@/types/dailyPath";

export type DailyNodeStatus = "locked" | "active" | "completed";

interface DailyPathNodeProps {
  node: DailyPathNodeConfig;
  status: DailyNodeStatus;
  onSelect?: () => void;
  isAutonomy?: boolean;
  showSoftLabel?: boolean;
}

const SHAPE_ICON: Record<DailyPathNodeConfig["shape"], string> = {
  circle: "●",
  star: "★",
  hollow: "○",
};

export function DailyPathNode({ node, status, onSelect, isAutonomy, showSoftLabel }: DailyPathNodeProps) {
  const isAction = node.kind === "ACTION";
  const disabled = status !== "active";
  const icon = SHAPE_ICON[node.shape];
  const iconClasses =
    status === "completed"
      ? "bg-[var(--omni-energy-soft)] text-[var(--omni-ink)]"
      : status === "active"
        ? "bg-[var(--omni-energy)] text-[var(--omni-bg-paper)]"
        : "bg-[var(--omni-bg-main)] text-[var(--omni-muted)]";

  return (
    <div className="flex gap-4 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-semibold ${iconClasses}`}>
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-[var(--omni-ink)]">{node.title}</p>
          {node.isBonus ? (
            <span className="rounded-full border border-[var(--omni-energy)] px-2 py-[1px] text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
              Bonus
            </span>
          ) : null}
          {showSoftLabel ? (
            <span className="rounded-full border border-[var(--omni-border-soft)] px-2 py-[1px] text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              Soft path
            </span>
          ) : null}
        </div>
        <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[var(--omni-bg-main)] px-2 py-[2px] text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)]">
            +{node.xp} XP
          </span>
          <div className="ml-auto flex items-center gap-2">
            {isAutonomy ? (
              <OmniCtaButton size="sm" disabled={disabled} onClick={onSelect}>
                Alege traseul
              </OmniCtaButton>
            ) : (
              <OmniCtaButton size="sm" disabled={disabled} onClick={onSelect}>
                {isAction ? "Aplică" : "Continuă"}
              </OmniCtaButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyPathNode;
