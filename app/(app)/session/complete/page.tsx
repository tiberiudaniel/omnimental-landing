"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { isE2EMode } from "@/lib/e2eMode";
import { isMindPacingSignalTag, type MindPacingSignalTag } from "@/lib/mindPacingSignals";
import type { CatAxisId } from "@/lib/profileEngine";
import { getGuidedClusterParam, isGuidedDayOneLane } from "@/lib/guidedDayOne";
import { getTodayKey } from "@/lib/dailyCompletion";
import {
  hasGuidedDayOneSavePromptBeenSeen,
  markGuidedDayOneMigrationPending,
  markGuidedDayOneSavePromptSeen,
} from "@/lib/migration/migrateGuestProgress";

const SUMMARY_WINDOW_MINUTES = 45;

const EVENT_LABELS: Record<string, string> = {
  mindpacing_completed: "MindPacing finalizat",
  vocab_completed: "Vocab finalizat",
  today_run_completed: "Today Run",
  arena_run_completed: "Arena Run",
  cat_lite_completed: "CAT Lite complet",
};

const GUIDED_DAY1_MICRO_DONE_KEY = "guided_day1_micro_done";

function getDailyMicroFlag(): string | null {
  return (() => {
    try {
      return getTodayKey();
    } catch {
      return new Date().toDateString();
    }
  })();
}

function hasCompletedGuidedDayOneMicro() {
  if (typeof window === "undefined") return false;
  const dayKey = getDailyMicroFlag();
  if (!dayKey) return false;
  try {
    return window.localStorage.getItem(GUIDED_DAY1_MICRO_DONE_KEY) === dayKey;
  } catch {
    return false;
  }
}

function setCompletedGuidedDayOneMicro() {
  if (typeof window === "undefined") return;
  const dayKey = getDailyMicroFlag();
  if (!dayKey) return;
  try {
    window.localStorage.setItem(GUIDED_DAY1_MICRO_DONE_KEY, dayKey);
  } catch {}
}

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

const GUIDED_DAY_ONE_INSIGHTS: Record<MindPacingSignalTag | "default", { headline: string; detail: string }> = {
  brain_fog: {
    headline: "Starea ta nu era „lene”. Era ceață cognitivă.",
    detail: "Ai aerisit zgomotul mental și ai ales un singur lucru real.",
  },
  overthinking: {
    headline: "Blocajul a fost ruminația fără sfârșit.",
    detail: "Ai tăiat firul overthinking și ai păstrat o singură decizie.",
  },
  task_switching: {
    headline: "Zgomotul real a fost task switching-ul continuu.",
    detail: "Ai fixat atenția pe un singur lucru cu miză.",
  },
  somatic_tension: {
    headline: "Corpul ținea frâna, nu motivația.",
    detail: "Ai redus tensiunea și ai eliberat energia pentru o decizie reală.",
  },
  default: {
    headline: "Nu era lipsă de motivație.",
    detail: "Era zgomot cognitiv și acum ai numit trigger-ul principal.",
  },
};

