"use client";

import { useState } from "react";

export type MCQ = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export default function TestQuestionCard({ item, onAnswer }: { item: MCQ; onAnswer: (idx: number, correct: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const graded = typeof item.correctIndex === 'number' && item.correctIndex >= 0;
  const correct = sel !== null && graded ? sel === item.correctIndex : null;
  return (
    <div className="rounded-[12px] border border-[#E4DAD1] bg-white p-4 shadow-sm" data-testid="eo-question">
      <p className="text-sm font-medium text-[#1F1F1F]">{item.question}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {item.options.map((opt, idx) => {
          const is = sel === idx;
          const stateClass = sel === null
            ? ""
            : graded
            ? (idx === item.correctIndex ? "border-[#1F7A53] bg-[#F0FFF6]" : (is ? "border-[#B8000E] bg-[#FFF5F4]" : ""))
            : "";
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSel(idx);
                onAnswer(idx, graded ? idx === item.correctIndex : false);
              }}
              data-testid="eo-option"
              className={`rounded-[10px] border px-3 py-2 text-left text-[13px] sm:text-sm transition ${
                stateClass || "border-[#D8C6B6] hover:border-[#2C2C2C]"
              } text-[#2C2C2C]`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {sel !== null ? (
        graded ? (
          <p className={`mt-3 text-sm ${correct ? "text-[#1F3C2F]" : "text-[#8C2B2F]"}`}>
            {correct ? "Corect." : "Incorect."} {item.explanation}
          </p>
        ) : (
          <p className="mt-3 text-sm text-[#4A3A30]">{item.explanation}</p>
        )
      ) : null}
    </div>
  );
}
