"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import type {
  AdaptiveCluster,
  DailyPathConfig,
  DailyPathLanguage,
  DailyPathMode,
  DailyPathNodeConfig,
} from "@/types/dailyPath";
import DailyPathNode from "./DailyPathNode";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { recordDailyPathEvent } from "@/lib/dailyPathEvents";
import { applyDailyPracticeCompletion } from "@/lib/arcMetrics";
import { CLUSTER_REGISTRY } from "@/config/clusterRegistry";

const COMPLETION_BONUS = 15;
const IS_DEV = process.env.NODE_ENV !== "production";
const DAILY_PATH_COPY: Record<
  DailyPathLanguage,
  {
    title: string;
    xpLabel: string;
    progressSuffix: string;
    stepLabel: (current: number, total: number) => string;
    durationLabel: string;
    durations: Record<DailyPathMode, string>;
    preparing: string;
    skillIntro: string;
  }
> = {
  ro: {
    title: "Path-ul tău de azi",
    xpLabel: "XP azi",
    progressSuffix: "% complet",
    stepLabel: (current, total) => `Pasul ${current} din ${total}`,
    durationLabel: "Durată estimată",
    durations: {
      deep: "10–12 min",
      short: "3–5 min",
    },
    preparing: "Pregătim un traseu adaptiv pentru tine.",
    skillIntro: "Astăzi ai antrenat",
  },
  en: {
    title: "Today's path",
    xpLabel: "XP today",
    progressSuffix: "% complete",
    stepLabel: (current, total) => `Step ${current} of ${total}`,
    durationLabel: "Estimated duration",
    durations: {
      deep: "10–12 min",
      short: "3–5 min",
    },
    preparing: "Preparing your adaptive path…",
    skillIntro: "Today you trained",
  },
};

const CLUSTER_SUMMARY: Record<
  AdaptiveCluster,
  Record<DailyPathLanguage, { title: string; skill: string }>
> = {
  focus_energy_cluster: {
    ro: { title: "Energie", skill: "Reset rapid între task-uri" },
    en: { title: "Energy", skill: "Quick reset between tasks" },
  },
  clarity_cluster: {
    ro: { title: "Claritate", skill: "O singură intenție clară" },
    en: { title: "Clarity", skill: "One clear intention" },
  },
  emotional_flex_cluster: {
    ro: { title: "Flexibilitate emoțională", skill: "Pauza de 2 secunde când apare tensiunea" },
    en: { title: "Emotional Flexibility", skill: "The 2-second pause under tension" },
  },
};

type DailyPathProps = {
  config: DailyPathConfig | null;
  userId?: string | null;
  currentArcId?: string | null;
  disablePersistence?: boolean;
  defaultTimeSelection?: number | null;
  modeHint?: DailyPathMode | null;
  onTimeSelection?: (minutes: number) => void;
  onCompleted?: () => void;
};

const TIME_OPTIONS = [
  { value: 5, label: { ro: "4–5 min", en: "4–5 min" } },
  { value: 10, label: { ro: "5–10 min", en: "5–10 min" } },
  { value: 20, label: { ro: "15–25 min", en: "15–25 min" } },
  { value: 30, label: { ro: "30+ min", en: "30+ min" } },
] as const;

const validModes: DailyPathMode[] = ["short", "deep"];

