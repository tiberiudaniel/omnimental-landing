"use client";

import Link from 'next/link';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { AppShell } from '@/components/AppShell';
import { useSearchParams, useRouter } from 'next/navigation';

function KunoHub() {
  const search = useSearchParams();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
  return (
    <AppShell header={<SiteHeader onAuthRequest={e2e ? undefined : goToAuth} />}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[var(--omni-ink)]">Omni‑Kuno</h1>
        <p className="mt-1 text-sm text-[var(--omni-ink-soft)]">Mini‑teste educative, feedback imediat și progres în timp.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/kuno/practice" className="omni-card px-5 py-4 text-sm transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]">
            Start practice (5 întrebări)
          </Link>
          <Link href="/kuno/learn" className="omni-card px-5 py-4 text-sm transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]">
            Lecții scurte per categorie
          </Link>
          <Link href="/experience-onboarding?flow=initiation&step=welcome&from=kuno" className="omni-card px-5 py-4 text-sm transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]">
            Încearcă experiența ghidată
          </Link>
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
