"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import Typewriter from "@/components/onboarding/Typewriter";
import { recordPracticeSession, recordQuickAssessment } from "@/lib/progressFacts";
import Image from "next/image";
import GuideCard from "@/components/onboarding/GuideCard";
import onboardingDailyState from "@/public/assets/onboarding-daily-state.jpg";

type Key = "energy" | "stress" | "sleep" | "clarity" | "confidence" | "focus";

export default function InitiationStepDailyState({ onComplete }: { onComplete?: () => void }) {
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
  const [touched, setTouched] = useState<Record<Key, boolean>>({
    energy: false,
    stress: false,
    sleep: false,
    clarity: false,
    confidence: false,
    focus: false,
  });
  const set = (k: Key, v: number) => setVals((prev) => ({ ...prev, [k]: v }));
  const markTouched = (k: Key) =>
    setTouched((prev) => (prev[k] ? prev : { ...prev, [k]: true }));
  const allTouched = (Object.keys(vals) as Key[]).every((key) => touched[key]);
  const submit = async () => {
    setBusy(true);
    try {
      await recordQuickAssessment(vals);
      await recordPracticeSession('reflection', Date.now(), 90);
    } catch (e) {
      console.warn('initiation daily-state failed', e);
    } finally {
      setBusy(false);
      if (onComplete) onComplete();
      else router.push('/progress?from=initiation&step=daily-state-done');
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
      <div className="panel-ghost px-4 py-4" data-highlight={!touched[k] ? "true" : undefined}>
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
              onChange={(e) => {
                const next = Number(e.target.value);
                set(k, next);
                markTouched(k);
              }}
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
    <section className="px-0 py-0">
      <div className="rounded-[24px] border border-[#E4DAD1] bg-white px-4 py-4 shadow-sm md:px-6 md:py-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="md:w-[38%] flex justify-center">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-[32px] border border-[#E4DAD1] shadow-[0_20px_45px_rgba(0,0,0,0.12)]">
              <Image src={onboardingDailyState} alt={lang === 'ro' ? 'Ilustrație stare zilnică' : 'Daily state illustration'} fill className="object-cover" priority={false} />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="rounded-[18px] border border-[#F0E8E0] bg-[#FFF8F4] px-5 py-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#B08A78]">{lang === 'ro' ? 'Stare zilnică' : 'Daily state'}</p>
              <h3 className="mt-2 text-xl font-semibold text-[#2C2C2C]">{lang === 'ro' ? 'Mică evaluare a resurselor de azi' : 'Quick evaluation of today’s resources'}</h3>
              <div className="mt-3 text-sm text-[#4A3A30]">
                <Typewriter text={lang === 'ro' ? 'Cum arată azi resursele tale interne?' : 'How do your inner resources look today?'} />
              </div>
            </div>
            <GuideCard title={lang === 'ro' ? 'Scală 1–10' : 'Scale 1–10'} className="w-full">
              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(vals) as Key[]).map((k) => (
                  <Mixer key={k} k={k} />
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  disabled={busy || !allTouched}
                  onClick={submit}
                  className="rounded-[999px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:bg-[#2C2C2C] hover:text-white"
                  data-testid="init-daily-continue"
                >
                  {lang === 'ro' ? 'Continuă' : 'Continue'}
                </button>
              </div>
            </GuideCard>
          </div>
        </div>
      </div>
    </section>
  );
}
