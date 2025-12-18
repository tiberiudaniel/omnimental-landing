"use client";

import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useRouter } from "next/navigation";
import {
  recordSessionTelemetry,
  type KpiEvent,
  type TelemetrySessionType,
  type TelemetryOrigin,
  type TelemetryFlowTag,
} from "@/lib/telemetry";
import { ARENA_TASKS } from "@/config/arenas";
import { buildArenaKpiEvent } from "@/lib/arenaEngine";

type ColorKey = "red" | "green" | "blue" | "yellow";

const COLOR_META: Record<ColorKey, { hex: string; label: string }> = {
  red: { hex: "#ef4444", label: "Roșu" },
  green: { hex: "#22c55e", label: "Verde" },
  blue: { hex: "#3b82f6", label: "Albastru" },
  yellow: { hex: "#eab308", label: "Galben" },
};

type Stimulus = {
  word: ColorKey;
  inkColor: ColorKey;
  congruent: boolean;
};

type TrialResult = {
  congruent: boolean;
  correct: boolean;
  rtMs: number;
};

type Phase = "intro" | "running" | "summary";

const TRIAL_COUNT = 36;

function generateStimuli(): Stimulus[] {
  const result: Stimulus[] = [];
  for (let i = 0; i < TRIAL_COUNT; i += 1) {
    const inkColor = pickRandomColor();
    const congruent = Math.random() > 0.4;
    if (congruent) {
      result.push({ word: inkColor, inkColor, congruent: true });
    } else {
      const choices = (Object.keys(COLOR_META) as ColorKey[]).filter((color) => color !== inkColor);
      const word = choices[Math.floor(Math.random() * choices.length)];
      result.push({ word, inkColor, congruent: false });
    }
  }
  return result;
}

function pickRandomColor(): ColorKey {
  const colors = Object.keys(COLOR_META) as ColorKey[];
  return colors[Math.floor(Math.random() * colors.length)];
}

type Props = {
  onComplete: () => void;
  sessionType?: TelemetrySessionType;
  arenaId?: keyof typeof ARENA_TASKS;
  origin?: TelemetryOrigin;
  flowTag?: TelemetryFlowTag;
};

