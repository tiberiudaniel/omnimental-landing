"use client";

import { useMemo, useState } from "react";
import { OMNI_KUNO_FINAL_TESTS, type OmniKunoFinalTestQuestion } from "@/config/omniKunoFinalTests";

export type TestViewProps = {
  testId: string;
  onCompleted?: (result: { correct: number; total: number }) => void;
};

const MIN_PASS_OBJECTIVE = 4;

export default function TestView({ testId, onCompleted }: TestViewProps) {
  const test = OMNI_KUNO_FINAL_TESTS[testId];
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const current = test.questions[index];
  const total = test.questions.length;

  const canContinue = useMemo(() => {
    if (!current) return false;
    const value = answers[current.id ?? `${testId}-${index}`];
    if (current.type === "singleChoice" || current.type === "scenario") {
      return typeof value === "number";
    }
    if (current.type === "fillBlank" || current.type === "reflectionShort") {
      return typeof value === "string" && value.trim().length > 0;
    }
    return false;
  }, [answers, current, index, testId]);

  const handleNext = () => {
    if (!current) return;
    if (index < total - 1) {
      setIndex((prev) => prev + 1);
      return;
    }
    const result = computeScore(test.questions, answers, testId);
    setScore(result);
    onCompleted?.(result);
  };

  if (!test) {
    return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Testul nu este disponibil momentan.</p>;
  }

  if (score) {
    const passed = score.correct >= MIN_PASS_OBJECTIVE;
    const completion = test.completion;
    return (
      <section className="space-y-3 rounded-3xl border border-[#E4DAD1] bg-white px-6 py-5 text-[#2C2C2C]">
        <h3 className="text-xl font-semibold">{completion?.title ?? "Felicitări!"}</h3>
        <p className="text-sm text-[#4D3F36]">
          Ai răspuns corect la {score.correct} din {score.total} întrebări cu răspuns obiectiv.{" "}
          {passed
            ? "Ești gata să treci la următoarele module – continuă practica calmă și integrează ce ai învățat în conversațiile tale zilnice."
            : "Îți recomandăm să revezi lecțiile-cheie care ți-au ridicat semne de întrebare și să relansezi testul după câteva zile."}
        </p>
        {completion ? (
          <div className="space-y-2 rounded-2xl border border-[#F0E8E0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4D3F36]">
            <p>{completion.body}</p>
            {completion.suggestions?.length ? (
              <ul className="list-disc space-y-1 pl-5 text-[13px] text-[#513D32]">
                {completion.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            ) : null}
            {completion.badge ? (
              <div className="rounded-xl border border-[#CBE8D7] bg-[#F3FFF8] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1F3C2F]">
                {completion.badge}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-[#E4DAD1] bg-white px-6 py-5 text-[#2C2C2C]">
      {index === 0 ? (
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">Mini-test</p>
          <h3 className="text-xl font-semibold">{test.intro.title}</h3>
          <p className="text-sm text-[#4D3F36]">{test.intro.body}</p>
        </header>
      ) : null}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">
          Întrebarea {index + 1}/{total}
        </p>
        {current.type === "reflectionShort" ? (
          <p className="text-[11px] text-[#A08F82]">Răspunsul tău rămâne privat, folosit doar pentru recapitulare personală.</p>
        ) : null}
        {renderQuestion(current, answers, setAnswers, testId, index)}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue}
          className="inline-flex items-center rounded-full border border-[#C07963] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white disabled:cursor-not-allowed disabled:border-[#E4DAD1] disabled:text-[#B99484]"
        >
          {index === total - 1 ? "Încheie" : "Continuă"}
        </button>
      </div>
    </section>
  );
}

function renderQuestion(
  question: OmniKunoFinalTestQuestion,
  answers: Record<string, unknown>,
  setAnswers: (value: Record<string, unknown>) => void,
  testId: string,
  index: number,
) {
  const id = question.id ?? `${testId}-${index}`;
  const stored = answers[id];
  if (question.type === "singleChoice" || question.type === "scenario") {
    return (
      <div className="space-y-3">
        <p className="text-base font-semibold text-[#2C2C2C]">{question.question}</p>
        <div className="space-y-2">
          {question.options.map((option, idx) => {
            const selected = stored === idx;
            return (
              <button
                type="button"
                key={option}
                onClick={() => setAnswers({ ...answers, [id]: idx })}
                className={`w-full rounded-2xl border px-4 py-2 text-left text-sm transition focus:outline-none ${
                  selected ? "border-[#C07963] bg-[#FFFBF7] text-[#2C2C2C]" : "border-[#E4DAD1] text-[#4D3F36] hover:border-[#C07963]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (question.type === "fillBlank") {
    return (
      <div className="space-y-3">
        <p className="text-base font-semibold text-[#2C2C2C]">{question.question}</p>
        <input
          type="text"
          value={typeof stored === "string" ? stored : ""}
          onChange={(event) => setAnswers({ ...answers, [id]: event.target.value })}
          className="w-full rounded-2xl border border-[#E4DAD1] px-3 py-2 text-sm text-[#2C2C2C] focus:border-[#C07963] focus:outline-none"
          placeholder="Completează scurt aici"
        />
      </div>
    );
  }
  if (question.type === "reflectionShort") {
    return (
      <div className="space-y-3">
        <p className="text-base font-semibold text-[#2C2C2C]">{question.question}</p>
        <p className="text-sm text-[#7B6B60]">{question.prompt}</p>
        <input
          type="text"
          value={typeof stored === "string" ? stored : ""}
          onChange={(event) => setAnswers({ ...answers, [id]: event.target.value })}
          className="w-full rounded-2xl border border-[#E4DAD1] px-3 py-2 text-sm text-[#2C2C2C] focus:border-[#C07963] focus:outline-none"
          placeholder="Scrie o propoziție"
        />
      </div>
    );
  }
  return null;
}

function computeScore(
  questions: OmniKunoFinalTestQuestion[],
  answers: Record<string, unknown>,
  testId: string,
): { correct: number; total: number } {
  let correct = 0;
  let total = 0;
  questions.forEach((question, idx) => {
    const id = question.id ?? `${testId}-${idx}`;
    const answer = answers[id];
    if (question.type === "singleChoice" || question.type === "scenario") {
      total += 1;
      if (typeof answer === "number" && answer === question.correctIndex) {
        correct += 1;
      }
    } else if (question.type === "fillBlank") {
      total += 1;
      if (typeof answer === "string") {
        if (matchesFillBlank(answer, question.answer, question.variations ?? [])) {
          correct += 1;
        }
      }
    }
  });
  return { correct, total };
}

function matchesFillBlank(input: string, canonical: string, variations: string[]): boolean {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .trim();
  const normalizedInput = normalize(input);
  const accepted = [canonical, ...variations].map((value) => normalize(value));
  if (accepted.includes(normalizedInput)) return true;
  const tokens = normalizedInput.split(/\s+/);
  return tokens.length >= 3 && canonical.toLowerCase().split(/\s+/).every((token) => normalizedInput.includes(token));
}
