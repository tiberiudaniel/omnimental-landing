"use client";

import { useMemo, useState } from "react";
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

  const visibleNodes = useMemo(() => {
    if (!config) return [];
    return config.nodes.filter((node) => !node.softPathOnly || softPathChosen);
  }, [config, softPathChosen]);

  const currentProgress = useMemo(() => {
    if (!visibleNodes.length) return 0;
    const completed = visibleNodes.filter((node) => completedNodeIds.includes(node.id)).length;
    return Math.min(100, Math.round((completed / visibleNodes.length) * 100));
  }, [completedNodeIds, visibleNodes]);

  const markNodeCompleted = (node: DailyPathNodeConfig, awardXp = true) => {
    setCompletedNodeIds((prev) => {
      if (prev.includes(node.id)) {
        advanceToNext(node.id, prev);
        return prev;
      }
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

  const handleNodeAction = (node: DailyPathNodeConfig) => {
    if (!config) return;
    if (node.id === config.autonomyNodeId) {
      setPendingAutonomy(node);
      return;
    }
    markNodeCompleted(node, true);
  };

  const handleAutonomyChoice = (choice: "soft" | "challenge") => {
    if (!pendingAutonomy || !config) return;
    const updatedCompleted = completedNodeIds.includes(pendingAutonomy.id)
      ? completedNodeIds
      : [...completedNodeIds, pendingAutonomy.id];
    if (choice === "soft") {
      setSoftPathChosen(true);
      setCompletedNodeIds(updatedCompleted);
      const softNode = config.nodes.find((node) => node.softPathOnly);
      setPendingAutonomy(null);
      if (softNode) {
        setActiveNodeId(softNode.id);
      } else {
        advanceToNext(pendingAutonomy.id, updatedCompleted);
      }
      return;
    }
    markNodeCompleted(pendingAutonomy, true);
    setPendingAutonomy(null);
  };

  if (!config) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-6 text-sm text-[var(--omni-muted)]">
        Pregătim un traseu adaptiv pentru tine.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-[var(--omni-ink)]">Path-ul tău de azi</h3>
        <span className="rounded-full bg-[var(--omni-bg-main)] px-3 py-[4px] text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)]">
          XP azi: {xp}
        </span>
        <span className="ml-auto text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
          {currentProgress}% complet
        </span>
      </div>
      <div className="space-y-3">
        {visibleNodes.map((node) => {
          const isCompleted = completedNodeIds.includes(node.id);
          const status: "locked" | "active" | "completed" =
            isCompleted ? "completed" : node.id === activeNodeId ? "active" : "locked";
          return (
            <DailyPathNode
              key={node.id}
              node={node}
              status={status}
              onSelect={() => handleNodeAction(node)}
              isAutonomy={node.id === config.autonomyNodeId}
              showSoftLabel={node.softPathOnly === true}
            />
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
      {pendingAutonomy ? (
        <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-4 text-sm text-[var(--omni-ink)] shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
          <p className="text-base font-semibold">Cum vrei să continui?</p>
          <p className="text-sm text-[var(--omni-ink)]/80">
            Poți exersa încă puțin sau poți trece direct la provocare.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <OmniCtaButton size="sm" variant="neutral" onClick={() => handleAutonomyChoice("soft")}>
              Încă mai exersez
            </OmniCtaButton>
            <OmniCtaButton size="sm" onClick={() => handleAutonomyChoice("challenge")}>
              Sunt pregătit
            </OmniCtaButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
