"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/I18nProvider";
import { getString } from "@/lib/i18nGetString";
import { omniKnowledgeModules } from "@/lib/omniKnowledge";
import { submitOmniKnowledgeAssessment } from "@/lib/submitEvaluation";
import { recordOmniPatch } from "@/lib/progressFacts";

type AnswerMap = Record<string, number | null>;

export default function MiniCunoTest({ lang, onDone }: { lang: "ro" | "en"; onDone: () => void }) {
  const { t } = useI18n();
  const search = useSearchParams();
  const e2e = search?.get('e2e') === '1';
  // Use first question from each module for a 6-item micro test
  const items = useMemo(() => omniKnowledgeModules.map((m) => ({ module: m.key, question: m.questions[0] })), []);
  const [answers, setAnswers] = useState<AnswerMap>(() => items.reduce((acc, it) => ({ ...acc, [it.question.id]: null }), {}));
  const [saving, setSaving] = useState(false);

  const allAnswered = useMemo(() => Object.values(answers).every((v) => typeof v === "number"), [answers]);
  const score = useMemo(() => {
    let raw = 0;
    const max = items.length;
    const breakdown: Record<string, { raw: number; max: number; percent: number }> = {};
    items.forEach((it) => {
      const val = answers[it.question.id];
      const correct = it.question.correctIndex;
      const r = typeof val === "number" && val === correct ? 1 : 0;
      raw += r;
      breakdown[it.module] = { raw: r, max: 1, percent: Math.round((r / 1) * 100) };
    });
    const percent = max ? Math.round((raw / max) * 100) : 0;
    return { raw, max, percent, breakdown };
  }, [answers, items]);

  const set = (id: string, idx: number) => setAnswers((prev) => ({ ...prev, [id]: idx }));

  const handleSubmit = async () => {
    if (!allAnswered && !e2e) return;
    setSaving(true);
    try {
      await submitOmniKnowledgeAssessment({ lang, score, answers: {} });
      await recordOmniPatch({ kuno: { knowledgeIndex: score.percent, completedTests: 1 } });
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl px-4" data-testid="onboarding-minicuno">
      <Card className="rounded-2xl border border-[#E4DAD1] bg-white p-5 shadow-sm">
        <header className="mb-3">
          <h2 className="text-xl font-semibold text-[#1F1F1F]">{getString(t, "minicuno.title", lang === "ro" ? "Mini‑Cuno (6 întrebări)" : "Mini‑Knowledge (6 questions)")}</h2>
          <p className="mt-1 text-sm text-[#4A3A30]">{getString(t, "minicuno.instructions", lang === "ro" ? "Răspunde rapid la câte o întrebare per modul. Primești un scor instant." : "Answer one quick question per module. You’ll get an instant score.")}</p>
        </header>
        <div className="space-y-4">
          {items.map((it) => (
            <article key={it.question.id} className="space-y-2 rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3">
              <p className="text-sm text-[#2C2C2C]">{it.question.question}</p>
              <div className="grid gap-2 md:grid-cols-2">
                {it.question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => set(it.question.id, idx)}
                    className={`rounded-[10px] border px-3 py-2 text-left text-sm ${
                      answers[it.question.id] === idx ? "border-[#2C2C2C] bg-[#2C2C2C] text-white" : "border-[#E4DAD1] bg-white text-[#2C2C2C] hover:border-[#2C2C2C]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
        <footer className="mt-4 flex items-center justify-between">
          <p className="text-[12px] text-[#7B6B60]">{getString(t, "minicuno.currentScore", lang === "ro" ? "Scor curent" : "Current score")}: {score.percent}%</p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={(!allAnswered && !e2e) || saving}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="onboarding-minicuno-save"
          >
            {getString(t, "minicuno.saveScore", lang === "ro" ? "Salvează scorul" : "Save score")}
          </button>
        </footer>
      </Card>
    </section>
  );
}