function resolveGuidedInsight(tag: string | null | undefined) {
  if (tag && isMindPacingSignalTag(tag)) {
    return GUIDED_DAY_ONE_INSIGHTS[tag];
  }
  return GUIDED_DAY_ONE_INSIGHTS.default;
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

export type SessionCompletePageInnerProps = {
  forcedSource?: string | null;
  forcedLane?: string | null;
};

export function SessionCompletePageInner({ forcedSource = null, forcedLane = null }: SessionCompletePageInnerProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const todayKeyRef = useRef<string | null>(null);
  if (!todayKeyRef.current) {
    todayKeyRef.current = getTodayKey();
  }
  const savePromptDayKey = todayKeyRef.current;
  const [savePromptGateReady, setSavePromptGateReady] = useState(false);
  const [savePromptSeenBefore, setSavePromptSeenBefore] = useState(false);
  const [savePromptDismissed, setSavePromptDismissed] = useState(false);
  const savePromptLoggedRef = useRef(false);

  useEffect(() => {
    track("session_complete_viewed");
  }, []);

  const isE2E = isE2EMode() || searchParams?.get("e2e") === "1";
  const withE2E = (path: string) => (isE2E ? `${path}${path.includes("?") ? "&" : "?"}e2e=1` : path);
  const buildUrl = useCallback(
    (basePath: string, params: Record<string, string>) => {
      const query = new URLSearchParams(params);
      if (isE2E) {
        query.set("e2e", "1");
      }
      return `${basePath}?${query.toString()}`;
    },
    [isE2E],
  );

  const sourceParam = forcedSource ?? searchParams?.get("source");
  const laneParam = forcedLane ?? searchParams?.get("lane");
  const guidedLaneActive = isGuidedDayOneLane(sourceParam, laneParam);
  const isGuestOrAnon = !user || user.isAnonymous || isE2E;
  const guidedDayOneSummaryActive = guidedLaneActive;
  const alreadyDidMicro = hasCompletedGuidedDayOneMicro();
  const showGuidedDayOneFollowUp = guidedDayOneSummaryActive && !alreadyDidMicro;
  const guidedAxis = (progressFacts?.mindPacing?.axisId ?? null) as CatAxisId | null;
  const guidedInsight = useMemo(
    () => resolveGuidedInsight(progressFacts?.mindPacing?.mindTag ?? null),
    [progressFacts],
  );
  const guidedDayOneFollowUpHref = useMemo(() => {
    const params: Record<string, string> = {
      source: "guided_day1",
      mode: "quick",
      round: "extra",
      lessonMode: "short",
      lane: "guided_day1",
    };
    if (guidedAxis) {
      params.axis = guidedAxis;
      const clusterParam = getGuidedClusterParam(guidedAxis);
      if (clusterParam) {
        params.cluster = clusterParam;
      }
    }
    return buildUrl("/today/run", params);
  }, [buildUrl, guidedAxis]);

  useEffect(() => {
    if (!guidedLaneActive || !isGuestOrAnon) {
      setSavePromptGateReady(false);
      setSavePromptSeenBefore(false);
      setSavePromptDismissed(false);
      savePromptLoggedRef.current = false;
      return;
    }
    const seen = hasGuidedDayOneSavePromptBeenSeen(savePromptDayKey);
    setSavePromptSeenBefore(seen);
    setSavePromptGateReady(true);
    savePromptLoggedRef.current = false;
  }, [guidedLaneActive, isGuestOrAnon, savePromptDayKey]);

  const showSaveProgressCard =
    guidedLaneActive && isGuestOrAnon && !savePromptDismissed && savePromptGateReady && !savePromptSeenBefore;

  useEffect(() => {
    if (!showSaveProgressCard || savePromptLoggedRef.current) return;
    markGuidedDayOneSavePromptSeen(savePromptDayKey);
    savePromptLoggedRef.current = true;
    track("save_progress_prompt_view", { lane: "guided_day1", location: "session_complete" });
  }, [savePromptDayKey, showSaveProgressCard]);

  const todayHrefBase = guidedLaneActive ? "/today?source=guided_day1" : "/today";
  const todayHref = withE2E(todayHrefBase);

  const buildNextRoute = () => {
    const params = new URLSearchParams({ source: "session_complete", round: "extra" });
    if (isE2E) {
      params.set("e2e", "1");
    }
    return `/today/next?${params.toString()}`;
  };

  const applyNavigation = useCallback(
    (target: string, replace = false) => {
      if (isE2E && typeof window !== "undefined") {
        if (replace) {
          window.location.replace(target);
        } else {
          window.location.assign(target);
        }
        return;
      }
      if (replace) {
        router.replace(target);
      } else {
        router.push(target);
      }
    },
    [isE2E, router],
  );

  const handleAnotherRound = async () => {
    if (ctaLoading) return;
    setCtaLoading(true);
    const nextRoute = buildNextRoute();
    try {
      if (membershipTier === "premium") {
        track("session_complete_another_round", { tier: membershipTier, via: "premium" });
        applyNavigation(nextRoute);
        return;
      }
      if (earnedRounds.canSpend) {
        await earnedRounds.spend();
        track("session_complete_another_round", { tier: membershipTier, via: "credit" });
        applyNavigation(nextRoute);
        return;
      }
      track("session_complete_another_round", { tier: membershipTier, via: "earn_gate" });
      applyNavigation(buildUrl("/today/earn", { source: "session_complete", round: "extra" }));
    } finally {
      setCtaLoading(false);
    }
  };

  const handleOpenEarnGate = () => {
    track("session_complete_go_to_earn");
    applyNavigation(buildUrl("/today/earn", { source: "session_complete", round: "extra" }));
  };

  const handleGuidedDayOneContinue = () => {
    track("guided_day1_summary_continue");
    setCompletedGuidedDayOneMicro();
    applyNavigation(guidedDayOneFollowUpHref);
  };

  const handleGuidedDayOneExplore = () => {
    track("guided_day1_summary_explore");
    const target = buildUrl("/intro/explore", { source: "guided_day1", entry: "cat-lite" });
    applyNavigation(target);
  };

  const handleGuidedDayOneBack = () => {
    track("guided_day1_summary_back_today");
    applyNavigation(todayHref);
  };

  const handleSaveProgressCreate = () => {
    track("save_progress_prompt_action", { lane: "guided_day1", action: "create_account" });
    markGuidedDayOneSavePromptSeen(savePromptDayKey);
    markGuidedDayOneMigrationPending();
    const target = `/auth?mode=signup&returnTo=${encodeURIComponent(
      withE2E("/session/complete?lane=guided_day1&source=guided_day1"),
    )}`;
    applyNavigation(target);
  };

  const handleSaveProgressDismiss = () => {
    track("save_progress_prompt_action", { lane: "guided_day1", action: "dismiss" });
    markGuidedDayOneSavePromptSeen(savePromptDayKey);
    setSavePromptDismissed(true);
  };

  const saveProgressCard = showSaveProgressCard ? (
    <section
      className="mt-8 rounded-[24px] border border-[var(--omni-border-soft)] bg-white px-6 py-5 text-left shadow-[0_18px_40px_rgba(0,0,0,0.08)]"
      data-testid="save-progress-card"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Salvează-ți progresul</p>
      <p className="mt-2 text-base font-semibold text-[var(--omni-ink)]">Păstrezi rezultatele și traseul pe toate dispozitivele.</p>
      <p className="mt-1 text-sm text-[var(--omni-ink)]/80">Durează 10 secunde și sincronizează MindPacing, vocab și sesiunea ghidată.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <OmniCtaButton
          className="justify-center sm:min-w-[200px]"
          onClick={handleSaveProgressCreate}
          data-testid="save-progress-create"
        >
          Creează cont
        </OmniCtaButton>
        <button
          type="button"
          className="rounded-[14px] border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--omni-ink)]"
          onClick={handleSaveProgressDismiss}
          data-testid="save-progress-dismiss"
        >
          Mai târziu
        </button>
      </div>
    </section>
  ) : null;

  return (
    <>
      <AppShell
        header={
          guidedDayOneSummaryActive
            ? null
            : (
                <SiteHeader
                  showMenu={accessTier.flags.showMenu}
                  onMenuToggle={() => setMenuOpen(true)}
                  onAuthRequest={() => router.push("/auth?returnTo=%2Fsession%2Fcomplete")}
                />
              )
        }
        bodyClassName={guidedDayOneSummaryActive ? "bg-[var(--omni-bg-soft)]" : undefined}
        mainClassName={guidedDayOneSummaryActive ? "px-0 py-10" : undefined}
      >
        {guidedDayOneSummaryActive ? (
          <div className="mx-auto w-full max-w-3xl px-4" data-testid="session-complete-root">
            <div data-testid="guided-day1-summary-root">
              <section
                className="rounded-[32px] border border-[var(--omni-border-soft)] bg-white px-6 py-10 text-center shadow-[0_24px_70px_rgba(0,0,0,0.1)] sm:px-12"
                data-testid="guided-day1-summary"
              >
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
                Prima sesiune ghidată
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[var(--omni-ink)] sm:text-[40px]">Ai redus zgomotul inițial</h1>
              <p className="mt-3 text-sm text-[var(--omni-ink)]/80">Durată reală: {durationLabel}</p>
              <div className="mt-6 rounded-[24px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-soft)] px-5 py-5 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--omni-muted)]">Insight</p>
                <p className="mt-2 text-lg font-semibold text-[var(--omni-ink)]">{guidedInsight.headline}</p>
                <p className="mt-1 text-sm text-[var(--omni-ink)]/80">{guidedInsight.detail}</p>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                {showGuidedDayOneFollowUp ? (
                  <div className="flex flex-col items-center gap-2">
                    <OmniCtaButton
                      className="justify-center sm:min-w-[220px]"
                      onClick={handleGuidedDayOneContinue}
                      data-testid="guided-day1-summary-continue"
                    >
                      Continuă (2 min)
                    </OmniCtaButton>
                    <p className="text-center text-xs text-[var(--omni-muted)]">
                      Un micro-jurnal de 2 minute fixează decizia de azi. Îl faci o singură dată.
                    </p>
                  </div>
                ) : null}
                <OmniCtaButton
                  className="justify-center sm:min-w-[220px]"
                  variant="neutral"
                  onClick={handleGuidedDayOneExplore}
                  data-testid="guided-day1-summary-explore"
                >
                  Vreau mai mult
                </OmniCtaButton>
                <button
                  type="button"
                  className="rounded-[14px] border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--omni-ink)]"
                  onClick={handleGuidedDayOneBack}
                  data-testid="session-back-today"
                >
                  Înapoi la Today
                </button>
              </div>
              {saveProgressCard}
              <p className="mt-5 text-xs text-[var(--omni-muted)]">
                {showGuidedDayOneFollowUp
                  ? "Următorul pas: un micro-jurnal de 2 minute fixează decizia."
                  : "Micro-jurnalul de 2 minute a fost completat azi."}
              </p>
            </section>
            </div>
          </div>
        ) : (
          <div
            className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8"
            data-testid="session-complete-root"
          >
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
                  <OmniCtaButton
                    className="justify-center sm:min-w-[220px]"
                    onClick={handleAnotherRound}
                    disabled={ctaLoading}
                    data-testid="session-another-round"
                  >
                    Încă o rundă
                  </OmniCtaButton>
                  <Link
                    href={todayHref}
                    prefetch={false}
                    className="rounded-[14px] border border-[var(--omni-border-soft)] px-4 py-2 text-center text-sm font-semibold text-[var(--omni-ink)]"
                    data-testid="session-back-today"
                    onClick={() => track("session_complete_back_today")}
                  >
                    Înapoi la Today
                  </Link>
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
        )}
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

export default function SessionCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <SessionCompletePageInner />
    </Suspense>
  );
}
