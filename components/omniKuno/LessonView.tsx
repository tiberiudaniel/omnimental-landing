"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { OmniKunoLesson } from "@/config/omniKunoLessons";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { getLessonXp, applyKunoXp } from "@/lib/omniKunoXp";
import { recordKunoLessonProgress } from "@/lib/progressFacts";
import { updatePerformanceSnapshot, type KunoPerformanceSnapshot } from "@/lib/omniKunoAdaptive";
import { maybeUnlockCollectiblesForLesson, type UnlockedCollectible } from "@/lib/collectibles";
import { useI18n } from "@/components/I18nProvider";
import { asDifficulty, DIFFICULTY_STYLES } from "./difficulty";
import {
  OMNI_KUNO_LESSON_CONTENT,
  type OmniKunoLessonScreen,
} from "@/config/omniKunoLessonContent";
import { CALM_PROTOCOL_STEPS } from "@/config/omniKunoConstants";
import { LessonJournalDrawer } from "./LessonJournalDrawer";
import { recordReplayTimeTracking } from "@/lib/replay/replayTelemetry";
import { useSearchParams } from "next/navigation";

export type LessonViewProps = {
  areaKey: OmniKunoModuleId;
  moduleId: string;
  lesson: OmniKunoLesson;
  existingCompletedIds: readonly string[];
  ownerId?: string | null;
  performanceSnapshot: KunoPerformanceSnapshot;
  onCompleted?: (
    lessonId: string,
    meta?: {
      timeSpentSec: number;
      updatedPerformance: KunoPerformanceSnapshot;
      note?: string;
      unlockedCollectibles?: UnlockedCollectible[];
    },
  ) => void;
  onStepChange?: (current: number, total: number) => void;
  showHeader?: boolean;
  isReplayMode?: boolean;
};

