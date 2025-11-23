"use client";

import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { listMicroLessons } from '@/data/lessons';
import type { MicroLesson } from '@/lib/lessonTypes';

function CategoryPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#7B6B60]">
      {label}
    </span>
  );
}

function LearnInner() {
  const search = useSearchParams();
  const router = useRouter();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const goToAuth = () => router.push('/auth');
  const locale = (search?.get('lang') === 'en' ? 'en' : 'ro') as 'ro' | 'en';
  const catParam = search?.get('cat') || null;
  const lessons = useMemo<MicroLesson[]>(() => listMicroLessons({ level: 'initiation', locale }), [locale]);
  const groups = useMemo((): Array<[string, MicroLesson[]]> => {
    const m = new Map<string, MicroLesson[]>();
    for (const l of lessons) {
      const key = l.taxonomy.domain;
      const arr = m.get(key) ?? [];
      arr.push(l);
      m.set(key, arr);
    }
    return Array.from(m.entries());
  }, [lessons]);
  const featuredLesson = useMemo(() => {
    if (!lessons.length) return null;
    if (catParam) {
      const match = lessons.find((l) => l.taxonomy.domain === catParam);
      if (match) return match;
    }
    return lessons[0];
  }, [lessons, catParam]);

  const catLabel = (d: string) => d.charAt(0).toUpperCase() + d.slice(1);

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader compact onAuthRequest={e2e ? undefined : goToAuth} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">Omni‑Kuno — Lecții</h1>
        <p className="mt-1 text-sm text-[#4A3A30]">Micro-lecții per categorie cu mini‑quiz rapid.</p>
        {featuredLesson ? (
          <div className="mt-4 rounded-[14px] border border-[#E4DAD1] bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-2 text-[#2C2C2C] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{featuredLesson.title}</p>
                <p className="text-[12px] text-[#7B6B60]">{featuredLesson.goal}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CategoryPill label={catLabel(featuredLesson.taxonomy.domain)} />
                <button
                  type="button"
                  data-testid="learn-start"
                  className="rounded-[10px] border border-[#2C2C2C] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#C07963] hover:text-[#C07963]"
                  onClick={() => {
                    const params = new URLSearchParams(search?.toString() ?? '');
                    params.set('lang', locale);
                    params.set('start', '1');
                    if (!params.has('cat') && catParam) {
                      params.set('cat', catParam);
                    }
                    const qs = params.toString();
                    router.push(`/kuno/learn/${encodeURIComponent(featuredLesson.id)}${qs ? `?${qs}` : ''}`);
                  }}
                >
                  {locale === 'ro' ? 'Începe' : 'Start'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mt-5 grid gap-3">
          {groups.map(([cat, lessons]) => (
            <section key={cat} className="rounded-[12px] border border-[#E4DAD1] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryPill label={catLabel(cat)} />
                  <p className="text-[12px] text-[#7B6B60]">{locale === 'ro' ? 'Lecții disponibile' : 'Lessons available'}: {lessons.length}</p>
                </div>
                <div />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/kuno/learn/${encodeURIComponent(l.id)}?lang=${encodeURIComponent(locale)}`}
                    className="rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] p-3 text-[#2C2C2C] hover:border-[#C07963] hover:text-[#C07963]"
                  >
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="mt-1 text-[12px] text-[#7B6B60]">{l.goal}</p>
                    <p className="mt-2 text-[11px] text-[#7B6B60]">~3–5 min</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LearnInner />
    </Suspense>
  );
}
