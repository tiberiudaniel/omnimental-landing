"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { buildPlanKpiEvent } from "@/lib/sessionTelemetry";
import { recordDailyRunnerEvent, recordDailySessionCompletion } from "@/lib/progressFacts/recorders";
import { useUserAccessTier } from "@/components/useUserAccessTier";

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
  const runModuleId = useMemo(() => {
    if (storedPlan?.moduleId) return storedPlan.moduleId;
    return todayModuleKey;
  }, [storedPlan?.moduleId, todayModuleKey]);
  const runStartLoggedRef = useRef(false);
  const runModeParam = searchParams.get("mode");
  const runMode = runModeParam === "deep" ? "deep" : runModeParam === "quick" ? "quick" : "standard";
  const roundParam = searchParams.get("round");
  const isExtraRound = roundParam === "extra";

  useEffect(() => {
    if (typeof window === "undefined") return;
    let alive = true;
    const timeout = window.setTimeout(() => {
      if (!alive) return;
      setCompletedToday(hasCompletedToday());
      const plan = readTodayPlan();
      setStoredPlan(plan);
      if (plan?.moduleId) {
        setTodayModuleKey(plan.moduleId);
      } else {
        setTodayModuleKey(getTodayModuleKey());
      }
      setInitialized(true);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const isBlocked = Boolean(membershipTier === "free" && completedToday && !isExtraRound);

  useEffect(() => {
    if (!initialized) return;
    if (isBlocked) {
      track("daily_run_blocked_free_limit");
      setTriedExtraToday(true);
      return;
    }
    track("daily_run_started");
  }, [initialized, isBlocked]);

  useEffect(() => {
    if (!initialized || isBlocked || runStartLoggedRef.current) return;
    runStartLoggedRef.current = true;
    void recordDailyRunnerEvent({
      type: "today_run_started",
      mode: runMode,
      label: runModuleId ?? undefined,
    });
  }, [initialized, isBlocked, runMode, runModuleId]);

  const logRunCompleted = (moduleKey?: string | null) => {
    const label = moduleKey ?? runModuleId ?? undefined;
    void recordDailyRunnerEvent({
      type: "today_run_completed",
      mode: runMode,
      label,
    });
  };

  const navigateToSessionComplete = () => {
    router.push("/session/complete?source=today_run");
  };

  const finalizeCompletion = async (moduleKey?: string | null) => {
    markDailyCompletion(moduleKey ?? null);
    track("daily_run_completed", { moduleKey });
    const plan = readTodayPlan();
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
    navigateToSessionComplete();
  };

  const handleWowComplete = async (payload: WowCompletionPayload) => {
    const plan = readTodayPlan();
    const userId = profile?.id ?? null;
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
          sessionId: `today-wow-${Date.now()}`,
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
          await addTraitXp(userId, moduleTraitPrimary, 10);
        } catch (error) {
          console.warn("addTraitXp failed", error);
        }
      }
      try {
        await recordDailySessionCompletion(userId);
      } catch (error) {
        console.warn("recordDailySessionCompletion failed", error);
      }
      track("daily_session_completed", {
        source: "today",
        moduleId: plan?.moduleId ?? null,
        arcId: plan?.arcId ?? null,
      });
    }
    await finalizeCompletion(plan?.moduleId ?? null);
    logRunCompleted(plan?.moduleId ?? null);
    navigateToSessionComplete();
  };

  const handleBackToToday = () => {
    track("daily_run_back_to_today", { reason: "blocked" });
    router.push("/today");
  };

  const handleEarnGateRedirect = () => {
    track("daily_run_open_earn_gate", { reason: "blocked" });
    router.push("/today/earn?source=run_block&round=extra");
  };

  const wowLesson = useMemo(() => {
    if (!storedPlan?.moduleId) return null;
    return getWowLessonDefinition(storedPlan.moduleId);
  }, [storedPlan]);

  if (!initialized) {
    return null;
  }

  const xpTrait = wowLesson?.traitPrimary ?? storedPlan?.traitPrimary ?? null;
  const xpLabel = xpTrait ? `+10 XP ${getTraitLabel(xpTrait)}` : "+10 XP";

  if (wowLesson && !isBlocked) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <WowLessonShell lesson={wowLesson} sessionType="daily" xpRewardLabel={xpLabel} onComplete={handleWowComplete} />
        </div>
      </div>
    );
  }

  if (isBlocked) {
    const header = (
      <SiteHeader showMenu onMenuToggle={() => setMenuOpen(true)} onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday")} />
    );
    return (
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
  }

  return <DailyPathRunner onCompleted={handleCompleted} todayModuleKey={todayModuleKey} />;
}

export default function TodayRunPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <TodayRunPageInner />
    </Suspense>
  );
}
