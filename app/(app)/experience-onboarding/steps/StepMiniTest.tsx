"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import TestQuestionCard from "@/components/onboarding/TestQuestionCard";
import { CUNO_QUESTIONS } from "@/lib/cunoQuestions";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { getOnboardingQuestions } from "@/lib/omniKunoOnboarding";
import { getCorrectIndexFor } from "@/lib/omniKunoAnswers";
import type { OmniKunoTopicKey } from "@/lib/omniKunoTypes";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useI18n } from "@/components/I18nProvider";

type MiniMeta = {
  topicKey?: string;
  secondaryTopicKey?: string;
  questions?: Array<{ id: string; correctIndex: number; style?: string; facet?: string; topicKey?: string; questionText?: string }>;
};

export default function StepMiniTest({
  onSubmit,
  autoSubmitAfterMin = false,
}: {
  onSubmit: (answers: number[], score: { raw: number; max: number }, meta?: MiniMeta) => void;
  autoSubmitAfterMin?: boolean;
}) {
  const { lang } = useI18n();
  const { profile } = useProfile();
  const { data: facts } = useProgressFacts(profile?.id);
  // Pick primary dimension from intent categories (highest count); fallback to 'relatii' if tags hint, else generic
  const primary = (() => {
    try {
      const cats = facts?.intent?.categories as Array<{ category: string; count: number }> | undefined;
      const top = cats && cats.length ? [...cats].sort((a, b) => (b.count || 0) - (a.count || 0))[0]?.category : null;
      if (top && /relat/i.test(top)) return 'relatii';
      if (top && /calm|stress/i.test(top)) return 'calm';
      if (top && /clar|cuno|knowledge|ident/i.test(top)) return 'identitate';
      if (top && /perform/i.test(top)) return 'performanta';
      if (top && /energie|energy/i.test(top)) return 'energie';
      if (top && /obice|habit/i.test(top)) return 'obiceiuri';
      if (top && /sens|meaning|purpose/i.test(top)) return 'sens';
    } catch {}
    const tags = (facts?.intent?.tags ?? []) as string[];
    if (tags.some((t) => /relat/i.test(t))) return 'relatii';
    return null;
  })();
  // Determine secondary from intent categories if available
  const secondary = (() => {
    try {
      const cats = (facts?.intent?.categories as Array<{ category: string; count: number }> | undefined) || [];
      if (!cats.length) return null;
      const norm = (s: string) => s.toLowerCase();
      const sorted = [...cats].sort((a, b) => (b.count || 0) - (a.count || 0));
      const top2 = sorted.slice(0, 2).map((c) => norm(c.category));
      const map: Record<string, OmniKunoTopicKey> = {
        relatii: 'relatii',
        relatie: 'relatii',
        calm: 'calm',
        stres: 'calm',
        claritate: 'identitate',
        identitate: 'identitate',
        performanta: 'performanta',
        energie: 'energie',
        obiceiuri: 'obiceiuri',
        sens: 'sens',
      };
      const keys = top2.map((w) => Object.keys(map).find((k) => w.includes(k))).filter(Boolean) as string[];
      const prim = primary as string | null;
      const pick = keys.map((k) => map[k!]).find((k) => k !== prim) || null;
      return pick;
    } catch { return null; }
  })();
  // Build a pure knowledge mini‑quiz to avoid mixing types in the score.
  // 1) Pull onboarding questions and filter to knowledge
  const onboardingSet = useMemo(
    () =>
      primary
        ? getOnboardingQuestions(primary as OmniKunoTopicKey, undefined, (facts?.intent?.tags ?? []) as string[])
        : [],
    [facts?.intent?.tags, primary],
  );
  const knowledgeFromOnboarding = onboardingSet.filter((q) => q.style === 'knowledge');
  // 2) If not enough, fallback to general CUNO bank for the mapped category
  const catMap: Record<string, string> = { relatii: 'relationships', calm: 'calm', identitate: 'clarity', performanta: 'performance', energie: 'energy', obiceiuri: 'general', sens: 'general' };
  const desired = 5;
  const knowledgeMapped = knowledgeFromOnboarding.map((q) => ({ id: q.id, question: q.text, options: q.options.map((o) => o.label), correctIndex: getCorrectIndexFor(q.id, q.options.map((o) => o.id)), explanation: q.defaultFeedback ?? '' }));
  const need = Math.max(0, desired - knowledgeMapped.length);
  const fallback = (() => {
    try {
      const cat = primary ? (catMap[primary] || 'general') : 'general';
      const pool = CUNO_QUESTIONS.filter((q) => (q.category || 'general') === cat);
      const picks: typeof pool = [];
      for (const q of pool) {
        if (picks.length >= need) break;
        // avoid accidental duplicate by question text
        if (!knowledgeMapped.some((m) => m.question === q.question)) picks.push(q);
      }
      return picks.map((q) => ({ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation }));
    } catch { return []; }
  })();
  const built = [...knowledgeMapped, ...fallback].slice(0, desired);
  const questions = built.length ? built : CUNO_QUESTIONS.slice(0, 3).map((q) => ({ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation }));
  // const totalCount = questions.length;
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [touched, setTouched] = useState<boolean[]>(Array(questions.length).fill(false));
  const raw = answers.filter((a, i) => questions[i].correctIndex >= 0 && a === questions[i].correctIndex).length;
  const max = questions.length;
  const answeredCount = touched.filter(Boolean).length;
  const minAnswersNeeded = Math.min(3, questions.length || 3);
  const canSubmit = answeredCount >= minAnswersNeeded;
  const autoSubmitRef = useRef(false);
  const handleSubmit = useCallback(() => {
    autoSubmitRef.current = true;
    onSubmit(
      answers,
      { raw, max },
      {
        topicKey: onboardingSet.length ? (primary as string) : (primary as string | undefined),
        secondaryTopicKey: onboardingSet.length ? (secondary as string | undefined) : undefined,
        questions: questions.map((q) => {
          const src = onboardingSet.find((f) => f.id === q.id);
          return {
            id: q.id,
            correctIndex: q.correctIndex,
            style: src?.style,
            facet: src?.facet as string | undefined,
            topicKey: src?.topicKey as string | undefined,
            questionText: q.question,
          };
        }),
      },
    );
  }, [answers, max, onboardingSet, onSubmit, primary, questions, raw, secondary]);

  useEffect(() => {
    if (!autoSubmitAfterMin) return;
    if (!canSubmit) return;
    if (autoSubmitRef.current) return;
    handleSubmit();
  }, [autoSubmitAfterMin, canSubmit, handleSubmit]);
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Pas 2/7' : 'Step 2/7'}</div>
        <Typewriter text={lang === 'ro' ? `Mini‑Cuno: ${questions.length} întrebări rapide. Vei vedea explicația corectă la fiecare răspuns.` : `Mini‑Cuno: ${questions.length} quick questions. You’ll see the explanation for the correct answer.`} />
      </div>
      {/* Legend removed here to keep the quiz simple and self‑evident (pure knowledge) */}
      {questions.map((q, idx) => {
        const style = 'knowledge' as const;
        return (
          <TestQuestionCard
            key={q.id}
            item={{ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation ?? '' }}
            onAnswer={(sel) => {
              setAnswers((prev) => prev.map((v, i) => (i === idx ? sel : v)));
              setTouched((prev) => prev.map((v, i) => (i === idx ? true : v)));
            }}
            scored={q.correctIndex >= 0}
            styleLabel={style}
            index={idx}
            total={questions.length}
            questionTestId="eo-question"
            optionTestId="eo-option"
          />
        );
      })}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#4A3A30]">{lang === 'ro' ? 'Scor curent' : 'Current score'}: {raw}/{max}</p>
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          data-testid="eo-submit"
          className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
        >
          {lang === 'ro' ? 'Vezi scorul' : 'See score'}
        </button>
      </div>
    </section>
  );
}
