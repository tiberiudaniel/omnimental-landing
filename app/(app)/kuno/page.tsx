"use client";

import Link from 'next/link';
import { Suspense, useEffect, useMemo } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { AppShell } from '@/components/AppShell';
import { useSearchParams, useRouter } from 'next/navigation';
import { KunoCtaButton } from "@/components/ui/cta/KunoCtaButton";
import { NeutralCtaButton } from "@/components/ui/cta/NeutralCtaButton";
import { useAuth } from "@/components/AuthProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { canAccessOmniKuno, getTotalDailySessionsCompleted } from "@/lib/gatingSelectors";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { GATING } from "@/lib/gatingConfig";

function KunoHub() {
  const search = useSearchParams();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
  const { user, authReady } = useAuth();
  const returnPath = useMemo(() => {
    const qs = search?.toString();
    return qs && qs.length > 0 ? `/kuno?${qs}` : "/kuno";
  }, [search]);
  const { data: progress, loading: progressLoading } = useProgressFacts(user?.uid ?? null);
  const totalSessions = getTotalDailySessionsCompleted(progress);
  const unlocked = e2e || canAccessOmniKuno(progress);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/auth?returnTo=${encodeURIComponent(returnPath)}`);
    }
  }, [authReady, user, router, returnPath]);

  if (!authReady || progressLoading) {
    return (
      <AppShell header={<SiteHeader onAuthRequest={goToAuth} />}>
        <div className="px-4 py-16 text-center text-sm text-[var(--omni-ink-soft)]">Se verifică accesul la OmniKuno...</div>
      </AppShell>
    );
  }

  if (!user) {
    return null;
  }

  if (!unlocked) {
    const remainingSessions = Math.max(0, GATING.omniKunoMinDailySessions - totalSessions);
    const progressPct = Math.min(
      100,
      Math.round((totalSessions / GATING.omniKunoMinDailySessions) * 100),
    );
    return (
      <AppShell header={<SiteHeader onAuthRequest={goToAuth} />}>
        <div className="px-4 py-12">
          <section className="mx-auto max-w-3xl space-y-4 rounded-[28px] border border-[var(--omni-border-soft)] bg-white px-6 py-8 text-center text-[var(--omni-ink)] shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">OmniKuno</p>
            <h2 className="text-2xl font-semibold">Ai nevoie de {GATING.omniKunoMinDailySessions} sesiuni reale pentru acces</h2>
            <p className="text-sm text-[var(--omni-ink)]/75">
              Ai înregistrat {totalSessions} sesiuni zilnice. Revino după pragul minim și vei debloca lecțiile și testele OmniKuno.
            </p>
            <div className="mx-auto mt-4 w-full max-w-sm">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
                <span>Progres</span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--omni-border-soft)]/60">
                <div
                  className="h-2 rounded-full bg-[var(--omni-energy)] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-1 text-[var(--omni-ink)]/70 text-xs">
                Mai ai {remainingSessions} {remainingSessions === 1 ? "zi" : "zile"} până la deblocare.
              </p>
            </div>
            <div className="mt-6 rounded-[20px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">În curând</p>
              <p className="mt-2 text-sm text-[var(--omni-ink)]">
                Mini-teste adaptive, lecții pe teme ca <strong>claritate și energie</strong>, plus feedback rapid pentru fiecare răspuns.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-[var(--omni-ink)]/80">
                <li>• Drill-uri zilnice de 5 întrebări</li>
                <li>• Lecții scurte cu aplicații reale</li>
                <li>• Tracking al progresului pe trăsături</li>
              </ul>
            </div>
            <OmniCtaButton className="mt-4 justify-center" onClick={() => router.push("/today")}>
              Înapoi la /today
            </OmniCtaButton>
          </section>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell header={<SiteHeader onAuthRequest={e2e ? undefined : goToAuth} />}>
      <div className="px-4 py-10">
        <div className="w-full max-w-5xl mx-auto px-4">
          <section className="omni-card rounded-card p-6 md:p-7 mb-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs md:text-[11px] uppercase tracking-[0.2em] text-[var(--omni-muted)]">OmniKuno</p>
                <h1 className="mt-2 text-xl md:text-2xl font-semibold text-[var(--omni-ink)]">Misiunile tale de cunoaștere</h1>
                <p className="mt-2 text-sm text-[var(--omni-ink-soft)]">Mini-teste educative, feedback imediat și progres în timp.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <KunoCtaButton as="link" href="/omni-kuno">
                  Intră în OmniKuno
                </KunoCtaButton>
                <NeutralCtaButton as="link" href="/kuno/practice">
                  Fă mini-testul
                </NeutralCtaButton>
              </div>
            </div>
          </section>
        </div>
        <div className="w-full max-w-5xl mx-auto px-4 space-y-8">
          <section className="omni-panel-soft rounded-card p-6 md:p-7">
            <div className="flex flex-col gap-1">
              <p className="text-base md:text-lg font-semibold text-[var(--omni-ink)]">Puncte de pornire rapide</p>
              <p className="text-sm text-[var(--omni-muted)]">Alege modul în care vrei să continui azi.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/kuno/practice" className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-4 text-sm text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]">
                Start practice (5 întrebări)
              </Link>
              <Link href="/kuno/learn" className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-4 text-sm text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]">
                Lecții scurte per categorie
              </Link>
              <Link href="/experience-onboarding?flow=initiation&step=welcome&from=kuno" className="rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-4 text-sm text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]">
                Încearcă experiența ghidată
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <KunoHub />
    </Suspense>
  );
}
