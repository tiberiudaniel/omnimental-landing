"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OmniKunoLesson } from "@/config/omniKunoLessons";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { applyKunoXp, getQuizXp } from "@/lib/omniKunoXp";
import { recordKunoLessonProgress } from "@/lib/progressFacts";
import { getOmniKunoQuiz } from "@/lib/omniKunoQuizBank";
import { updatePerformanceSnapshot, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { useI18n } from "@/components/I18nProvider";
import { asDifficulty, DIFFICULTY_STYLES } from "./difficulty";

export type QuizViewProps = {
  areaKey: OmniKunoModuleId;
  moduleId: string;
  lesson: OmniKunoLesson & { quizTopicKey?: string };
  existingCompletedIds: readonly string[];
  ownerId?: string | null;
  performanceSnapshot: KunoPerformanceSnapshot;
  onCompleted?: (
    lessonId: string,
    meta: { score: number; timeSpentSec: number; updatedPerformance: KunoPerformanceSnapshot },
  ) => void;
};

export default function QuizView({
  areaKey,
  moduleId,
  lesson,
  existingCompletedIds,
  ownerId,
  performanceSnapshot,
  onCompleted,
}: QuizViewProps) {
  const { t } = useI18n();
  const difficultyKey = asDifficulty(lesson.difficulty);
  const chipText = String(t(`omnikuno.difficulty.${difficultyKey}Chip`));
  const chipClass = DIFFICULTY_STYLES[difficultyKey].chip;
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(existingCompletedIds.includes(lesson.id));
  const startRef = useRef(Date.now());
  useEffect(() => {
    setScore(null);
    setSelection({});
    setCompleted(existingCompletedIds.includes(lesson.id));
    startRef.current = Date.now();
  }, [existingCompletedIds, lesson.id]);
  const questions = useMemo(() => {
    if (!lesson.quizTopicKey) return [];
    const quiz = getOmniKunoQuiz(lesson.quizTopicKey);
    return quiz?.questions ?? [];
  }, [lesson.quizTopicKey]);

  const handleSubmit = async () => {
    if (busy || !questions.length || completed) return;
    setBusy(true);
    try {
      const total = questions.length;
      const correct = questions.filter((q) => selection[q.id] === q.correctAnswer).length;
      const pct = Math.round((correct / Math.max(1, total)) * 100);
      setScore(pct);
      const merged = Array.from(new Set([...existingCompletedIds, lesson.id]));
      const timeSpentSec = Math.max(30, Math.round((Date.now() - startRef.current) / 1000));
      const updatedPerformance = updatePerformanceSnapshot(performanceSnapshot, { score: pct, timeSpentSec });
      const xpReward = getQuizXp(pct);
      const wasFirstCompletion = !existingCompletedIds.includes(lesson.id);
      await recordKunoLessonProgress({
        moduleId,
        completedIds: merged,
        ownerId,
        performance: updatedPerformance,
        xpDelta: wasFirstCompletion ? xpReward : 0,
        wasFirstCompletion,
        difficulty: difficultyKey,
      });
      setCompleted(true);
      applyKunoXp(areaKey, xpReward);
      onCompleted?.(lesson.id, { score: pct, timeSpentSec, updatedPerformance });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#7B6B60]">Quiz</p>
        <h3 className="text-xl font-bold text-[#2C2C2C]">{lesson.title}</h3>
        <p className="text-sm text-[#7B6B60]">Răspunde la întrebările de mai jos.</p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#7B6B60]">
          <span className={`inline-flex items-center rounded-full px-3 py-0.5 uppercase tracking-[0.2em] ${chipClass}`}>
            {chipText}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {questions.map((question) => (
          <div key={question.id} className="rounded-xl border border-[#F0E8E0] bg-[#FFFBF7] p-3">
            <p className="font-semibold text-[#2C2C2C]">{question.text}</p>
            <div className="mt-2 space-y-1 text-sm text-[#4D3F36]">
              {question.options.map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={selection[question.id] === option.value}
                    onChange={() => setSelection((prev) => ({ ...prev, [question.id]: option.value }))}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      {score != null ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#1F7A43]">Ai obținut {score}%</p>
          <p className="text-[12px] text-[#4D3F36]">{String(t(`omnikuno.quizSummary.${difficultyKey}Completed`))}</p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={busy || !questions.length || completed}
        className="inline-flex items-center rounded-full border border-[#C07963] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white disabled:cursor-not-allowed disabled:border-[#E4DAD1] disabled:text-[#B99484]"
      >
        {completed ? "Quiz complet" : busy ? "Se evaluează..." : "Trimite răspunsurile"}
      </button>
    </div>
  );
}
