"use client";

import Link from "next/link";
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
import { recordDailyRunnerEvent } from "@/lib/progressFacts/recorders";
import {
  logExecutionIntent,
  logExecutionStart,
  logExecutionCompletion,
  logExecutionAbandon,
} from "@/lib/execution/executionTelemetry";
import { applyDailyPracticeCompletion } from "@/lib/arcMetrics";
import { CLUSTER_REGISTRY } from "@/config/clusterRegistry";
import { getShownVocabIdForToday } from "@/lib/vocabProgress";
import { getTodayKey } from "@/lib/dailyCompletion";
import { resolveVocab } from "@/components/vocab/useVocab";

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
  streakDays?: number | null;
  bestStreakDays?: number | null;
  decisionReason?: string | null;
  policyReason?: string | null;
  vocabDayKey?: string | null;
};

type MissionBriefCopy = {
  title: string;
  description: string;
  recommendation: string;
  scienceTag: string;
  productTag: string;
  domains: string[];
  kpis: string[];
};

type MissionTimeOption = {
  id: string;
  value: number;
  label: Record<DailyPathLanguage, string>;
  copy: Record<DailyPathLanguage, MissionBriefCopy>;
};

const MISSION_TIME_OPTIONS: MissionTimeOption[] = [
  {
    id: "rapid_reset",
    value: 7,
    label: { ro: "5–7 min", en: "5–7 min" },
    copy: {
      ro: {
        title: "Micro-reset · Energie funcțională",
        description:
          "Anchorezi respirația și focusul pentru a ridica inițierea task-urilor și a reduce zgomotul mental.",
        recommendation: "Folosește acest sprint când ai fereastră scurtă sau energie scăzută.",
        scienceTag: "Backbone științific · Energie funcțională",
        productTag: "Backbone produs · Sprint rapid",
        domains: ["Energie funcțională", "Reglare emoțională"],
        kpis: ["Inițiere task", "Timp de recuperare"],
      },
      en: {
        title: "Micro reset · Functional energy",
        description:
          "Guided breathing and focus anchors to boost task initiation and quiet noisy thoughts.",
        recommendation: "Use this sprint when the window is short or energy feels low.",
        scienceTag: "Scientific backbone · Functional energy",
        productTag: "Product backbone · Rapid sprint",
        domains: ["Functional energy", "Emotional regulation"],
        kpis: ["Task initiation", "Recovery time"],
      },
    },
  },
  {
    id: "stability_core",
    value: 15,
    label: { ro: "10–15 min", en: "10–15 min" },
    copy: {
      ro: {
        title: "Stabilizare decizională",
        description:
          "Combină exerciții de claritate și control executiv. Obții intenție clară și scenarii de decizie.",
        recommendation: "Ideal pentru o zi standard sau când vrei intenție fermă înainte de lucru.",
        scienceTag: "Backbone științific · Control executiv",
        productTag: "Backbone produs · Misiune standard",
        domains: ["Control executiv", "Claritate decizională"],
        kpis: ["Latență decizie", "Consistență răspuns"],
      },
      en: {
        title: "Decision stabilizer",
        description:
          "Pairs clarity drills with executive control so you exit with one firm intention and scenarios.",
        recommendation: "Best for standard days or when you need a confident pre-work briefing.",
        scienceTag: "Scientific backbone · Executive control",
        productTag: "Product backbone · Core mission",
        domains: ["Executive control", "Decision clarity"],
        kpis: ["Decision latency", "Response consistency"],
      },
    },
  },
  {
    id: "deep_adaptive",
    value: 20,
    label: { ro: "20+ min", en: "20+ min" },
    copy: {
      ro: {
        title: "Sprint profund adaptiv",
        description:
          "Intri în modul Deep: parcurgi întregul arc cu autonomie, provocări și recap energetic.",
        recommendation: "Alege-l când vrei upgrade real al indicatorilor și timp dedicat.",
        scienceTag: "Backbone științific · Control executiv+",
        productTag: "Backbone produs · Quest complet",
        domains: ["Control executiv", "Claritate decizională", "Reglare emoțională"],
        kpis: ["Error rate sub interferență", "Degradare sub presiune", "Curba de oboseală cognitivă"],
      },
      en: {
        title: "Deep adaptive sprint",
        description:
          "Enter full Deep mode with autonomy choices, challenge branch and energy recap.",
        recommendation: "Pick this when you want measurable KPI upgrades and dedicated focus.",
        scienceTag: "Scientific backbone · Executive+",
        productTag: "Product backbone · Full quest",
        domains: ["Executive control", "Decision clarity", "Emotional regulation"],
        kpis: ["Error rate under interference", "Drop-off under pressure", "Cognitive fatigue curve"],
      },
    },
  },
] as const;

