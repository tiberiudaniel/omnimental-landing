"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { track } from "@/lib/telemetry/track";
import { useProfile } from "@/components/ProfileProvider";
import DailyPathRunner from "@/components/today/DailyPathRunner";
import { getTodayModuleKey, hasCompletedToday, markDailyCompletion, setTriedExtraToday } from "@/lib/dailyCompletion";
import { advanceArcProgress, addTraitXp, getTraitLabel } from "@/lib/profileEngine";
import { readTodayPlan, clearTodayPlan } from "@/lib/todayPlanStorage";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { getWowLessonDefinition, resolveTraitPrimaryForModule } from "@/config/wowLessonsV2";
import WowLessonShell, { type WowCompletionPayload } from "@/components/wow/WowLessonShell";
import type { StoredInitiationBlock, StoredTodayPlan } from "@/lib/todayPlanStorage";
import { recordSessionTelemetry } from "@/lib/telemetry";
import { isGuidedDayOneLane } from "@/lib/guidedDayOne";
import { buildPlanKpiEvent } from "@/lib/sessionTelemetry";
import { recordDailyRunnerEvent, recordDailySessionCompletion } from "@/lib/progressFacts/recorders";
import { useUserAccessTier } from "@/components/useUserAccessTier";
import { resolveInitiationLesson } from "@/lib/content/resolveLessonToExistingContent";
import type { LessonId } from "@/lib/taxonomy/types";
import { completeInitiationRunFromPlan } from "@/lib/today/completeInitiationRun";
import {
  clearInitiationRunState,
  readInitiationRunState,
  saveInitiationRunState,
  type InitiationRunState,
  type RecallResponse,
} from "@/lib/today/initiationRunState";
import InitiationRecallBlock from "@/components/today/InitiationRecallBlock";
import type { RecallBlock } from "@/lib/initiations/buildRecallBlock";
import { setLastNavReason } from "@/lib/debug/runtimeDebug";
import { NAV_REASON } from "@/lib/debug/reasons";

const RuntimeDebugPanel = dynamic(() => import("@/components/debug/RuntimeDebugPanel").then((mod) => mod.RuntimeDebugPanel), {
  ssr: false,
});

const deriveCoreLessonId = (plan: StoredTodayPlan | null): LessonId | null => {
  if (!plan) return null;
  const fromBlocks = plan.initiationBlocks?.find(
    (block): block is StoredInitiationBlock & { lessonId: LessonId } =>
      block.kind === "core_lesson" && Boolean(block.lessonId),
  );
  if (fromBlocks?.lessonId) {
    return fromBlocks.lessonId as LessonId;
  }
  if (plan.initiationLessonIds?.length) {
    return plan.initiationLessonIds[0] as LessonId;
  }
  return null;
};

type LessonRuntimeBlock = {
  kind: "core_lesson" | "elective_practice";
  lesson: ReturnType<typeof resolveInitiationLesson>;
};

type RecallRuntimeBlock = {
  kind: "recall";
  prompt: RecallBlock;
};

type RuntimeBlock = LessonRuntimeBlock | RecallRuntimeBlock;

const getLessonIdFromBlock = (block: RuntimeBlock | null | undefined): LessonId | null => {
  if (!block) return null;
  if (block.kind === "core_lesson" || block.kind === "elective_practice") {
    return block.lesson.meta.lessonId;
  }
  return null;
};

const getForcedSentinelText = ({
  runState,
  initiationBlocks,
  storedPlan,
}: {
  runState: InitiationRunState | null;
  initiationBlocks: RuntimeBlock[] | null | undefined;
  storedPlan: StoredTodayPlan | null;
}): string => {
  if (runState && initiationBlocks?.length) {
    const boundedIndex = Math.min(Math.max(runState.blockIndex ?? 0, 0), initiationBlocks.length - 1);
    const activeLessonId = getLessonIdFromBlock(initiationBlocks[boundedIndex]);
    if (activeLessonId) {
      return activeLessonId;
    }
  }
  if (initiationBlocks?.length) {
    const firstCore = initiationBlocks.find(
      (block): block is LessonRuntimeBlock => block.kind === "core_lesson",
    );
    const fallbackLessonBlock =
      firstCore ??
      initiationBlocks.find((block): block is LessonRuntimeBlock => block.kind === "elective_practice");
    const fallbackLessonId = getLessonIdFromBlock(fallbackLessonBlock ?? null);
    if (fallbackLessonId) {
      return fallbackLessonId;
    }
  }
  const derivedCore = deriveCoreLessonId(storedPlan);
  if (derivedCore) {
    return derivedCore;
  }
  return "NO_PLAN";
};

function TodayRunPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const navLinks = useNavigationLinks();
  const { membershipTier } = useUserAccessTier();
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [storedPlan, setStoredPlan] = useState<StoredTodayPlan | null>(() => readTodayPlan());
  const [runState, setRunState] = useState<InitiationRunState | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const plan = readTodayPlan();
      if (!plan?.runId) return null;
      const existing = readInitiationRunState(plan.runId);
      if (existing) {
        return {
          runId: existing.runId,
          blockIndex: existing.blockIndex ?? 0,
          completed: existing.completed ?? {},
          responses: existing.responses ?? undefined,
        };
      }
      const initialState: InitiationRunState = {
        runId: plan.runId,
        blockIndex: 0,
        completed: {},
      };
      saveInitiationRunState(initialState);
      return initialState;
    } catch {
      return null;
    }
  });
  const initiationPlanResolution = useMemo(() => {
    const fallbackModule = storedPlan?.moduleId ?? getTodayModuleKey();
    let moduleKey = fallbackModule;
    let moduleError: string | null = null;
    if (storedPlan?.worldId === "INITIATION") {
      const coreLessonId = deriveCoreLessonId(storedPlan);
      if (coreLessonId) {
        try {
          const lesson = resolveInitiationLesson(coreLessonId);
          moduleKey = lesson.refId;
        } catch (error) {
          console.warn("[today/run] failed to resolve initiation lesson", error);
          moduleError = `Failed to resolve core lesson: ${String(error)}`;
          moduleKey = fallbackModule;
        }
      } else {
        moduleError = "Missing initiation core lesson in stored plan";
        moduleKey = fallbackModule;
      }
    } else if (storedPlan?.moduleId) {
      moduleKey = storedPlan.moduleId;
    } else {
      moduleKey = getTodayModuleKey();
    }
    let blocks: RuntimeBlock[] | null = null;
    let blockError: string | null = null;
    if (storedPlan?.worldId === "INITIATION") {
      const storedBlocks = storedPlan.initiationBlocks ?? null;
      if (storedBlocks?.length) {
        try {
          const resolvedBlocks = storedBlocks
            .map((block) => {
              if ((block.kind === "core_lesson" || block.kind === "elective_practice") && block.lessonId) {
                const lesson = resolveInitiationLesson(block.lessonId as LessonId);
                return { kind: block.kind, lesson } as LessonRuntimeBlock;
              }
              if (block.kind === "recall" && block.prompt) {
                return { kind: "recall", prompt: block.prompt } as RecallRuntimeBlock;
              }
              return null;
            })
            .filter((entry): entry is RuntimeBlock => Boolean(entry));
          if (resolvedBlocks.length) {
            blocks = resolvedBlocks;
          }
        } catch (error) {
          console.warn("[today/run] failed to resolve initiation blocks", error);
          blockError = `Failed to resolve initiation blocks: ${String(error)}`;
        }
      }
    }
    return {
      moduleKey,
      blocks,
      error: blockError ?? moduleError,
    };
  }, [storedPlan]);
  const initiationBlocks = initiationPlanResolution.blocks;
  const baseTodayModuleKey = initiationPlanResolution.moduleKey;
  const initiationResolutionError = initiationPlanResolution.error;
  const legacyForcedModuleConfig = useMemo(() => {
    if (!storedPlan || storedPlan.worldId !== "INITIATION") return null;
    const lessonId = deriveCoreLessonId(storedPlan);
    if (!lessonId) return null;
    try {
      const lesson = resolveInitiationLesson(lessonId);
      return {
        moduleKey: lesson.refId,
        cluster: lesson.meta.cluster,
      };
    } catch (error) {
      console.warn("[today/run] failed to build forced module config", error);
      return null;
    }
  }, [storedPlan]);
  const runStartLoggedRef = useRef(false);
  const runCompletionTriggeredRef = useRef(false);
  const runModeParam = searchParams.get("mode");
  const runSourceParam = searchParams.get("source");
  const laneParam = (searchParams.get("lane") ?? "").toLowerCase();
  const guidedLaneActive = isGuidedDayOneLane(runSourceParam, laneParam);
  const simulateParam = (searchParams.get("simulate") ?? "").toLowerCase() === "1";
  const simulateTodayRun = !guidedLaneActive && (simulateParam || (runSourceParam ?? "").toLowerCase() === "today_e2e");
  const runMode = runModeParam === "deep" ? "deep" : runModeParam === "quick" ? "quick" : runModeParam === "guided_day1" ? "guided_day1" : "standard";
  const roundParam = searchParams.get("round");
  const lessonModeParam = searchParams.get("lessonMode");
  const lessonMode = lessonModeParam === "short" ? "short" : "full";
  const isExtraRound = roundParam === "extra";
  const axisParam = searchParams.get("axis");
  const clusterParam = searchParams.get("cluster");
  const cookieE2E = useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((entry) => entry.trim().startsWith("omni_e2e=1"));
  }, []);
  const e2eMode = (searchParams.get("e2e") ?? "").toLowerCase() === "1" || cookieE2E;
  const debugFlagEnv = (process.env.NEXT_PUBLIC_TODAY_RUN_DEBUG || "").toLowerCase();
  const debugParamEnabled = (searchParams.get("debug") ?? "").toLowerCase() === "1";
  const debugEnabled = debugParamEnabled || debugFlagEnv === "1" || debugFlagEnv === "true";
  const blockDebugEnabled = debugEnabled || e2eMode;
  const forceDailyRunner = guidedLaneActive;
  const usingInitiationBlocks = Boolean(initiationBlocks?.length && storedPlan?.worldId === "INITIATION");
  const activeBlock =
    usingInitiationBlocks && runState && initiationBlocks
      ? initiationBlocks[Math.min(runState.blockIndex, initiationBlocks.length - 1)] ?? null
      : null;
  const activeLessonBlock =
    activeBlock && (activeBlock.kind === "core_lesson" || activeBlock.kind === "elective_practice") ? activeBlock : null;
  const activeRecallBlock = activeBlock && activeBlock.kind === "recall" ? activeBlock : null;
  const todayModuleKey = activeLessonBlock ? activeLessonBlock.lesson.refId : baseTodayModuleKey;
  const runModuleId = storedPlan?.moduleId ?? todayModuleKey;
  const sentinelText = useMemo(
    () => getForcedSentinelText({ runState, initiationBlocks, storedPlan }),
    [runState, initiationBlocks, storedPlan],
  );
  useEffect(() => {
    runCompletionTriggeredRef.current = false;
  }, [storedPlan?.runId]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let alive = true;
    const timeout = window.setTimeout(() => {
      if (!alive) return;
      setCompletedToday(hasCompletedToday());
      setStoredPlan(readTodayPlan());
      setInitialized(true);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [e2eMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let timeout: number | null = null;
    const schedule = (fn: () => void) => {
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => {
          if (!cancelled) fn();
        });
        return;
      }
      timeout = window.setTimeout(() => {
        if (!cancelled) fn();
      }, 0);
    };
    schedule(() => {
      if (!storedPlan?.runId) {
        setRunState(null);
        return;
      }
      const existing = readInitiationRunState(storedPlan.runId);
      if (!existing) {
        const initialState: InitiationRunState = {
          runId: storedPlan.runId,
          blockIndex: 0,
          completed: {},
        };
        setRunState(initialState);
        saveInitiationRunState(initialState);
        return;
      }
      const normalizedState: InitiationRunState = {
        runId: existing.runId,
        blockIndex: existing.blockIndex ?? 0,
        completed: existing.completed ?? {},
        responses: existing.responses ?? undefined,
      };
      setRunState(normalizedState);
    });
    return () => {
      cancelled = true;
      if (timeout !== null) {
        window.clearTimeout(timeout);
      }
    };
  }, [storedPlan?.runId]);

  const isBlocked = Boolean(
    membershipTier === "free" && completedToday && !isExtraRound && !e2eMode,
  );
  const runtimeDebugContext = useMemo(() => {
    if (!initiationBlocks?.length) {
      return {
        worldId: storedPlan?.worldId ?? "INITIATION",
        todayPlanVersion: storedPlan?.arcId ?? storedPlan?.moduleId ?? null,
        runId: storedPlan?.runId ?? runState?.runId ?? null,
        blockIndex: runState?.blockIndex ?? null,
        activeBlockKind: null,
        activeLessonId: null,
        moduleId: storedPlan?.moduleId ?? null,
        extras: {
          mode: runMode,
          blocked: isBlocked,
        },
      };
    }
    const index = Math.min(Math.max(runState?.blockIndex ?? 0, 0), initiationBlocks.length - 1);
    const block = initiationBlocks[index];
    const activeLessonId = block && block.kind !== "recall" ? block.lesson.meta.lessonId : null;
    return {
      worldId: storedPlan?.worldId ?? "INITIATION",
      todayPlanVersion: storedPlan?.arcId ?? storedPlan?.moduleId ?? null,
      runId: storedPlan?.runId ?? runState?.runId ?? null,
      blockIndex: runState?.blockIndex ?? null,
      activeBlockKind: block?.kind ?? null,
      activeLessonId,
      moduleId: storedPlan?.moduleId ?? null,
      extras: {
        mode: runMode,
        blocked: isBlocked,
      },
    };
  }, [initiationBlocks, isBlocked, runMode, runState, storedPlan]);

  useEffect(() => {
    if (e2eMode) return;
    if (!initialized) return;
    if (isBlocked) {
      track("daily_run_blocked_free_limit");
      setTriedExtraToday(true);
      return;
    }
    track("daily_run_started");
  }, [e2eMode, initialized, isBlocked]);

  useEffect(() => {
    if (e2eMode) return;
    if (!initialized || isBlocked || runStartLoggedRef.current) return;
    runStartLoggedRef.current = true;
    void recordDailyRunnerEvent({
      type: "today_run_started",
      mode: runMode,
      label: runModuleId ?? undefined,
    });
  }, [e2eMode, initialized, isBlocked, runMode, runModuleId]);

  const logRunCompleted = (moduleKey?: string | null) => {
    const label = moduleKey ?? runModuleId ?? undefined;
    void recordDailyRunnerEvent({
      type: "today_run_completed",
      mode: runMode,
      label,
    });
  };

  const completionSource = forceDailyRunner ? "guided_day1" : e2eMode ? "today_e2e" : "today_run";
  const navigateToSessionComplete = (extras?: { module?: string | null }) => {
    const params = new URLSearchParams({ source: completionSource });
    if (extras?.module) {
      params.set("module", extras.module);
    }
    if (forceDailyRunner) {
      params.set("lane", "guided_day1");
    }
    if (e2eMode) {
      params.set("e2e", "1");
    }
    setLastNavReason(NAV_REASON.TODAY_RUN_COMPLETE, { target: `/session/complete?${params.toString()}` });
    router.push(`/session/complete?${params.toString()}`);
  };

  const showInitiationResolutionBanner = Boolean(
    initiationResolutionError && (process.env.NODE_ENV !== "production" || e2eMode),
  );

  const finalizeCompletion = async (moduleKey?: string | null) => {
    const resolvedModule = moduleKey ?? null;
    markDailyCompletion(resolvedModule);
    track("daily_run_completed", { moduleKey: resolvedModule });
    const plan = readTodayPlan();
    completeInitiationRunFromPlan(plan, profile?.id ?? null);
    const runId = plan?.runId ?? null;
    if (runId) {
      clearInitiationRunState(runId);
    }
    if (profile?.id && plan?.arcId) {
      try {
        await advanceArcProgress(profile.id, plan.arcId, { completedToday: true });
      } catch (error) {
        console.warn("advanceArcProgress failed", error);
      }
    }
    clearTodayPlan();
  };

  const handleCompleted = async (_configId?: string | null, moduleKey?: string | null) => {
    const targetModule = moduleKey ?? runModuleId ?? null;
    await finalizeCompletion(targetModule);
    track("daily_run_completed_redirect", { moduleKey: targetModule });
    logRunCompleted(targetModule);
    navigateToSessionComplete({ module: targetModule });
  };

  const handleWowComplete = async (payload: WowCompletionPayload) => {
    const plan = readTodayPlan();
    const userId = profile?.id ?? null;
    const shouldRecordDailyCompletion = lessonMode !== "short";
    if (userId) {
      const kpiEvent =
        plan && plan.canonDomain && plan.traitPrimary
          ? buildPlanKpiEvent(
              {
                userId,
                moduleId: plan.moduleId,
                canonDomain: plan.canonDomain,
                traitPrimary: plan.traitPrimary,
                traitSecondary: plan.traitSecondary,
              },
              { source: "daily", difficultyFeedback: payload.difficultyFeedback },
            )
          : null;
      try {
      await recordSessionTelemetry({
        sessionId: wowSessionId,
          userId,
          sessionType: "daily",
          arcId: plan?.arcId ?? null,
          moduleId: plan?.moduleId ?? null,
          traitSignals: payload.traitSignals,
          kpiEvents: kpiEvent ? [kpiEvent] : [],
          difficultyFeedback: payload.difficultyFeedback,
          origin: "real",
          flowTag: "today",
        });
      } catch (error) {
        console.warn("recordSessionTelemetry failed", error);
      }
      const xpAmount = lessonMode === "short" ? 2 : 10;
      const moduleTraitPrimary = resolveTraitPrimaryForModule(plan?.moduleId ?? null, plan?.traitPrimary);
      if (moduleTraitPrimary) {
        try {
          await addTraitXp(userId, moduleTraitPrimary, xpAmount);
        } catch (error) {
          console.warn("addTraitXp failed", error);
        }
      }
      if (shouldRecordDailyCompletion) {
        try {
          await recordDailySessionCompletion(userId);
        } catch (error) {
          console.warn("recordDailySessionCompletion failed", error);
        }
      }
      track("daily_session_completed", {
        source: lessonMode === "short" ? "today_short" : "today",
        moduleId: plan?.moduleId ?? null,
        arcId: plan?.arcId ?? null,
      });
    }
    const completedModule = plan?.moduleId ?? runModuleId ?? null;
    await finalizeCompletion(completedModule);
    logRunCompleted(completedModule);
    navigateToSessionComplete({ module: completedModule });
  };

  const finalizeRunFromBlocks = (moduleKey?: string | null) => {
    if (runCompletionTriggeredRef.current) return;
    runCompletionTriggeredRef.current = true;
    setRunState(null);
    void handleCompleted(null, moduleKey ?? storedPlan?.moduleId ?? runModuleId ?? null);
  };

  const handleLessonBlockCompletion = (block: LessonRuntimeBlock, moduleKeyOverride?: string | null) => {
    if (!runState || !initiationBlocks?.length || !storedPlan?.runId) return;
    const completed = {
      ...runState.completed,
      [block.kind === "core_lesson" ? "core" : "elective"]: true,
    };
    const nextIndex = runState.blockIndex + 1;
    const moduleKey = moduleKeyOverride ?? block.lesson.refId;
    if (nextIndex >= initiationBlocks.length) {
      finalizeRunFromBlocks(moduleKey);
      return;
    }
    const nextState: InitiationRunState = {
      runId: storedPlan.runId,
      blockIndex: nextIndex,
      completed,
      responses: runState.responses ?? undefined,
    };
    setRunState(nextState);
    saveInitiationRunState(nextState);
  };

  const handleRecallComplete = (payload: RecallResponse) => {
    if (!runState || !initiationBlocks?.length || !storedPlan?.runId) return;
    const nextIndex = runState.blockIndex + 1;
    const completed = { ...runState.completed, recall: true };
    const responses = { ...(runState.responses ?? {}), [payload.promptId]: payload };
    if (nextIndex >= initiationBlocks.length) {
      finalizeRunFromBlocks(storedPlan.moduleId ?? runModuleId ?? null);
      return;
    }
    const nextState: InitiationRunState = {
      runId: storedPlan.runId,
      blockIndex: nextIndex,
      completed,
      responses,
    };
    setRunState(nextState);
    saveInitiationRunState(nextState);
  };

  const handleDebugAdvanceBlock = () => {
    if (!activeLessonBlock) return;
    handleLessonBlockCompletion(activeLessonBlock, activeLessonBlock.lesson.refId);
  };

  const handleBackToToday = () => {
    track("daily_run_back_to_today", { reason: "blocked" });
    router.push("/today");
  };

  const handleEarnGateRedirect = () => {
    track("daily_run_open_earn_gate", { reason: "blocked" });
    router.push("/today/earn?source=run_block&round=extra");
  };

  const [wowSessionId] = useState(() => `today-wow-${Date.now()}`);
  const wowLesson = useMemo(() => {
    if (forceDailyRunner) return null;
    if (!storedPlan?.moduleId) return null;
    return getWowLessonDefinition(storedPlan.moduleId);
  }, [forceDailyRunner, storedPlan]);
  const planAxisId = storedPlan?.traitPrimary ?? null;
  const planModuleId = storedPlan?.moduleId ?? null;
  const renderDebugBanner = () => {
    if (!debugEnabled) return null;
    const runnerChoice = wowLesson && !isBlocked ? "wow" : isBlocked ? "blocked" : "daily";
    return (
      <div className="fixed top-4 right-4 z-50 max-w-xs rounded-xl bg-black/80 px-4 py-3 text-[11px] text-white shadow-lg">
        <p>source: {runSourceParam ?? "—"}</p>
        <p>lane: {laneParam || "n/a"}</p>
        <p>mode: {runModeParam ?? "—"}</p>
        <p>round: {roundParam ?? "—"}</p>
        <p>axis(query): {axisParam ?? "n/a"}</p>
        <p>cluster(query): {clusterParam ?? "n/a"}</p>
        <p>runner: {runnerChoice}</p>
        <p>planner: {forceDailyRunner ? "guided-shortcut" : "decideNextDailyPath"}</p>
        <p>plan module: {planModuleId ?? "n/a"}</p>
        <p>blocked: {isBlocked ? "yes" : "no"}</p>
      </div>
    );
  };

  const guidedLaneBadge = forceDailyRunner ? (
    <div className="fixed bottom-4 left-4 z-40 rounded-lg bg-black/80 px-3 py-2 text-[11px] text-white shadow-lg">
      <p className="font-semibold">GuidedDay1LaneDebug</p>
      <p>lane: {laneParam || "n/a"}</p>
      <p>axisQuery: {axisParam ?? "n/a"}</p>
      <p>clusterQuery: {clusterParam ?? "n/a"}</p>
    </div>
  ) : null;

  useEffect(() => {
    if (!initialized || e2eMode) return;
    const runner = forceDailyRunner || !wowLesson ? "daily" : "wow";
    if (typeof window !== "undefined") {
      console.info("[TodayRunDebug]", {
        source: runSourceParam ?? null,
        mode: runMode,
        round: roundParam ?? null,
        isExtraRound,
        isBlocked,
        storedPlanModule: planModuleId,
        resolvedModule: runModuleId ?? null,
        planAxisId,
        axisParam: axisParam ?? null,
        clusterParam: clusterParam ?? null,
        lane: laneParam || null,
        runner,
        planner: forceDailyRunner ? "guided-shortcut" : "decideNextDailyPath",
      });
    }
  }, [
    axisParam,
    clusterParam,
    e2eMode,
    forceDailyRunner,
    initialized,
    isBlocked,
    isExtraRound,
    planAxisId,
    planModuleId,
    roundParam,
    runMode,
    runModuleId,
    runSourceParam,
    laneParam,
    wowLesson,
  ]);

  let branchContent: React.ReactNode = null;
  if (simulateTodayRun) {
    branchContent = (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)]"
        data-testid="today-run-e2e"
      >
        <p>Simulated Today Run</p>
        <Link
          data-testid="session-finish-button"
          href="/session/complete?e2e=1&source=today_e2e"
          className="rounded-full bg-[var(--omni-ink)] px-4 py-2 text-white"
        >
          Finalizează sesiunea
        </Link>
      </main>
    );
  } else if (!initialized) {
    branchContent = (
      <div className="px-4 py-10 text-center text-sm text-[var(--omni-muted)]">Se pregătește sesiunea…</div>
    );
  } else if (usingInitiationBlocks) {
    if (!runState || !activeBlock) {
      branchContent = (
        <>
          {showInitiationResolutionBanner ? (
            <div
              data-testid="initiation-resolution-failed"
              className="mx-4 my-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {initiationResolutionError ?? "Failed to resolve initiation plan."}
            </div>
          ) : null}
          <div className="px-4 py-10 text-center text-sm text-[var(--omni-muted)]">Se pregătește planul de inițiere…</div>
        </>
      );
    } else {
      const forcedConfig =
        activeLessonBlock != null
          ? { moduleKey: activeLessonBlock.lesson.refId, cluster: activeLessonBlock.lesson.meta.cluster }
          : legacyForcedModuleConfig;
      const lessonRunnerHandler =
        activeLessonBlock != null
          ? (configId?: string | null, moduleKey?: string | null) =>
              handleLessonBlockCompletion(activeLessonBlock, moduleKey ?? activeLessonBlock.lesson.refId)
          : handleCompleted;
      const runnerOnComplete = activeLessonBlock ? lessonRunnerHandler : handleCompleted;
      branchContent = (
        <>
          {showInitiationResolutionBanner ? (
            <div
              data-testid="initiation-resolution-failed"
              className="mx-4 my-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {initiationResolutionError ?? "Failed to resolve initiation plan."}
            </div>
          ) : null}
          {blockDebugEnabled && activeLessonBlock ? (
            <div className="mx-4 my-2 flex justify-end">
              <button
                type="button"
                className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-xs uppercase tracking-[0.25em] text-[var(--omni-muted)] transition hover:border-[var(--omni-ink)]/60"
                onClick={handleDebugAdvanceBlock}
                data-testid="initiation-block-debug-complete"
              >
                Marchează blocul finalizat
              </button>
            </div>
          ) : null}
          {activeLessonBlock ? (
            <DailyPathRunner
              onCompleted={runnerOnComplete}
              todayModuleKey={activeLessonBlock.lesson.refId}
              forcedModuleConfig={forcedConfig}
            />
          ) : activeRecallBlock ? (
            <InitiationRecallBlock prompt={activeRecallBlock.prompt} onComplete={handleRecallComplete} />
          ) : null}
        </>
      );
    }
  } else {
    const xpTrait = wowLesson?.traitPrimary ?? storedPlan?.traitPrimary ?? null;
    const xpAmount = lessonMode === "short" ? 2 : 10;
    const xpLabel = xpTrait ? `+${xpAmount} XP ${getTraitLabel(xpTrait)}` : `+${xpAmount} XP`;
    if (wowLesson && !isBlocked) {
      branchContent = (
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-8">
          <div className="mx-auto max-w-3xl">
            <WowLessonShell
              lesson={wowLesson}
              sessionType="daily"
              xpRewardLabel={xpLabel}
              onComplete={handleWowComplete}
              mode={lessonMode === "short" ? "short" : "full"}
            />
          </div>
        </div>
      );
    } else if (isBlocked) {
      const header = (
        <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday")} />
      );
      branchContent = (
        <>
          <AppShell header={header}>
            <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-8">
              <div className="mx-auto max-w-xl rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Limită zilnică</p>
                <h1 className="mt-3 text-2xl font-semibold">Ai completat sesiunea de azi</h1>
                <p className="mt-3 text-sm text-[var(--omni-ink)]/80">
                  Ai făcut deja sesiunea zilnică azi. Poți debloca încă o rundă trecând prin Earn Gate sau activând OmniMental Premium.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <OmniCtaButton className="justify-center" onClick={handleEarnGateRedirect}>
                    Deblochează încă o rundă
                  </OmniCtaButton>
                  <OmniCtaButton className="justify-center" variant="neutral" onClick={handleBackToToday}>
                    Înapoi la Today
                  </OmniCtaButton>
                  <OmniCtaButton as="link" href="/upgrade" variant="secondary" className="justify-center">
                    Activează Premium
                  </OmniCtaButton>
                </div>
              </div>
            </div>
          </AppShell>
          <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
        </>
      );
    } else {
      branchContent = (
        <>
          {showInitiationResolutionBanner ? (
            <div
              data-testid="initiation-resolution-failed"
              className="mx-4 my-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {initiationResolutionError ?? "Failed to resolve initiation plan."}
            </div>
          ) : null}
          <DailyPathRunner
            onCompleted={handleCompleted}
            todayModuleKey={todayModuleKey}
            forcedModuleConfig={legacyForcedModuleConfig}
          />
        </>
      );
    }
  }

  return (
    <>
      <div data-testid="today-run-root">
        <div data-testid="initiation-forced-module" className="sr-only">
          {sentinelText}
        </div>
        {renderDebugBanner()}
        {guidedLaneBadge}
        {branchContent}
      </div>
      <RuntimeDebugPanel context={runtimeDebugContext} />
    </>
  );
}

export default function TodayRunPage() {
  return (
    <Suspense
      fallback={
        <div data-testid="today-run-root" className="min-h-screen bg-[var(--omni-bg-main)]">
          <div data-testid="initiation-forced-module" className="sr-only">
            NO_PLAN
          </div>
        </div>
      }
    >
      <TodayRunPageInner />
    </Suspense>
  );
}
