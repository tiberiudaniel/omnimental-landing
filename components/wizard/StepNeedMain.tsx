"use client";

import { useState } from 'react';
import { NEED_SURVEY_CONFIG, type NeedOptionId } from '@/config/needSurveyConfig';
import TypewriterText from '@/components/TypewriterText';
import { useI18n } from '@/components/I18nProvider';
import { getWizardStepTestId } from '@/components/useWizardSteps';

export default function StepNeedMain({ onNext }: { onNext: (sel: NeedOptionId[], otherText?: string) => void }) {
  const { lang } = useI18n();
  const q = NEED_SURVEY_CONFIG.questions.find((x) => x.id === 'need_q1_main' && x.type === 'multi_select')! as Extract<(typeof NEED_SURVEY_CONFIG)['questions'][number], { id: 'need_q1_main' }>;
  const [selected, setSelected] = useState<NeedOptionId[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const url = new URL(window.location.href);
      const isRelaxed = url.searchParams.get("e2e") === "1" || url.searchParams.get("demo") === "1";
      if (!isRelaxed) return [];
      const first = q.options[0]?.id as NeedOptionId | undefined;
      return first ? [first] : [];
    } catch {
      return [];
    }
  });
  const { minSelections, maxSelections } = q;
  const canContinue = selected.length >= minSelections && selected.length <= maxSelections;
  const toggle = (id: NeedOptionId) => {
    setSelected((prev) => {
      // deselect if already selected
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // if we have room, add
      if (prev.length < maxSelections) return [...prev, id];
      // if full (2), replace the last selected with the new one
      if (prev.length === maxSelections) return [prev[0], id];
      return prev;
    });
  };
  const hint = lang === 'ro'
    ? `Alege maximum ${maxSelections} teme prioritare (încearcă să te limitezi la ${minSelections} dacă poți).`
    : `Pick up to ${maxSelections} focus areas (ideally at least ${minSelections}).`;
  return (
    <section className="space-y-4" data-testid={getWizardStepTestId("needMain")}>
      <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-sm space-y-2">
        <TypewriterText text={lang === 'ro' ? q.label.ro : q.label.en} />
        <p className="text-sm text-[#6A4A3A]">{hint}</p>
      </div>
      <div className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          {q.options.filter((opt) => opt.id !== 'need_other').map((opt) => {
            const label = lang === 'ro' ? opt.label.ro : opt.label.en;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                className={`rounded-[14px] border px-4 py-3 text-left shadow-sm transition ${selected.includes(opt.id) ? 'border-[#1F7A53] bg-[#F0FFF6]' : 'border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] hover:border-[var(--omni-energy)]'}`}
                data-testid={`need-opt-${opt.id}`}
              >
                <span className="text-sm font-medium text-[var(--omni-ink)]">{label}</span>
              </button>
            );
          })}
        </div>
        {/* need_other removed from this flow per request */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => onNext(selected)}
            className="rounded-[10px] border border-[var(--omni-border-soft)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] disabled:opacity-60 hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
            data-testid="need-main-continue"
          >
            {lang === 'ro' ? 'Continuă' : 'Continue'}
          </button>
        </div>
      </div>
    </section>
  );
}
