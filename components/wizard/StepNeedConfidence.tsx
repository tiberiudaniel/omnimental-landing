"use client";

import { useMemo, useState } from 'react';
import { NEED_SURVEY_CONFIG, type NeedOptionId, type NeedChannelTag } from '@/config/needSurveyConfig';
import { buildNeedProfile } from '@/lib/needProfile';
import GuideCard from '@/components/onboarding/GuideCard';
import TypewriterText from '@/components/TypewriterText';
import { useI18n } from '@/components/I18nProvider';
import { getWizardStepTestId } from '@/components/useWizardSteps';
import { recordNeedProfile } from '@/lib/progressFacts';
import { FEEDBACK_BY_TAG } from '@/config/needSurveyFeedback';

export default function StepNeedConfidence({ selectedOptions, onDone }: { selectedOptions: NeedOptionId[]; onDone: (profile: ReturnType<typeof buildNeedProfile>) => void }) {
  const { lang } = useI18n();
  const q = NEED_SURVEY_CONFIG.questions.find((x) => x.id === 'need_q2_self_efficacy' && x.type === 'likert_1_5')! as Extract<(typeof NEED_SURVEY_CONFIG)['questions'][number], { id: 'need_q2_self_efficacy' }>;
  const [score, setScore] = useState<number>(3);
  const optionToTags: Record<NeedOptionId, NeedChannelTag[]> = useMemo(() => {
    const q1 = NEED_SURVEY_CONFIG.questions.find((x) => x.id === 'need_q1_main' && x.type === 'multi_select')! as Extract<(typeof NEED_SURVEY_CONFIG)['questions'][number], { id: 'need_q1_main' }>;
    const map = {} as Record<NeedOptionId, NeedChannelTag[]>;
    q1.options.forEach((o) => { map[o.id as NeedOptionId] = o.channelTags; });
    return map;
  }, []);
  const profile = useMemo(() => buildNeedProfile({ selectedOptionsQ1: selectedOptions, selfEfficacyScoreQ2: score, optionToTags }), [selectedOptions, score, optionToTags]);
  const fb = profile.primaryTag ? FEEDBACK_BY_TAG[profile.primaryTag] : null;
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await recordNeedProfile({
        primaryOptionId: profile.primaryOptionId,
        secondaryOptionId: profile.secondaryOptionId,
        primaryTag: profile.primaryTag,
        allTags: profile.allTags,
        selfEfficacyScore: profile.selfEfficacyScore,
      });
    } catch {}
    setSaving(false);
    onDone(profile);
  };
  return (
    <section className="space-y-4" data-testid={getWizardStepTestId("needConfidence")}>
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <TypewriterText text={lang === 'ro' ? q.label.ro : q.label.en} />
      </div>
      <GuideCard title={lang === 'ro' ? 'Alege varianta care te descrie' : 'Choose the option that fits you'}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {[1,2,3,4,5].map((v) => {
            const short = lang==='ro' ? shortLabel(v,'ro') : shortLabel(v,'en');
            const full = lang==='ro' ? anchorText(v,'ro') : anchorText(v,'en');
            return (
              <button
                key={v}
                type="button"
                aria-label={`${v}: ${full}`}
                onClick={() => setScore(v)}
                className={`rounded-[10px] border px-3 py-2 text-sm ${score===v?'border-[#1F7A53] bg-[#F0FFF6]':'border-[#E4DAD1] bg-white hover:border-[#2C2C2C]'}`}
              >
                {short}
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Rezultatul tău acum' : 'Your result now'}</p>
          {fb ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-[#2C2C2C]">{lang === 'ro' ? fb.title.ro : fb.title.en}</p>
              <p className="mt-1 text-[13px] text-[#4A3A30]">{lang === 'ro' ? fb.text.ro : fb.text.en}</p>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
            data-testid="need-confidence-continue"
          >
            {lang === 'ro' ? 'Continuă' : 'Continue'}
          </button>
        </div>
      </GuideCard>
    </section>
  );
}

function anchorText(v: number, lang: 'ro'|'en'): string {
  const ro: Record<number,string> = {
    1: 'Deloc, mi se pare aproape imposibil acum',
    2: 'Foarte greu, nu prea cred că o să reușesc',
    3: 'Posibil, dar nu sunt deloc sigur(ă)',
    4: 'Probabil, dacă am sprijin potrivit',
    5: 'Sunt convins(ă) că pot, doar îmi trebuie un pic de structură',
  };
  const en: Record<number,string> = {
    1: 'Not at all, it feels almost impossible right now',
    2: "Very hard, I don't really believe I'll manage",
    3: "Possible, but I'm not confident at all",
    4: 'Likely, if I have the right support',
    5: "I'm confident I can, I just need a bit of structure",
  };
  return (lang === 'ro' ? ro : en)[v] || '';
}

function shortLabel(v: number, lang: 'ro'|'en'): string {
  const ro: Record<number,string> = {
    1: 'Deloc',
    2: 'Puțin',
    3: 'Posibil',
    4: 'Probabil',
    5: 'Sunt convins(ă)',
  };
  const en: Record<number,string> = {
    1: 'Not at all',
    2: 'A little',
    3: 'Possible',
    4: 'Likely',
    5: 'Confident',
  };
  return (lang === 'ro' ? ro : en)[v] || '';
}
