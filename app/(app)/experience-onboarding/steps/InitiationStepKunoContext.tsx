"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import Typewriter from "@/components/onboarding/Typewriter";
import TestQuestionCard from "@/components/onboarding/TestQuestionCard";
import GuideCard from "@/components/onboarding/GuideCard";
import { getOnboardingQuestions } from "@/lib/omniKunoOnboarding";
import type { OmniKunoTopicKey } from "@/lib/omniKunoTypes";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { recordPracticeSession } from "@/lib/progressFacts";
import IllustratedStep from "@/components/onboarding/IllustratedStep";
import onboardingKunoDocs from "@/public/assets/onboarding-kuno-docs.jpg";

export default function InitiationStepKunoContext({ userId, onContinue }: { userId: string | null; onContinue: () => void }) {
  const { lang } = useI18n();
  const { profile } = useProfile();
  const { data: facts } = useProgressFacts(profile?.id);
  const primary = useMemo(() => {
    try {
      const cats = facts?.intent?.categories as Array<{ category: string; count: number }> | undefined;
      const top = cats && cats.length ? [...cats].sort((a, b) => (b.count || 0) - (a.count || 0))[0]?.category : null;
      if (top && /relat/i.test(top)) return 'relatii';
      if (top && /calm|stress/i.test(top)) return 'calm';
      if (top && /clar|ident/i.test(top)) return 'identitate';
      if (top && /perform/i.test(top)) return 'performanta';
      if (top && /energie|energy/i.test(top)) return 'energie';
      if (top && /obice|habit/i.test(top)) return 'obiceiuri';
      if (top && /sens|meaning|purpose/i.test(top)) return 'sens';
    } catch {}
    const tags = (facts?.intent?.tags ?? []) as string[];
    if (tags.some((t) => /relat/i.test(t))) return 'relatii';
    return null;
  }, [facts?.intent]);
  const pool = useMemo(() => {
    const set = primary ? getOnboardingQuestions(primary as OmniKunoTopicKey, undefined, (facts?.intent?.tags ?? []) as string[]) : [];
    // Pick 2 reflection + 2 scenario when available
    const reflection = set.filter((q) => q.style === 'reflection').slice(0, 2);
    const scenario = set.filter((q) => q.style === 'scenario').slice(0, 2);
    return [...reflection, ...scenario].slice(0, 4);
  }, [primary, facts?.intent]);
  const [answers, setAnswers] = useState<number[]>(Array(pool.length).fill(-1));
  const allAnswered = answers.every((a) => a >= 0);
  const save = async () => {
    try {
      const reflections = pool.filter((q) => q.style === 'reflection').length;
      if (reflections) {
        await recordPracticeSession('reflection', Date.now() - reflections * 60000, 45 * reflections, userId ?? undefined);
      }
    } catch {}
    onContinue();
  };
  return (
    <IllustratedStep
      image={onboardingKunoDocs}
      imageAlt={lang === 'ro' ? 'Note Omni-Kuno și instrumente de cunoaștere' : 'Omni-Kuno notes and learning tools'}
      imageClassName="opacity-70"
      imageTintClassName="bg-[var(--omni-surface-card)]/40"
      label={lang === 'ro' ? 'Context Omni-Kuno' : 'Omni-Kuno context'}
      title={lang === 'ro' ? 'Hai să acumulăm cunoaștere' : 'Let’s gather knowledge'}
      body={
        <div className="space-y-2">
          <Typewriter text={lang === 'ro' ? 'Când pornești la drum te pregătești, aduni instrucțiuni și cunoștințe despre ce vrei să explorezi.' : 'When you set off on a journey you prepare, gather instructions, and learn about what you want to explore.'} />
          <p className="text-sm" style={{ color: "var(--text-main)" }}>
            {lang === 'ro'
              ? 'Câteva scenarii și reflecții (nepunctate) te ajută să cunoști terenul și să vezi ce rezultate urmărești.'
              : 'A few unscored scenarios and reflections help you know the terrain and clarify the outcome you’re aiming for.'}
          </p>
        </div>
      }
    >
      {pool.length === 0 ? (
        <GuideCard title={lang === 'ro' ? 'Gata pentru pasul următor' : 'Ready for next step'}>
          <p>{lang === 'ro' ? 'Continuă — îți vom clarifica contextul în pașii următori.' : 'Continue — we will clarify your context in the next steps.'}</p>
        </GuideCard>
      ) : null}
      <div className="space-y-4">
        {pool.map((q, idx) => (
          <TestQuestionCard
            key={q.id}
            item={{ id: q.id, question: q.text, options: q.options.map((o) => o.label), correctIndex: -1, explanation: q.defaultFeedback ?? '' }}
            onAnswer={(sel) => setAnswers((prev) => prev.map((v, i) => (i === idx ? sel : v)))}
            scored={false}
            styleLabel={q.style as 'knowledge' | 'scenario' | 'reflection' | 'microSkill' | undefined}
            index={idx}
            total={pool.length}
            questionTestId="init-kuno-question"
            optionTestId="init-kuno-option"
          />
        ))}
      </div>
      <div className="flex justify-end">
        <button
          disabled={!allAnswered}
          onClick={save}
          className="theme-btn-solid rounded-[999px] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="init-kuno-continue"
        >
          {lang === 'ro' ? 'Continuă' : 'Continue'}
        </button>
      </div>
    </IllustratedStep>
  );
}
