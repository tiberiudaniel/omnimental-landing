"use client";

import Link from 'next/link';
import { Suspense } from 'react';
import SiteHeader from '@/components/SiteHeader';
import { useSearchParams, useRouter } from 'next/navigation';

function KunoHub() {
  const search = useSearchParams();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader compact onAuthRequest={e2e ? undefined : goToAuth} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">Omni‑Kuno</h1>
        <p className="mt-1 text-sm text-[#4A3A30]">Mini‑teste educative, feedback imediat și progres în timp.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/kuno/practice" className="rounded-[12px] border border-[#E4D8CE] bg-white px-5 py-4 text-sm text-[#2C2C2C] shadow-sm hover:border-[#C07963] hover:text-[#C07963]">
            Start practice (5 întrebări)
          </Link>
          <Link href="/kuno/learn" className="rounded-[12px] border border-[#E4D8CE] bg-white px-5 py-4 text-sm text-[#2C2C2C] shadow-sm hover:border-[#C07963] hover:text-[#C07963]">
            Lecții scurte per categorie
          </Link>
          <Link href="/experience-onboarding?start=1" className="rounded-[12px] border border-[#E4D8CE] bg-white px-5 py-4 text-sm text-[#2C2C2C] shadow-sm hover:border-[#C07963] hover:text-[#C07963]">
            Încearcă experiența ghidată
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <KunoHub />
    </Suspense>
  );
}
