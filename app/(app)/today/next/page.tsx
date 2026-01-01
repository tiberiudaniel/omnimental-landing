"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { deriveAccessTier } from "@/lib/accessTier";
import { getRecentSessionEvents } from "@/lib/sessionSummary";
import { track } from "@/lib/telemetry/track";

type NextPlan = {
  destination: string;
  label: string;
  reason: string;
};

const RECENT_RUN_WINDOW_MINUTES = 20;

function appendRoundParam(url: string, round: string | null): string {
  if (!round) return url;
  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.set("round", round);
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function resolveNextPlan(progressFacts: Parameters<typeof getRecentSessionEvents>[0]): NextPlan {
  const events = getRecentSessionEvents(progressFacts ?? null, 90);
  const now = Date.now();
  const lastRun = [...events].reverse().find((event) => event.type === "today_run_completed");
  if (lastRun && now - lastRun.at.getTime() < RECENT_RUN_WINDOW_MINUTES * 60 * 1000) {
    return {
      destination: "/today/run?mode=deep",
      label: "Deep Loop",
      reason: "Ai terminat o rundă în ultimele minute",
    };
  }
  return {
    destination: "/today/run",
    label: "Quick Loop",
    reason: "Runda implicită pentru azi",
  };
}

export default function TodayNextPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navLinks = useNavigationLinks();
  const { user } = useAuth();
  const { data: progressFacts, loading: progressFactsLoading } = useProgressFacts(user?.uid ?? null);
  const accessTier = useMemo(() => deriveAccessTier({ progress: progressFacts ?? null }), [progressFacts]);
  const [menuOpen, setMenuOpen] = useState(false);
  const plan = useMemo(() => {
    if (progressFactsLoading) return null;
    return resolveNextPlan(progressFacts ?? null);
  }, [progressFacts, progressFactsLoading]);
  const roundParam = searchParams.get("round");
  const resolvedDestination = useMemo(() => {
    if (!plan) return null;
    return appendRoundParam(plan.destination, roundParam);
  }, [plan, roundParam]);
  const trackedPlanRef = useRef<string | null>(null);
  const autoRedirectRef = useRef(false);

  useEffect(() => {
    if (!resolvedDestination || !plan) return;
    if (trackedPlanRef.current === resolvedDestination) return;
    trackedPlanRef.current = resolvedDestination;
    track("today_next_resolved", { destination: resolvedDestination, reason: plan.reason });
  }, [plan, resolvedDestination]);

  useEffect(() => {
    if (!resolvedDestination || autoRedirectRef.current) return;
    autoRedirectRef.current = true;
    const timer = window.setTimeout(() => {
      track("today_next_auto_start", { destination: resolvedDestination });
      router.replace(resolvedDestination);
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      autoRedirectRef.current = false;
    };
  }, [autoRedirectRef, resolvedDestination, router]);

  const handleStartNow = () => {
    if (!resolvedDestination) return;
    track("today_next_manual_start", { destination: resolvedDestination });
    router.replace(resolvedDestination);
  };

  const handleBackToToday = () => {
    track("today_next_back");
    router.push("/today");
  };

  const header = (
    <SiteHeader
      showMenu={accessTier.flags.showMenu}
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday%2Fnext")}
    />
  );

  return (
    <>
      <AppShell header={header}>
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-6 text-center">
            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-white/95 px-6 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Another Round</p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Pregătim următoarea sesiune</h1>
              <p className="mt-3 text-sm text-[var(--omni-ink)]/80">
                Analizăm ultimele evenimente ca să-ți propunem următoarea rută fără să pierzi ritmul.
              </p>
              <div className="mt-6 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-4 py-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pas următor</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">{plan?.label ?? "Se calculează..."}</p>
                <p className="mt-1 text-sm text-[var(--omni-muted)]">
                  {plan?.reason ?? "Identificăm istoricul recent"}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <OmniCtaButton className="justify-center sm:min-w-[200px]" onClick={handleStartNow} disabled={!resolvedDestination}>
                  Pornește acum
                </OmniCtaButton>
                <button
                  type="button"
                  className="rounded-[14px] border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--omni-ink)]"
                  onClick={handleBackToToday}
                >
                  Înapoi la Today
                </button>
              </div>
              <p className="mt-4 text-xs text-[var(--omni-muted)]">
                Te redirecționăm automat în 1 secundă {plan ? "…" : "când este pregătit planul"}.
              </p>
            </section>
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
