"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import {
  saveUserStyleProfile,
  type LearningStyle,
  type ExecutionPace,
  type InfoProcessing,
} from "@/lib/profileEngine";
import { track } from "@/lib/telemetry/track";

type QuestionOption<T extends string> = {
  label: string;
  value: T;
  description?: string;
};

type QuestionConfig<T extends string> = {
  id: string;
  label: string;
  description: string;
  options: QuestionOption<T>[];
};

const LEARNING_OPTIONS: QuestionOption<LearningStyle>[] = [
  { label: "Vizual", value: "visual", description: "diagrame, video, hărți mentale" },
  { label: "Verbal", value: "verbal", description: "texte scurte, explicații audio" },
  { label: "Combinat", value: "mixed", description: "îmi place să alternez formatul" },
];

const PACE_OPTIONS: QuestionOption<ExecutionPace>[] = [
  { label: "Micro-sesiuni", value: "micro", description: "3–6 minute, de mai multe ori pe zi" },
  { label: "Blocuri dedicate", value: "block", description: "15–20 minute concentrate" },
];

const PROCESSING_OPTIONS: QuestionOption<InfoProcessing>[] = [
  { label: "Analitic", value: "analytic", description: "vreau pași concreți și metrici" },
  { label: "Intuitiv", value: "intuitive", description: "vreau exemple și analogii" },
  { label: "Mix", value: "mixed", description: "depinde de context" },
];

const QUESTIONS: QuestionConfig<string>[] = [
  {
    id: "learning",
    label: "Cum preferi să primești informația?",
    description: "Alege formatul care te ajută să procesezi rapid.",
    options: LEARNING_OPTIONS,
  },
  {
    id: "executionPace",
    label: "Ce ritm de execuție ți se potrivește?",
    description: "Sesiuni foarte scurte sau blocuri concentrate?",
    options: PACE_OPTIONS,
  },
  {
    id: "infoProcessing",
    label: "Cum procesezi mai ușor insight-urile?",
    description: "Alege tipul de explicații care te mișcă mai repede.",
    options: PROCESSING_OPTIONS,
  },
];

export default function StyleProfilePage() {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/auth?returnTo=${encodeURIComponent("/onboarding/style")}`);
      return;
    }
    track("style_profile_started");
  }, [authReady, user, router]);

  const ready = authReady && Boolean(user);

  const missingFields = useMemo(() => {
    return QUESTIONS.filter((question) => !answers[question.id]).map((question) => question.label);
  }, [answers]);

  const handleSubmit = async () => {
    if (!user || saving) return;
    if (missingFields.length > 0) {
      setError("Selectează o opțiune la fiecare întrebare.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveUserStyleProfile(user.uid, {
        learning: answers.learning as LearningStyle,
        executionPace: answers.executionPace as ExecutionPace,
        infoProcessing: answers.infoProcessing as InfoProcessing,
      });
      track("style_profile_completed", {
        learning: answers.learning,
        executionPace: answers.executionPace,
        infoProcessing: answers.infoProcessing,
      });
      router.replace("/today");
    } catch (err) {
      console.warn("saveUserStyleProfile failed", err);
      setError("Nu am reușit să salvăm preferințele. Încearcă din nou.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] text-sm text-[var(--omni-ink-soft)]">
        Se pregătește chestionarul…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)]">
      <div className="mx-auto w-full max-w-3xl space-y-8 rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.1)] sm:px-10">
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Profil de stil</p>
          <h1 className="text-3xl font-semibold">Adaptăm exercițiile la modul tău de lucru</h1>
          <p className="text-sm text-[var(--omni-ink)]/75">
            Răspunsurile tale ne ajută să calibrăm ancorele și modul în care primești insight-urile după ce ai deja câteva
            sesiuni reale.
          </p>
        </header>
        <div className="space-y-6">
          {QUESTIONS.map((question) => (
            <article
              key={question.id}
              className="rounded-[18px] border border-[var(--omni-border-soft)] bg-white/85 px-4 py-5 shadow-[0_12px_40px_rgba(0,0,0,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{question.label}</p>
              <p className="mt-1 text-sm text-[var(--omni-ink)]/80">{question.description}</p>
              <div className="mt-4 grid gap-3">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`w-full rounded-[16px] border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-[var(--omni-energy)] bg-[var(--omni-energy)]/10 text-[var(--omni-ink)]"
                          : "border-[var(--omni-border-soft)] bg-white text-[var(--omni-ink)]/80 hover:border-[var(--omni-ink)]"
                      }`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.value }))}
                    >
                      <span className="font-semibold">{option.label}</span>
                      {option.description ? (
                        <span className="mt-1 block text-xs text-[var(--omni-ink)]/70">{option.description}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <OmniCtaButton onClick={handleSubmit} disabled={saving} className="justify-center sm:min-w-[180px]">
            {saving ? "Se salvează…" : "Salvează profilul"}
          </OmniCtaButton>
        </div>
      </div>
    </main>
  );
}
