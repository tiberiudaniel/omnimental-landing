"use client";

import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { useState } from 'react';
import AccountModal from '@/components/AccountModal';

type Lesson = {
  id: string;
  category: 'clarity' | 'calm' | 'energy' | 'relationships' | 'performance' | 'health' | 'general';
  title: string;
  summary: string;
  minutes: number;
};

const LESSONS: Lesson[] = [
  { id: 'clarity-1', category: 'clarity', title: 'Claritate: jurnal în 2 minute', summary: 'Te ajută să scoți gândurile pe hârtie și să-ți structurezi intențiile.', minutes: 3 },
  { id: 'calm-1', category: 'calm', title: 'Calm: respirație 6/min', summary: 'Activează sistemul parasimpatic și reduce reactivitatea.', minutes: 4 },
  { id: 'energy-1', category: 'energy', title: 'Energie: reset scurt de postură', summary: 'Îmbunătățește starea energică prin mișcări ușoare și ritm.', minutes: 3 },
  { id: 'relationships-1', category: 'relationships', title: 'Relații: întrebarea intenției', summary: 'Antrenează empatia rapidă în conversații dificile.', minutes: 3 },
  { id: 'performance-1', category: 'performance', title: 'Performanță: intrarea în flow', summary: 'Setează provocare potrivită și feedback rapid.', minutes: 5 },
  { id: 'health-1', category: 'health', title: 'Sănătate: micro-rutină zilnică', summary: '3 pași simpli pentru ritm și recuperare.', minutes: 4 },
  // Obiceiuri – încadrate la categoria general pentru micro-quiz
  { id: 'habits-anchors', category: 'general', title: 'Obiceiuri: ancore mici, repetate', summary: 'Construiește consistența cu pași de 2–3 minute/zi și remindere.', minutes: 4 },
  { id: 'habits-progress-check', category: 'general', title: 'Obiceiuri: verificare progres săptămânal', summary: 'Setează un moment scurt pentru a ajusta și menține ritmul.', minutes: 3 },
  // Sens – încadrate la categoria general pentru micro-quiz
  { id: 'sense-values', category: 'general', title: 'Sens: conectează sarcinile la valori', summary: 'Formulează scurt: „De ce contează?” și aliniază pașii.', minutes: 4 },
  { id: 'sense-reminder', category: 'general', title: 'Sens: reamintire zilnică de scop', summary: 'Un mesaj scurt care reactivează direcția și motivația.', minutes: 3 },
  // Flexibilitate psihologică (ACT) – încadrat la general
  { id: 'psych-flex-1', category: 'general', title: 'Flex psihologic: deschidere • adaptare', summary: 'Învață bazele ACT: deschidere la experiență, flexibilitate cognitivă și acțiune ghidată de valori.', minutes: 5 },
];

function CategoryPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#E4DAD1] bg-[#FFFBF7] px-2 py-0.5 text-[10px] text-[#7B6B60]">
      {label}
    </span>
  );
}

function LearnInner() {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const search = useSearchParams();
  const e2e = (search?.get('e2e') === '1') || (search?.get('demo') === '1');
  const selectedCat = (search?.get('cat') || '').toString();
  const firstLessonInCat = useMemo(() => {
    if (!selectedCat) return null;
    const lesson = LESSONS.find(l => l.category === (selectedCat as Lesson['category']));
    return lesson ?? null;
  }, [selectedCat]);
  const groups = useMemo(() => {
    const m = new Map<string, Lesson[]>();
    for (const l of LESSONS) {
      const arr = m.get(l.category) ?? [];
      arr.push(l);
      m.set(l.category, arr);
    }
    return Array.from(m.entries());
  }, []);

  const catLabel = (c: Lesson['category']) => {
    const map: Record<Lesson['category'], string> = {
      clarity: 'Claritate',
      calm: 'Calm',
      energy: 'Energie',
      relationships: 'Relații',
      performance: 'Performanță',
      health: 'Sănătate',
      general: 'General',
    };
    return map[c] ?? c;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9]">
      <SiteHeader compact onAuthRequest={e2e ? undefined : (() => setAccountModalOpen(true))} />
      {e2e ? null : (
        <AccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} />
      )}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#2C2C2C]">Omni‑Kuno — Lecții</h1>
        <p className="mt-1 text-sm text-[#4A3A30]">Micro-lecții per categorie cu mini‑quiz rapid.</p>
        {firstLessonInCat ? (
          <div className="mt-4 flex justify-center">
            <Link
              href={`/kuno/learn/${firstLessonInCat.id}?cat=${encodeURIComponent(selectedCat)}`}
              className="rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
              data-testid="learn-start"
            >
              Începe
            </Link>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          {groups.map(([cat, lessons]) => (
            <section key={cat} className="rounded-[12px] border border-[#E4DAD1] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryPill label={catLabel(cat as Lesson['category'])} />
                  <p className="text-[12px] text-[#7B6B60]">Lecții disponibile: {lessons.length}</p>
                </div>
                <Link
                  href={`/kuno/practice?cat=${encodeURIComponent(cat)}`}
                  className="rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
                >
                  Quiz rapid
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {lessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/kuno/learn/${l.id}?cat=${encodeURIComponent(cat)}`}
                    className="rounded-[12px] border border-[#E4DAD1] bg-[#FFFBF7] p-3 text-[#2C2C2C] hover:border-[#C07963] hover:text-[#C07963]"
                  >
                    <p className="text-sm font-medium">{l.title}</p>
                    <p className="mt-1 text-[12px] text-[#7B6B60]">{l.summary}</p>
                    <p className="mt-2 text-[11px] text-[#7B6B60]">~{l.minutes} min</p>
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