export default function LessonView({
  areaKey,
  moduleId,
  lesson,
  existingCompletedIds,
  ownerId,
  performanceSnapshot,
  onCompleted,
  onStepChange,
  showHeader = true,
  isReplayMode = false,
}: LessonViewProps) {
  const searchParams = useSearchParams();
  const replayFromUrl = searchParams?.get("replay") === "1";
  const replayActive = Boolean(isReplayMode ?? replayFromUrl);
  const { t, lang } = useI18n();
  const difficultyKey = asDifficulty(lesson.difficulty);
  const chipText = String(t(`omnikuno.difficulty.${difficultyKey}Chip`));
  const chipClass = DIFFICULTY_STYLES[difficultyKey].chip;
  const durationText = lesson.durationMin ? `~${lesson.durationMin} min` : null;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(replayActive ? false : existingCompletedIds.includes(lesson.id));
  const [reflection, setReflection] = useState("");
  const [isRelaxedMode, setIsRelaxedMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("e2e") === "1" || url.searchParams.get("demo") === "1") {
        setIsRelaxedMode(true);
      }
    } catch {
      // ignore
    }
  }, []);
  const reflectionMinChars = isRelaxedMode ? 0 : 3;
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [quizAnswerIndex, setQuizAnswerIndex] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null);
  const [journalOpen, setJournalOpen] = useState(false);
  const startRef = useRef(Date.now());
  const responseTimesRef = useRef<number[]>([]);
  const stepStartRef = useRef(Date.now());
  const idleMsRef = useRef(0);
  const idleStartRef = useRef<number | null>(null);
  const answerLengthsRef = useRef<number[]>([]);
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
  const requiresReflectionInput = currentScreen.kind === "reflection" && !isRelaxedMode;
  const needsQuizAnswer = currentScreen.kind === "quiz" && quizAnswerIndex === null;
  const centerLabel = useMemo(() => {
    if (!lesson.center) return null;
    const map =
      lang === "ro"
        ? { mind: "Minte", body: "Corp", heart: "Inimă", combined: "Integrat" }
        : { mind: "Mind", body: "Body", heart: "Heart", combined: "Combined" };
    return map[lesson.center];
  }, [lang, lesson.center]);

  const reflectionStorageKey = useMemo(() => `omnikuno_reflection_${lesson.id}`, [lesson.id]);
  const progressStorageKey = useMemo(() => `omnikuno_progress_${lesson.id}`, [lesson.id]);
  const reflectionHelperId = `${lesson.id}-reflection-hint`;
  useEffect(() => {
    if (replayActive) {
      console.log("Replay mode active (Phase 1)");
    }
  }, [replayActive]);
  const registerStepDuration = () => {
    const now = Date.now();
    const delta = Math.max(0, now - stepStartRef.current);
    responseTimesRef.current.push(delta);
    stepStartRef.current = now;
  };

  useEffect(() => {
    const alreadyDone = existingCompletedIds.includes(lesson.id);
    setDone(replayActive ? false : alreadyDone);
    startRef.current = Date.now();
    responseTimesRef.current = [];
    stepStartRef.current = Date.now();
    idleMsRef.current = 0;
    idleStartRef.current = null;
    answerLengthsRef.current = [];
    let restoredIndex = 0;
    if (!alreadyDone && !replayActive && typeof window !== "undefined") {
      const storedIdx = Number(window.localStorage.getItem(progressStorageKey));
      if (Number.isFinite(storedIdx) && storedIdx >= 0 && storedIdx < totalScreens) {
        restoredIndex = storedIdx;
      }
    } else if (alreadyDone && !replayActive && typeof window !== "undefined") {
      window.localStorage.removeItem(progressStorageKey);
    }
    setCurrentScreenIndex(restoredIndex);
    setQuizAnswerIndex(null);
    setQuizResult(null);
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(reflectionStorageKey);
      setReflection(stored ?? "");
    } else {
      setReflection("");
    }
  }, [existingCompletedIds, lesson.id, progressStorageKey, reflectionStorageKey, replayActive, totalScreens]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (replayActive) return;
    if (reflection.trim()) {
      window.localStorage.setItem(reflectionStorageKey, reflection);
    }
  }, [reflection, reflectionStorageKey, replayActive]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (replayActive) return;
    window.localStorage.setItem(progressStorageKey, String(currentScreenIndex));
  }, [currentScreenIndex, progressStorageKey, replayActive]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      if (document.hidden) {
        idleStartRef.current = Date.now();
      } else if (idleStartRef.current) {
        idleMsRef.current += Date.now() - idleStartRef.current;
        idleStartRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (idleStartRef.current) {
        idleMsRef.current += Date.now() - idleStartRef.current;
        idleStartRef.current = null;
      }
    };
  }, []);

  const handleComplete = async () => {
    if (busy || done) return;
    if (requiresReflectionInput && reflection.trim().length < reflectionMinChars) return;
    setBusy(true);
    const merged = Array.from(new Set([...existingCompletedIds, lesson.id]));
    registerStepDuration();
    if (idleStartRef.current) {
      idleMsRef.current += Date.now() - idleStartRef.current;
      idleStartRef.current = null;
    }
    const endTimestamp = Date.now();
    const timeSpentSec = Math.max(30, Math.round((endTimestamp - startRef.current) / 1000));
    const updatedPerformance = updatePerformanceSnapshot(performanceSnapshot, { timeSpentSec });
    const wasFirstCompletion = !existingCompletedIds.includes(lesson.id);
    let unlocked: UnlockedCollectible[] = [];
    const shouldRecordProgress = !replayActive;
    try {
      if (shouldRecordProgress) {
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
        if (ownerId) {
          try {
            unlocked = await maybeUnlockCollectiblesForLesson(ownerId, lesson.id);
          } catch (error) {
            console.warn("unlock collectibles failed", error);
          }
        }
      }
    } catch (error) {
      if (shouldRecordProgress) {
        console.warn("recordKunoLessonProgress failed", error);
      }
    } finally {
      if (shouldRecordProgress) {
        setDone(true);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(reflectionStorageKey);
          window.localStorage.removeItem(progressStorageKey);
        }
        onCompleted?.(lesson.id, {
          timeSpentSec,
          updatedPerformance,
          note: reflection.trim(),
          unlockedCollectibles: unlocked,
        });
      } else {
        setDone(false);
      }
      const idleSec = Math.max(0, Math.round(idleMsRef.current / 1000));
      if (reflection.trim().length) {
        answerLengthsRef.current.push(reflection.trim().length);
      }
      void recordReplayTimeTracking(
        {
          activityType: "lesson",
          lessonId: lesson.id,
          moduleId,
          startTimestamp: startRef.current,
          endTimestamp,
          timeSpentSec,
          idleSec,
          responseTimes: [...responseTimesRef.current],
          answerLengths: [...answerLengthsRef.current],
        },
        ownerId,
      );
      setBusy(false);
    }
  };

  const handleNextScreen = () => {
    if (isLastScreen) return;
    registerStepDuration();
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
      ? isRelaxedMode || quizAnswerIndex !== null
      : currentScreen.kind === "reflection"
        ? isRelaxedMode || reflection.trim().length >= reflectionMinChars
        : true;
  const journalButton = (
    <button
      type="button"
      onClick={() => setJournalOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)]"
      data-testid="lesson-journal-button"
    >
      <span aria-hidden="true">📝</span>
      {lang === "ro" ? "Jurnal" : "Journal"}
    </button>
  );

  useEffect(() => {
    onStepChange?.(currentScreenIndex + 1, totalScreens);
  }, [currentScreenIndex, totalScreens, onStepChange]);

  return (
    <>
      <div className="space-y-4" data-testid="lesson-view">
        {replayActive ? (
          <div className="rounded-2xl border border-[var(--omni-energy)] bg-[color-mix(in srgb,var(--omni-energy)_10%,white)] px-4 py-2 text-sm text-[var(--omni-ink)] shadow-sm" data-testid="lesson-replay-banner">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">Replay mode (Phase 1)</p>
            <p className="text-[13px] text-[var(--omni-ink)]">Foundation test — manual replay entry point</p>
          </div>
        ) : null}
        {showHeader ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--omni-muted)]">{lang === "ro" ? "Lecție" : "Lesson"}</p>
                <h3 className="text-xl font-bold leading-tight text-[var(--omni-ink)]">{lesson.title}</h3>
              </div>
              <div className="flex flex-col items-end gap-2 text-right text-[11px] text-[var(--omni-muted)] sm:flex-row sm:items-center sm:justify-end sm:gap-3">
                <div>
                  <p className="font-semibold text-[var(--omni-ink)]">+{xpReward} XP</p>
                  <p>{lang === "ro" ? "Recompensă estimată" : "Projected reward"}</p>
                </div>
                {journalButton}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--omni-muted)]">
              <span className={`inline-flex items-center rounded-full px-3 py-0.5 uppercase tracking-[0.2em] ${chipClass}`}>
                {chipText}
              </span>
              {durationText ? <span>{durationText}</span> : null}
              {centerLabel ? (
                <span className="rounded-full bg-[var(--omni-energy-tint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--omni-energy)]">{centerLabel}</span>
              ) : null}
              <span className="rounded-full bg-[var(--omni-energy-tint)] px-2.5 py-0.5 font-semibold text-[var(--omni-energy)]">
                {done ? (lang === "ro" ? "Finalizată" : "Completed") : lang === "ro" ? "Activă" : "Active"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {screens.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-2 w-2 rounded-full ${idx === currentScreenIndex ? "bg-[var(--omni-energy)]" : "bg-[#E4DAD1]"}`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-[var(--omni-muted)]" id={reflectionHelperId}>
                {lang === "ro" ? `Pas ${currentScreenIndex + 1} din ${totalScreens}` : `Step ${currentScreenIndex + 1} of ${totalScreens}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">{journalButton}</div>
        )}
        <div className="rounded-2xl border border-[#F0E8E0] bg-[var(--omni-bg-paper)] p-4 text-[#4D3F36]" data-testid={`lesson-screen-${currentScreenIndex + 1}`}>
          {renderScreenContent(currentScreen, {
            areaKey,
            quizAnswerIndex,
            quizResult,
            reflection,
            lang,
            onQuizSelect: handleQuizSelect,
            onReflectionChange: (value) => setReflection(value),
            reflectionMinChars,
            reflectionHelperId,
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentScreenIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentScreenIndex === 0}
            className="inline-flex items-center rounded-full border border-[var(--omni-border-soft)] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-muted)] transition hover:border-[var(--omni-energy)] hover:text-[var(--omni-energy)] disabled:cursor-not-allowed disabled:border-[#F3E9DF] disabled:text-[#CAB7A8]"
          >
            {lang === "ro" ? "Înapoi" : "Back"}
          </button>
          {!isLastScreen ? (
            <button
              type="button"
              onClick={handleNextScreen}
              disabled={!canContinue}
              data-testid="lesson-next"
              className="inline-flex items-center rounded-full border border-[var(--omni-energy)] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--omni-border-soft)] disabled:text-[#B99484]"
            >
              {lang === "ro" ? "Continuă" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={busy || done || (requiresReflectionInput && reflection.trim().length < reflectionMinChars)}
              data-testid="lesson-complete"
              className="inline-flex items-center rounded-full border border-[var(--omni-energy)] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--omni-border-soft)] disabled:text-[#B99484]"
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
          {!canContinue && requiresReflectionInput ? (
            <p className="text-[11px] text-[#B03C2F]">
              {lang === "ro" ? "Scrie încă 1–2 propoziții ca să poți continua." : "Add 1–2 short sentences to continue."}
            </p>
          ) : null}
          {!canContinue && needsQuizAnswer ? (
            <p className="text-[11px] text-[#B03C2F]">
              {lang === "ro" ? "Alege un răspuns ca să poți continua." : "Select an answer to continue."}
            </p>
          ) : null}
          {!canContinue && currentScreen.kind === "quiz" && quizAnswerIndex === null ? (
            <p className="text-[11px] text-[#B03C2F]">
              {lang === "ro" ? "Alege un răspuns ca să continui." : "Select an answer to continue."}
            </p>
          ) : null}
          {done ? (
            <div className="rounded-xl border border-[var(--omni-success)] bg-[var(--omni-success-soft)] px-4 py-2 text-sm text-[var(--omni-ink-soft)]">
              {lang === "ro"
                ? `Excelent! Ai câștigat ${xpReward} XP și lecția este salvată în progres. Continuă cu următoarea misiune.`
                : `Great! You earned ${xpReward} XP and the lesson is saved. Continue with the next mission.`}
            </div>
          ) : null}
        </div>
      </div>
      <LessonJournalDrawer
        open={journalOpen}
        onClose={() => setJournalOpen(false)}
        userId={ownerId}
        moduleId={moduleId}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
      />
    </>
  );
}

type ScreenRendererProps = {
  areaKey: LessonViewProps["areaKey"];
  quizAnswerIndex: number | null;
  quizResult: "correct" | "incorrect" | null;
  reflection: string;
  lang: "ro" | "en";
  onQuizSelect: (index: number) => void;
  onReflectionChange: (value: string) => void;
  reflectionMinChars: number;
  reflectionHelperId: string;
};

function renderScreenContent(
  screen: OmniKunoLessonScreen,
  { areaKey, quizAnswerIndex, quizResult, reflection, lang, onQuizSelect, onReflectionChange, reflectionMinChars, reflectionHelperId }: ScreenRendererProps,
) {
  if (screen.kind === "content") {
    return (
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{screen.title}</p>
        <p className="text-sm leading-relaxed text-[var(--omni-ink)]">{screen.body}</p>
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
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{screen.title}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--omni-ink)]">
          {screen.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {screen.helper ? <p className="text-[12px] text-[var(--omni-muted)]">{screen.helper}</p> : null}
      </div>
    );
  }
  if (screen.kind === "quiz") {
    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{screen.title}</p>
        <p className="text-sm text-[var(--omni-ink)]">{screen.question}</p>
        <div className="space-y-2">
          {screen.options.map((option, index) => {
            const selected = quizAnswerIndex === index;
            const isCorrect = index === screen.correctIndex;
            const showState = quizAnswerIndex !== null;
            const baseClasses =
              "w-full rounded-2xl border px-4 py-2 text-left text-sm transition focus:outline-none";
            let stateClasses = "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]";
            if (showState && selected) {
              stateClasses = isCorrect
                ? "border-[#1F7A43] bg-[#ECF8F0] text-[var(--omni-ink-soft)]"
                : "border-[#E54C38] bg-[#FBEAE6] text-[#5C2A1D]";
            } else if (showState && isCorrect) {
              stateClasses = "border-dashed border-[#1F7A43] text-[var(--omni-ink-soft)]";
            }
            return (
              <button
                key={option}
                type="button"
                className={`${baseClasses} ${stateClasses}`}
                onClick={() => onQuizSelect(index)}
                data-testid="kuno-quiz-option"
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
                ? "border border-[var(--omni-success)] bg-[var(--omni-success-soft)] text-[var(--omni-ink-soft)]"
                : "border border-[#F5C6C0] bg-[#FFF7F5] text-[#5C2A1D]"
            }`}
          >
            {screen.explanation
              ? screen.explanation
              : quizResult === "correct"
                ? lang === "ro"
                  ? "Bine ai surprins ideea-cheie: răspunsul corect sprijină ceea ce tocmai ai exersat în lecție."
                  : "Great—this answer reflects the key point of the lesson."
                : lang === "ro"
                  ? "Observă ce detaliu ți-a scăpat și recitește explicația din pasul anterior pentru claritate."
                  : "Review the previous insight and notice what detail you missed."}
          </div>
        ) : null}
      </div>
    );
  }
  if (screen.kind === "reflection") {
    const remaining = Math.max(0, reflectionMinChars - reflection.trim().length);
    return (
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{screen.title}</p>
        <p className="text-sm text-[#4D3F36]">{screen.prompt}</p>
        <p className="text-[11px] text-[var(--omni-muted)]">
          {lang === "ro" ? "Respiră de 3 ori înainte să scrii. Răspunsul rămâne doar în aplicație." : "Take three slow breaths. Your note stays private inside the app."}
        </p>
        <textarea
          value={reflection}
          onChange={(e) => onReflectionChange(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-3 py-2 text-sm text-[var(--omni-ink)] focus:border-[var(--omni-energy)] focus:outline-none"
          aria-describedby={reflectionHelperId}
          placeholder={
            lang === "ro"
              ? `Scrie cel puțin ${reflectionMinChars} caractere.`
              : `Write at least ${reflectionMinChars} characters.`
          }
        />
        <p className="text-[11px] text-[var(--omni-muted)]">
          {remaining > 0
            ? lang === "ro"
              ? "Scrie încă 1–2 propoziții ca să poți continua."
              : "Add 1–2 short sentences to continue."
            : lang === "ro"
              ? "Perfect, poți continua."
              : "Great, you can continue."}
        </p>
      </div>
    );
  }
  if (screen.kind === "arcIntro") {
    return (
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{screen.title}</p>
        <p className="text-sm leading-relaxed text-[var(--omni-ink)]">{screen.body}</p>
      </div>
    );
  }
  if (screen.kind === "protocol") {
    const customSteps = Array.isArray(screen.steps) && screen.steps.length ? screen.steps : null;
    const steps = customSteps ?? (areaKey === "emotional_balance" ? CALM_PROTOCOL_STEPS : null);
    return (
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{screen.title}</p>
        {screen.body ? <p className="text-sm text-[var(--omni-ink)]">{screen.body}</p> : null}
        {steps ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#4D3F36]">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  return null;
}
