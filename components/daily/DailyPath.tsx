"use client";

import { useMemo, useRef, useState, useEffect } from "react";
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
  const [pathFinished, setPathFinished] = useState(false);
  const [bonusGranted, setBonusGranted] = useState(false);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const processedNodes = useMemo(() => {
    if (!config) return [];
    const merged: DailyPathNodeConfig[] = [];
    for (let i = 0; i < config.nodes.length; i += 1) {
      const node = config.nodes[i];
      if (node.kind === "SUMMARY") {
        const maybeAnchor = config.nodes[i + 1];
        if (maybeAnchor?.kind === "ANCHOR") {
          merged.push({ ...node, anchorDescription: maybeAnchor.description });
          i += 1;
          continue;
        }
      }
      merged.push(node);
    }
    return merged;
  }, [config]);

  const currentActiveId = useMemo(() => {
    if (!processedNodes.length) return null;
    if (activeNodeId && processedNodes.some((node) => node.id === activeNodeId)) {
      return activeNodeId;
    }
    return processedNodes[0]?.id ?? null;
  }, [processedNodes, activeNodeId]);

  useEffect(() => {
    if (!currentActiveId) return;
    const element = nodeRefs.current[currentActiveId];
    if (!element) return;
    queueMicrotask(() => {
      if (typeof window === "undefined") {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const prefersDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (prefersDesktop) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const offset = window.innerHeight * 0.15;
      const targetTop = window.scrollY + element.getBoundingClientRect().top - offset;
      window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
    });
  }, [currentActiveId]);

  const visibleNodes = useMemo(() => {
    return processedNodes.filter((node) => !node.softPathOnly || softPathChosen);
  }, [processedNodes, softPathChosen]);

  const currentProgress = useMemo(() => {
    if (!visibleNodes.length) return 0;
    const completed = visibleNodes.filter((node) => completedNodeIds.includes(node.id)).length;
    return Math.min(100, Math.round((completed / visibleNodes.length) * 100));
  }, [completedNodeIds, visibleNodes]);

  const handleNodeAction = (node: DailyPathNodeConfig) => {
    if (!config) return;
    if (node.id !== currentActiveId) return;
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
    if (!config || !processedNodes.length) return;
    const autonomyNode = processedNodes.find((node) => node.id === config.autonomyNodeId);
    if (!autonomyNode) return;
    if (choice === "soft") {
      const updated = completedNodeIds.includes(autonomyNode.id)
        ? completedNodeIds
        : [...completedNodeIds, autonomyNode.id];
      setSoftPathChosen(true);
      setCompletedNodeIds(updated);
      const softNode = processedNodes.find((node) => node.softPathOnly);
      if (softNode) {
        setActiveNodeId(softNode.id);
        return;
      }
      advanceToNext(autonomyNode.id, updated);
      return;
    }
    markNodeCompleted(autonomyNode, true);
  };

  if (!config) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-6 text-center text-sm text-[var(--omni-muted)]">
        Pregătim un traseu adaptiv pentru tine.
      </div>
    );
  }

  return (
    <div className="mt-6 w-full rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] py-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] sm:mt-8">
      <div className="mx-auto flex w-full max-w-[520px] flex-col space-y-4 px-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-[var(--omni-ink)]">Path-ul tău de azi</h3>
          <span className="rounded-full bg-[var(--omni-bg-main)] px-3 py-[4px] text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)]">
            XP azi: {xp}
          </span>
          <span className="ml-auto text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">
            {currentProgress}% complet
          </span>
        </div>
        <div className="space-y-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto">
          {visibleNodes.map((node, index) => {
            const isCompleted = completedNodeIds.includes(node.id);
            const status: "locked" | "active" | "completed" =
              isCompleted ? "completed" : node.id === currentActiveId ? "active" : "locked";
            return (
              <div
                key={`${node.id}-${status}`}
                ref={(el) => {
                  nodeRefs.current[node.id] = el;
                }}
                className="flex w-full flex-col items-center gap-2 scroll-mt-24 lg:scroll-mt-48"
              >
                <DailyPathNode
                  node={node}
                  status={status}
                  onSelect={() => handleNodeAction(node)}
                  isAutonomy={node.id === config.autonomyNodeId}
                  showSoftLabel={node.softPathOnly === true}
                  onAutonomyChoice={handleAutonomyChoice}
                />
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
    </div>
  );
}

function PathConnector() {
  return (
    <div className="flex justify-center py-2">
      <div className="h-4 w-px bg-[var(--omni-border-soft)]/70" />
    </div>
  );
}