export default function DailyPath({
  config,
  userId = null,
  currentArcId = null,
  disablePersistence = false,
  defaultTimeSelection = null,
  modeHint = null,
  onTimeSelection,
  onCompleted,
}: DailyPathProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [completedNodeIds, setCompletedNodeIds] = useState<string[]>([]);
  const [softPathChosen, setSoftPathChosen] = useState(false);
  const [xp, setXp] = useState(0);
  const [pathFinished, setPathFinished] = useState(false);
  const [bonusGranted, setBonusGranted] = useState(false);
  const [pathVariant, setPathVariant] = useState<"soft" | "challenge">("challenge");
  const [timeAvailableMin, setTimeAvailableMin] = useState<number | null>(defaultTimeSelection);
  const [timeSelectionLocked, setTimeSelectionLocked] = useState(Boolean(defaultTimeSelection != null));
  const startLoggedRef = useRef(false);
  const completionLoggedRef = useRef(false);
  const completionNotifiedRef = useRef(false);
  const startTimestampRef = useRef<number | null>(null);
  const pendingStartMinutesRef = useRef<number | null>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeLang: DailyPathLanguage = config?.lang ?? "ro";
  const persistenceEnabled = !disablePersistence;
  const copy = DAILY_PATH_COPY[activeLang] ?? DAILY_PATH_COPY.ro;
  const localizedTimeOptions = useMemo(
    () =>
      TIME_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label[activeLang] ?? opt.label.ro,
      })),
    [activeLang],
  );
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

  const visibleNodes = useMemo(() => {
    return processedNodes.filter((node) => !node.softPathOnly || softPathChosen);
  }, [processedNodes, softPathChosen]);

  const currentProgress = useMemo(() => {
    if (!visibleNodes.length) return 0;
    const completed = visibleNodes.filter((node) => completedNodeIds.includes(node.id)).length;
    return Math.min(100, Math.round((completed / visibleNodes.length) * 100));
  }, [completedNodeIds, visibleNodes]);
  const totalVisibleNodes = visibleNodes.length || processedNodes.length;
  const currentIndex = currentActiveId
    ? visibleNodes.findIndex((node) => node.id === currentActiveId)
    : -1;
  const currentStepNumber = currentIndex >= 0 ? currentIndex + 1 : 0;
  const displayStep =
    currentStepNumber > 0 ? currentStepNumber : totalVisibleNodes > 0 ? totalVisibleNodes : 0;

  const resetState = useCallback(() => {
    setActiveNodeId(config?.nodes?.[0]?.id ?? null);
    setCompletedNodeIds([]);
    setSoftPathChosen(false);
    setPathVariant("challenge");
    setXp(0);
    setPathFinished(false);
    setBonusGranted(false);
    startLoggedRef.current = false;
    completionLoggedRef.current = false;
    completionNotifiedRef.current = false;
    startTimestampRef.current = null;
    pendingStartMinutesRef.current = null;
    setTimeAvailableMin(null);
    setTimeSelectionLocked(false);
  }, [config]);

useEffect(() => {
  if (!config) return;
  const id = window.setTimeout(() => {
    resetState();
  }, 0);
  return () => window.clearTimeout(id);
}, [config, resetState]);

useEffect(() => {
  if (defaultTimeSelection != null) {
    const id = window.setTimeout(() => {
      setTimeAvailableMin(defaultTimeSelection);
      setTimeSelectionLocked(true);
    }, 0);
    return () => window.clearTimeout(id);
  } else {
    const id = window.setTimeout(() => {
      setTimeSelectionLocked(false);
      setTimeAvailableMin(null);
    }, 0);
    return () => window.clearTimeout(id);
  }
}, [defaultTimeSelection]);

  const logDebug = useCallback((...args: unknown[]) => {
    if (!IS_DEV) return;
    console.debug("[DailyPath]", ...args);
  }, []);

  if (IS_DEV && config) {
    if (!config.id) {
      throw new Error("DailyPath config missing id");
    }
    if (!config.nodes || config.nodes.length === 0) {
      throw new Error(`DailyPath config ${config.id} has no nodes`);
    }
    if (!validModes.includes(config.mode)) {
      throw new Error(`DailyPath config ${config.id} has invalid mode ${config.mode}`);
    }
    if (!CLUSTER_REGISTRY[config.cluster]) {
      throw new Error(`DailyPath config ${config.id} has unknown cluster ${config.cluster}`);
    }
  }

  const handleTimeSelect = useCallback(
    (selected: number) => {
      if (!config || timeSelectionLocked) return;
      setTimeAvailableMin(selected);
      onTimeSelection?.(selected);
      pendingStartMinutesRef.current = selected;
      setTimeSelectionLocked(true);
    },
    [config, onTimeSelection, timeSelectionLocked],
  );

  const logPathStart = useCallback(
    (selected: number) => {
      if (!config || startLoggedRef.current) return;
      startLoggedRef.current = true;
      startTimestampRef.current = Date.now();
      logDebug("start", {
        configId: config.id,
        cluster: config.cluster,
        mode: config.mode,
        timeAvailableMin: selected,
      });
      if (persistenceEnabled) {
        void recordDailyPathEvent(userId, {
          configId: config.id,
          cluster: config.cluster,
          mode: config.mode,
          lang: config.lang,
          event: "start",
          timeAvailableMin: selected,
        });
      }
    },
    [config, logDebug, persistenceEnabled, userId],
  );

  useEffect(() => {
    if (!config) return;
    if (startLoggedRef.current) return;
    if (pendingStartMinutesRef.current == null) return;
    if (modeHint && config.mode !== modeHint) return;
    const selected = pendingStartMinutesRef.current;
    pendingStartMinutesRef.current = null;
    logPathStart(selected);
  }, [config, modeHint, logPathStart, timeAvailableMin]);