const validModes: DailyPathMode[] = ["short", "deep"];

function getNow(): number {
  return Date.now();
}

export default function DailyPath({
  config,
  userId = null,
  currentArcId = null,
  disablePersistence = false,
  defaultTimeSelection = null,
  modeHint = null,
  onTimeSelection,
  onCompleted,
  streakDays = null,
  bestStreakDays = null,
  decisionReason = null,
  policyReason = null,
  vocabDayKey = null,
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
  const missionBriefStartRef = useRef<number | null>(null);
  const missionBriefSelectionLoggedRef = useRef(false);
  const questMapLoggedRef = useRef<string | null>(null);
  const questCompletionLoggedRef = useRef<string | null>(null);
  const nodeIntentTimesRef = useRef<Record<string, number>>({});
  const nodeStartTimesRef = useRef<Record<string, number>>({});
  const activeLang: DailyPathLanguage = config?.lang ?? "ro";
  const persistenceEnabled = !disablePersistence;
  const copy = DAILY_PATH_COPY[activeLang] ?? DAILY_PATH_COPY.ro;
  const localizedMissionOptions = useMemo(
    () =>
      MISSION_TIME_OPTIONS.map((opt) => ({
        id: opt.id,
        value: opt.value,
        label: opt.label[activeLang] ?? opt.label.ro,
        copy: opt.copy[activeLang] ?? opt.copy.ro,
      })),
    [activeLang],
  );
  const missionCardCopy = useMemo(() => {
    if (activeLang === "en") {
      return {
        heading: "Mission brief (time & load)",
        helper: "Pick the brief that matches your real window so we can align the scientific backbone with today's product path.",
        helperSelectedLocked: "Time saved – mode is calibrated. Continue the path.",
        helperSelectedUnlocked: "You can still adjust the brief before we start.",
        domainLabel: "Domains",
        kpiLabel: "KPIs",
        debugLabel: "Debug",
      };
    }
    return {
      heading: "Brieful de misiune (timp & încărcare)",
      helper: "Alege brieful care se potrivește ferestrei reale ca să aliniem backbone-ul științific cu traseul.",
      helperSelectedLocked: "Am salvat timpul – modul este calibrat. Continuă traseul.",
      helperSelectedUnlocked: "Poți ajusta brieful înainte să începem.",
      domainLabel: "Domenii urmărite",
      kpiLabel: "Indicatori (KPI)",
      debugLabel: "Debug",
    };
  }, [activeLang]);
  const questMapCopy = useMemo(() => {
    if (activeLang === "en") {
      return {
        badge: "Quest map",
        subline: "Every node unlocks XP on today's arc.",
        streakLabel: "streak",
        activeLabel: "Now playing",
        lockedLabel: "Locked",
        completedLabel: "Cleared",
        celebrationTitle: "Daily quest complete",
        celebrationBody: (streak: number, best: number) => {
          if (streak > 1 && streak >= best) {
            return `New best streak: ${streak} days. XP added to Foundation Cycle.`;
          }
          if (streak > 1) {
            return `You kept the streak alive (${streak} days). XP added to Foundation Cycle.`;
          }
          return "You unlocked today's adaptive mission. XP saved to your arc.";
        },
      };
    }
    return {
      badge: "Quest map",
      subline: "Fiecare nod adaugă XP pe arcul de azi.",
      streakLabel: "serie",
      activeLabel: "În progres",
      lockedLabel: "Blocat",
      completedLabel: "Finalizat",
      celebrationTitle: "Ai închis quest-ul de azi",
      celebrationBody: (streak: number, best: number) => {
        if (streak > 1 && streak >= best) {
          return `Ai depășit recordul: ${streak} zile în serie. XP-ul merge în Foundation Cycle.`;
        }
        if (streak > 1) {
          return `Serie activă: ${streak} zile. XP-ul merge în Foundation Cycle.`;
        }
        return "Ai deblocat misiunea adaptivă de azi. XP-ul e salvat în arc.";
      },
    };
  }, [activeLang]);
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
  const configRef = useRef(config);
  const visibleNodesRef = useRef(visibleNodes);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    visibleNodesRef.current = visibleNodes;
  }, [visibleNodes]);
  const todaysVocabId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const dayKey = vocabDayKey ?? getTodayKey();
    return getShownVocabIdForToday(dayKey);
  }, [vocabDayKey]);
  const questSteps = useMemo(() => {
    return visibleNodes.map((node, index) => {
      const isCompleted = completedNodeIds.includes(node.id);
      const status: "completed" | "active" | "locked" =
        isCompleted ? "completed" : node.id === currentActiveId ? "active" : "locked";
      return {
        id: node.id,
        order: index + 1,
        title: node.title,
        status,
        xp: node.xp,
      };
    });
  }, [visibleNodes, completedNodeIds, currentActiveId]);
  const todaysVocab = useMemo(() => (todaysVocabId ? resolveVocab(todaysVocabId) : null), [todaysVocabId]);
  const todaysReflexCopy = useMemo(() => {
    if (!todaysVocab) return null;
    const label = activeLang === "en" ? "Reflex trained" : "Reflex antrenat";
    const command = todaysVocab.command[activeLang] ?? todaysVocab.command.ro;
    return { label, command };
  }, [todaysVocab, activeLang]);
  const activeQuestStep =
    questSteps.find((step) => step.status === "active") ??
    questSteps.find((step) => step.status === "locked") ??
    questSteps[questSteps.length - 1];

  useEffect(() => {
    if (!config || !persistenceEnabled) {
      if (!config) questMapLoggedRef.current = null;
      return;
    }
    if (questMapLoggedRef.current === config.id) return;
    questMapLoggedRef.current = config.id;
    void recordDailyRunnerEvent({
      type: "quest_map_view",
      configId: config.id,
      cluster: config.cluster,
      mode: config.mode,
      optionValue: visibleNodes.length,
      label: typeof streakDays === "number" ? `streak:${streakDays}` : undefined,
      context: "quest_map",
    });
  }, [config, persistenceEnabled, visibleNodes.length, streakDays]);

  useEffect(() => {
    if (!config) return;
    if (!currentActiveId) return;
    const activeNode = visibleNodes.find((node) => node.id === currentActiveId);
    if (!activeNode) return;
    if (nodeIntentTimesRef.current[activeNode.id]) return;
    const timestamp = getNow();
    nodeIntentTimesRef.current[activeNode.id] = timestamp;
    logExecutionIntent({
      userId,
      moduleKey: config.moduleKey ?? null,
      cluster: config.cluster,
      mode: config.mode,
      lang: config.lang,
      skillLabel: config.skillLabel,
      nodeId: activeNode.id,
      nodeKind: activeNode.kind,
      nodeTitle: activeNode.title,
      xp: activeNode.xp,
      intentTimestamp: timestamp,
    });
  }, [config, currentActiveId, userId, visibleNodes]);

  const ensureNodeStartLogged = useCallback(
    (node: DailyPathNodeConfig) => {
      if (!config) return null;
      if (nodeStartTimesRef.current[node.id]) {
        return nodeStartTimesRef.current[node.id];
      }
      const startTimestamp = getNow();
      nodeStartTimesRef.current[node.id] = startTimestamp;
      const intentTimestamp = nodeIntentTimesRef.current[node.id];
      logExecutionStart({
        userId,
        moduleKey: config.moduleKey ?? null,
        cluster: config.cluster,
        mode: config.mode,
        lang: config.lang,
        skillLabel: config.skillLabel,
        nodeId: node.id,
        nodeKind: node.kind,
        nodeTitle: node.title,
        xp: node.xp,
        startTimestamp,
        latencyMs: intentTimestamp ? Math.max(0, startTimestamp - intentTimestamp) : undefined,
      });
      return startTimestamp;
    },
    [config, userId],
  );

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
    questCompletionLoggedRef.current = null;
  }, [config]);

