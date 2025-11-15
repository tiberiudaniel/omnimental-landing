"use client";

import Typewriter from "@/components/onboarding/Typewriter";
import TestQuestionCard from "@/components/onboarding/TestQuestionCard";
import { CUNO_QUESTIONS } from "@/lib/cunoQuestions";
import { useProfile } from "@/components/ProfileProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { getOmniKunoMiniTest } from "@/lib/omniKuno";
import type { OmniKunoTopicKey } from "@/lib/omniKunoTypes";
import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type MiniMeta = { topicKey?: string; questions?: Array<{ id: string; correctIndex: number; style?: string }> };

export default function StepMiniTest({ onSubmit }: { onSubmit: (answers: number[], score: { raw: number; max: number }, meta?: MiniMeta) => void }) {
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
  const mini = primary ? getOmniKunoMiniTest({ primaryDimension: primary as OmniKunoTopicKey, cloudTags: (facts?.intent?.tags ?? []) as string[] }) : null;
  const full = mini?.questions ?? [];
  const questions = (full.length > 0
    ? full.slice(0, 7).map((q) => ({
        id: q.id,
        question: q.text,
        options: q.options.map((o) => o.label),
        // Kuno mini‑test items are not graded (no correctIndex in schema)
        correctIndex: -1,
        explanation: q.defaultFeedback ?? '',
      }))
    : CUNO_QUESTIONS.slice(0, 3).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        // For fallback bank, keep the real correct index so score is computed
        correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 ? q.correctIndex : -1,
        explanation: q.explanation ?? '',
      }))
  );
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [touched, setTouched] = useState<boolean[]>(Array(questions.length).fill(false));
  const raw = answers.filter((a, i) => questions[i].correctIndex >= 0 && a === questions[i].correctIndex).length;
  const max = questions.length;
  const allAnswered = touched.every(Boolean);
  return (
    <section className="space-y-4">
      <div className="rounded-[16px] border border-[#E4DAD1] bg-white px-6 py-6 shadow-sm">
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-[#A08F82]">{lang === 'ro' ? 'Pas 2/7' : 'Step 2/7'}</div>
        <Typewriter text={lang === 'ro' ? "Mini‑Cuno: 3 întrebări rapide. Vei vedea explicația corectă la fiecare răspuns." : "Mini‑Cuno: 3 quick questions. You’ll see the explanation for the correct answer."} />
      </div>
      {questions.map((q, idx) => (
        <TestQuestionCard
          key={q.id}
          item={{ id: q.id, question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation ?? '' }}
          onAnswer={(sel) => {
            setAnswers((prev) => prev.map((v, i) => (i === idx ? sel : v)));
            setTouched((prev) => prev.map((v, i) => (i === idx ? true : v)));
          }}
        />
      ))}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#4A3A30]">{lang === 'ro' ? 'Scor curent' : 'Current score'}: {raw}/{max}</p>
        <button
          disabled={!allAnswered}
          onClick={() => onSubmit(
            answers,
            { raw, max },
            { topicKey: mini?.topicKey, questions: questions.map((q) => ({ id: q.id, correctIndex: q.correctIndex, style: full.find((f) => f.id === q.id)?.style })) }
          )}
          data-testid="eo-submit"
          className="rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] disabled:opacity-60 hover:border-[#E60012] hover:text-[#E60012]"
        >
          {lang === 'ro' ? 'Vezi scorul' : 'See score'}
        </button>
      </div>
    </section>
  );
}
