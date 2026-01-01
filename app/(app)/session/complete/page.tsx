"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { useUserAccessTier } from "@/components/useUserAccessTier";
import {
  getRecentSessionEvents,
  summarizeSessionEvents,
  type SessionEvent,
} from "@/lib/sessionSummary";
import { useEarnedRoundsController } from "@/components/today/useEarnedRounds";
import { track } from "@/lib/telemetry/track";

const SUMMARY_WINDOW_MINUTES = 45;

const EVENT_LABELS: Record<string, string> = {
  mindpacing_completed: "MindPacing finalizat",
  vocab_completed: "Vocab finalizat",
  today_run_completed: "Today Run",
  arena_run_completed: "Arena Run",
};

function formatDurationLabel(durationMs: number): string {
  if (!durationMs) return "<1 min";
  const minutes = durationMs / 60000;
  if (minutes < 1) return "<1 min";
  if (minutes < 10) return `${minutes.toFixed(1)} min`;
  return `${Math.round(minutes)} min`;
}

function formatTimeLabel(date: Date): string {
  try {
    return new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

function getEventLabel(event: SessionEvent): string {
  const label = EVENT_LABELS[event.type];
  if (label) return label;
  if (event.label) return event.label;
  return event.type.replace(/_/g, " ");
}

type StatCardProps = {
  label: string;
  value: string;
  detail?: string | null;
};

function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--omni-border-soft)] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--omni-ink)]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[var(--omni-muted)]">{detail}</p> : null}
    </div>
  );
}

export default function SessionCompletePage() {
  const router = useRouter();
  const navLinks = useNavigationLinks();
  const { user } = useAuth();
  const { data: progressFacts } = useProgressFacts(user?.uid ?? null);
  const { accessTier, membershipTier } = useUserAccessTier();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ctaLoading, setCtaLoading] = useState(false);
  const earnedRounds = useEarnedRoundsController(progressFacts ?? null);
  const summaryEvents = useMemo(
    () => getRecentSessionEvents(progressFacts ?? null, SUMMARY_WINDOW_MINUTES),
    [progressFacts],
  );
  const summary = useMemo(() => summarizeSessionEvents(summaryEvents), [summaryEvents]);
  const events24h = useMemo(() => getRecentSessionEvents(progressFacts ?? null, 24 * 60), [progressFacts]);
  const sessionsToday = useMemo(
    () => events24h.filter((event) => event.type === "today_run_completed").length,
    [events24h],
  );
  const latestUnlock = summary.unlocks[0] ?? null;
  const modules = summary.modules.length ? summary.modules : ["Sesiune adaptivă"];
  const durationLabel = formatDurationLabel(summary.durationMs);
  const showEarnPrompt = membershipTier === "free" && !earnedRounds.canSpend;

  useEffect(() => {
    track("session_complete_viewed");
  }, []);

  const handleAnotherRound = async () => {
    if (ctaLoading) return;
    setCtaLoading(true);
    const nextRouteParams = new URLSearchParams({ source: "session_complete", round: "extra" });
    const nextRoute = `/today/next?${nextRouteParams.toString()}`;
    try {
      if (membershipTier === "premium") {
        track("session_complete_another_round", { tier: membershipTier, via: "premium" });
        router.push(nextRoute);
        return;
      }
      if (earnedRounds.canSpend) {
        await earnedRounds.spend();
        track("session_complete_another_round", { tier: membershipTier, via: "credit" });
        router.push(nextRoute);
        return;
      }
      track("session_complete_another_round", { tier: membershipTier, via: "earn_gate" });
      router.push("/today/earn?source=session_complete&round=extra");
    } finally {
      setCtaLoading(false);
    }
  };

  const handleBackToToday = () => {
    track("session_complete_back_today");
    router.push("/today");
  };

  const handleOpenEarnGate = () => {
    track("session_complete_go_to_earn");
    router.push("/today/earn?source=session_complete&round=extra");
  };

  return (
    <>
      <AppShell
        header={
          <SiteHeader
            showMenu={accessTier.flags.showMenu}
            onMenuToggle={() => setMenuOpen(true)}
            onAuthRequest={() => router.push("/auth?returnTo=%2Fsession%2Fcomplete")}
          />
        }
      >
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-white/95 px-6 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Sesiune închisă</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ai terminat o rundă reală</h1>
              <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
                Ultimele module finalizate calibrează următoarele recomandări și XP-ul tău.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Durată sesiune"
                  value={durationLabel}
                  detail={
                    summary.startAt && summary.endAt
                      ? `${formatTimeLabel(summary.startAt)} – ${formatTimeLabel(summary.endAt)}`
                      : "Măsurat automat"
                  }
                />
                <StatCard label="Module completate" value={modules.join(", ")} detail="Ultimele 30 min" />
                <StatCard label="Unlock" value={latestUnlock ?? "—"} detail={latestUnlock ? "Activat azi" : "În pregătire"} />
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <OmniCtaButton className="justify-center sm:min-w-[220px]" onClick={handleAnotherRound} disabled={ctaLoading}>
                  Încă o rundă
                </OmniCtaButton>
                <button
                  type="button"
                  className="rounded-[14px] border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--omni-ink)]"
                  onClick={handleBackToToday}
                >
                  Înapoi la Today
                </button>
                {showEarnPrompt ? (
                  <button
                    type="button"
                    className="rounded-[14px] border border-dashed border-[var(--omni-energy)]/60 px-4 py-2 text-sm font-semibold text-[var(--omni-energy)]"
                    onClick={handleOpenEarnGate}
                  >
                    Deblochează o rundă
                  </button>
                ) : null}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                Runde extra folosite: {earnedRounds.state.usedToday}/3 · Credite disponibile: {earnedRounds.state.credits}
              </p>
              <p className="mt-1 text-xs text-[var(--omni-muted)]/80">Sesiuni zilnice azi: {sessionsToday}</p>
            </section>

            <section className="rounded-[24px] border border-[var(--omni-border-soft)] bg-white/90 px-6 py-6 shadow-[0_14px_45px_rgba(0,0,0,0.06)] sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Cronologia ultimei sesiuni</p>
              {summaryEvents.length ? (
                <ul className="mt-4 space-y-3">
                  {summaryEvents.map((event) => (
                    <li
                      key={`${event.type}-${event.at.getTime()}`}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-4 py-3"
                    >
                      <div className="text-xs font-semibold text-[var(--omni-muted)]">{formatTimeLabel(event.at)}</div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--omni-ink)]">{getEventLabel(event)}</p>
                        {event.label ? <p className="text-xs text-[var(--omni-muted)]">{event.label}</p> : null}
                        {event.mode ? <p className="text-xs text-[var(--omni-muted)]/80">Mod: {event.mode}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--omni-ink)]/70">
                  Încă nu avem evenimente salvate pentru această sesiune. Următoarele runde vor fi urmărite în timp real.
                </p>
              )}
            </section>
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