useEffect(() => {
  if (!config || !pathFinished || completionLoggedRef.current) return;
    completionLoggedRef.current = true;
    if (!persistenceEnabled) return;
    const completionDate = new Date();
    const nodesCompletedCount = completedNodeIds.length;
    const durationSeconds =
      startTimestampRef.current != null
        ? Math.max(0, Math.round((Date.now() - startTimestampRef.current) / 1000))
        : null;
    logDebug("completed", {
      configId: config.id,
      xp,
      nodesCompletedCount,
      pathVariant,
      durationSeconds,
    });
    void (async () => {
      await recordDailyPathEvent(userId, {
        configId: config.id,
        cluster: config.cluster,
        mode: config.mode,
        lang: config.lang,
        event: "completed",
        xpDelta: xp,
        nodesCompletedCount,
        pathVariant,
        durationSeconds,
      });
      if (userId && currentArcId) {
        try {
          await applyDailyPracticeCompletion(userId, currentArcId, xp, completionDate);
        } catch (error) {
          console.warn("applyDailyPracticeCompletion failed", error);
        }
      }
    })();
  }, [
    config,
    pathFinished,
    userId,
    xp,
    currentArcId,
    completedNodeIds.length,
    pathVariant,
    logDebug,
    persistenceEnabled,
  ]);

  useEffect(() => {
    if (!config || !pathFinished || completionNotifiedRef.current) return;
    completionNotifiedRef.current = true;
    onCompleted?.();
  }, [config, onCompleted, pathFinished]);

  const handleNodeAction = (node: DailyPathNodeConfig) => {
    if (!config) return;
    if (node.id !== currentActiveId) return;
    markNodeCompleted(node);
  };

  const markNodeCompleted = (
    node: DailyPathNodeConfig,
    xpOverride?: number,
    options?: { skipAdvance?: boolean; customCompletedList?: string[] },
  ) => {
    if (!config) return;
    const alreadyCompleted = completedNodeIds.includes(node.id);
    const updated =
      options?.customCompletedList ?? (alreadyCompleted ? completedNodeIds : [...completedNodeIds, node.id]);
    if (!alreadyCompleted || options?.customCompletedList) {
      setCompletedNodeIds(updated);
    }
    if (alreadyCompleted && !options?.customCompletedList) return;
    const xpDelta = typeof xpOverride === "number" ? Math.max(0, xpOverride) : node.xp;
    if (xpDelta > 0) {
      setXp((prevXp) => prevXp + xpDelta);
    }
    logDebug("node_completed", { nodeId: node.id, xpDelta, skipAdvance: options?.skipAdvance });
    if (!options?.skipAdvance) {
      advanceToNext(node.id, updated);
    }
    if (persistenceEnabled) {
      void recordDailyPathEvent(userId, {
        configId: config.id,
        cluster: config.cluster,
        mode: config.mode,
        lang: config.lang,
        event: "node_completed",
        nodeId: node.id,
        xpDelta,
      });
    }
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
      setSoftPathChosen(true);
      setPathVariant("soft");
      const updated = completedNodeIds.includes(autonomyNode.id)
        ? [...completedNodeIds]
        : [...completedNodeIds, autonomyNode.id];
      markNodeCompleted(autonomyNode, 0, { skipAdvance: true, customCompletedList: updated });
      const softNode = processedNodes.find((node) => node.softPathOnly);
      if (softNode) {
        setActiveNodeId(softNode.id);
        return;
      }
      advanceToNext(autonomyNode.id, updated);
      return;
    }
    setPathVariant("challenge");
    markNodeCompleted(autonomyNode);
  };

  if (!config) {
    return (
      <div className="rounded-[20px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-6 text-center text-sm text-[var(--omni-muted)]">
        {copy.preparing}
      </div>
    );
  }
  const clusterSummary =
    CLUSTER_SUMMARY[config.cluster]?.[activeLang] ?? CLUSTER_SUMMARY[config.cluster]?.ro;
  const trainedSkill = config.skillLabel ?? clusterSummary?.skill ?? null;

  return (
    <div className="mt-6 w-full rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] py-4 shadow-[0_18px_40px_rgba(0,0,0,0.08)] sm:mt-8 sm:py-5">
      <div className="mx-auto flex w-full max-w-[520px] flex-col space-y-2 px-2 sm:space-y-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-[var(--omni-ink)]">{copy.title}</h3>
          <span className="rounded-full bg-[var(--omni-bg-main)] px-3 py-[4px] text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)]">
            {copy.xpLabel}: {xp}
          </span>
          <span className="ml-auto text-[11px] uppercase tracking-[0.3em] text-[var(--omni-muted)] sm:text-xs">
            {currentProgress}
            {copy.progressSuffix}
          </span>
        </div>
        <div className="mt-1 flex flex-col space-y-1 text-[13px] text-[var(--omni-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:space-y-0">
          {totalVisibleNodes > 0 ? (
            <span>{copy.stepLabel(Math.min(displayStep, totalVisibleNodes), totalVisibleNodes)}</span>
          ) : null}
          <span>
            {copy.durationLabel}: {copy.durations[config.mode]}
          </span>
        </div>
        <div className="mt-2 space-y-2 rounded-[16px] bg-[var(--omni-bg-main)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--omni-ink)]">
            {activeLang === "ro" ? "Cât timp ai azi?" : "How much time do you have?"}
          </p>
          <div className="flex flex-wrap gap-2">
            {localizedTimeOptions.map((option) => {
              const isSelected = timeAvailableMin === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={timeSelectionLocked}
                  onClick={() => handleTimeSelect(option.value)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    isSelected
                      ? "border-[var(--omni-ink)] bg-[var(--omni-ink)] text-white"
                      : "border-[var(--omni-border-soft)] text-[var(--omni-ink)]"
                  } ${timeSelectionLocked ? "opacity-60" : "hover:border-[var(--omni-ink)]"}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {timeAvailableMin == null ? (
            <p className="text-xs text-[var(--omni-muted)]">
              {activeLang === "ro"
                ? "Selectează timpul pentru a adapta traseul de azi."
                : "Select your time window to tailor today’s path."}
            </p>
          ) : (
            <div className="text-xs text-[var(--omni-muted)] space-y-1">
              <p>
                {timeSelectionLocked
                  ? activeLang === "ro"
                    ? "Am notat timpul – poți continua traseul."
                    : "Time saved – you can continue the path."
                  : activeLang === "ro"
                  ? "Poți ajusta timpul înainte să începem."
                  : "You can adjust the time before we start."}
              </p>
              <p>
                {activeLang === "ro"
                  ? `Debug: ${timeAvailableMin} min → mod ${modeHint ?? config.mode}`
                  : `Debug: ${timeAvailableMin} min → mode ${modeHint ?? config.mode}`}
              </p>
            </div>
          )}
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
                  lang={config.lang}
                />
                {index < visibleNodes.length - 1 ? <PathConnector /> : null}
              </div>
            );
          })}
        </div>
        {pathFinished ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-3 text-sm text-[var(--omni-ink)]">
            <div>
              <span>Ai terminat traseul de azi! +{COMPLETION_BONUS} XP bonus.</span>
              {trainedSkill ? (
                <p className="text-xs text-[var(--omni-muted)]">
                  {copy.skillIntro}: {trainedSkill}
                </p>
              ) : null}
            </div>
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
