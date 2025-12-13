"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { track } from "@/lib/telemetry/track";
type TestDuration = "short" | "medium";

interface AxisTestCardProps {
  mediumUnlocked: boolean;
  onTestComplete: (axisId: string, duration: TestDuration) => void;
  onUnlockMedium: () => void;
  onTestStarted?: (axisId: string, duration: TestDuration) => void;
}

interface ActiveTest {
  axisId: string;
  duration: TestDuration;
  secondsLeft: number;
}

const AXES = [
  {
    id: "clarity",
    title: "Claritate",
    description: "Gândești rapid, dar îți scapă ordinea corectă. Testul evaluează focusul sub presiune.",
  },
  {
    id: "energy",
    title: "Energie",
    description: "Măsoară cât de repede îți revii între task-uri și dacă respiri la timp.",
  },
  {
    id: "adaptability",
    title: "Adaptabilitate",
    description: "Verifică flexibilitatea cognitivă și cât de ușor schimbi strategiile.",
  },
  {
    id: "resilience",
    title: "Reziliență",
    description: "Cât rezistă atenția când apare tensiunea emoțională.",
  },
];

const TEST_SECONDS: Record<TestDuration, number> = {
  short: 45,
  medium: 60,
};

export function AxisTestCard({
  mediumUnlocked,
  onTestComplete,
  onUnlockMedium,
  onTestStarted,
}: AxisTestCardProps) {
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [completed, setCompleted] = useState<Record<string, Partial<Record<TestDuration, boolean>>>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const modalTitle = useMemo(() => {
    if (!activeTest) return "";
    const axis = AXES.find((a) => a.id === activeTest.axisId);
    return axis ? `${axis.title} · ${activeTest.duration === "short" ? "Test scurt" : "Test mediu"}` : "Test";
  }, [activeTest]);

  const updateCompletion = useCallback(
    (axisId: string, duration: TestDuration) => {
      if (completed[axisId]?.[duration]) return;
      setCompleted((prev) => ({
        ...prev,
        [axisId]: { ...(prev[axisId] ?? {}), [duration]: true },
      }));
      onTestComplete(axisId, duration);
      if (duration === "short" && !mediumUnlocked) {
        onUnlockMedium();
      }
      track("axis_test_completed", { axis: axisId, durationType: duration });
    },
    [completed, mediumUnlocked, onTestComplete, onUnlockMedium],
  );

  useEffect(() => {
    if (!activeTest) return;
    if (activeTest.secondsLeft <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveTest((prev) =>
        prev ? { ...prev, secondsLeft: Math.max(prev.secondsLeft - 1, 0) } : null,
      );
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [activeTest]);

  useEffect(() => {
    if (!activeTest) return;
    if (activeTest.secondsLeft > 0) return;
    const id = window.setTimeout(() => {
      updateCompletion(activeTest.axisId, activeTest.duration);
      setActiveTest(null);
    }, 0);
    return () => window.clearTimeout(id);
  }, [activeTest, updateCompletion]);

  const startTest = (axisId: string, duration: TestDuration) => {
    if (duration === "medium" && !mediumUnlocked) return;
    if (completed[axisId]?.[duration]) return;
    if (activeTest) return;
    const seconds = TEST_SECONDS[duration];
    setActiveTest({ axisId, duration, secondsLeft: seconds });
    onTestStarted?.(axisId, duration);
    track("axis_test_started", { axis: axisId, durationType: duration });
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleFeedback = (axisId: string, value: string) => {
    setFeedback((prev) => ({ ...prev, [axisId]: value }));
  };

  return (
    <section id="axis-tests" className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:px-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Card 2</p>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">
          Testează o axă
        </h2>
        <p className="text-sm leading-relaxed text-[var(--omni-ink)]/80 sm:text-base">
          Alege o axă, rulează un test scurt și vezi ce simți. După primul test scurt se deblochează și testele medii.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {AXES.map((axis) => {
          const axisCompleted = completed[axis.id] ?? {};
          const anyCompleted = Boolean(axisCompleted.short || axisCompleted.medium);
          return (
            <div key={axis.id} className="flex h-full flex-col rounded-[24px] border border-[var(--omni-border-soft)]/70 bg-[var(--omni-bg-main)] px-4 py-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{axis.title}</p>
                  <p className="mt-1 text-sm text-[var(--omni-ink)]/85">{axis.description}</p>
                </div>
                {anyCompleted ? (
                  <span className="rounded-full bg-[var(--omni-energy)]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-energy)]">
                    Completat
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={clsx(
                    "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
                    axisCompleted.short
                      ? "border-[var(--omni-energy)] bg-[var(--omni-energy)]/10 text-[var(--omni-energy)]"
                      : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]/70",
                  )}
                  disabled={Boolean(activeTest) || Boolean(axisCompleted.short)}
                  onClick={() => startTest(axis.id, "short")}
                >
                  Test scurt
                </button>
                <button
                  type="button"
                  className={clsx(
                    "flex-1 rounded-full border px-3 py-2 text-sm font-semibold transition",
                    mediumUnlocked && !axisCompleted.medium
                      ? "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]/70"
                      : "border-dashed border-[var(--omni-border-soft)] text-[var(--omni-muted)]",
                    axisCompleted.medium ? "border-[var(--omni-energy)] bg-[var(--omni-energy)]/10 text-[var(--omni-energy)]" : "",
                  )}
                  disabled={!mediumUnlocked || Boolean(activeTest) || Boolean(axisCompleted.medium)}
                  onClick={() => startTest(axis.id, "medium")}
                >
                  Test mediu
                </button>
              </div>
              {anyCompleted ? (
                <div className="mt-4 space-y-2 rounded-2xl bg-white/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                    A fost util?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Da", "Meh", "Nu"].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleFeedback(axis.id, label)}
                        className={clsx(
                          "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                          feedback[axis.id] === label
                            ? "border-[var(--omni-ink)] bg-[var(--omni-ink)] text-white"
                            : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-ink)]/70",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {activeTest ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Test în desfășurare</p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--omni-ink)]">{modalTitle}</h3>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--omni-ink)]">{formatCountdown(activeTest.secondsLeft)}</p>
            <p className="mt-2 text-sm text-[var(--omni-ink)]/70">Stai cu exercițiul până la final. Ulterior notăm impresia.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
