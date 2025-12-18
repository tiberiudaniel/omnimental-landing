"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { track } from "@/lib/telemetry/track";
import { getTriedExtraToday, hasCompletedToday, readLastCompletion, type DailyCompletionRecord } from "@/lib/dailyCompletion";
import { getTraitLabel } from "@/lib/profileEngine";
import { type SessionPlan } from "@/lib/sessionRecommenderEngine";
import { saveTodayPlan } from "@/lib/todayPlanStorage";
import { getSensAiTodayPlan, hasFreeDailyLimit, type SensAiContext } from "@/lib/omniSensAI";

export default function TodayOrchestrator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navLinks = useNavigationLinks();
  const { user, authReady } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<DailyCompletionRecord | null>(null);
  const cameFromRunComplete = searchParams?.get("source") === "run_complete";
  const [triedExtraToday, setTriedExtraTodayState] = useState(false);
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [sensAiCtx, setSensAiCtx] = useState<SensAiContext | null>(null);

  useEffect(() => {
    track("today_viewed");
    if (typeof window === "undefined") return;
    let alive = true;
    const timeout = window.setTimeout(() => {
      if (!alive) return;
      const completed = hasCompletedToday();
      const last = readLastCompletion();
      const tried = getTriedExtraToday();
      setCompletedToday(completed);
      setLastCompletion(last);
      setTriedExtraTodayState(tried);
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!cameFromRunComplete) return;
    router.replace("/today");
  }, [cameFromRunComplete, router]);

  const loadPlanFromSensAi = useCallback(
    async (userId: string, token: { cancelled: boolean }) => {
      setPlanLoading(true);
      try {
        const result = await getSensAiTodayPlan(userId);
        if (token.cancelled) return;
        setSensAiCtx(result.ctx);
        setSessionPlan(result.plan);
      } finally {
        if (!token.cancelled) setPlanLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!authReady || !user) return;
    const token = { cancelled: false };
    void loadPlanFromSensAi(user.uid, token);
    return () => {
      token.cancelled = true;
    };
  }, [authReady, user, loadPlanFromSensAi]);

  useEffect(() => {
    if (!sessionPlan) return;
    saveTodayPlan({
      arcId: sessionPlan.arcId,
      arcDayIndex: sessionPlan.arcDayIndex,
      arcLengthDays: sessionPlan.arcLengthDays,
      moduleId: sessionPlan.moduleId,
      traitPrimary: sessionPlan.traitPrimary,
      traitSecondary: sessionPlan.traitSecondary,
      canonDomain: sessionPlan.canonDomain,
    });
  }, [sessionPlan]);

  const lastSessionLabel = useMemo(() => {
    if (!lastCompletion) return "—";
    const completedAt = new Date(lastCompletion.completedAt);
    const todayKey = new Date().toDateString();
    if (completedAt.toDateString() === todayKey) {
      return "Azi";
    }
    try {
      return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" }).format(completedAt);
    } catch {
      return completedAt.toLocaleDateString();
    }
  }, [lastCompletion]);

  const handleStart = () => {
    track("today_primary_clicked", { completedToday });
    router.push("/today/run");
  };

  const header = (
    <SiteHeader
      showMenu
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday")}
    />
  );

  const isPremiumSubscriber = sensAiCtx?.profile.subscription.status === "premium";
  const freeLimitReached = hasFreeDailyLimit(sensAiCtx);

  if (!sessionPlan) {
    return (
      <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-center text-[var(--omni-ink)]">
        Se încarcă sesiunea recomandată...
      </div>
    );
  }

  const activeArcDayIndex =
    sensAiCtx?.profile.activeArcId && sensAiCtx.profile.activeArcId === sessionPlan.arcId
      ? sensAiCtx.profile.activeArcDayIndex ?? null
      : null;
  const arcDayNumber = sessionPlan.arcId
    ? (() => {
        const profileDay = typeof activeArcDayIndex === "number" ? activeArcDayIndex + 1 : null;
        const fallbackDay = typeof sessionPlan.arcDayIndex === "number" ? sessionPlan.arcDayIndex + 1 : null;
        const rawDay = profileDay ?? fallbackDay;
        if (rawDay == null) return null;
        if (sessionPlan.arcLengthDays) {
          return Math.min(rawDay, sessionPlan.arcLengthDays);
        }
        return rawDay;
      })()
    : null;
  const arcProgressLabel = sessionPlan.arcId
    ? `Ziua ${arcDayNumber ?? "—"}${sessionPlan.arcLengthDays ? ` din ${sessionPlan.arcLengthDays}` : ""} în ${sessionPlan.title}`
    : "Primul tău antrenament de claritate";
  const xpForTrait = sensAiCtx?.profile.xpByTrait?.[sessionPlan.traitPrimary] ?? 0;

  const handleUpgrade = () => router.push("/upgrade");

  return (
    <>
      <AppShell header={header}>
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_25px_80px_rgba(0,0,0,0.08)] sm:px-10">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">Astăzi</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {sessionPlan.title ?? "Antrenamentul de azi"}
              </h1>
              <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">{sessionPlan.summary}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {arcProgressLabel}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <OmniCtaButton
                  className="justify-center sm:min-w-[220px]"
                  onClick={freeLimitReached ? handleUpgrade : handleStart}
                  disabled={completedToday || planLoading || freeLimitReached}
                >
                  {freeLimitReached
                    ? "Disponibil în Premium"
                    : completedToday
                    ? "Completat azi"
                    : `Sesiunea zilnică recomandată (${sessionPlan.expectedDurationMinutes} min)`}
                </OmniCtaButton>
                <button
                  type="button"
                  className={`rounded-[12px] border px-4 py-2 text-sm font-semibold ${isPremiumSubscriber ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)]" : "border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)]"}`}
                  onClick={() => {
                    if (!isPremiumSubscriber) handleUpgrade();
                  }}
                  disabled={!isPremiumSubscriber}
                >
                  Sesiune intensivă (în curând)
                </button>
              </div>
              <div className="mt-5 rounded-[18px] border border-[var(--omni-border-soft)] bg-white/70 px-4 py-4 text-sm text-[var(--omni-ink)]">
                <p className="font-semibold">Focus: {getTraitLabel(sessionPlan.traitPrimary)}</p>
                <p className="mt-1 text-[var(--omni-ink)]/80">
                  {`Consolidezi ${getTraitLabel(sessionPlan.traitPrimary)} și susții ${
                    sessionPlan.traitSecondary.length
                      ? getTraitLabel(sessionPlan.traitSecondary[0])
                      : "energia funcțională"
                  }.`}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--omni-energy)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
                  {`${getTraitLabel(sessionPlan.traitPrimary)}: ${xpForTrait} XP`}
                </div>
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-energy)]"
                    onClick={() => router.push("/os")}
                  >
                    Vezi harta mentală →
                  </button>
                </div>
              </div>
              {freeLimitReached ? (
                <div className="mt-4 rounded-2xl border border-[var(--omni-energy)]/40 bg-[var(--omni-energy)]/10 px-4 py-3 text-sm text-[var(--omni-ink)]">
                  Ai făcut deja sesiunea zilnică azi. Dacă vrei să lucrezi mai mult în fiecare zi, activează OmniMental Premium.
                </div>
              ) : cameFromRunComplete ? (
                <div className="mt-4 rounded-2xl border border-[var(--omni-energy)]/40 bg-[var(--omni-energy)]/10 px-4 py-3 text-sm text-[var(--omni-ink)]">
                  Sesiunea de azi este completă. Ne vedem mâine.
                </div>
              ) : null}
            </section>

            <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-5 text-sm text-[var(--omni-ink)]/85 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Ultima sesiune</p>
                <p className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">{lastSessionLabel}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Zile consecutive</p>
                <p className="mt-1 text-lg font-semibold text-[var(--omni-ink)]">—</p>
              </div>
            </section>

            {!isPremiumSubscriber && (completedToday || triedExtraToday || freeLimitReached) ? (
              <section className="rounded-[24px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 text-[var(--omni-ink)]">
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Upgrade</p>
                <h2 className="mt-2 text-2xl font-semibold">Vrei încă o sesiune azi?</h2>
                <ul className="mt-4 space-y-2 text-sm text-[var(--omni-ink)]/85">
                  <li>• +1 sesiune azi</li>
                  <li>• Istoric complet</li>
                  <li>• Recomandări adaptative</li>
                </ul>
                <OmniCtaButton
                  as="link"
                  href="/upgrade"
                  className="mt-4 w-full justify-center sm:w-auto"
                >
                  Activează OmniMental
                </OmniCtaButton>
              </section>
            ) : null}
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
