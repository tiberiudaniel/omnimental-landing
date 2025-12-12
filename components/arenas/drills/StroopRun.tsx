"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ArenaModuleV1, ArenaLang } from "@/config/arenaModules/v1/types";
import { ArenaHistorySparkline } from "@/components/arenas/ArenaHistorySparkline";
import {
  getArenaRuns,
  saveArenaRun,
  toDayKeyLocal,
  type ArenaRunRecord,
} from "@/lib/arenaRunStore";

const COLOR_KEYS = ["red", "green", "blue", "yellow"] as const;

type ColorKey = (typeof COLOR_KEYS)[number];

const COLOR_META: Record<
  ColorKey,
  {
    hex: string;
    label: { ro: string; en: string };
  }
> = {
  red: { hex: "#ef4444", label: { ro: "Roșu", en: "Red" } },
  green: { hex: "#22c55e", label: { ro: "Verde", en: "Green" } },
  blue: { hex: "#3b82f6", label: { ro: "Albastru", en: "Blue" } },
  yellow: { hex: "#eab308", label: { ro: "Galben", en: "Yellow" } },
};

interface StroopPreset {
  totalMs: number;
  targetTrials: number;
  incongruentRatio: number;
  timeoutMs: number;
}

const STROOP_PRESETS: Record<"30s" | "90s" | "3m", StroopPreset> = {
  "30s": { totalMs: 30_000, targetTrials: 18, incongruentRatio: 0.7, timeoutMs: 2000 },
  "90s": { totalMs: 90_000, targetTrials: 50, incongruentRatio: 0.75, timeoutMs: 1600 },
  "3m": { totalMs: 180_000, targetTrials: 100, incongruentRatio: 0.8, timeoutMs: 1400 },
};

interface Stimulus {
  word: ColorKey;
  inkColor: ColorKey;
  congruent: boolean;
}

interface TrialResult {
  congruent: boolean;
  correct: boolean;
  timeout: boolean;
  rtMs?: number;
}

interface SummaryStats {
  totalTrials: number;
  correctCount: number;
  incorrectCount: number;
  timeoutCount: number;
  accuracy: number;
  meanRTms: number | null;
  medianRTms: number | null;
  interferenceCost: number | null;
  fatigueSlope: number | null;
  score: number;
  interpretation: string;
}

interface StroopRunProps {
  module: ArenaModuleV1;
  lang: ArenaLang;
  duration: "30s" | "90s" | "3m";
}

const METRIC_INFO: Record<
  "accuracy" | "meanRT" | "interference" | "timeouts",
  { label: string; description: string }