useEffect(() => {
  if (!config) return;
  const id = window.setTimeout(() => {
    resetState();
  }, 0);
  return () => window.clearTimeout(id);
}, [config, resetState]);

  useEffect(() => {
    if (!config || !persistenceEnabled) {
      missionBriefStartRef.current = null;
      missionBriefSelectionLoggedRef.current = false;
      return;
    }
    missionBriefStartRef.current = getNow();
    missionBriefSelectionLoggedRef.current = false;
    void recordDailyRunnerEvent({
      type: "mission_brief_view",
      configId: config.id,
      cluster: config.cluster,
      mode: config.mode,
      context: "mission_brief",
    });
    return () => {
      if (missionBriefSelectionLoggedRef.current || missionBriefStartRef.current == null) {
        missionBriefStartRef.current = null;
        return;
      }
      const dwell = getNow() - missionBriefStartRef.current;
      missionBriefStartRef.current = null;
      void recordDailyRunnerEvent({
        type: "mission_brief_bounce",
        configId: config.id,
        cluster: config.cluster,
        mode: config.mode,
        dwellMs: dwell,
        context: "mission_brief",
      });
    };
  }, [config, persistenceEnabled]);

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
    (selected: number, meta?: { id?: string; label?: string }) => {
      if (!config || timeSelectionLocked) return;
      setTimeAvailableMin(selected);
      onTimeSelection?.(selected);
      pendingStartMinutesRef.current = selected;
      setTimeSelectionLocked(true);
      if (persistenceEnabled) {
        missionBriefSelectionLoggedRef.current = true;
        const dwell =
          missionBriefStartRef.current != null ? Math.max(0, getNow() - missionBriefStartRef.current) : null;
        void recordDailyRunnerEvent({
          type: "mission_brief_select",
          configId: config.id,
          cluster: config.cluster,
          mode: config.mode,
          optionId: meta?.id ?? null,
          optionValue: selected,
          label: meta?.label ?? null,
          ttfaMs: dwell ?? undefined,
          context: "mission_brief",
        });
      }
    },
    [config, onTimeSelection, persistenceEnabled, timeSelectionLocked],
  );

  const logPathStart = useCallback(
    (selected: number) => {
      if (!config || startLoggedRef.current) return;
      startLoggedRef.current = true;
      startTimestampRef.current = getNow();
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
    return () => {
      const cfg = configRef.current;
      if (!cfg) return;
      const nodes = visibleNodesRef.current;
      const abandonTimestamp = getNow();
      Object.entries(nodeIntentTimesRef.current).forEach(([nodeId, intentTs]) => {
        if (nodeStartTimesRef.current[nodeId]) return;
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;
        logExecutionAbandon({
          userId,
          moduleKey: cfg.moduleKey ?? null,
          cluster: cfg.cluster,
          mode: cfg.mode,
          lang: cfg.lang,
          skillLabel: cfg.skillLabel,
          nodeId,
          nodeKind: node.kind,
          nodeTitle: node.title,
          xp: node.xp,
          abandonTimestamp,
          elapsedMs: abandonTimestamp - intentTs,
        });
      });
      nodeIntentTimesRef.current = {};
      nodeStartTimesRef.current = {};
    };
  }, [userId]);

