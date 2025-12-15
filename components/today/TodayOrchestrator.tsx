"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { track } from "@/lib/telemetry/track";
import { getTriedExtraToday, hasCompletedToday, readLastCompletion, type DailyCompletionRecord } from "@/lib/dailyCompletion";

export default function TodayOrchestrator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedToday, setCompletedToday] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<DailyCompletionRecord | null>(null);
  const cameFromRunComplete = searchParams?.get("source") === "run_complete";
  const [triedExtraToday, setTriedExtraTodayState] = useState(false);

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

  const handleRecommendations = () => {
    track("today_secondary_recommendations_clicked");
    router.push("/recommendation");
  };

  const header = (
    <SiteHeader
      showMenu
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday")}
    />
  );

  return (
    <>
      <AppShell header={header}>
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_25px_80px_rgba(0,0,0,0.08)] sm:px-10">
              <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">Astăzi</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Antrenamentul de azi</h1>
              <p className="mt-2 text-sm text-[var(--omni-ink)]/80 sm:text-base">5–7 minute, adaptate la nivelul tău curent.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <OmniCtaButton
                  className="justify-center sm:min-w-[220px]"
                  onClick={handleStart}
                  disabled={completedToday}
                >
                  {completedToday ? "Completat azi" : "Începe"}
                </OmniCtaButton>
                {completedToday ? (
                  <p className="text-sm text-[var(--omni-muted)]">Revii mâine pentru o nouă sesiune.</p>
                ) : (
                  <button
                    type="button"
                    className="text-sm font-semibold text-[var(--omni-ink)] underline-offset-4 hover:underline"
                    onClick={handleRecommendations}
                  >
                    Vezi recomandări
                  </button>
                )}
              </div>
              {cameFromRunComplete ? (
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

            {!profile?.isPremium && (completedToday || triedExtraToday) ? (
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
