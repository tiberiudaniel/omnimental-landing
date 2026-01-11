"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { JournalDrawer } from "@/components/journal/JournalDrawer";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import ProgressDashboard from "@/components/dashboard/ProgressDashboard";
import { OmniCard } from "@/components/OmniCard";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import type { JournalTabId } from "@/lib/journal";
import DemoUserSwitcher from "@/components/DemoUserSwitcher";
import { getDemoProgressFacts } from "@/lib/demoData";
import { useAuth } from "@/components/AuthProvider";
import RequireAuth from "@/components/auth/RequireAuth";
import { getTodayKey } from "@/lib/dailyReset";
import {
  getLocalInitiationFacts,
  INITIATION_PROGRESS_EVENT,
} from "@/lib/content/initiationProgressStorage";
import { INITIATION_MODULES } from "@/config/content/initiations/modules";
import type { ProgressFact } from "@/lib/progressFacts";
import { isE2EMode } from "@/lib/e2eMode";

const FALLBACK_GUEST_ID = (() => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return `guest-${Math.random().toString(36).slice(2, 10)}`;
})();

const formatLessonLabel = (lessonId: string | null): string => {
  if (!lessonId) return "—";
  return lessonId
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

function ProgressContent() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const { data: progress, loading: progressLoading } = useProgressFacts(profile?.id);
  const search = useSearchParams();
  const demoParam = search?.get("demo");
  const e2e = (search?.get('e2e') === '1') || (demoParam === '1');
  const debugGrid = search?.get("grid") === "1" || search?.get("debug") === "grid";
  const demoVariant = demoParam ? (Number(demoParam) === 2 ? 2 : Number(demoParam) === 3 ? 3 : 1) : null;
  const fromParam = search?.get("from");
  const returnToParam = search?.get('returnTo');
  // Auto-demo only when explicitly requested via demo=1/2/3 or e2e=1; not via from=...
  const autoDemo = demoVariant || e2e ? (demoVariant ?? 1) : null;
  const demoFacts = autoDemo ? getDemoProgressFacts(lang === "en" ? "en" : "ro", autoDemo as 1 | 2 | 3) : undefined;
  const factsForViz = progress ?? demoFacts ?? null;
  const hasProgressData = useMemo(() => {
    if (demoFacts) return true;
    if (!progress) return false;
    const hasCore =
      Boolean(progress.intent) ||
      Boolean(progress.motivation) ||
      Boolean(progress.evaluation);
    const hasActivity =
      (Array.isArray(progress.practiceSessions) && progress.practiceSessions.length > 0) ||
      (Array.isArray(progress.recentEntries) && progress.recentEntries.length > 0);
    return hasCore || hasActivity;
  }, [demoFacts, progress]);
  // fromParam used elsewhere as well
  const afterParam = search?.get("after");
  const stepParam = search?.get('step');
  const [guestExpDone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return window.localStorage.getItem('omnimental_exp_onb_completed') === '1'; } catch { return false; }
  });
  const initialJournalState = (() => {
    const open = search?.get("open");
    if (open === "journal") {
      // Gate is currently disabled; allow opening even for demo/guest via anonymous auth
      const JOURNAL_GATE_ENABLED = false;
      const sel = profile?.selection ?? "none";
      const allowed = sel === "individual" || sel === "group";
      const allowBySource = (search?.get("from") === "experience-onboarding");
      return { open: !JOURNAL_GATE_ENABLED || allowed || allowBySource, blocked: JOURNAL_GATE_ENABLED && !allowed && !allowBySource };
    }
    return { open: false, blocked: false };
  })();
  // After 2 minutes, nudge user to do a quick mini‑report (sliders) if last one is stale
  const [showDailyNudge, setShowDailyNudge] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const last = (progress?.quickAssessment as { updatedAt?: unknown } | undefined)?.updatedAt;
        const toMs = (v: unknown) => {
          try {
            if (!v) return 0;
            if (typeof v === 'number') return v;
            if (v instanceof Date) return v.getTime();
            const ts = v as { toDate?: () => Date };
            if (typeof ts?.toDate === 'function') return ts.toDate().getTime();
          } catch {}
          return 0;
        };
        const lastMs = toMs(last);
        const stale = !lastMs || (Date.now() - lastMs) > (24 * 60 * 60 * 1000);
        if (stale) setShowDailyNudge(true);
      } catch {}
    }, 120000);
    return () => window.clearTimeout(id);
  }, [progress]);
  const [journalBlocked] = useState(initialJournalState.blocked);
  const [journalOpen, setJournalOpen] = useState(initialJournalState.open);
  const guestJournalId = useMemo(() => {
    if (profile?.id || user?.uid) return null;
    if (typeof window === "undefined") return null;
    const key = "omnimental_guest_id";
    const readStored = () => {
      const stored = window.localStorage.getItem(key);
      return stored && stored.trim().length ? stored : null;
    };
    let stored = readStored();
    if (!stored) {
      stored = FALLBACK_GUEST_ID;
      try {
        window.localStorage.setItem(key, stored);
      } catch {
        // ignore storage write failures
      }
    }
    return stored || FALLBACK_GUEST_ID;
  }, [profile?.id, user?.uid]);
  const goToAuth = () => router.push("/auth");
  const initialTabParam = (() => {
    const tab = search?.get('tab');
    const allowed = new Set(['SCOP_INTENTIE','MOTIVATIE_REZURSE','PLAN_RECOMANDARI','OBSERVATII_EVALUARE','NOTE_LIBERE']);
    return tab && allowed.has(tab) ? (tab as JournalTabId) : undefined;
  })();
  const journalSource = search?.get("source");
  const journalContext = useMemo(() => {
    const fromDailyAxes = journalSource === "daily_axes";
    const fromStep = stepParam === "journal-open";
    return {
      sourcePage: fromDailyAxes ? "dashboard.daily_axes" : "progress",
      sourceBlock: fromDailyAxes
        ? "dashboard.daily_axes.card"
        : fromStep
          ? "initiation.journal"
          : undefined,
      suggestedSnippets: fromDailyAxes
        ? lang === "ro"
          ? [
              "Notează în 2-3 propoziții ce vezi la claritate/emoție/energie.",
              "Ce schimbare mică vrei să faci azi?",
            ]
          : [
              "Capture 2-3 sentences about clarity/emotion/energy right now.",
              "What small adjustment will you make today?",
            ]
        : fromStep
          ? lang === "ro"
            ? [
                "Două propoziții despre starea ta acum.",
                "Ce ai observat la tine în ultimele ore?",
              ]
            : [
                "Two short sentences about your state now.",
                "What did you notice in the last hours?",
              ]
          : undefined,
    };
  }, [journalSource, lang, stepParam]);
  const journalUserId = profile?.id ?? user?.uid ?? guestJournalId ?? (demoParam || e2e ? "demo-user" : null);
  const [initiationFactsVersion, setInitiationFactsVersion] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setInitiationFactsVersion((version) => version + 1);
    window.addEventListener(INITIATION_PROGRESS_EVENT, handler);
    return () => window.removeEventListener(INITIATION_PROGRESS_EVENT, handler);
  }, []);
  const initiationFacts = useMemo(() => {
    void initiationFactsVersion;
    return getLocalInitiationFacts(profile?.id ?? user?.uid ?? null);
  }, [profile?.id, user?.uid, initiationFactsVersion]);
  const sessionsCompleted =
    progress?.stats?.dailySessionsCompleted ?? initiationFacts?.completedLessons ?? 0;
  const streakDays = initiationFacts?.streakDays ?? 0;
  const initiationModuleTitle = initiationFacts
    ? INITIATION_MODULES[initiationFacts.currentModuleId]?.title
    : null;
  const initiationModuleProgress = initiationFacts
    ? `${Math.min(initiationFacts.completedLessons + 1, initiationFacts.moduleLessonCount)}/${
        initiationFacts.moduleLessonCount
      }`
    : null;
  const nextLessonLabel = initiationFacts?.nextLessonId ? formatLessonLabel(initiationFacts.nextLessonId) : null;
  const initiationSummaryCard = initiationFacts ? (
    <OmniCard className="px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
        Inițiere · World 1
      </p>
      <div className="mt-3 grid gap-3 text-sm text-[var(--omni-ink)]/80 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Streak</p>
          <p className="text-lg font-semibold text-[var(--omni-ink)]">{streakDays} zile</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Sesiuni</p>
          <p className="text-lg font-semibold text-[var(--omni-ink)]">{sessionsCompleted}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">Modul curent</p>
          <p className="text-lg font-semibold text-[var(--omni-ink)]">{initiationModuleTitle ?? "—"}</p>
          {initiationModuleProgress ? (
            <p className="text-xs text-[var(--omni-muted)]">Lecția {initiationModuleProgress}</p>
          ) : null}
        </div>
      </div>
      {nextLessonLabel ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--omni-ink)]">
            Următoarea lecție: <span className="font-semibold">{nextLessonLabel}</span>
          </p>
          <OmniCtaButton onClick={() => router.push("/today")} data-testid="progress-next-lesson-cta">
            {lang === "ro" ? "Continuă lecția" : "Continue lesson"}
          </OmniCtaButton>
        </div>
      ) : null}
    </OmniCard>
  ) : null;


  // React to open=journal in URL: open the drawer immediately, then clean the param
  useEffect(() => {
    if (search?.get('open') === 'journal') {
      const id = window.setTimeout(() => setJournalOpen(true), 0);
      const params = new URLSearchParams(search?.toString() ?? '');
      params.delete('open');
      params.delete('source');
      router.replace(params.toString() ? `/progress?${params.toString()}` : '/progress');
      return () => window.clearTimeout(id);
    }
  }, [router, search]);

  // Absence (72h) nudge: compute asynchronously in effect to satisfy lint rules
  const [absenceNudge, setAbsenceNudge] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        if (!progress) { setAbsenceNudge(false); return; }
        const toMs = (v: unknown) => {
          try {
            if (!v) return 0;
            if (typeof v === 'number') return v;
            if (v instanceof Date) return v.getTime();
            const ts = v as { toDate?: () => Date };
            return typeof ts?.toDate === 'function' ? ts.toDate().getTime() : 0;
          } catch { return 0; }
        };
        const sessions = Array.isArray(progress.practiceSessions) ? (progress.practiceSessions as Array<{ startedAt?: unknown }>) : [];
        let last = 0;
        sessions.forEach((s) => { const ms = toMs(s?.startedAt); if (ms > last) last = ms; });
        const evs = Array.isArray((progress as { activityEvents?: Array<{ startedAt?: unknown }> })?.activityEvents) ? (progress as { activityEvents?: Array<{ startedAt?: unknown }> }).activityEvents! : [];
        evs.forEach((e) => { const ms = toMs(e?.startedAt); if (ms > last) last = ms; });
        const AGE = Date.now() - last;
        setAbsenceNudge(AGE > 72 * 60 * 60 * 1000);
      } catch { setAbsenceNudge(false); }
    }, 0);
    return () => window.clearTimeout(id);
  }, [progress]);

  const journalDrawer = !journalBlocked && journalUserId ? (
    <JournalDrawer
      open={journalOpen}
      onOpenChange={setJournalOpen}
      userId={journalUserId}
      context={journalContext}
      initialTab={initialTabParam}
    />
  ) : null;

  // Guided Day-1 gating moved to /today route. Progress always shows full dashboard.

  if (!profile?.id) {
    if (demoParam || e2e) {
      const header = (
        <SiteHeader onAuthRequest={e2e ? undefined : goToAuth} onMenuToggle={() => setMenuOpen(true)} />
      );
      return (
        <div>
          <AppShell header={header}>
            {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? <DemoUserSwitcher /> : null}
            <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
            {fromParam === 'experience-onboarding' && !guestExpDone ? (
              <OmniCard
                className="mb-3 rounded-[14px] px-5 py-4"
                style={{ borderColor: "var(--omni-success)", backgroundColor: "var(--omni-success-soft)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-[var(--omni-ink-soft)]">{lang === 'ro' ? 'Continuă experiența ghidată' : 'Continue the guided experience'}</p>
                      <p className="text-sm text-[var(--omni-ink-soft)]/80">{lang === 'ro' ? 'Mai ai 2 pași scurți: jurnal și exercițiu de respirație.' : '2 short steps left: journal and breathing practice.'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/experience-onboarding?flow=initiation&step=journal')}
                      className="rounded-[10px] border border-[var(--omni-ink-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink-soft)] hover:bg-[var(--omni-ink-soft)] hover:text-white"
                      data-testid="progress-cta-eo-continue"
                    >
                      {lang === 'ro' ? 'Continuă' : 'Continue'}
                    </button>
                </div>
              </OmniCard>
            ) : null}
              <ProgressDashboard profileId={journalUserId ?? "demo-user"} demoFacts={demoFacts} debugGrid={debugGrid} />
            </div>
            {journalDrawer}
          </AppShell>
          <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
        </div>
      );
    }
    const header = <SiteHeader onAuthRequest={goToAuth} />;
    return (
      <div>
        <AppShell header={header}>
          <div className="mx-auto max-w-5xl px-4 py-8">
            <p className="text-sm text-[var(--omni-ink-soft)]">
              {getString(t, "progress.loginToView", lang === "ro" ? "Conectează-te pentru a vedea tabloul tău de bord." : "Sign in to view your dashboard.")}
            </p>
          </div>
        </AppShell>
      </div>
    );
  }

  return (
    <div>
      <AppShell
        header={<SiteHeader onAuthRequest={goToAuth} onMenuToggle={() => setMenuOpen(true)} />}
      >
      {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? <DemoUserSwitcher /> : null}
      {demoParam ? (
        <div className="mx-auto mt-3 w-full max-w-5xl px-4">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="inline-flex items-center rounded-full bg-[var(--omni-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">{lang === "ro" ? "Demo" : "Demo"}</span>
            <span className="inline-flex items-center rounded-[8px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2.5 py-1 text-[var(--omni-ink-soft)]">
              {lang === "ro"
                ? "Mod demo: date sintetice — nu se salvează în cont."
                : "Demo mode: synthetic data — not saved to your account."}
            </span>
          </div>
        </div>
      ) : null}
      {!hasProgressData && !progressLoading ? (
        <div className="mx-auto mt-4 w-full max-w-5xl px-4">
          <OmniCard className="px-5 py-4 text-sm">
            <p className="text-base font-semibold text-[var(--omni-ink)]">
              {lang === "ro" ? "Încă nu ai date salvate" : "No progress data yet"}
            </p>
            <p className="mt-1">
              {lang === "ro"
                ? "Completează primul test din experiența ghidată pentru a-ți construi tabloul de bord."
                : "Complete the guided experience to generate your personalized dashboard."}
            </p>
            <OmniCtaButton
              type="button"
              variant="primary"
              onClick={() => router.push("/?from=progress&step=preIntro")}
              className="mt-3"
            >
              {lang === "ro" ? "Începe mini-evaluarea" : "Start the mini assessment"}
            </OmniCtaButton>
          </OmniCard>
        </div>
      ) : null}
      {initiationSummaryCard ? <div className="mx-auto mt-4 w-full max-w-5xl px-4">{initiationSummaryCard}</div> : null}
      {journalBlocked ? (
        <div className="mx-auto mt-3 w-full max-w-5xl px-4">
          <OmniCard className="bg-[var(--omni-bg-paper)] px-4 py-3 text-sm shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {lang === 'ro'
                  ? 'Jurnalul se activează după ce alegi modul de lucru (individual sau grup).'
                  : 'The journal unlocks after you choose a format (individual or group).'}
              </p>
              <OmniCtaButton
                type="button"
                variant="neutral"
                size="sm"
                onClick={() => router.push('/choose?from=journal')}
                className="px-4"
              >
                {lang === 'ro' ? 'Alege formatul' : 'Choose format'}
              </OmniCtaButton>
            </div>
          </OmniCard>
        </div>
      ) : null}
      {/* Force-open journal drawer when allowed */}
      {journalDrawer}
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        {fromParam === 'onboarding-auth' ? (
          <OmniCard
            className="mb-3 rounded-[12px] px-4 py-3 text-sm"
            data-testid="onboarding-auth-banner"
            style={{ borderColor: "var(--omni-success)", backgroundColor: "var(--omni-success-soft)", color: "var(--omni-ink)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {lang === 'ro'
                  ? 'Pentru a continua experiența, conectează-te. Te vom întoarce exact unde erai.'
                  : 'To continue the experience, please sign in. We will return you to your last step.'}
              </p>
              <a
                href={`/auth${returnToParam ? `?returnTo=${encodeURIComponent(returnToParam)}` : ''}`}
                className="rounded-[10px] border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em]"
                style={{ borderColor: "var(--omni-energy)", color: "var(--omni-energy)" }}
              >
                {lang === 'ro' ? 'Conectează-te' : 'Sign in'}
              </a>
            </div>
          </OmniCard>
        ) : null}
        {absenceNudge ? (
          <OmniCard className="mb-3 bg-[var(--omni-bg-paper)] px-4 py-3 text-sm shadow-[0_10px_24px_rgba(0,0,0,0.05)]" data-testid="absence-nudge">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{lang === 'ro' ? 'Ai lipsit câteva zile. Vrei să adaugi rapid 1–2 acțiuni pentru zilele trecute?' : 'You’ve been away a few days. Want to quickly add 1–2 actions for past days?'}</p>
              <a
                href="/progress#actions-trend"
                className="rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]"
                style={{
                  backgroundColor: "var(--omni-brand-soft)",
                  color: "var(--omni-ink)",
                  border: `1px solid var(--omni-border-soft)`,
                }}
              >
                {lang === 'ro' ? 'Mergi la Trendul acțiunilor' : 'Go to Actions trend'}
              </a>
            </div>
          </OmniCard>
        ) : null}
        {showDailyNudge ? (
          <OmniCard className="mb-3 bg-[var(--omni-bg-paper)] px-4 py-3 text-sm shadow-[0_10px_24px_rgba(0,0,0,0.05)]" data-testid="daily-nudge">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{lang === 'ro' ? 'Completează o mini‑raportare (1–10) ca să ținem indicatorii interni proaspeți.' : 'Do a quick mini‑report (1–10) to keep internal indicators fresh.'}</p>
              <OmniCtaButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() => router.push('/experience-onboarding?flow=initiation&step=daily-state')}
                className="px-4"
              >
                {lang === 'ro' ? 'Deschide sliderele' : 'Open sliders'}
              </OmniCtaButton>
            </div>
          </OmniCard>
        ) : null}
        {fromParam === 'experience-onboarding' && profile && profile.experienceOnboardingCompleted !== true ? (
          <OmniCard
            className="mb-3 rounded-[14px] px-5 py-4"
            style={{ borderColor: "var(--omni-success)", backgroundColor: "var(--omni-success-soft)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-[var(--omni-ink-soft)]">{lang === 'ro' ? 'Continuă experiența ghidată' : 'Continue the guided experience'}</p>
                <p className="text-sm text-[var(--omni-ink-soft)]/80">{lang === 'ro' ? 'Mai ai 2 pași scurți: jurnal și exercițiu de respirație.' : '2 short steps left: journal and breathing practice.'}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/experience-onboarding?flow=initiation&step=journal')}
                className="rounded-[10px] border border-[var(--omni-ink-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink-soft)] hover:bg-[var(--omni-ink-soft)] hover:text-white"
                data-testid="progress-cta-eo-continue"
              >
                {lang === 'ro' ? 'Continuă' : 'Continue'}
              </button>
            </div>
          </OmniCard>
        ) : null}
        {fromParam === 'onboarding-test' || fromParam === 'experience-onboarding' ? (
          <div className="mb-3 rounded-[12px] border border-[var(--omni-success)] bg-[var(--omni-success-soft)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]">
            {lang === 'ro' ? 'Ai completat primul tău test.' : 'You completed your first test.'}
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'omnikuno-test-done' ? (
          <div className="mb-3 rounded-[14px] border border-[var(--omni-success)] bg-[var(--omni-success-soft)] px-5 py-4 shadow-sm" data-testid="init-banner-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-[var(--omni-ink-soft)]">{lang === 'ro' ? 'Mini‑test OmniKuno finalizat.' : 'OmniKuno mini‑test completed.'}</p>
                <p className="text-sm text-[var(--omni-ink-soft)]/80">{lang === 'ro' ? 'Scorul tău și trendurile au fost actualizate.' : 'Your score and trends have been updated.'}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/experience-onboarding?flow=initiation&step=journal')}
                className="rounded-[10px] border border-[var(--omni-ink-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink-soft)] hover:bg-[var(--omni-ink-soft)] hover:text-white"
              >
                {lang === 'ro' ? 'Pasul 2: Jurnal' : 'Step 2: Journal'}
              </button>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'journal-open' ? (
          <div className="mb-3 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]" data-testid="init-banner-2a">
            <div className="flex flex-col gap-1">
              <p>{lang === 'ro' ? 'Deschide „Note libere” și scrie 2 propoziții (~60 caractere). Apoi închide jurnalul.' : 'Open “Free notes” and write 2 short sentences (~60 chars). Then close the journal.'}</p>
              <p className="text-[12px] text-[var(--omni-muted)]">{lang === 'ro' ? 'Vei vedea intrarea la „Însemnări recente”, „Trends” și „Reflecții”.' : 'You’ll see it under “Recent entries”, “Trends” and “Reflections”.'}</p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/experience-onboarding?flow=initiation&step=omniscope')}
                  className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
                >
                  {lang === 'ro' ? 'Am scris' : 'I wrote it'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/experience-onboarding?flow=initiation&step=omniscope')}
                  className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)] hover:border-[var(--omni-energy)] hover:text-[var(--omni-ink)]"
                >
                  {lang === 'ro' ? 'Sari peste' : 'Skip'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'journal-done' ? (
          <div className="mb-3 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]" data-testid="init-banner-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>{lang === 'ro' ? 'Pas 2 complet: reflecția ta a fost salvată.' : 'Step 2 complete: your reflection has been saved.'}</p>
              <button type="button" onClick={() => router.push('/experience-onboarding?flow=initiation&step=omniscope')} className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]">{lang === 'ro' ? 'Pasul 3: OmniScope' : 'Step 3: OmniScope'}</button>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'omniscope-done' ? (
          <div className="mb-3 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]" data-testid="init-banner-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>{lang === 'ro' ? 'Pas 3 complet: contextul tău a fost actualizat.' : 'Step 3 complete: your context has been updated.'}</p>
              <button type="button" onClick={() => router.push('/experience-onboarding?flow=initiation&step=daily-state')} className="rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]">{lang === 'ro' ? 'Pasul 4: Stare zilnică' : 'Step 4: Daily state'}</button>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'daily-state-done' ? (
          <div className="mb-3 rounded-[12px] border border-[var(--omni-success)] bg-[var(--omni-success-soft)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]" data-testid="init-banner-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>{lang === 'ro' ? 'Pas 4 complet: starea de azi a fost înregistrată.' : 'Step 4 complete: today’s state recorded.'}</p>
              <button type="button" onClick={() => router.push('/experience-onboarding?flow=initiation&step=omnikuno-lesson')} className="rounded-[10px] border border-[var(--omni-ink-soft)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink-soft)] hover:bg-[var(--omni-ink-soft)] hover:text-white">{lang === 'ro' ? 'Pasul 5: Lecție Kuno' : 'Step 5: Kuno lesson'}</button>
            </div>
          </div>
        ) : null}
        {afterParam === 'os' ? (
          <div className="mb-3 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]">
            {lang === 'ro' ? 'Ai scris în jurnal.' : 'You wrote in your journal.'}
          </div>
        ) : null}
      {afterParam === 'abil' ? (
        <div className="mb-3 rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]">
          {lang === 'ro' ? 'Ai încheiat un exercițiu OmniAbil.' : 'You finished an OmniAbil exercise.'}
        </div>
      ) : null}

        {factsForViz ? (
          <div className="mt-6 space-y-8">
            <div className="w-full max-w-5xl mx-auto px-4">
              <ProgressHeroBand lang={lang} facts={factsForViz} />
            </div>
            <div className="w-full max-w-5xl mx-auto px-4 space-y-8">
              <ProgressTwoColumnPanels lang={lang} facts={factsForViz} />
            </div>
          </div>
        ) : null}
        <section className="omni-panel-soft rounded-card p-6 md:p-7 mt-8">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Analitice detaliate" : "Detailed analytics"}
            </p>
            <p className="text-sm text-[var(--omni-muted)]">
              {lang === "ro"
                ? "Vizualizări extinse pentru ritmuri, practici și note."
                : "Extended views for rhythms, practice, and notes."}
            </p>
          </div>
          <ProgressDashboard
            profileId={profile.id}
            demoFacts={demoFacts}
            facts={progress}
            loading={progressLoading}
            debugGrid={debugGrid}
            hideOmniIntel
          />
        </section>
        <ExploreAutonomyStrip lang={lang} />
      </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </div>
  );
}

function ProgressPageInner() {
  const search = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const demoParam = search?.get("demo");
  const e2eParam = search?.get("e2e");
  const langParam = (search?.get("lang") ?? "").toLowerCase() === "en" ? "en" : "ro";
  const fromParam = search?.get("from");
  const allowGuest = Boolean(demoParam || e2eParam === "1" || fromParam === "experience-onboarding");
  const e2eOverrideActive = e2eParam === "1" || isE2EMode();

  useEffect(() => {
    console.info("[page] progress mounted");
  }, []);

  useEffect(() => {
    if (e2eOverrideActive) return;
    if (allowGuest) return;
    if (loading) return;
    if (!user) {
      const encoded = encodeURIComponent("/progress");
      router.replace(`/auth?returnTo=${encoded}`);
    }
  }, [allowGuest, loading, router, user, e2eOverrideActive]);

  if (e2eOverrideActive) {
    return <ProgressSmokeShell lang={langParam} />;
  }

  if (!allowGuest && (loading || !user)) {
    return null;
  }

  if (allowGuest) {
    return <ProgressContent />;
  }
  return (
    <RequireAuth redirectTo="/progress">
      <ProgressContent />
    </RequireAuth>
  );
}

export default function ProgressPage() {
  return (
    <div data-testid="progress-root" data-page="progress">
      <Suspense fallback={null}>
        <ProgressPageInner />
      </Suspense>
    </div>
  );
}

function ProgressSmokeShell({ lang }: { lang: string }) {
  return (
    <div>
      <AppShell header={<SiteHeader />}>
        <div className="mx-auto max-w-5xl px-4 py-8 text-[var(--omni-ink)]">
          <div className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Mod demo" : "Demo mode"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              {lang === "ro" ? "Progres (scenariu de test)" : "Progress (test scenario)"}
            </h1>
            <p className="mt-2 text-sm text-[var(--omni-ink)]/80">
              {lang === "ro"
                ? "Aceasta este o machetă pentru testele automate. UI-ul real se încarcă în aplicația live."
                : "This is a lightweight shell for automated tests. The full UI renders in the live app."}
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
                {lang === "ro" ? "Ritual zilnic" : "Daily ritual"}
              </p>
              <p className="mt-1 text-sm text-[var(--omni-ink)]">
                {lang === "ro" ? "Ai completat 3 sesiuni săptămâna asta." : "You completed 3 sessions this week."}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
                {lang === "ro" ? "Următorul pas" : "Next step"}
              </p>
              <p className="mt-1 text-sm text-[var(--omni-ink)]">
                {lang === "ro" ? "Continuă cu lecția initiation_01." : "Continue with lesson initiation_01."}
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}

type HeroFacts = ProgressFact | null | undefined;

function ProgressHeroBand({ lang, facts }: { lang: string; facts: HeroFacts }) {
  const todayKey = getTodayKey();
  const omni = (facts as { omni?: Record<string, unknown> } | null)?.omni ?? null;
  const daily = (omni as { daily?: Record<string, unknown> } | null)?.daily ?? null;
  const streak =
    typeof ((daily as { streakDays?: number } | null)?.streakDays) === "number"
      ? (daily as { streakDays?: number }).streakDays!
      : null;
  const completedToday = (daily as { lastCheckinDate?: string } | null)?.lastCheckinDate === todayKey;
  const missionLabel =
    (facts as { intent?: { primaryNeedLabel?: string; mainNeedLabel?: string } } | null)?.intent?.primaryNeedLabel ??
    (facts as { intent?: { mainNeedLabel?: string } } | null)?.intent?.mainNeedLabel ??
    (lang === "ro" ? "Tema prioritară" : "Core focus");
  const missionXp =
    typeof ((omni as { kuno?: { global?: { totalXp?: number } } } | null)?.kuno?.global?.totalXp) === "number"
      ? Math.round(((omni as { kuno?: { global?: { totalXp?: number } } } | null)?.kuno?.global?.totalXp as number) ?? 0)
      : 0;
  const quote =
    (facts as { insights?: { daily?: string } } | null)?.insights?.daily ??
    (lang === "ro"
      ? "Somnul profund stabilizează variabilitatea ritmului cardiac și susține energia pe tot parcursul zilei."
      : "Deep sleep stabilises heart‑rate variability and keeps energy steady throughout the day.");
  return (
    <div className="omni-card rounded-card p-6 md:p-7 shadow-[0_2px_6px_rgba(0,0,0,0.04)] mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="space-y-2">
        <p className="text-xs md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Ritual zilnic" : "Daily ritual"}
        </p>
        <div className="text-[12px]">
          {completedToday ? (
            <p className="text-[var(--omni-ink)]">{lang === "ro" ? "Ai bifat resetul azi." : "You logged today’s reset."}</p>
          ) : (
            <p className="text-[var(--omni-ink)]">
              {lang === "ro" ? "Încă nu ai completat resetul." : "You haven’t completed today’s reset yet."}
            </p>
          )}
          <p className="text-[var(--omni-muted)]">
            {streak
              ? lang === "ro"
                ? `Serie activă: ${streak} zile.`
                : `Active streak: ${streak} days.`
              : lang === "ro"
                ? "Începe o nouă serie astăzi."
                : "Start a new streak today."}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Misiunea ta" : "Your mission"}
        </p>
        <p className="text-base md:text-lg font-semibold text-[var(--omni-energy)]">{missionLabel}</p>
        <p className="text-[12px] text-[var(--omni-muted)]">
          {lang === "ro"
            ? `XP acumulat: ${missionXp.toLocaleString("ro-RO")}`
            : `XP collected: ${missionXp.toLocaleString("en-US")}`}
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs md:text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Revelația zilei" : "Insight of the day"}
        </p>
        <p className="text-sm italic text-[var(--omni-ink-soft)]">{quote}</p>
      </div>
    </div>
  );
}

function ExploreAutonomyStrip({ lang }: { lang: string }) {
  return (
    <section className="mx-auto mt-10 flex max-w-[680px] flex-col items-center gap-4 px-4 py-8 text-center sm:items-start">
      <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--omni-muted)]">
        {lang === "ro" ? "Explorează în ritmul tău" : "Explore at your pace"}
      </p>
      <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
        <Link
          href="/library/kuno"
          className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]/40"
        >
          {lang === "ro" ? "Lecții OmniKuno" : "OmniKuno Lessons"}
        </Link>
        <Link
          href="/abil"
          className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]/40"
        >
          {lang === "ro" ? "Acțiuni OmniAbil" : "OmniAbil Actions"}
        </Link>
      </div>
    </section>
  );
}

function ProgressTwoColumnPanels({ lang, facts }: { lang: string; facts: HeroFacts }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="space-y-6">
        <div className="omni-panel-soft rounded-card p-6 md:p-7">
          <ProgressAxesPanel lang={lang} facts={facts} />
        </div>
        <div className="omni-panel-soft rounded-card p-6 md:p-7">
          <ProgressPracticePanel lang={lang} facts={facts} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="omni-card rounded-card p-6 md:p-7 shadow-[0_2px_6px_rgba(0,0,0,0.04)]">
          <ProgressRecommendationCard lang={lang} facts={facts} />
        </div>
        <div className="omni-panel-soft rounded-card p-6 md:p-7">
          <ProgressQuickVariants lang={lang} />
        </div>
      </div>
    </div>
  );
}

function ProgressAxesPanel({ lang, facts }: { lang: string; facts: HeroFacts }) {
  const daily = ((facts as { omni?: { daily?: Record<string, unknown> } } | null)?.omni?.daily ?? {}) as Record<
    string,
    unknown
  >;
  const values =
    (daily.values as { clarity?: number; energy?: number; stress?: number } | undefined) ??
    ((daily as { levels?: { clarity?: number; energy?: number; stress?: number } }).levels ?? {});
  const clarity = typeof values?.clarity === "number" ? values.clarity : null;
  const energy = typeof values?.energy === "number" ? values.energy : null;
  const emotion = typeof values?.stress === "number" ? 10 - values.stress : null;
  const hasValues = clarity !== null || energy !== null || emotion !== null;
  const todayKey = getTodayKey();
  const completedToday = (daily as { lastCheckinDate?: string } | null)?.lastCheckinDate === todayKey;
  return (
    <div className="space-y-3 text-[var(--omni-ink)]">
      <div>
        <p className="text-xs font-semibold text-[var(--omni-muted)]">
          {lang === "ro" ? "Axe zilnice – Claritate · Emoție · Energie" : "Daily axes – Clarity · Emotion · Energy"}
        </p>
        <p className="text-sm text-[var(--omni-muted)]">
          {lang === "ro"
            ? "Rezumat scurt al energiei, echilibrului emoțional și clarității mentale."
            : "Short snapshot of energy, emotional balance, and clarity."}
        </p>
      </div>
      {hasValues ? (
        <dl className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Claritate" : "Clarity"}
            </dt>
            <dd className="text-lg font-semibold text-[var(--omni-ink)]">
              {clarity !== null ? clarity.toFixed(1) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">
              {lang === "ro" ? "Emoție" : "Emotion"}
            </dt>
            <dd className="text-lg font-semibold text-[var(--omni-ink)]">
              {emotion !== null ? emotion.toFixed(1) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">Energy</dt>
            <dd className="text-lg font-semibold text-[var(--omni-ink)]">
              {energy !== null ? energy.toFixed(1) : "—"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-[12px] text-[var(--omni-muted)]">
          {completedToday
            ? lang === "ro"
              ? "Valorile se sincronizează în câteva momente după Daily Reset."
              : "Values sync a few moments after you complete the Daily Reset."
            : lang === "ro"
              ? "Completează Daily Reset pentru a vedea aceste valori."
              : "Complete your Daily Reset to unlock these axes."}
        </p>
      )}
    </div>
  );
}

function ProgressPracticePanel({ lang, facts }: { lang: string; facts: HeroFacts }) {
  const sessions = Array.isArray((facts as { practiceSessions?: unknown[] } | null)?.practiceSessions)
    ? ((facts as { practiceSessions?: unknown[] }).practiceSessions as Array<{ type?: string }>).filter(Boolean)
    : [];
  const reflections = Array.isArray((facts as { recentEntries?: unknown[] } | null)?.recentEntries)
    ? ((facts as { recentEntries?: unknown[] }).recentEntries?.length ?? 0)
    : 0;
  const breathing = sessions.filter((s) => (s.type ?? "").toLowerCase().includes("breath")).length;
  return (
    <div className="space-y-3 text-[var(--omni-ink)]">
      <p className="text-xs font-semibold text-[var(--omni-muted)]">
        {lang === "ro" ? "Misiuni de implementare" : "Practice snapshot"}
      </p>
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">{lang === "ro" ? "Sesiuni" : "Sessions"}</p>
          <p className="text-lg font-semibold text-[var(--omni-ink)]">{sessions.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">{lang === "ro" ? "Respirații" : "Breathing"}</p>
          <p className="text-lg font-semibold text-[var(--omni-ink)]">{breathing}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">{lang === "ro" ? "Reflecții" : "Reflections"}</p>
          <p className="text-lg font-semibold text-[var(--omni-ink)]">{reflections}</p>
        </div>
      </div>
      <p className="text-[12px] text-[var(--omni-muted)]">
        {lang === "ro"
          ? "Ține ritmul: 2 acțiuni scurte/zi stabilizează progresul."
          : "Keep cadence: two short actions a day stabilise progress."}
      </p>
    </div>
  );
}

function ProgressRecommendationCard({ lang, facts }: { lang: string; facts: HeroFacts }) {
  const primary = (facts as { recommendations?: { primary?: { title?: string; body?: string; ctaHref?: string; ctaLabel?: string } } } | null)
    ?.recommendations?.primary;
  const title = primary?.title ?? (lang === "ro" ? "Reset ușor + respirație" : "Gentle reset + breathing");
  const body =
    primary?.body ??
    (lang === "ro"
      ? "Reconectează-te la corp cu un exercițiu de respirație conștientă și o notă în jurnal."
      : "Reconnect to your body with a slow breathing drill and a quick journal entry.");
  const ctaHref = typeof primary?.ctaHref === "string" ? primary.ctaHref : "/omni-kuno";
  const ctaLabel = primary?.ctaLabel ?? (lang === "ro" ? "Deschide OmniKuno" : "Open OmniKuno");
  return (
    <div className="space-y-3 text-[var(--omni-ink)]">
      <p className="text-xs font-semibold text-[var(--omni-muted)]">{lang === "ro" ? "Recomandarea ta" : "Your recommendation"}</p>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-[12px] text-[var(--omni-muted)]">{body}</p>
      <OmniCtaButton as="link" href={ctaHref} variant="kuno">
        {ctaLabel}
      </OmniCtaButton>
    </div>
  );
}

function ProgressQuickVariants({ lang }: { lang: string }) {
  const quickOptions = [
    { label: lang === "ro" ? "Mini OmniKuno (5 min)" : "Mini OmniKuno (5 min)", href: "/omni-kuno?area=emotional_balance" },
    { label: lang === "ro" ? "Jurnal ghidat" : "Guided journal", href: "/progress?open=journal&tab=NOTE_LIBERE" },
    { label: lang === "ro" ? "Respirație 4-6" : "4-6 breathing", href: "/omni-kuno?area=energy_body" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[var(--omni-muted)]">{lang === "ro" ? "Variante rapide" : "Quick variants"}</p>
      <div className="space-y-2 text-sm text-[var(--omni-ink)]">
        {quickOptions.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="block rounded-full border border-[var(--omni-border-soft)] px-3 py-2 hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
          >
            {option.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
