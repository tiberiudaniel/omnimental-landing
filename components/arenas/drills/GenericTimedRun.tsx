"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ArenaModuleV1, ArenaDrillDuration, ArenaLang } from "@/config/arenaModules/v1/types";
import { ArenaRunLayout } from "@/components/arenas/ArenaRunLayout";
import { ArenaFinishScreen } from "@/components/arenas/ArenaFinishScreen";
import { saveArenaRun, toDayKeyLocal, updateArenaRun } from "@/lib/arenaRunStore";

const DURATION_SECONDS: Record<ArenaDrillDuration, number> = {
  "30s": 30,
  "90s": 90,
  "3m": 180,
};

interface GenericTimedRunProps {
  module: ArenaModuleV1;
  lang: ArenaLang;
  duration: ArenaDrillDuration;
}

export function GenericTimedRun({ module, lang, duration }: GenericTimedRunProps) {
  const router = useRouter();
  const drills = module.drills?.[lang] ?? [];
  const selectedDrill =
    drills.find((drill) => drill.duration === duration) ?? drills[0] ?? null;
  const durationSec = DURATION_SECONDS[duration];

  const [phase, setPhase] = useState<"idle" | "running" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const runIdRef = useRef<string | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    resetTimer();
    setTimeLeft(durationSec);
    setPhase("idle");
    runIdRef.current = null;
  }, [durationSec, resetTimer]);

  useEffect(() => {
    return () => resetTimer();
  }, [resetTimer]);

  const startRun = () => {
    resetTimer();
    setPhase("running");
    setTimeLeft(durationSec);
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          resetTimer();
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleReplay = () => {
    if (!runIdRef.current) {
      handleSubmit(null);
    }
    resetTimer();
    setPhase("idle");
    setTimeLeft(durationSec);
    runIdRef.current = null;
  };

  const handleDurationChange = (nextDuration: ArenaDrillDuration) => {
    router.replace(
      `/training/arenas/${module.arena}/${module.id}/run?duration=${nextDuration}&lang=${lang}`,
    );
  };

  const handleSubmit = (selfReport: number | null) => {
    const completedAt = Date.now();
    const recordId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${completedAt}-${Math.random()}`;
    runIdRef.current = recordId;
    saveArenaRun({
      id: recordId,
      arenaId: module.arena,
      moduleId: module.id,
      drillId: selectedDrill?.duration ?? duration,
      duration,
      durationSec,
      startedAt: startedAtRef.current ?? completedAt - durationSec * 1000,
      completedAt,
      dayKey: toDayKeyLocal(completedAt),
      selfReport,
      score: selfReport ? selfReport * 20 : undefined,
    });
  };

  const successMetric = selectedDrill?.successMetric;
  const availableDurations = useMemo(
    () => drills.map((drill) => drill.duration),
    [drills],
  );

  if (!selectedDrill) {
    return (
      <div className="min-h-screen bg-[#05060a] text-white flex items-center justify-center">
        <p className="text-white/70">Drill indisponibil.</p>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <ArenaFinishScreen
        module={module}
        lang={lang}
        duration={selectedDrill.duration}
        successMetric={successMetric}
        availableDurations={availableDurations}
        onReplay={handleReplay}
        onSelectDuration={handleDurationChange}
        onBackToArena={() => router.push(`/training/arenas/${module.arena}`)}
        onSubmit={(value) => {
          if (runIdRef.current) {
            updateArenaRun(runIdRef.current, { selfReport: value });
          } else {
            handleSubmit(value);
          }
        }}
      />
    );
  }

  return (
    <ArenaRunLayout
      title={`${module.title[lang]} — ${selectedDrill.duration}`}
      durationLabel={selectedDrill.duration}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/80">
            {phase === "running" ? "Timer" : "Durată pregătită"}
          </p>
          <p className="text-2xl font-semibold">
            {phase === "running" ? `${timeLeft}s` : `${durationSec}s`}
          </p>
        </div>
        <p className="text-sm text-white/70">
          <span className="font-semibold">Constraint:</span> {selectedDrill.constraint}
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-white/80">
          {selectedDrill.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={startRun}
          disabled={phase === "running"}
          className="w-full rounded-2xl bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-white/80 disabled:bg-white/30 disabled:text-white/50"
        >
          {phase === "running" ? "În desfășurare..." : "Start"}
        </button>
      </div>
    </ArenaRunLayout>
  );
}
