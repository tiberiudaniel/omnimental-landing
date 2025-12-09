"use client";

import { useMemo, useRef, useState, useEffect, forwardRef } from "react";
import type { DailyPathConfig, DailyPathNodeConfig } from "@/types/dailyPath";
import DailyPathNode from "./DailyPathNode";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

const COMPLETION_BONUS = 15;

type DailyPathProps = {
  config: DailyPathConfig | null;
};

export default function DailyPath({ config }: DailyPathProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(config?.nodes[0]?.id ?? null);
  const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);
  const [softPathChosen, setSoftPathChosen] = useState(false);
  const [xp, setXp] = useState(0);
  const [pendingAutonomy, setPendingAutonomy] = useState<DailyPathNodeConfig | null>(null);
  const [pathFinished, setPathFinished] = useState(false);
  const [bonusGranted, setBonusGranted] = useState(false);
  const autonomyDialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pendingAutonomy) {
      queueMicrotask(() => {
        autonomyDialogRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [pendingAutonomy]);

  const visibleNodes = useMemo(() => {
    if (!config) return [];
    return config.nodes.filter((node) => !node.softPathOnly || softPathChosen);
  }, [config, softPathChosen]);

  const currentProgress = useMemo(() => {
    if (!visibleNodes.length) return 0;
    const completed = visibleNodes.filter((node) => completedNodeIds.includes(node.id)).length;
    return Math.min(100, Math.round((completed / visibleNodes.length) * 100));
  }, [completedNodeIds, visibleNodes]);

  const handleNodeAction = (node: DailyPathNodeConfig) => {
    if (!config) return;
    if (node.id !== activeNodeId) return;
    if (node.id === config.autonomyNodeId) {
      setPendingAutonomy(node);
      return;
    }
    markNodeCompleted(node, true);
  };

  const markNodeCompleted = (node: DailyPathNodeConfig, awardXp = true) => {
    setCompletedNodeIds((prev) => {
      if (prev.includes(node.id)) return prev;
      const updated = [...prev, node.id];
      if (awardXp) {
        setXp((prevXp) => prevXp + node.xp);
      }
      advanceToNext(node.id, updated);
      return updated;
    });
  };

  const advanceToNext = (currentId: string | null, completedList: string[] = completedNodeIds) => {
    if (!visibleNodes.length) {
      setActiveNodeId(null);
      return;
    }
    const currentIndex = currentId ? visibleNodes.findIndex((node) => node.id === currentId) : -1;
    for (let i = currentIndex + 1; i < visibleNodes.length; i += 1) {
      const node = visibleNodes[i];
      if (!completedList.includes(node.id)) {
        setActiveNodeId(node.id);
        return;
      }
    }
    setActiveNodeId(null);
    if (!bonusGranted) {
      setXp((prev) => prev + COMPLETION_BONUS);
      setBonusGranted(true);
    }
    setPathFinished(true);
  };

  const handleAutonomyChoice = (choice: "soft" | "challenge") => {
    if (!pendingAutonomy || !config) return;
    if (choice === "soft") {
      const updated = completedNodeIds.includes(pendingAutonomy.id)
        ? completedNodeIds
        : [...completedNodeIds, pendingAutonomy.id];
      setSoftPathChosen(true);
      setCompletedNodeIds(updated);
      setPendingAutonomy(null);
      const softNode = config.nodes.find((node) => node.softPathOnly);
      if (softNode) {
        setActiveNodeId(softNode.id);
      } else {
        advanceToNext(pendingAutonomy.id, updated);
      }
      return;
    }
    markNodeCompleted(pendingAutonomy, true);
    setPendingAutonomy(null);
  };

  if (!config) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-6 text-center text-sm text-[var(--omni-muted)]">
        Pregătim un traseu adaptiv pentru tine.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-[var(--omni-ink)]">Path-ul tău de azi</h3>
        <span className="rounded-full bg-[var(--omni-bg-main)] px-3 py-[4px] text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)]">
          XP azi: {xp}
        </span>
        <span className="ml-auto text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {currentProgress}% complet
        </span>
      </div>
      <div className="space-y-2 lg:max-h-[calc(100vh-230px)] lg:overflow-y-auto lg:pr-2">
        {visibleNodes.map((node, index) => {
          const isCompleted = completedNodeIds.includes(node.id);
          const status: "locked" | "active" | "completed" =
            isCompleted ? "completed" : node.id === activeNodeId ? "active" : "locked";
          return (
            <div key={`${node.id}-${status}`} className="flex flex-col items-center gap-2">
              <div className="w-full max-w-xl">
                <DailyPathNode
                  node={node}
                  status={status}
                  onSelect={() => handleNodeAction(node)}
                  isAutonomy={node.id === config.autonomyNodeId}
                  showSoftLabel={node.softPathOnly === true}
                />
              </div>
              {node.id === config.autonomyNodeId && pendingAutonomy ? (
                <AutonomyDialog ref={autonomyDialogRef} onChoice={handleAutonomyChoice} />
              ) : null}
              {index < visibleNodes.length - 1 ? <PathConnector /> : null}
            </div>
          );
        })}
      </div>
      {pathFinished ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-3 text-sm text-[var(--omni-ink)]">
          <span>Ai terminat traseul de azi! +{COMPLETION_BONUS} XP bonus.</span>
          <OmniCtaButton size="sm" variant="neutral">
            Gata pe azi
          </OmniCtaButton>
        </div>
      ) : null}
    </div>
  );
}

const AutonomyDialog = forwardRef<HTMLDivElement, { onChoice: (choice: "soft" | "challenge") => void }>(
  ({ onChoice }, ref) => (
    <div
      ref={ref}
      className="w-full max-w-xl rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-4 text-sm text-[var(--omni-ink)] shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
    >
      <p className="text-base font-semibold">Cum simți? Mai exersezi puțin sau ești pregătit de provocare?</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <OmniCtaButton size="sm" variant="neutral" onClick={() => onChoice("soft")}>
          Încă mai exersez
        </OmniCtaButton>
        <OmniCtaButton size="sm" onClick={() => onChoice("challenge")}>
          Sunt pregătit
        </OmniCtaButton>
      </div>
    </div>
  ),
);

AutonomyDialog.displayName = "AutonomyDialog";

function PathConnector() {
  return (
    <div className="flex justify-center py-1">
      <div className="h-5 w-[2px] bg-[var(--omni-border-soft)]" />
    </div>
  );
}