useEffect(() => {
  if (!config || !pathFinished || completionLoggedRef.current) return;
    completionLoggedRef.current = true;
    if (!persistenceEnabled) return;
    const completionDate = new Date();
    const nodesCompletedCount = completedNodeIds.length;
    const durationSeconds =
      startTimestampRef.current != null
        ? Math.max(0, Math.round((getNow() - startTimestampRef.current) / 1000))
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
    if (!config || !pathFinished || !persistenceEnabled) return;
    if (questCompletionLoggedRef.current === config.id) return;
    questCompletionLoggedRef.current = config.id;
    void recordDailyRunnerEvent({
      type: "quest_complete",
      configId: config.id,
      cluster: config.cluster,
      mode: config.mode,
      optionValue: xp,
      label: typeof streakDays === "number" ? `streak:${streakDays}` : undefined,
      context: "quest_map",
    });
  }, [config, pathFinished, persistenceEnabled, xp, streakDays]);

  useEffect(() => {
    if (!config || !pathFinished || completionNotifiedRef.current) return;
    completionNotifiedRef.current = true;
    onCompleted?.();
  }, [config, onCompleted, pathFinished]);

  const handleNodeAction = (node: DailyPathNodeConfig) => {
    if (!config) return;
    if (node.id !== currentActiveId) return;
    ensureNodeStartLogged(node);
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
    const completeTimestamp = getNow();
    const startTimestamp = ensureNodeStartLogged(node) ?? completeTimestamp;
    logExecutionCompletion({
      userId,
      moduleKey: config.moduleKey ?? null,
      cluster: config.cluster,
      mode: config.mode,
      lang: config.lang,
      skillLabel: config.skillLabel,
      nodeId: node.id,
      nodeKind: node.kind,
      nodeTitle: node.title,
      xp: xpDelta,
      completeTimestamp,
      durationMs: Math.max(0, completeTimestamp - startTimestamp),
    });
    delete nodeIntentTimesRef.current[node.id];
    delete nodeStartTimesRef.current[node.id];
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
        {decisionReason ? (
          <div className="rounded-[14px] border border-dashed border-[var(--omni-border-soft)] bg-white/70 px-3 py-2 text-xs text-[var(--omni-ink)]/80">
            <p className="font-semibold text-[var(--omni-ink)]">
              {activeLang === "ro" ? "De ce ai primit acest traseu" : "Why you got this path"}
            </p>
            <p className="mt-1">{decisionReason}</p>
            {policyReason ? (
              <p className="mt-1 text-[var(--omni-muted)]">
                {activeLang === "ro" ? "Politica adaptivă" : "Adaptive policy"}: {policyReason}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-1 flex flex-col space-y-1 text-[13px] text-[var(--omni-muted)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:space-y-0">
          {totalVisibleNodes > 0 ? (
            <span>{copy.stepLabel(Math.min(displayStep, totalVisibleNodes), totalVisibleNodes)}</span>
          ) : null}
          <span>
            {copy.durationLabel}: {copy.durations[config.mode]}
          </span>
        </div>
        <div className="mt-2 space-y-3 rounded-[18px] bg-[var(--omni-bg-main)] px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--omni-ink)]">{missionCardCopy.heading}</p>
            <p className="text-xs text-[var(--omni-muted)]">{missionCardCopy.helper}</p>
          </div>
          <div className="space-y-3">
            {localizedMissionOptions.map((option) => {
              const isSelected = timeAvailableMin === option.value;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={timeSelectionLocked}
                  onClick={() => handleTimeSelect(option.value, { id: option.id, label: option.label })}
                  className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-[var(--omni-ink)] bg-[var(--omni-ink)]/5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                      : "border-[var(--omni-border-soft)] bg-white/70 hover:border-[var(--omni-ink)]/70"
                  } ${timeSelectionLocked ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[var(--omni-ink)]">{option.label}</div>
                    <span
                      className={`text-[11px] uppercase tracking-[0.25em] ${
                        isSelected ? "text-[var(--omni-ink)]" : "text-[var(--omni-muted)]"
                      }`}
                    >
                      {isSelected
                        ? activeLang === "ro"
                          ? "Selectat"
                          : "Selected"
                        : activeLang === "ro"
                        ? "Brieful tău"
                        : "Your brief"}
                    </span>
                  </div>
                  <h4 className="mt-2 text-base font-semibold text-[var(--omni-ink)]">{option.copy.title}</h4>
                  <p className="mt-1 text-sm text-[var(--omni-ink)]/80">{option.copy.description}</p>
                  <p className="mt-2 text-xs font-medium text-[var(--omni-ink)]/80">{option.copy.recommendation}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--omni-ink)]/5 px-3 py-1 text-[11px] font-semibold text-[var(--omni-ink)]/80">
                      {option.copy.scienceTag}
                    </span>
                    <span className="rounded-full bg-[var(--omni-border-soft)]/40 px-3 py-1 text-[11px] font-medium text-[var(--omni-ink)]/70">
                      {option.copy.productTag}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-[11px] text-[var(--omni-muted)]">
                    <p>
                      <span className="font-semibold text-[var(--omni-ink)]/70">{missionCardCopy.domainLabel}:</span>{" "}
                      {option.copy.domains.join(" · ")}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--omni-ink)]/70">{missionCardCopy.kpiLabel}:</span>{" "}
                      {option.copy.kpis.join(" · ")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {timeAvailableMin == null ? (
            <p className="text-xs text-[var(--omni-muted)]">
              {activeLang === "ro"
                ? "Selectează un brief ca să pornim Path-ul de azi."
                : "Select a brief to launch today's path."}
            </p>
          ) : (
            <div className="space-y-1 text-xs text-[var(--omni-muted)]">
              <p>{timeSelectionLocked ? missionCardCopy.helperSelectedLocked : missionCardCopy.helperSelectedUnlocked}</p>
              <p>
                {missionCardCopy.debugLabel}: {timeAvailableMin} min →{" "}
                {activeLang === "ro" ? `mod ${modeHint ?? config.mode}` : `mode ${modeHint ?? config.mode}`}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-4 rounded-[22px] border border-[var(--omni-border-soft)] bg-gradient-to-b from-white/95 via-[var(--omni-bg-main)] to-white/90 px-4 py-5 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-[var(--omni-muted)]">{questMapCopy.badge}</p>
              <p className="text-sm text-[var(--omni-ink)]/80">{questMapCopy.subline}</p>
            </div>
            {typeof streakDays === "number" && streakDays > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[13px] font-semibold text-[var(--omni-ink)]">
                <span className="text-[10px] uppercase tracking-[0.4em] text-[var(--omni-muted)]">
                  {questMapCopy.streakLabel}
                </span>
                <span>{streakDays}d</span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {questSteps.map((step, index) => {
              const isCompleted = step.status === "completed";
              const isActive = step.status === "active";
              const circleClasses = isCompleted
                ? "bg-[var(--omni-energy)] text-white border-[var(--omni-energy)]"
                : isActive
                ? "border-[var(--omni-ink)] text-[var(--omni-ink)] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)] animate-pulse"
                : "border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)] bg-white opacity-80";
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300 ${circleClasses}`}
                    >
                      <span>{step.order}</span>
                      <span className="text-[9px] uppercase tracking-[0.3em]">
                        {isCompleted
                          ? questMapCopy.completedLabel
                          : isActive
                          ? questMapCopy.activeLabel
                          : questMapCopy.lockedLabel}
                      </span>
                    </div>
                    <span className="rounded-full bg-white/90 px-2 py-[2px] text-[10px] font-semibold text-[var(--omni-ink)] shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
                      +{step.xp} XP
                    </span>
                  </div>
                  {index < questSteps.length - 1 ? (
                    <div
                      className={`h-[2px] w-10 rounded-full transition-colors duration-300 ${
                        isCompleted
                          ? "bg-[var(--omni-energy)]"
                          : isActive
                          ? "bg-[var(--omni-ink)]/70"
                          : "bg-[var(--omni-border-soft)]"
                      }`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          {activeQuestStep ? (
            <div className="rounded-[14px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-3 text-sm text-[var(--omni-ink)]/80">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">
                {questMapCopy.activeLabel}
              </p>
              <p className="mt-1 text-[var(--omni-ink)]">{activeQuestStep.title}</p>
              <p className="text-[11px] text-[var(--omni-muted)]">
                XP {activeQuestStep.xp} · {copy.stepLabel(activeQuestStep.order, questSteps.length)}
              </p>
            </div>
          ) : null}
          {pathFinished ? (
            <div className="relative overflow-hidden rounded-[22px] border border-[var(--omni-energy)]/40 bg-[var(--omni-bg-paper)]/95 px-5 py-5 text-sm text-[var(--omni-ink)] shadow-[0_16px_48px_rgba(0,0,0,0.15)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsla(28,60%,80%,0.25),_transparent_60%)]" />
              <div className="relative space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-ink)]/70">
                  {questMapCopy.badge}
                </p>
                <p className="text-lg font-semibold">{questMapCopy.celebrationTitle}</p>
              <p className="text-xs text-[var(--omni-ink)]/80">
                {questMapCopy.celebrationBody(
                  typeof streakDays === "number" ? streakDays : 0,
                  typeof bestStreakDays === "number" ? bestStreakDays : 0,
                )}
              </p>
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <OmniCtaButton as="link" href="/progress">
                    {activeLang === "ro" ? "Vezi progresul" : "View progress"}
                  </OmniCtaButton>
                  <Link
                    href="/arenas"
                    className="inline-flex items-center justify-center rounded-full border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--omni-ink)] transition hover:bg-[var(--omni-ink)]/5"
                  >
                    {activeLang === "ro" ? "Antrenează 90s" : "Train 90s"}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
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
              {todaysReflexCopy ? (
                <p className="text-xs text-[var(--omni-energy)]/80">
                  {todaysReflexCopy.label}: {todaysReflexCopy.command}
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
