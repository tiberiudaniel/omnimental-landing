"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function TodayRunPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [todayModuleKey, setTodayModuleKey] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [storedPlan, setStoredPlan] = useState<StoredTodayPlan | null>(null);

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

  const isBlocked = Boolean(!profile?.isPremium && completedToday);

  useEffect(() => {
    if (!initialized) return;
    if (isBlocked) {
      track("daily_run_blocked_free_limit");
      setTriedExtraToday(true);
      return;
    }
    track("daily_run_started");
  }, [initialized, isBlocked]);

  const handleCompleted = async (_configId?: string | null, moduleKey?: string | null) => {
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
    track("daily_run_back_to_today", { reason: "completed" });
    router.push("/today?source=run_complete");
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
    }
    await handleCompleted(null, plan?.moduleId ?? null);
  };

  const handleBackToToday = () => {
    track("daily_run_back_to_today", { reason: "blocked" });
    router.push("/today");
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
                Ai făcut deja sesiunea zilnică azi. Dacă vrei să lucrezi mai mult în fiecare zi, activează OmniMental Premium.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <OmniCtaButton className="justify-center" onClick={handleBackToToday}>
                  Înapoi la Astăzi
                </OmniCtaButton>
                <OmniCtaButton as="link" href="/upgrade" variant="neutral" className="justify-center">
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
