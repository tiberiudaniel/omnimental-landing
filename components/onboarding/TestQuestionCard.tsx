"use client";

import { useState } from "react";

export type MCQ = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
type Props = {
  item: MCQ;
  onAnswer: (idx: number, correct: boolean) => void;
  scored?: boolean; // whether this item counts to score (knowledge)
  styleLabel?: 'knowledge' | 'scenario' | 'reflection' | 'microSkill' | undefined;
  index?: number;
  total?: number;
  questionTestId?: string;
  optionTestId?: string;
};

export default function TestQuestionCard({
  item,
  onAnswer,
  scored,
  styleLabel,
  index,
  total,
  questionTestId,
  optionTestId,
}: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const graded = typeof item.correctIndex === 'number' && item.correctIndex >= 0;
  const correct = sel !== null && graded ? sel === item.correctIndex : null;
  const styleText = (() => {
    if (styleLabel === 'knowledge') return 'Cunoștințe';
    if (styleLabel === 'scenario') return 'Scenariu';
    if (styleLabel === 'reflection') return 'Reflecție';
    if (styleLabel === 'microSkill') return 'Micro‑abilitate';
    return undefined;
  })();
  const scoredHint = scored ?? graded;
  return (
    <div
      className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-4 shadow-sm"
      data-testid={questionTestId ?? undefined}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {styleText ? (
            <span className={`rounded-full border px-2 py-[1px] text-[10px] ${scoredHint ? 'border-[#1F7A53] text-[#1F7A53]' : 'border-[#7B6B60] text-[var(--omni-muted)]'}`} title={scoredHint ? 'Contează la scor' : 'Nu contează la scor'}>
              {styleText}{scoredHint ? ' · +scor' : ''}
            </span>
          ) : null}
        </div>
        {typeof index === 'number' && typeof total === 'number' ? (
          <span className="text-[10px] text-[var(--omni-muted)]">{index + 1}/{total}</span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-[var(--omni-ink)]">{item.question}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {item.options.map((opt, idx) => {
          const is = sel === idx;
          const stateClass = sel === null
            ? ""
            : graded
            ? (idx === item.correctIndex ? "border-[#1F7A53] bg-[#F0FFF6]" : (is ? "border-[var(--omni-danger)] bg-[var(--omni-danger-soft)]" : ""))
            : (is ? "border-[var(--omni-ink)] bg-[var(--omni-bg-paper)]" : "");
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSel(idx);
                onAnswer(idx, graded ? idx === item.correctIndex : false);
              }}
              data-testid={optionTestId ?? undefined}
              className={`flex items-center justify-between rounded-[10px] border px-3 py-2 text-left text-[13px] sm:text-sm transition ${
                stateClass || "border-[var(--omni-border-soft)] hover:border-[var(--omni-energy)]"
              } text-[var(--omni-ink)]`}
            >
              <span className="pr-2">{opt}</span>
              {sel !== null && !graded && is ? (
                <span aria-hidden className="text-[var(--omni-muted)]">✓</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {sel !== null ? (
        graded ? (
          <p className={`mt-3 text-sm ${correct ? "text-[var(--omni-ink-soft)]" : "text-[var(--omni-danger)]"}`}>
            {correct ? "Corect." : "Incorect."} {item.explanation}
          </p>
        ) : (
          <div className="mt-3 text-sm text-[var(--omni-ink-soft)]">
            <p>{item.explanation}</p>
            <p className="mt-1 text-[12px] text-[var(--omni-muted)]">Acest item nu contează la scor (folosit pentru personalizare).</p>
          </div>
        )
      ) : null}
    </div>
  );
}