> = {
  accuracy: {
    label: "Acuratețe",
    description: "Procentul de răspunsuri corecte din totalul trialurilor.",
  },
  meanRT: {
    label: "Mean RT",
    description: "Timpul mediu de reacție (în milisecunde) pentru răspunsurile înregistrate.",
  },
  interference: {
    label: "Interference cost",
    description: "Diferența medie dintre timpul pe trialuri incongruente și cele congruente (mai mare = conflictul te încetinește).",
  },
  timeouts: {
    label: "Timeouts",
    description: "De câte ori nu ai răspuns în fereastra limită prestabilită.",
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateTrials(preset: StroopPreset): Stimulus[] {
  const total = preset.targetTrials;
  const incongruentCount = Math.round(total * preset.incongruentRatio);
  const congruentCount = total - incongruentCount;
  const flags = shuffle([
    ...Array(incongruentCount).fill(true),
    ...Array(congruentCount).fill(false),
  ]);
  return flags.map((isIncongruent) => {
    const inkColor = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
    if (!isIncongruent) {
      return { word: inkColor, inkColor, congruent: true };
    }
    const otherColors = COLOR_KEYS.filter((color) => color !== inkColor);
    const word = otherColors[Math.floor(Math.random() * otherColors.length)];
    return { word, inkColor, congruent: false };
  });
}

function computeSummary(results: TrialResult[]): SummaryStats {
  const totalTrials = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const timeoutCount = results.filter((r) => r.timeout).length;
  const incorrectCount = totalTrials - correctCount - timeoutCount;
  const accuracy = totalTrials ? correctCount / totalTrials : 0;

  const rtValues = results.filter((r) => !r.timeout && typeof r.rtMs === "number").map((r) => r.rtMs!) ?? [];
  const meanRTms = rtValues.length ? rtValues.reduce((sum, value) => sum + value, 0) / rtValues.length : null;
  const sortedRT = [...rtValues].sort((a, b) => a - b);
  const medianRTms = sortedRT.length
    ? sortedRT.length % 2 === 1
      ? sortedRT[Math.floor(sortedRT.length / 2)]
      : (sortedRT[sortedRT.length / 2 - 1] + sortedRT[sortedRT.length / 2]) / 2
    : null;

  const mean = (arr: number[]) => (arr.length ? arr.reduce((sum, value) => sum + value, 0) / arr.length : null);
  const congruentRT = results.filter((r) => r.congruent && r.correct && r.rtMs).map((r) => r.rtMs!) ?? [];
  const incongruentRT = results.filter((r) => !r.congruent && r.correct && r.rtMs).map((r) => r.rtMs!) ?? [];
  const interferenceCost =
    congruentRT.length && incongruentRT.length ? mean(incongruentRT)! - mean(congruentRT)! : null;

  const nonTimeoutResults = results.filter((r) => !r.timeout && typeof r.rtMs === "number");
  let fatigueSlope: number | null = null;
  if (nonTimeoutResults.length >= 6) {
    const segmentSize = Math.floor(nonTimeoutResults.length / 3);
    if (segmentSize > 0) {
      const firstMean = mean(nonTimeoutResults.slice(0, segmentSize).map((r) => r.rtMs!));
      const lastMean = mean(nonTimeoutResults.slice(-segmentSize).map((r) => r.rtMs!));
      if (firstMean !== null && lastMean !== null) {
        fatigueSlope = lastMean - firstMean;
      }
    }
  }

  const accScore = clamp(accuracy * 100, 0, 100);
  const targetRT = 650;
  const speedBonus = meanRTms
    ? clamp(((targetRT - meanRTms) / targetRT) * 20, -20, 20)
    : 0;
  const timeoutPenalty = timeoutCount * 2;
  const score = clamp(accScore + speedBonus - timeoutPenalty, 0, 100);

  let interpretation = "Control bun sub conflict";
  if (accuracy < 0.75) {
    interpretation = "Control scade sub conflict";
  } else if (interferenceCost !== null && interferenceCost > 150) {
    interpretation = "Interferență ridicată";
  }

  return {
    totalTrials,
    correctCount,
    incorrectCount,
    timeoutCount,
    accuracy,
    meanRTms,
    medianRTms,
    interferenceCost,
    fatigueSlope,
    score,
    interpretation,
  };
}

export function StroopRun({ module, lang, duration }: StroopRunProps) {
  const preset = STROOP_PRESETS[duration];
  const [trials, setTrials] = useState<Stimulus[]>(() => generateTrials(preset));
  const [trialIndex, setTrialIndex] = useState(0);
  const [phase, setPhase] = useState<"running" | "summary">("running");
  const [timeLeftMs, setTimeLeftMs] = useState(preset.totalMs);
  const [summary, setSummary] = useState<SummaryStats | null>(null);

  const runStartRef = useRef<number>(0);
  const trialStartRef = useRef<number>(0);
  const trialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<TrialResult[]>([]);
  const finishedRef = useRef(false);
  const [recentRuns, setRecentRuns] = useState<ArenaRunRecord[]>(() =>
    getArenaRuns({ arenaId: module.arena, moduleId: module.id }),
  );

  const historyLink = useMemo(
    () => `/training/arenas/history?arenaId=${module.arena}&moduleId=${module.id}`,
    [module.arena, module.id],
  );

  const [todayKey] = useState(() => toDayKeyLocal(Date.now()));

  const bestToday = useMemo(() => {
    const todays = recentRuns.filter((run) => run.dayKey === todayKey);
    if (!todays.length) return null;
    return Math.max(...todays.map((run) => run.score));
  }, [recentRuns, todayKey]);

  const sparklineSource = useMemo(() => recentRuns.slice(0, 7).reverse(), [recentRuns]);
  const lastRun = recentRuns[0] ?? null;

  const resetTimers = useCallback(() => {
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current);
      trialTimeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const finishRun = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    resetTimers();
    const finalResults = resultsRef.current;
    const computed = computeSummary(finalResults);
    setPhase("summary");
    setSummary(computed);
    const completedAt = Date.now();
    const record: ArenaRunRecord = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${completedAt}-${Math.random()}`,
      arenaId: module.arena,
      moduleId: module.id,
      drillId: duration,
      duration,
      startedAt: runStartRef.current || completedAt,
      completedAt,
      dayKey: toDayKeyLocal(completedAt),
      totalTrials: computed.totalTrials,
      correctCount: computed.correctCount,
      incorrectCount: computed.incorrectCount,
      timeoutCount: computed.timeoutCount,
      accuracy: computed.accuracy,
      meanRTms: computed.meanRTms,
      score: computed.score,
      interpretation: computed.interpretation,
    };
    saveArenaRun(record);
    setRecentRuns(getArenaRuns({ arenaId: module.arena, moduleId: module.id }));
  }, [duration, module.arena, module.id, resetTimers]);

  const startRun = useCallback(() => {
    resetTimers();
    finishedRef.current = false;
    const newTrials = generateTrials(preset);
    setTrials(newTrials);
    setTrialIndex(0);
    resultsRef.current = [];
    setSummary(null);
    setPhase("running");
    setTimeLeftMs(preset.totalMs);
    runStartRef.current = Date.now();
  }, [preset, resetTimers]);

  useEffect(() => {
    return () => resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (phase !== "running") return;
    runStartRef.current = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, preset.totalMs - (Date.now() - runStartRef.current));
      setTimeLeftMs(remaining);
      if (remaining === 0) {
        finishRun();
      }
    }, 100);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [phase, preset.totalMs, finishRun]);

  const currentStimulus = trials[trialIndex] ?? null;

  const handleAnswer = useCallback(
    (selectedColor: ColorKey | null, timeout = false) => {
      if (phase !== "running" || !currentStimulus) return;
      if (trialTimeoutRef.current) {
        clearTimeout(trialTimeoutRef.current);
        trialTimeoutRef.current = null;
      }
      const rtMs = selectedColor ? Date.now() - trialStartRef.current : undefined;
      const correct = !timeout && selectedColor === currentStimulus.inkColor;
      const result: TrialResult = {
        congruent: currentStimulus.congruent,
        correct,
        timeout,
        rtMs,
      };
      const nextResults = [...resultsRef.current, result];
      resultsRef.current = nextResults;
      if (trialIndex + 1 >= trials.length) {
        finishRun();
      } else {
        setTrialIndex((prev) => prev + 1);
      }
    },
    [currentStimulus, finishRun, phase, trialIndex, trials.length],
  );

  useEffect(() => {
    if (phase !== "running" || !currentStimulus) return;
    trialStartRef.current = Date.now();
    if (trialTimeoutRef.current) {
      clearTimeout(trialTimeoutRef.current);
    }
    trialTimeoutRef.current = setTimeout(() => {
      handleAnswer(null, true);
    }, preset.timeoutMs);
    return () => {
      if (trialTimeoutRef.current) {
        clearTimeout(trialTimeoutRef.current);
        trialTimeoutRef.current = null;
      }
    };
  }, [phase, currentStimulus, preset.timeoutMs, handleAnswer]);

  const timeDisplay = useMemo(() => `${Math.ceil(timeLeftMs / 1000)}s`, [timeLeftMs]);

  if (phase === "summary" && summary) {
    return (
      <div className="min-h-screen bg-[#05060a] text-white flex flex-col">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-wide text-white/60">Rezultat</p>
            <h1 className="text-3xl font-semibold">Score: {Math.round(summary.score)}</h1>
            <p className="text-sm text-white/70 mt-2">{summary.interpretation}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-1">
                {METRIC_INFO.accuracy.label}
                <span className="text-white/50 cursor-help" title={METRIC_INFO.accuracy.description}>
                  ⓘ
                </span>
              </h3>
              <p className="text-2xl font-bold text-white">{(summary.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-1">
                {METRIC_INFO.meanRT.label}
                <span className="text-white/50 cursor-help" title={METRIC_INFO.meanRT.description}>
                  ⓘ
                </span>
              </h3>
              <p className="text-2xl font-bold text-white">
                {summary.meanRTms ? `${Math.round(summary.meanRTms)} ms` : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-1">
                {METRIC_INFO.interference.label}
                <span className="text-white/50 cursor-help" title={METRIC_INFO.interference.description}>
                  ⓘ
                </span>
              </h3>
              <p className="text-2xl font-bold text-white">
                {summary.interferenceCost ? `${Math.round(summary.interferenceCost)} ms` : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white/70 flex items-center gap-1">
                {METRIC_INFO.timeouts.label}
                <span className="text-white/50 cursor-help" title={METRIC_INFO.timeouts.description}>
                  ⓘ
                </span>
              </h3>
              <p className="text-2xl font-bold text-white">{summary.timeoutCount}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">Cel mai bun scor azi</p>
                <p className="text-3xl font-semibold">
                  {bestToday !== null ? Math.round(bestToday) : "—"}
                </p>
                <p className="text-sm text-white/60">
                  Ultimul run:{" "}
                  {lastRun ? new Date(lastRun.completedAt).toLocaleTimeString() : "—"}
                </p>
              </div>
              <ArenaHistorySparkline runs={sparklineSource} />
            </div>
            <Link
              href={historyLink}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 text-white text-sm font-semibold px-5 py-2"
            >
              Vezi istoricul
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startRun}
              className="rounded-full bg-white text-black text-sm font-semibold px-5 py-2"
            >
              Repeat
            </button>
            <Link
              href={`/training/arenas/${module.arena}/${module.id}`}
              className="rounded-full border border-white/40 text-white text-sm font-semibold px-5 py-2"
            >
              Change duration
            </Link>
            <Link
              href={`/training/arenas/${module.arena}`}
              className="rounded-full border border-white/40 text-white text-sm font-semibold px-5 py-2"
            >
              Back to arena
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-white flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 px-4 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Trial {trialIndex + 1}</span>
          <span>Timer: {timeDisplay}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <p className="text-sm uppercase tracking-wide text-white/60">
            Selectează culoarea cernelei, nu cuvântul
          </p>
          <div
            className="text-5xl md:text-7xl font-bold"
            style={{ color: currentStimulus ? COLOR_META[currentStimulus.inkColor].hex : "white" }}
          >
            {currentStimulus ? COLOR_META[currentStimulus.word].label[lang] : ""}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {COLOR_KEYS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleAnswer(color, false)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/40"
            >
              <div className="w-8 h-8 rounded-full mb-2" style={{ backgroundColor: COLOR_META[color].hex }} />
              <p className="text-lg font-semibold">{COLOR_META[color].label[lang]}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
