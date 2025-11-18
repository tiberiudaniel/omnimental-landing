"use client";

import { useState } from 'react';
import { NEED_SURVEY_CONFIG, type NeedOptionId } from '@/config/needSurveyConfig';
import GuideCard from '@/components/onboarding/GuideCard';
import TypewriterText from '@/components/TypewriterText';
import { useI18n } from '@/components/I18nProvider';

export default function StepNeedMain({ onNext }: { onNext: (sel: NeedOptionId[], otherText?: string) => void }) {
  const { lang } = useI18n();
  const q = NEED_SURVEY_CONFIG.questions.find((x) => x.id === 'need_q1_main' && x.type === 'multi_select')! as Extract<(typeof NEED_SURVEY_CONFIG)['questions'][number], { id: 'need_q1_main' }>;
  const [selected, setSelected] = useState<NeedOptionId[]>([]);
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
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <TypewriterText text={lang === 'ro' ? q.label.ro : q.label.en} />
      </div>
      <GuideCard title={lang === 'ro' ? 'Alege maxim 2' : 'Choose up to 2'}>
        <div className="grid gap-3 md:grid-cols-2">
          {q.options.filter((opt) => opt.id !== 'need_other').map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`rounded-[12px] border px-4 py-3 text-left shadow-sm transition ${selected.includes(opt.id) ? 'border-[#1F7A53] bg-[#F0FFF6]' : 'border-[#E4DAD1] bg-white hover:border-[#2C2C2C]'}`}
              data-testid={`need-opt-${opt.id}`}
            >
              <p className="text-sm font-semibold text-[#2C2C2C]">{lang === 'ro' ? opt.label.ro : opt.label.en}</p>
            </button>
          ))}
        </div>
        {/* need_other removed from this flow per request */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => onNext(selected)}
            className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
            data-testid="need-main-continue"
          >
            {lang === 'ro' ? 'Continuă' : 'Continue'}
          </button>
        </div>
      </GuideCard>
    </section>
  );
}
