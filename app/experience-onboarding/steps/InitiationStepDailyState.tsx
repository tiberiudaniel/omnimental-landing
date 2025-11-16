"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import GuideCard from "@/components/onboarding/GuideCard";
import Typewriter from "@/components/onboarding/Typewriter";
import { recordPracticeSession, recordQuickAssessment } from "@/lib/progressFacts";

type Key = "energy" | "stress" | "sleep" | "clarity" | "confidence" | "focus";

export default function InitiationStepDailyState() {
  const { lang } = useI18n();
  const router = useRouter();
  const [vals, setVals] = useState<Record<Key, number>>({
    energy: 6,
    stress: 5,
    sleep: 6,
    clarity: 6,
    confidence: 6,
    focus: 6,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: Key, v: number) => setVals((prev) => ({ ...prev, [k]: v }));
  const submit = async () => {
    setBusy(true);
    try {
      await recordQuickAssessment(vals);
      await recordPracticeSession('reflection', Date.now(), 90);
    } catch (e) {
      console.warn('initiation daily-state failed', e);
    } finally {
      setBusy(false);
      router.push('/progress?from=initiation&step=daily-state-done');
    }
  };
  const labels: Record<Key, string> = {
    energy: lang === 'ro' ? 'energie' : 'energy',
    stress: lang === 'ro' ? 'stres' : 'stress',
    sleep: lang === 'ro' ? 'somn' : 'sleep',
    clarity: lang === 'ro' ? 'claritate' : 'clarity',
    confidence: lang === 'ro' ? 'încredere' : 'confidence',
    focus: lang === 'ro' ? 'focus' : 'focus',
  };
  const lowHigh: Record<Key, { low: string; high: string }> = {
    energy: { low: lang === 'ro' ? 'Scăzută' : 'Low', high: lang === 'ro' ? 'Ridicată' : 'High' },
    stress: { low: lang === 'ro' ? 'Puțin' : 'Little', high: lang === 'ro' ? 'Mult' : 'A lot' },
    sleep: { low: lang === 'ro' ? 'Prost' : 'Poor', high: lang === 'ro' ? 'Bine' : 'Good' },
    clarity: { low: lang === 'ro' ? 'Neclar' : 'Vague', high: lang === 'ro' ? 'Clar' : 'Clear' },
    confidence: { low: lang === 'ro' ? 'Mică' : 'Low', high: lang === 'ro' ? 'Mare' : 'High' },
    focus: { low: lang === 'ro' ? 'Dispersat' : 'Scattered', high: lang === 'ro' ? 'Concentrat' : 'Focused' },
  };

  function Mixer({ k }: { k: Key }) {
    const val = vals[k];
    const clamped = Math.max(1, Math.min(10, val));
    const fillPct = Math.max(0, Math.min(100, (clamped - 1) * (100 / 9)));
    return (
      <div className="panel-ghost px-4 py-4">
        <p className="text-sm font-medium text-[#2C2C2C] capitalize">{labels[k]}</p>
        <div className="mt-2">
          <div className="mixer-wrap ticks-10">
            <span className="mixer-slot" aria-hidden="true"></span>
            <span className="mixer-fill" aria-hidden="true" style={{ width: `calc(${fillPct}% - 13px)` }}></span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={clamped}
              onChange={(e) => set(k, Number(e.target.value))}
              data-testid={`init-daily-${k}`}
              className="mixer-range w-full"
            />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
          <span>{lowHigh[k].low}</span>
          <span className="text-[#7A6455]">{clamped}/10</span>
          <span>{lowHigh[k].high}</span>
        </div>
      </div>
    );
  }
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <Typewriter text={lang === 'ro' ? 'Mini‑stare pentru azi (1–10).' : 'Mini state for today (1–10).'} />
      </div>
      <GuideCard title={lang === 'ro' ? 'Evaluare rapidă (1–10)' : 'Quick check (1–10)'}>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(vals) as Key[]).map((k) => (
            <Mixer key={k} k={k} />
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            disabled={busy}
            onClick={submit}
            className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
            data-testid="init-daily-continue"
          >
            {lang === 'ro' ? 'Continuă' : 'Continue'}
          </button>
        </div>
      </GuideCard>
    </section>
  );
}
