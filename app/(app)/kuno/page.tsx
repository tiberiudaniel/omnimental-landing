"use client";

import Link from 'next/link';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { AppShell } from '@/components/AppShell';
import { useSearchParams, useRouter } from 'next/navigation';
import { PrimaryButton, SecondaryButton } from '@/components/PrimaryButton';

function KunoHub() {
  const search = useSearchParams();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
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
                <PrimaryButton shape="pill" className="uppercase tracking-[0.2em] text-[12px]" asChild>
                  <Link href="/omni-kuno">Intră în OmniKuno</Link>
                </PrimaryButton>
                <SecondaryButton className="uppercase tracking-[0.2em] text-[12px]" asChild>
                  <Link href="/kuno/practice">Fă mini-testul</Link>
                </SecondaryButton>
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
