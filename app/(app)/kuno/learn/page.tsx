"use client";

import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { AppShell } from '@/components/AppShell';
import { OmniCard } from '@/components/OmniCard';
import { KunoCtaButton } from "@/components/ui/cta/KunoCtaButton";
import { listMicroLessons } from '@/data/lessons';
import type { MicroLesson } from '@/lib/lessonTypes';

function CategoryPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: "var(--omni-energy-tint)",
        color: "var(--omni-energy)",
        borderColor: "var(--omni-border-soft)",
      }}
    >
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
    <AppShell header={<SiteHeader onAuthRequest={e2e ? undefined : goToAuth} />}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[var(--omni-ink)]">Omni‑Kuno — Lecții</h1>
        <p className="mt-1 text-sm text-[var(--omni-muted)]">Micro-lecții per categorie cu mini‑quiz rapid.</p>
        {featuredLesson ? (
          <OmniCard className="mt-4 px-4 py-4">
            <div className="flex flex-col gap-2 text-[var(--omni-ink)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{featuredLesson.title}</p>
                <p className="text-[12px] text-[var(--omni-muted)]">{featuredLesson.goal}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CategoryPill label={catLabel(featuredLesson.taxonomy.domain)} />
                <KunoCtaButton
                  type="button"
                  data-testid="learn-start"
                  size="sm"
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
                </KunoCtaButton>
              </div>
            </div>
          </OmniCard>
        ) : null}
        <div className="mt-5 grid gap-3">
          {groups.map(([cat, lessons]) => (
            <OmniCard key={cat} className="rounded-[12px] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryPill label={catLabel(cat)} />
                  <p className="text-[12px] text-[var(--omni-muted)]">{locale === 'ro' ? 'Lecții disponibile' : 'Lessons available'}: {lessons.length}</p>
                </div>
                <div />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/kuno/learn/${encodeURIComponent(l.id)}?lang=${encodeURIComponent(locale)}`}
                    className="rounded-[12px] border p-3 transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
                    style={{
                      backgroundColor: "var(--omni-bg-paper)",
                      borderColor: "var(--omni-border-soft)",
                      color: "var(--omni-ink)",
                    }}
                  >
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="mt-1 text-[12px] text-[var(--omni-muted)]">{l.goal}</p>
                    <p className="mt-2 text-[11px] text-[var(--omni-muted)]">~3–5 min</p>
                  </Link>
                ))}
              </div>
            </OmniCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LearnInner />
    </Suspense>
  );
}