export default function QuickStroopTask({
  onComplete,
  sessionType = "wizard",
  arenaId = "exec_control_micro_stroop",
  origin = "real",
  flowTag = "onboarding",
}: Props) {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [stimuli, setStimuli] = useState<Stimulus[]>(() => generateStimuli());
  const [trialIndex, setTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const trialStartRef = useRef<number>(0);
  const [summary, setSummary] = useState<{ accuracy: number; meanRt: number; score: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const currentStimulus = stimuli[trialIndex];

  const beginTask = () => {
    setStimuli(generateStimuli());
    setResults([]);
    setTrialIndex(0);
    trialStartRef.current = performance.now();
    setPhase("running");
  };

  const handleChoice = (choice: ColorKey) => {
    if (!currentStimulus) return;
    const now = performance.now();
    const rt = Math.max(50, now - (trialStartRef.current || now));
    const nextResults = [
      ...results,
      {
        congruent: currentStimulus.congruent,
        correct: choice === currentStimulus.inkColor,
        rtMs: rt,
      },
    ];
    setResults(nextResults);
    if (trialIndex + 1 >= TRIAL_COUNT) {
      finishTask(nextResults);
    } else {
      setTrialIndex((prev) => prev + 1);
      trialStartRef.current = performance.now();
    }
  };

  const finishTask = useCallback(
    async (finalResults: TrialResult[]) => {
      const accuracy =
        finalResults.length > 0
          ? finalResults.filter((trial) => trial.correct).length / finalResults.length
          : 0;
      const meanRt =
        finalResults.length > 0
          ? finalResults.reduce((sum, trial) => sum + trial.rtMs, 0) / finalResults.length
          : 0;
      const accuracyScore = accuracy * 80;
      const speedBonus = Math.max(0, Math.min(20, ((700 - meanRt) / 700) * 20));
      const score = Math.max(0, Math.min(100, accuracyScore + speedBonus));
      const summaryData = { accuracy, meanRt, score };
      if (!user) {
        setSummary(summaryData);
        setPhase("summary");
        return;
      }
      const arenaTask = ARENA_TASKS[arenaId] ?? ARENA_TASKS.exec_control_micro_stroop;
      setSaving(true);
      const kpiEvent: KpiEvent = buildArenaKpiEvent(arenaTask, user.uid, Number(score.toFixed(2)), sessionType);
      try {
        await recordSessionTelemetry({
          sessionId: `quick-task-${Date.now()}`,
          userId: user.uid,
          sessionType,
          arenaId: arenaTask.id,
          moduleId: arenaTask.id,
          traitSignals: [
            {
              trait: "focus",
              canonDomain: "executiveControl",
              deltaSelfReport: null,
              confidence: "low",
            },
          ],
          kpiEvents: [kpiEvent],
          origin,
          flowTag,
        });
      } catch (error) {
        console.warn("recordSessionTelemetry failed", error);
      } finally {
        setSummary(summaryData);
        setPhase("summary");
        setSaving(false);
      }
    },
    [user, arenaId, sessionType, origin, flowTag],
  );

  if (!authReady) {
    return (
      <section className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--omni-ink-soft)]">Pregătim următorul pas…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-[var(--omni-ink)]">
          Ai nevoie de un cont (poate fi și anonim) pentru a rula mini-taskul.
        </p>
        <OmniCtaButton onClick={() => router.push("/auth")} variant="primary">
          Creează cont
        </OmniCtaButton>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-8 shadow-[0_8px_28px_rgba(0,0,0,0.15)]">
      {phase === "intro" ? (
        <IntroStep onBegin={beginTask} />
      ) : null}
      {phase === "running" && currentStimulus ? (
        <RunStep
          stimulus={currentStimulus}
          trialIndex={trialIndex}
          onChoice={handleChoice}
          totalTrials={TRIAL_COUNT}
        />
      ) : null}
      {phase === "summary" && summary ? (
        <SummaryStep
          summary={summary}
          loading={saving}
          onNext={() => {
            onComplete();
          }}
        />
      ) : null}
    </section>
  );
}

function IntroStep({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Pasul 2 din 3</p>
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Task rapid: Micro-Stroop</h2>
      <p className="text-sm text-[var(--omni-ink-soft)]">
        Selectează culoarea cu care este scris cuvântul (nu textul). 36 de trialuri · ~2 minute.
      </p>
      <OmniCtaButton variant="primary" onClick={onBegin} data-testid="stroop-start">
        Începe taskul
      </OmniCtaButton>
    </div>
  );
}

function RunStep({
  stimulus,
  trialIndex,
  totalTrials,
  onChoice,
}: {
  stimulus: Stimulus;
  trialIndex: number;
  totalTrials: number;
  onChoice: (choice: ColorKey) => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
        Trial {trialIndex + 1}/{totalTrials}
      </p>
      <div className="flex min-h-[160px] items-center justify-center rounded-[12px] border border-dashed border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)]">
        <span
          className="text-4xl font-semibold tracking-wide"
          style={{ color: COLOR_META[stimulus.inkColor].hex }}
        >
          {COLOR_META[stimulus.word].label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(COLOR_META) as ColorKey[]).map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChoice(color)}
            data-testid={`stroop-color-${color}`}
            className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-3 text-center text-sm font-semibold shadow-sm transition hover:border-[var(--omni-energy)]"
          >
            {COLOR_META[color].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryStep({
  summary,
  loading,
  onNext,
}: {
  summary: { accuracy: number; meanRt: number; score: number };
  loading: boolean;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Task completat</p>
      <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Semnal colectat</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Acuratețe" value={`${Math.round(summary.accuracy * 100)}%`} />
        <MetricCard label="Timp mediu" value={`${Math.round(summary.meanRt)} ms`} />
        <MetricCard label="Scor" value={summary.score.toFixed(0)} />
      </div>
      <OmniCtaButton variant="primary" onClick={onNext} disabled={loading} data-testid="stroop-complete">
        {loading ? "Se salvează…" : "Continuă"}
      </OmniCtaButton>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-3 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--omni-ink)]">{value}</p>
    </div>
  );
}
