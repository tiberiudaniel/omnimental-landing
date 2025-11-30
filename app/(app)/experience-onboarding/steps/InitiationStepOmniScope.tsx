"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import Typewriter from "@/components/onboarding/Typewriter";
import { recordPracticeSession, recordOmniPatch } from "@/lib/progressFacts";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import Image from "next/image";
import GuideCard from "@/components/onboarding/GuideCard";
import onboardingPathGeometry from "@/public/assets/onboarding-path-geometry.jpg";
// (no extra types needed)

function Mixer({ label, value, setValue, min = 1, max = 10, ticks = 10, lowLabel, highLabel, testId, highlight = false, onAfterChange }: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min?: number;
  max?: number;
  ticks?: number;
  lowLabel?: string;
  highLabel?: string;
  testId: string;
  highlight?: boolean;
  onAfterChange?: (n: number) => void;
}) {
  const clamped = Math.max(min, Math.min(max, value));
  const fillPct = Math.max(0, Math.min(100, (clamped - min) * (100 / (max - min))));
  return (
    <div className="panel-ghost px-4 py-4" data-highlight={highlight ? 'true' : undefined}>
      <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
        {label}
      </p>
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
            onChange={(e) => {
              const next = Number(e.target.value);
              setValue(next);
              if (onAfterChange) onAfterChange(next);
            }}
            data-testid={testId}
            className="mixer-range w-full"
          />
        </div>
      </div>
      {(lowLabel || highLabel) ? (
        <div
          className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.25em]"
          style={{ color: "var(--text-soft)" }}
        >
          <span>{lowLabel}</span>
          <span style={{ color: "var(--text-muted)" }}>
            {clamped}/{max}
          </span>
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
  const defaults = { impact: 6, readiness: 7, frequency: 6 } as const;
  const [impact, setImpact] = useState<number>(defaults.impact);      // cât afectează azi
  const [readiness, setReadiness] = useState<number>(defaults.readiness); // disponibilitate de efort constant
  const [frequency, setFrequency] = useState<number>(defaults.frequency); // cât de des te gândești
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState<{ impact: boolean; readiness: boolean; frequency: boolean }>({ impact: false, readiness: false, frequency: false });
  const markTouched = (key: 'impact' | 'readiness' | 'frequency') => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };
  const allTouched = touched.impact && touched.readiness && touched.frequency;
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
    <section className="px-0 py-0">
      <div
        className="omni-card px-4 py-4 md:px-6 md:py-6"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="md:w-[38%] flex justify-center">
            <div
              className="relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-[32px] border shadow-[0_20px_45px_rgba(0,0,0,0.12)]"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Image src={onboardingPathGeometry} alt={lang === 'ro' ? 'Ilustrație OmniScope' : 'OmniScope illustration'} fill className="object-cover" priority={false} />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div
              className="omni-card px-5 py-5"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card-soft)" }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: "var(--text-soft)" }}
              >
                {lang === 'ro' ? 'OmniScope' : 'OmniScope'}
              </p>
              <h3
                className="mt-2 text-xl font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {lang === 'ro' ? 'Calibrezi harta temei în focus' : 'Calibrate the map for your focus theme'}
              </h3>
              <div className="mt-3 text-sm" style={{ color: "var(--text-main)" }}>
                <Typewriter text={lang === 'ro' ? 'Unde ești acum pe hartă în raport cu tema în focus?' : 'Where are you right now relative to your focus theme?'} />
              </div>
            </div>
            <GuideCard title={lang === 'ro' ? 'Trei întrebări scurte' : 'Three quick questions'} className="w-full">
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
                  highlight={!touched.impact}
                  onAfterChange={() => markTouched('impact')}
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
                  highlight={!touched.readiness}
                  onAfterChange={() => markTouched('readiness')}
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
                  highlight={!touched.frequency}
                  onAfterChange={() => markTouched('frequency')}
                />
                <div className="flex justify-end">
                  <button
                    disabled={busy || !allTouched}
                    onClick={submit}
                    className="theme-btn-solid rounded-[999px] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] disabled:cursor-not-allowed disabled:opacity-60"
                    data-testid="init-scope-continue"
                  >
                    {lang === 'ro' ? 'Continuă' : 'Continue'}
                  </button>
                </div>
              </div>
            </GuideCard>
          </div>
        </div>
      </div>
    </section>
  );
}
