"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/telemetry/track";
import { useProfile } from "@/components/ProfileProvider";
import DailyPathRunner from "@/components/today/DailyPathRunner";
import { getTodayModuleKey, hasCompletedToday, markDailyCompletion, setTriedExtraToday } from "@/lib/dailyCompletion";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";

export default function TodayRunPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const navLinks = useNavigationLinks();
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [todayModuleKey, setTodayModuleKey] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let alive = true;
    const timeout = window.setTimeout(() => {
      if (!alive) return;
      setCompletedToday(hasCompletedToday());
      setTodayModuleKey(getTodayModuleKey());
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

  const handleCompleted = (_configId?: string | null, moduleKey?: string | null) => {
    markDailyCompletion(moduleKey ?? null);
    track("daily_run_completed", { moduleKey });
    track("daily_run_back_to_today", { reason: "completed" });
    router.push("/today?source=run_complete");
  };

  const handleBackToToday = () => {
    track("daily_run_back_to_today", { reason: "blocked" });
    router.push("/today");
  };

  if (!initialized) {
    return null;
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
                Revino mâine pentru o nouă sesiune sau activează Premium pentru mai multe sesiuni pe zi.
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
