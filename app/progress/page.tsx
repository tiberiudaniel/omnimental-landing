"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import AccountModal from "@/components/AccountModal";
import { JournalDrawer } from "@/components/journal/JournalDrawer";
import { useI18n } from "../../components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { useProfile } from "../../components/ProfileProvider";
import { useProgressFacts } from "../../components/useProgressFacts";
import NextBestStep from "../../components/NextBestStep";
import OmniPathInline from "../../components/OmniPathInline";
import ProgressDashboard from "../../components/dashboard/ProgressDashboard";
import type { JournalTabId } from "@/lib/journal";
import { recordEvaluationTabChange } from "@/lib/progressFacts";
import DemoUserSwitcher from "../../components/DemoUserSwitcher";
import { getDemoProgressFacts } from "@/lib/demoData";
import { ensureAuth } from "@/lib/firebase";
import InfoTooltip from "@/components/InfoTooltip";
import { useAuth } from "@/components/AuthProvider";

function ProgressContent() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const { data: progress } = useProgressFacts(profile?.id);
  const search = useSearchParams();
  const demoParam = search?.get("demo");
  const e2e = (search?.get('e2e') === '1') || (demoParam === '1');
  const debugGrid = search?.get("grid") === "1" || search?.get("debug") === "grid";
  const demoVariant = demoParam ? (Number(demoParam) === 2 ? 2 : Number(demoParam) === 3 ? 3 : 1) : null;
  const fromParam = search?.get("from");
  const autoDemo = demoVariant || e2e || fromParam === 'experience-onboarding' || fromParam === 'onboarding-test' ? (demoVariant ?? 1) : null;
  const demoFacts = autoDemo ? getDemoProgressFacts(lang === "en" ? "en" : "ro", autoDemo as 1 | 2 | 3) : undefined;
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
  const omniIntelDisplay = (() => {
    try {
      const pf = (demoFacts ?? progress) as { omni?: { omniIntelScore?: number } } | undefined;
      const val = Number(pf?.omni?.omniIntelScore ?? 0);
      return Number.isFinite(val) ? Math.round(val) : 0;
    } catch { return 0; }
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
  const initialTabParam = (() => {
    const tab = search?.get('tab');
    const allowed = new Set(['SCOP_INTENTIE','MOTIVATIE_REZURSE','PLAN_RECOMANDARI','OBSERVATII_EVALUARE','NOTE_LIBERE']);
    return tab && allowed.has(tab) ? (tab as JournalTabId) : undefined;
  })();

  // Provide an anonymous uid when profile is not selected so journal can still persist in demo/guest
  const [anonUid, setAnonUid] = useState<string | null>(null);
  useEffect(() => {
    // Only acquire an anonymous UID when we truly have no signed-in user
    if (authLoading) return;
    if (user && !user.isAnonymous) return; // already authenticated with email
    if (!profile?.id) {
      void ensureAuth().then((u) => setAnonUid(u?.uid ?? null));
    }
  }, [authLoading, user, profile?.id]);

  // React to open=journal in URL: open the drawer, then clean the param
  useEffect(() => {
    const uidAvailable = Boolean(profile?.id || anonUid);
    if (!uidAvailable) return;
    if (search?.get('open') === 'journal') {
      const id = window.setTimeout(() => setJournalOpen(true), 0);
      const params = new URLSearchParams(search?.toString() ?? '');
      params.delete('open');
      router.replace(params.toString() ? `/progress?${params.toString()}` : '/progress');
      return () => window.clearTimeout(id);
    }
  }, [profile?.id, anonUid, router, search, user]);

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

  if (!profile?.id) {
    if (demoParam || e2e) {
      return (
        <div className="min-h-screen bg-[#FAF7F2]">
          <SiteHeader compact onAuthRequest={e2e ? undefined : (() => setAccountModalOpen(true))} onMenuToggle={() => setMenuOpen(true)} />
          <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
          {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? <DemoUserSwitcher /> : null}
          <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
            {e2e ? null : (
              <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
            )}
            {fromParam === 'experience-onboarding' && !guestExpDone ? (
              <div className="mb-3 rounded-[14px] border border-[#CBE8D7] bg-[#F3FFF8] px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-[#1F3C2F]">{lang === 'ro' ? 'Continuă experiența ghidată' : 'Continue the guided experience'}</p>
                    <p className="text-sm text-[#1F3C2F]/80">{lang === 'ro' ? 'Mai ai 2 pași scurți: jurnal și exercițiu de respirație.' : '2 short steps left: journal and breathing practice.'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/experience-onboarding?step=journal')}
                    className="rounded-[10px] border border-[#1F3C2F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#1F3C2F] hover:bg-[#1F3C2F] hover:text-white"
                    data-testid="progress-cta-eo-continue"
                  >
                    {lang === 'ro' ? 'Continuă' : 'Continue'}
                  </button>
                </div>
              </div>
            ) : null}
            <section className="mx-auto w-full">
              <NextBestStep
                progress={demoFacts ?? undefined}
                lang={lang === "en" ? "en" : "ro"}
                className="rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(0,0,0,0.06)] md:py-4"
                onGoToKuno={() => router.push('/antrenament?tab=oc&source=progress')}
                onGoToSensei={() => { /* inactive */ }}
                onGoToAbil={() => { /* inactive */ }}
                onGoToIntel={() => router.push('/antrenament?tab=oi&source=progress')}
              >
                <OmniPathInline lang={lang === "en" ? "en" : "ro"} progress={demoFacts ?? undefined} />
              </NextBestStep>
            </section>
            <ProgressDashboard profileId={"demo-user"} demoFacts={demoFacts} debugGrid={debugGrid} />
          </main>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#FAF7F2]">
        <SiteHeader compact onAuthRequest={() => setAccountModalOpen(true)} />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
          <p className="text-sm text-[#4A3A30]">{getString(t, "progress.loginToView", lang === "ro" ? "Conectează-te pentru a vedea tabloul tău de bord." : "Sign in to view your dashboard.")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader compact onAuthRequest={() => setAccountModalOpen(true)} onMenuToggle={() => setMenuOpen(true)} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
      {process.env.NEXT_PUBLIC_ENABLE_DEMOS === "1" ? <DemoUserSwitcher /> : null}
      {demoParam ? (
        <div className="mx-auto mt-3 w-full max-w-5xl px-4">
          <div className="flex items-center gap-2 text-[12px]">
            <span className="inline-flex items-center rounded-full bg-[#7A6455] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">{lang === "ro" ? "Demo" : "Demo"}</span>
            <span className="inline-flex items-center rounded-[8px] border border-[#E4D8CE] bg-[#FFF8F2] px-2.5 py-1 text-[#4A3A30]">
              {lang === "ro"
                ? "Mod demo: date sintetice — nu se salvează în cont."
                : "Demo mode: synthetic data — not saved to your account."}
            </span>
          </div>
        </div>
      ) : null}
      {journalBlocked ? (
        <div className="mx-auto mt-3 w-full max-w-5xl px-4">
          <div className="rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                {lang === 'ro'
                  ? 'Jurnalul se activează după ce alegi modul de lucru (individual sau grup).'
                  : 'The journal unlocks after you choose a format (individual or group).'}
              </p>
              <button
                type="button"
                onClick={() => router.push('/choose?from=journal')}
                className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012]"
              >
                {lang === 'ro' ? 'Alege formatul' : 'Choose format'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {/* Force-open journal drawer when allowed */}
      {(profile?.id || anonUid) ? (
        <JournalDrawer
          open={journalOpen}
          onOpenChange={setJournalOpen}
          userId={user?.uid ?? anonUid}
          context={{
            sourcePage: 'progress',
            sourceBlock: stepParam === 'journal-open' ? 'initiation.journal' : undefined,
            suggestedSnippets: stepParam === 'journal-open'
              ? (lang === 'ro'
                ? [
                    'Două propoziții despre starea ta acum.',
                    'Ce ai observat la tine în ultimele ore?'
                  ]
                : [
                    'Two short sentences about your state now.',
                    'What did you notice in the last hours?'
                  ])
              : undefined,
          }}
          initialTab={initialTabParam}
        />
      ) : null}
      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        {absenceNudge ? (
          <div className="mb-3 rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]" data-testid="absence-nudge">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{lang === 'ro' ? 'Ai lipsit câteva zile. Vrei să adaugi rapid 1–2 acțiuni pentru zilele trecute?' : 'You’ve been away a few days. Want to quickly add 1–2 actions for past days?'}</p>
              <a href="/progress#actions-trend" className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]">{lang === 'ro' ? 'Mergi la Trendul acțiunilor' : 'Go to Actions trend'}</a>
            </div>
          </div>
        ) : null}
        {showDailyNudge ? (
          <div className="mb-3 rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]" data-testid="daily-nudge">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{lang === 'ro' ? 'Completează o mini‑raportare (1–10) ca să ținem indicatorii interni proaspeți.' : 'Do a quick mini‑report (1–10) to keep internal indicators fresh.'}</p>
              <button
                type="button"
                onClick={() => router.push('/experience-onboarding?flow=initiation&step=daily-state')}
                className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
              >
                {lang === 'ro' ? 'Deschide sliderele' : 'Open sliders'}
              </button>
            </div>
          </div>
        ) : null}
        {fromParam === 'experience-onboarding' && profile && profile.experienceOnboardingCompleted !== true ? (
          <div className="mb-3 rounded-[14px] border border-[#CBE8D7] bg-[#F3FFF8] px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-[#1F3C2F]">{lang === 'ro' ? 'Continuă experiența ghidată' : 'Continue the guided experience'}</p>
                <p className="text-sm text-[#1F3C2F]/80">{lang === 'ro' ? 'Mai ai 2 pași scurți: jurnal și exercițiu de respirație.' : '2 short steps left: journal and breathing practice.'}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/experience-onboarding?step=journal')}
                className="rounded-[10px] border border-[#1F3C2F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#1F3C2F] hover:bg-[#1F3C2F] hover:text-white"
                data-testid="progress-cta-eo-continue"
              >
                {lang === 'ro' ? 'Continuă' : 'Continue'}
              </button>
            </div>
          </div>
        ) : null}
        {fromParam === 'onboarding-test' || fromParam === 'experience-onboarding' ? (
          <div className="mb-3 rounded-[12px] border border-[#CBE8D7] bg-[#F3FFF8] px-4 py-3 text-sm text-[#1F3C2F]">
            {lang === 'ro' ? 'Ai completat primul tău test.' : 'You completed your first test.'}
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'omnikuno-test-done' ? (
          <div className="mb-3 rounded-[14px] border border-[#CBE8D7] bg-[#F3FFF8] px-5 py-4 shadow-sm" data-testid="init-banner-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-[#1F3C2F]">{lang === 'ro' ? 'Mini‑test OmniKuno finalizat.' : 'OmniKuno mini‑test completed.'}</p>
                <p className="text-sm text-[#1F3C2F]/80">{lang === 'ro' ? 'Scorul tău și trendurile au fost actualizate.' : 'Your score and trends have been updated.'}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/experience-onboarding?flow=initiation&step=journal')}
                className="rounded-[10px] border border-[#1F3C2F] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#1F3C2F] hover:bg-[#1F3C2F] hover:text-white"
              >
                {lang === 'ro' ? 'Pasul 2: Jurnal' : 'Step 2: Journal'}
              </button>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'journal-open' ? (
          <div className="mb-3 rounded-[12px] border border-[#E4DAD1] bg-white px-4 py-3 text-sm text-[#4A3A30]" data-testid="init-banner-2a">
            <div className="flex flex-col gap-1">
              <p>{lang === 'ro' ? 'Deschide „Note libere” și scrie 2 propoziții (~60 caractere). Apoi închide jurnalul.' : 'Open “Free notes” and write 2 short sentences (~60 chars). Then close the journal.'}</p>
              <p className="text-[12px] text-[#7B6B60]">{lang === 'ro' ? 'Vei vedea intrarea la „Însemnări recente”, „Trends” și „Reflecții”.' : 'You’ll see it under “Recent entries”, “Trends” and “Reflections”.'}</p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/experience-onboarding?flow=initiation&step=omniscope')}
                  className="rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
                >
                  {lang === 'ro' ? 'Am scris' : 'I wrote it'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/experience-onboarding?flow=initiation&step=omniscope')}
                  className="rounded-[10px] border border-[#D8C6B6] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B6B60] hover:border-[#2C2C2C] hover:text-[#2C2C2C]"
                >
                  {lang === 'ro' ? 'Sari peste' : 'Skip'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'journal-done' ? (
          <div className="mb-3 rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4A3A30]" data-testid="init-banner-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>{lang === 'ro' ? 'Pas 2 complet: reflecția ta a fost salvată.' : 'Step 2 complete: your reflection has been saved.'}</p>
              <button type="button" onClick={() => router.push('/experience-onboarding?flow=initiation&step=omniscope')} className="rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white">{lang === 'ro' ? 'Pasul 3: OmniScope' : 'Step 3: OmniScope'}</button>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'omniscope-done' ? (
          <div className="mb-3 rounded-[12px] border border-[#E4DAD1] bg-white px-4 py-3 text-sm text-[#4A3A30]" data-testid="init-banner-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>{lang === 'ro' ? 'Pas 3 complet: contextul tău a fost actualizat.' : 'Step 3 complete: your context has been updated.'}</p>
              <button type="button" onClick={() => router.push('/experience-onboarding?flow=initiation&step=daily-state')} className="rounded-[10px] border border-[#2C2C2C] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white">{lang === 'ro' ? 'Pasul 4: Stare zilnică' : 'Step 4: Daily state'}</button>
            </div>
          </div>
        ) : null}
        {fromParam === 'initiation' && stepParam === 'daily-state-done' ? (
          <div className="mb-3 rounded-[12px] border border-[#CBE8D7] bg-[#F3FFF8] px-4 py-3 text-sm text-[#1F3C2F]" data-testid="init-banner-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>{lang === 'ro' ? 'Pas 4 complet: starea de azi a fost înregistrată.' : 'Step 4 complete: today’s state recorded.'}</p>
              <button type="button" onClick={() => router.push('/experience-onboarding?flow=initiation&step=omnikuno-lesson')} className="rounded-[10px] border border-[#1F3C2F] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#1F3C2F] hover:bg-[#1F3C2F] hover:text-white">{lang === 'ro' ? 'Pasul 5: Lecție Kuno' : 'Step 5: Kuno lesson'}</button>
            </div>
          </div>
        ) : null}
        {afterParam === 'os' ? (
          <div className="mb-3 rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4A3A30]">
            {lang === 'ro' ? 'Ai scris în jurnal.' : 'You wrote in your journal.'}
          </div>
        ) : null}
        {afterParam === 'abil' ? (
          <div className="mb-3 rounded-[12px] border border-[#E4DAD1] bg-white px-4 py-3 text-sm text-[#4A3A30]">
            {lang === 'ro' ? 'Ai încheiat un exercițiu OmniAbil.' : 'You finished an OmniAbil exercise.'}
          </div>
        ) : null}
        <section className="mx-auto w-full">
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_minmax(160px,200px)]">
          <NextBestStep
            progress={(demoFacts ?? progress) ?? undefined}
            lang={lang === "en" ? "en" : "ro"}
            className="h-full rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(0,0,0,0.06)] md:py-4"
            onGoToKuno={() => {
              void recordEvaluationTabChange("oc");
              const qs = new URLSearchParams({ tab: "oc", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
            onGoToSensei={() => { /* inactive */ }}
            onGoToAbil={() => { /* inactive */ }}
            onGoToIntel={() => {
              void recordEvaluationTabChange("oi");
              const qs = new URLSearchParams({ tab: "oi", source: "progress" }).toString();
              router.push(`/antrenament?${qs}`);
            }}
          >
            <OmniPathInline lang={lang === "en" ? "en" : "ro"} progress={(demoFacts ?? progress) ?? undefined} />
          </NextBestStep>
          {/* Omni‑Intel small counter beside OmniPath */}
          <div className="flex h-full flex-col items-center justify-center rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(0,0,0,0.06)]">
            <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7B6B60]">
              {lang === 'ro' ? 'Omni‑Intel' : 'Omni‑Intel'}
              <InfoTooltip
                items={[
                  lang === 'ro'
                    ? 'Index compus din inteligența minții din cap, a minții din inimă, a minții din intestin.'
                    : 'Composite index from the head mind, heart mind, and gut mind intelligence.',
                ]}
                label={lang === 'ro' ? 'Detalii Omni‑Intel' : 'Omni‑Intel details'}
              />
            </div>
            <p className="text-2xl font-bold text-[#C24B17]">{omniIntelDisplay}</p>
            <p className="mt-0.5 text-center text-[10px] text-[#7B6B60]">
              {lang === 'ro' ? 'Nivel de Omni‑Inteligență' : 'Omni‑Intelligence level'}
            </p>
          </div>
          </div>
        </section>
        <ProgressDashboard profileId={profile.id} demoFacts={demoFacts} debugGrid={debugGrid} hideOmniIntel />
      </main>
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  );
}
