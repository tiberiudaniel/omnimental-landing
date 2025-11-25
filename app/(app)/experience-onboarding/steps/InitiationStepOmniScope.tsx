"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import GuideCard from "@/components/onboarding/GuideCard";
import Typewriter from "@/components/onboarding/Typewriter";
import { recordPracticeSession, recordOmniPatch } from "@/lib/progressFacts";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
// (no extra types needed)

function Mixer({ label, value, setValue, min = 1, max = 10, ticks = 10, lowLabel, highLabel, testId }: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min?: number;
  max?: number;
  ticks?: number;
  lowLabel?: string;
  highLabel?: string;
  testId: string;
}) {
  const clamped = Math.max(min, Math.min(max, value));
  const fillPct = Math.max(0, Math.min(100, (clamped - min) * (100 / (max - min))));
  return (
    <div className="panel-ghost px-4 py-4">
      <p className="text-sm font-medium text-[#2C2C2C]">{label}</p>
      <div className="mt-2">
        <div className={`mixer-wrap ${ticks === 10 ? 'ticks-10' : 'ticks-5'}`}>
          <span className="mixer-slot" aria-hidden="true"></span>
          <span className="mixer-fill" aria-hidden="true" style={{ width: `calc(${fillPct}% - 13px)` }}></span>
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={clamped}
            onChange={(e) => setValue(Number(e.target.value))}
            data-testid={testId}
            className="mixer-range w-full"
          />
        </div>
      </div>
      {(lowLabel || highLabel) ? (
        <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-[#A08F82]">
          <span>{lowLabel}</span>
          <span className="text-[#7A6455]">{clamped}/{max}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function InitiationStepOmniScope({ userId, onComplete }: { userId: string | null; onComplete?: () => void }) {
  const { lang } = useI18n();
  const router = useRouter();
  const { profile } = useProfile();
  const { data: facts } = useProgressFacts(profile?.id);
  const primaryLabel = (() => {
    try {
      const cats = (facts?.intent?.categories as Array<{ category: string; count: number }> | undefined) || [];
      const top = cats.length ? [...cats].sort((a,b)=> (b.count||0)-(a.count||0))[0]?.category?.toLowerCase() : '';
      const mapRo: Record<string,string> = { relatii: 'relații', calm: 'calm', identitate: 'claritate', performanta: 'performanță', energie: 'energie', obiceiuri: 'obiceiuri', sens: 'sens' };
      const key = Object.keys(mapRo).find(k => top.includes(k));
      return key ? mapRo[key] : (lang === 'ro' ? 'această temă' : 'this area');
    } catch { return (lang === 'ro' ? 'această temă' : 'this area'); }
  })();
  const [impact, setImpact] = useState(6);      // cât afectează azi
  const [readiness, setReadiness] = useState(7); // disponibilitate de efort constant
  const [frequency, setFrequency] = useState(6); // cât de des te gândești
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      // Compute a simple projected motivation index (0..100) from the 3 cues
      // Weighting: readiness (expectancy) 45%, impact (urgency) 30%, frequency (salience) 25%
      const proj = Math.round(
        0.45 * (readiness / 10) * 100 +
        0.30 * (impact / 10) * 100 +
        0.25 * (frequency / 10) * 100
      );
      await recordOmniPatch({
        scope: {
          motivationIndex: proj,
        },
      }, userId ?? undefined);
      await recordPracticeSession('drill', Date.now(), 120, userId ?? undefined);
    } catch (e) {
      console.warn('initiation omniscope save failed', e);
    } finally {
      setBusy(false);
      if (onComplete) onComplete();
      else router.push('/progress?from=initiation&step=omniscope-done');
    }
  };
  return (
    <section className="relative space-y-4 overflow-hidden rounded-[24px]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "url('/assets/onboarding-path-geometry.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="relative z-10 space-y-4">
        <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <Typewriter text={lang === 'ro' ? 'Unde ești acum pe hartă în raport cu tema în focus?' : 'Where are you right now relative to your focus theme?'} />
      </div>
      <GuideCard title={lang === 'ro' ? 'Trei întrebări scurte' : 'Three quick questions'}>
        <div className="space-y-4">
          <Mixer
            label={lang === 'ro' ? `Cât de mult îți afectează viața de zi cu zi faptul că ${primaryLabel} nu este încă așa cum ți-ai dori?` : `How much does it affect your day to day that ${primaryLabel} isn’t how you want it (yet)?`}
            value={impact}
            setValue={setImpact}
            min={1}
            max={10}
            ticks={10}
            lowLabel={lang === 'ro' ? 'Puțin' : 'Little'}
            highLabel={lang === 'ro' ? 'Mult' : 'A lot'}
            testId="init-scope-impact"
          />
          <Mixer
            label={lang === 'ro' ? `Cât de pregătit(ă) te simți să depui efort constant (nu perfect) pentru a progresa în ${primaryLabel}?` : `How ready do you feel to put in steady (not perfect) effort to progress in ${primaryLabel}?`}
            value={readiness}
            setValue={setReadiness}
            min={1}
            max={10}
            ticks={10}
            lowLabel={lang === 'ro' ? 'Deloc' : 'Not at all'}
            highLabel={lang === 'ro' ? 'Gata' : 'Ready'}
            testId="init-scope-readiness"
          />
          <Mixer
            label={lang === 'ro' ? 'Cât de des te gândești la această temă?' : 'How often do you think about this?'}
            value={frequency}
            setValue={setFrequency}
            min={1}
            max={10}
            ticks={10}
            lowLabel={lang === 'ro' ? 'Rar' : 'Rarely'}
            highLabel={lang === 'ro' ? 'Des' : 'Often'}
            testId="init-scope-frequency"
          />
          <div className="flex justify-end">
            <button
              disabled={busy}
              onClick={submit}
              className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
              data-testid="init-scope-continue"
            >
              {lang === 'ro' ? 'Continuă' : 'Continue'}
            </button>
          </div>
        </div>
      </GuideCard>
      </div>
    </section>
  );
}
