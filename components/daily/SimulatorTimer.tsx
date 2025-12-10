"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type SimulatorTimerProps = {
  inhaleSeconds?: number;
  exhaleSeconds?: number;
  autoStart?: boolean;
};

export default function SimulatorTimer({
  inhaleSeconds = 4,
  exhaleSeconds,
  autoStart = false,
}: SimulatorTimerProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "inhale" | "exhale">("idle");
  const [completedCycle, setCompletedCycle] = useState(false);
  const startRef = useRef<number | null>(null);
  const animationRef = useRef<number>();
  const inhaleMs = Math.max(500, inhaleSeconds * 1000);
  const exhaleMs = Math.max(500, (exhaleSeconds ?? inhaleSeconds) * 1000);
  const totalDuration = inhaleMs + exhaleMs;
  const inhalePortion = inhaleMs / totalDuration;

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const startCycle = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setCompletedCycle(false);
    setProgress(0);
    setPhase("inhale");
    startRef.current = null;
    const loop = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const nextProgress = Math.min(1, elapsed / totalDuration);
      setProgress(nextProgress);
      setPhase(nextProgress < inhalePortion ? "inhale" : "exhale");
      if (nextProgress < 1) {
        animationRef.current = requestAnimationFrame(loop);
      } else {
        setCompletedCycle(true);
        setPhase("idle");
      }
    };
    animationRef.current = requestAnimationFrame(loop);
  }, [inhalePortion, totalDuration]);

  useEffect(() => {
    if (!autoStart) return;
    const frame = requestAnimationFrame(() => startCycle());
    return () => cancelAnimationFrame(frame);
  }, [autoStart, startCycle]);

  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const active = phase !== "idle";
  const inspirationStroke = active
    ? phase === "inhale"
      ? "var(--omni-energy)"
      : "rgba(237,130,101,0.6)"
    : "#ece7e1";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={startCycle}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--omni-energy)]"
      >
        <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden="true" role="presentation">
          <circle
            cx="55"
            cy="55"
            r={RADIUS}
            fill="none"
            stroke="#ece7e1"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx="55"
            cy="55"
            r={RADIUS}
            fill="none"
            stroke={inspirationStroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
      </button>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
        {phase === "idle"
          ? "Apasă pe cerc ca să începi"
          : phase === "inhale"
            ? `Inspiră ${inhaleSeconds} secunde`
            : `Expiră ${(exhaleSeconds ?? inhaleSeconds)} secunde`}
      </p>
      {completedCycle ? (
        <button
          type="button"
          onClick={startCycle}
          className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]"
        >
          Mai vreau un ciclu
        </button>
      ) : null}
    </div>
  );
}
