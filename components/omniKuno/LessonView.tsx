"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OmniKunoLesson } from "@/config/omniKunoLessons";
import { getLessonXp, applyKunoXp } from "@/lib/omniKunoXp";
import { recordKunoLessonProgress } from "@/lib/progressFacts";
import { updatePerformanceSnapshot, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { useI18n } from "@/components/I18nProvider";
import { asDifficulty, DIFFICULTY_STYLES } from "./difficulty";
import {
  OMNI_KUNO_LESSON_CONTENT,
  type OmniKunoLessonScreen,
} from "@/config/omniKunoLessonContent";

export type LessonViewProps = {
  areaKey: "calm" | "energy" | "relations" | "performance" | "sense";
  moduleId: string;
  lesson: OmniKunoLesson;
  existingCompletedIds: readonly string[];
  ownerId?: string | null;
  performanceSnapshot: KunoPerformanceSnapshot;
  onCompleted?: (
    lessonId: string,
    meta?: { timeSpentSec: number; updatedPerformance: KunoPerformanceSnapshot; note?: string },
  ) => void;
};

export default function LessonView({
  areaKey,
  moduleId,
  lesson,
  existingCompletedIds,
  ownerId,
  performanceSnapshot,
  onCompleted,
}: LessonViewProps) {
  const { t, lang } = useI18n();
  const difficultyKey = asDifficulty(lesson.difficulty);
  const chipText = String(t(`omnikuno.difficulty.${difficultyKey}Chip`));
  const chipClass = DIFFICULTY_STYLES[difficultyKey].chip;
  const durationText = lesson.durationMin ? `~${lesson.durationMin} min` : null;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(existingCompletedIds.includes(lesson.id));
  const [reflection, setReflection] = useState("");
  const reflectionMinChars = 5;
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [quizAnswerIndex, setQuizAnswerIndex] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null);
  const startRef = useRef(Date.now());
  const xpReward = useMemo(() => getLessonXp(), []);
  const lessonContent = OMNI_KUNO_LESSON_CONTENT[lesson.id];
  const fallbackScreens: OmniKunoLessonScreen[] = useMemo(
    () => [
      {
        kind: "content",
        title: lesson.title,
        body: lesson.summary || (lang === "ro" ? "Nu există încă detalii pentru această lecție." : "Lesson details will arrive soon."),
      },
      {
        kind: "reflection",
        title: lang === "ro" ? "Notează ce iei cu tine" : "Capture your takeaway",
        prompt:
          lang === "ro"
            ? "Scrie cum vei aplica ideea principală în următoarea conversație."
            : "Write how you will apply the main idea in your next conversation.",
      },
    ],
    [lang, lesson.summary, lesson.title],
  );
  const screens = lessonContent?.screens?.length ? lessonContent.screens : fallbackScreens;
  const totalScreens = screens.length;
  const currentScreen = screens[Math.min(currentScreenIndex, totalScreens - 1)];
  const isLastScreen = currentScreenIndex === totalScreens - 1;
  const isReflectionScreen = currentScreen.kind === "reflection";

  const reflectionStorageKey = useMemo(() => `omnikuno_reflection_${lesson.id}`, [lesson.id]);

  useEffect(() => {
    setDone(existingCompletedIds.includes(lesson.id));
    startRef.current = Date.now();
    setCurrentScreenIndex(0);
    setQuizAnswerIndex(null);
    setQuizResult(null);
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(reflectionStorageKey);
      setReflection(stored ?? "");
    } else {
      setReflection("");
    }
  }, [existingCompletedIds, lesson.id, reflectionStorageKey, totalScreens]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reflection.trim()) {
      window.localStorage.setItem(reflectionStorageKey, reflection);
    }
  }, [reflection, reflectionStorageKey]);

  const handleComplete = async () => {
    if (busy || done || (isReflectionScreen && reflection.trim().length < reflectionMinChars)) return;
    setBusy(true);
    try {
      const merged = Array.from(new Set([...existingCompletedIds, lesson.id]));
      const timeSpentSec = Math.max(30, Math.round((Date.now() - startRef.current) / 1000));
      const updatedPerformance = updatePerformanceSnapshot(performanceSnapshot, { timeSpentSec });
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
      applyKunoXp(areaKey, xpReward);
      setDone(true);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(reflectionStorageKey);
      }
      onCompleted?.(lesson.id, { timeSpentSec, updatedPerformance, note: reflection.trim() });
    } finally {
      setBusy(false);
    }
  };

  const handleNextScreen = () => {
    if (isLastScreen) return;
    setCurrentScreenIndex((prev) => Math.min(prev + 1, totalScreens - 1));
    setQuizAnswerIndex(null);
    setQuizResult(null);
  };

  const handleQuizSelect = (index: number) => {
    if (currentScreen.kind !== "quiz") return;
    setQuizAnswerIndex(index);
    setQuizResult(index === currentScreen.correctIndex ? "correct" : "incorrect");
  };

  const canContinue =
    currentScreen.kind === "quiz"
      ? quizAnswerIndex !== null
      : currentScreen.kind === "reflection"
        ? reflection.trim().length >= reflectionMinChars
        : true;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#B08A78]">{lang === "ro" ? "Lecție" : "Lesson"}</p>
            <h3 className="text-xl font-bold leading-tight text-[#2C2C2C]">{lesson.title}</h3>
          </div>
          <div className="text-right text-[11px] text-[#7B6B60]">
            <p className="font-semibold text-[#2C2C2C]">+{xpReward} XP</p>
            <p>{lang === "ro" ? "Recompensă estimată" : "Projected reward"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#7B6B60]">
          <span className={`inline-flex items-center rounded-full px-3 py-0.5 uppercase tracking-[0.2em] ${chipClass}`}>
            {chipText}
          </span>
          {durationText ? <span>{durationText}</span> : null}
          <span className="rounded-full bg-[#FFF3EC] px-2.5 py-0.5 font-semibold text-[#C07963]">
            {done ? (lang === "ro" ? "Finalizată" : "Completed") : lang === "ro" ? "Activă" : "Active"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {screens.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full ${
                  idx === currentScreenIndex ? "bg-[#C07963]" : "bg-[#E4DAD1]"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#7B6B60]">
            {currentScreenIndex + 1}/{totalScreens}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-[#F0E8E0] bg-[#FFFBF7] p-4 text-[#4D3F36]">
        {renderScreenContent(currentScreen, {
          quizAnswerIndex,
          quizResult,
          reflection,
          lang,
          onQuizSelect: handleQuizSelect,
          onReflectionChange: (value) => setReflection(value),
          reflectionMinChars,
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentScreenIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentScreenIndex === 0}
          className="inline-flex items-center rounded-full border border-[#E4DAD1] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#7B6B60] transition hover:border-[#C07963] hover:text-[#C07963] disabled:cursor-not-allowed disabled:border-[#F3E9DF] disabled:text-[#CAB7A8]"
        >
          {lang === "ro" ? "Înapoi" : "Back"}
        </button>
        {!isLastScreen ? (
          <button
            type="button"
            onClick={handleNextScreen}
            disabled={!canContinue}
            className="inline-flex items-center rounded-full border border-[#C07963] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white disabled:cursor-not-allowed disabled:border-[#E4DAD1] disabled:text-[#B99484]"
          >
            {lang === "ro" ? "Continuă" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            disabled={busy || done || !isReflectionScreen || reflection.trim().length < reflectionMinChars}
            className="inline-flex items-center rounded-full border border-[#C07963] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white disabled:cursor-not-allowed disabled:border-[#E4DAD1] disabled:text-[#B99484]"
          >
            {done
              ? lang === "ro"
                ? "Lecție completă"
                : "Lesson saved"
              : busy
                ? lang === "ro"
                  ? "Se salvează..."
                  : "Saving..."
                : lang === "ro"
                  ? "Marchează lecția ca finalizată"
                  : "Mark lesson as done"}
          </button>
        )}
        {done ? (
          <div className="rounded-xl border border-[#CBE8D7] bg-[#F3FFF8] px-4 py-2 text-sm text-[#1F3C2F]">
            {lang === "ro"
              ? `Excelent! Ai câștigat ${xpReward} XP și lecția este salvată în progres. Continuă cu următoarea misiune.`
              : `Great! You earned ${xpReward} XP and the lesson is saved. Continue with the next mission.`}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ScreenRendererProps = {
  quizAnswerIndex: number | null;
  quizResult: "correct" | "incorrect" | null;
  reflection: string;
  lang: "ro" | "en";
  onQuizSelect: (index: number) => void;
  onReflectionChange: (value: string) => void;
  reflectionMinChars: number;
};

function renderScreenContent(
  screen: OmniKunoLessonScreen,
  { quizAnswerIndex, quizResult, reflection, lang, onQuizSelect, onReflectionChange, reflectionMinChars }: ScreenRendererProps,
) {
  if (screen.kind === "content") {
    return (
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">{screen.title}</p>
        <p className="text-sm leading-relaxed text-[#2C2C2C]">{screen.body}</p>
        {screen.bullets ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#4D3F36]">
            {screen.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (screen.kind === "checkpoint") {
    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">{screen.title}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[#2C2C2C]">
          {screen.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {screen.helper ? <p className="text-[12px] text-[#7B6B60]">{screen.helper}</p> : null}
      </div>
    );
  }
  if (screen.kind === "quiz") {
    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">{screen.title}</p>
        <p className="text-sm text-[#2C2C2C]">{screen.question}</p>
        <div className="space-y-2">
          {screen.options.map((option, index) => {
            const selected = quizAnswerIndex === index;
            const isCorrect = index === screen.correctIndex;
            const showState = quizAnswerIndex !== null;
            const baseClasses =
              "w-full rounded-2xl border px-4 py-2 text-left text-sm transition focus:outline-none";
            let stateClasses = "border-[#E4DAD1] text-[#2C2C2C] hover:border-[#C07963]";
            if (showState && selected) {
              stateClasses = isCorrect
                ? "border-[#1F7A43] bg-[#ECF8F0] text-[#1F3C2F]"
                : "border-[#E54C38] bg-[#FBEAE6] text-[#5C2A1D]";
            } else if (showState && isCorrect) {
              stateClasses = "border-dashed border-[#1F7A43] text-[#1F3C2F]";
            }
            return (
              <button
                key={option}
                type="button"
                className={`${baseClasses} ${stateClasses}`}
                onClick={() => onQuizSelect(index)}
              >
                <span className="inline-flex items-center gap-2">
                  {showState && selected ? (
                    isCorrect ? (
                      <span aria-hidden="true" className="text-sm">
                        ✓
                      </span>
                    ) : (
                      <span aria-hidden="true" className="text-sm">
                        ✕
                      </span>
                    )
                  ) : null}
                  {option}
                </span>
              </button>
            );
          })}
        </div>
        {quizResult ? (
          <div
            className={`rounded-xl px-4 py-2 text-sm ${
              quizResult === "correct"
                ? "border border-[#CBE8D7] bg-[#F3FFF8] text-[#1F3C2F]"
                : "border border-[#F5C6C0] bg-[#FFF7F5] text-[#5C2A1D]"
            }`}
          >
            {screen.explanation}
          </div>
        ) : null}
      </div>
    );
  }
  if (screen.kind === "reflection") {
    const remaining = Math.max(0, reflectionMinChars - reflection.trim().length);
    return (
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">{screen.title}</p>
        <p className="text-sm text-[#4D3F36]">{screen.prompt}</p>
        <p className="text-[11px] text-[#A08F82]">
          {lang === "ro" ? "Respiră de 3 ori înainte să scrii. Răspunsul rămâne doar în aplicație." : "Take three slow breaths. Your note stays private inside the app."}
        </p>
        <textarea
          value={reflection}
          onChange={(e) => onReflectionChange(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-[#E4DAD1] bg-white px-3 py-2 text-sm text-[#2C2C2C] focus:border-[#C07963] focus:outline-none"
          placeholder={
            lang === "ro"
              ? `Scrie cel puțin ${reflectionMinChars} caractere.`
              : `Write at least ${reflectionMinChars} characters.`
          }
        />
        <p className="text-[11px] text-[#7B6B60]">
          {remaining > 0
            ? lang === "ro"
              ? `Mai ai nevoie de ${remaining} caractere.`
              : `Need ${remaining} more characters.`
            : lang === "ro"
              ? "Perfect, poți salva lecția."
              : "Great, you can mark the lesson complete."}
        </p>
      </div>
    );
  }
  return null;
}
