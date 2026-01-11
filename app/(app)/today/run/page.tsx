"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { StoredTodayPlan } from "@/lib/todayPlanStorage";
import { recordSessionTelemetry } from "@/lib/telemetry";
import { isGuidedDayOneLane } from "@/lib/guidedDayOne";
import { buildPlanKpiEvent } from "@/lib/sessionTelemetry";
import { recordDailyRunnerEvent, recordDailySessionCompletion } from "@/lib/progressFacts/recorders";
import { useUserAccessTier } from "@/components/useUserAccessTier";
import { resolveInitiationLesson } from "@/lib/content/resolveLessonToExistingContent";
import type { LessonId } from "@/lib/taxonomy/types";
import { completeInitiationRunFromPlan } from "@/lib/today/completeInitiationRun";

function TodayRunPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const navLinks = useNavigationLinks();
  const { membershipTier } = useUserAccessTier();
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [todayModuleKey, setTodayModuleKey] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [storedPlan, setStoredPlan] = useState<StoredTodayPlan | null>(null);
  const [initiationResolutionError, setInitiationResolutionError] = useState<string | null>(null);
  const runModuleId = useMemo(() => {
    if (storedPlan?.moduleId) return storedPlan.moduleId;
    return todayModuleKey;
  }, [storedPlan?.moduleId, todayModuleKey]);
  const forcedModuleConfig = useMemo(() => {
    if (!storedPlan || storedPlan.worldId !== "INITIATION") return null;
    const lessonId = storedPlan.initiationLessonIds?.[0];
    if (!lessonId) return null;
    try {
      const lesson = resolveInitiationLesson(lessonId as LessonId);
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
  const runModeParam = searchParams.get("mode");
  const runSourceParam = searchParams.get("source");
  const laneParam = (searchParams.get("lane") ?? "").toLowerCase();
  const guidedLaneActive = isGuidedDayOneLane(runSourceParam, laneParam);
  const runMode = runModeParam === "deep" ? "deep" : runModeParam === "quick" ? "quick" : runModeParam === "guided_day1" ? "guided_day1" : "standard";
  const roundParam = searchParams.get("round");
  const lessonModeParam = searchParams.get("lessonMode");
  const lessonMode = lessonModeParam === "short" ? "short" : "full";
  const isExtraRound = roundParam === "extra";
  const axisParam = searchParams.get("axis");
  const clusterParam = searchParams.get("cluster");
  const debugFlagEnv = (process.env.NEXT_PUBLIC_TODAY_RUN_DEBUG || "").toLowerCase();
  const debugParamEnabled = (searchParams.get("debug") ?? "").toLowerCase() === "1";
  const debugEnabled = debugParamEnabled || debugFlagEnv === "1" || debugFlagEnv === "true";
  const forceDailyRunner = guidedLaneActive;
  const cookieE2E = useMemo(() => {
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((entry) => entry.trim().startsWith("omni_e2e=1"));
  }, []);
  const e2eMode = (searchParams.get("e2e") ?? "").toLowerCase() === "1" || cookieE2E;
  useEffect(() => {
    if (typeof window === "undefined") return;
    let alive = true;
    const timeout = window.setTimeout(() => {
      if (!alive) return;
      setCompletedToday(hasCompletedToday());
      const plan = readTodayPlan();
      setStoredPlan(plan);
      if (plan?.worldId === "INITIATION" && plan.initiationLessonIds?.length) {
        const coreLessonId = plan.initiationLessonIds[0] as LessonId;
        try {
          const lesson = resolveInitiationLesson(coreLessonId);
          setTodayModuleKey(lesson.refId);
          setInitiationResolutionError(null);
        } catch (error) {
          console.warn("[today/run] failed to resolve initiation lesson", error);
          setInitiationResolutionError(`Failed to resolve core lesson: ${String(error)}`);
          setTodayModuleKey(plan.moduleId ?? getTodayModuleKey());
        }
      } else if (plan?.moduleId) {
        setTodayModuleKey(plan.moduleId);
        setInitiationResolutionError(null);
      } else {
        setTodayModuleKey(getTodayModuleKey());
        setInitiationResolutionError(null);
      }
      setInitialized(true);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [e2eMode]);

  const isBlocked = Boolean(
    membershipTier === "free" && completedToday && !isExtraRound && !e2eMode,
  );

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
  const navigateToSessionComplete = useCallback(
    (extras?: { module?: string | null }) => {
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
      router.push(`/session/complete?${params.toString()}`);
    },
    [completionSource, e2eMode, router, forceDailyRunner],
  );

  const showInitiationResolutionBanner = Boolean(
    initiationResolutionError && (process.env.NODE_ENV !== "production" || e2eMode),
  );

  const finalizeCompletion = async (moduleKey?: string | null) => {
    markDailyCompletion(moduleKey ?? null);
    track("daily_run_completed", { moduleKey });
    const plan = readTodayPlan();
    completeInitiationRunFromPlan(plan, profile?.id ?? null);
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
    await finalizeCompletion(moduleKey ?? null);
    track("daily_run_completed_redirect", { moduleKey: moduleKey ?? null });
    logRunCompleted(moduleKey ?? null);
    navigateToSessionComplete({ module: moduleKey ?? runModuleId ?? null });
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

  if (e2eMode && !guidedLaneActive) {
    return (
      <>
        {renderDebugBanner()}
        {guidedLaneBadge}
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
      </>
    );
  }

  if (!initialized && !e2eMode) {
    return null;
  }

  const xpTrait = wowLesson?.traitPrimary ?? storedPlan?.traitPrimary ?? null;
  const xpAmount = lessonMode === "short" ? 2 : 10;
  const xpLabel = xpTrait ? `+${xpAmount} XP ${getTraitLabel(xpTrait)}` : `+${xpAmount} XP`;

  if (wowLesson && !isBlocked) {
    return (
      <>
        {renderDebugBanner()}
        {guidedLaneBadge}
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
      </>
    );
  }

  if (isBlocked) {
    const header = (
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday")} />
    );
    return (
      <>
        {renderDebugBanner()}
        {guidedLaneBadge}
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
  }

  return (
    <>
      {renderDebugBanner()}
      {guidedLaneBadge}
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
        forcedModuleConfig={forcedModuleConfig}
      />
    </>
  );
}

export default function TodayRunPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <TodayRunPageInner />
    </Suspense>
  );
}
