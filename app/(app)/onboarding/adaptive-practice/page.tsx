"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useAuth } from "@/components/AuthProvider";
import { getCatProfile } from "@/lib/firebase/cat";
import { logAdaptivePracticeSession } from "@/lib/firebase/adaptivePractice";
import { CAT_AXES, type CatAxisId } from "@/config/catEngine";
import type { AdaptiveCluster, BehaviorSuggestionType } from "@/types/adaptivePractice";

const CLARITY_FRAGMENTS = ["Am prea multe", "lucruri de făcut", "în același timp."];
const HOLD_DURATION_MS = 2500;
const FOCUS_DURATION_MS = 4000;
const HOME_ROUTE = "/recommendation";

const BEHAVIOR_SUGGESTIONS: Record<
  AdaptiveCluster,
  { text: string; key: BehaviorSuggestionType }
> = {
  clarity_cluster: {
    text: "Astăzi, alege un lucru important și reformulează-l în minte în maximum 7 cuvinte.",
    key: "clarity_7_words",
  },
  emotional_flex_cluster: {
    text: "Dacă apare un moment tensionat, respiră o dată adânc înainte să răspunzi.",
    key: "breath_before_react",
  },
  focus_energy_cluster: {
    text: "Astăzi, ia 2 minute fără telefon – doar pentru tine.",
    key: "two_min_no_phone",
  },
};

const MICRO_DESCRIPTIONS: Record<
  AdaptiveCluster,
  { title: string; detail: string }
> = {
  clarity_cluster: {
    title: "Selectează partea esențială",
    detail: "Alege fragmentul care surprinde miezul problemei tale.",
  },
  emotional_flex_cluster: {
    title: "Resetează tensiunea",
    detail: "Ține apăsat cercul 2 secunde pentru a marca reset-ul interior.",
  },
  focus_energy_cluster: {
    title: "Urmează punctul",
    detail: "Pornește exercițiul și urmărește punctul 4 secunde.",
  },
};

const STEP_TITLES = ["Introducere", "Micro-exercițiu", "Sugestie", "Final"];

export default function AdaptivePracticeLitePage() {
  const router = useRouter();
  const { user, loading, authReady } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getCatProfile>>>(null);
  const [step, setStep] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [microExerciseCompleted, setMicroExerciseCompleted] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState<string | null>(null);
  const [holdState, setHoldState] = useState<"idle" | "pressing" | "completed">("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const [focusActive, setFocusActive] = useState(false);
  const [focusProgress, setFocusProgress] = useState(0);
  const [focusCompleted, setFocusCompleted] = useState(false);
  const [sessionLogged, setSessionLogged] = useState(false);
  const [loggingSession, setLoggingSession] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await getCatProfile(user.uid);
        if (!cancelled) {
          setProfile(doc);
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  useEffect(() => {
    return () => {
      clearHoldTimers();
      clearFocusTimers();
    };
  }, []);

  const axisMeta = useMemo(() => {
    const map = new Map<CatAxisId, { label: string; shortLabel: string }>();
    for (const axis of CAT_AXES) {
      map.set(axis.id, { label: axis.label, shortLabel: axis.shortLabel });
    }
    return map;
  }, []);

  const { primaryAxis, cluster } = useMemo(() => {
    if (!profile?.axisScores) return { primaryAxis: null, cluster: null };
    const entries = Object.entries(profile.axisScores) as [CatAxisId, number][];
    if (!entries.length) return { primaryAxis: null, cluster: null };
    const weakest = entries.reduce((min, current) => (current[1] < min[1] ? current : min));
    return { primaryAxis: weakest[0], cluster: mapAxisToCluster(weakest[0]) };
  }, [profile]);

  const axisLabel = primaryAxis ? axisMeta.get(primaryAxis)?.label : null;
  const axisShort = primaryAxis ? axisMeta.get(primaryAxis)?.shortLabel : null;

  const suggestion = cluster ? BEHAVIOR_SUGGESTIONS[cluster] : null;
  const microDescription = cluster ? MICRO_DESCRIPTIONS[cluster] : null;

  const showLoader = loading || loadingProfile || !authReady;

  function mapAxisToCluster(axisId: CatAxisId): AdaptiveCluster {
    if (axisId === "clarity") return "clarity_cluster";
    if (axisId === "flex" || axisId === "emo_stab" || axisId === "recalib") {
      return "emotional_flex_cluster";
    }
    return "focus_energy_cluster";
  }

  const resetMicroStates = () => {
    setMicroExerciseCompleted(false);
    setSelectedFragment(null);
    setHoldState("idle");
    setHoldProgress(0);
    clearHoldTimers();
    setFocusActive(false);
    setFocusProgress(0);
    setFocusCompleted(false);
    clearFocusTimers();
  };

  const clearHoldTimers = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const clearFocusTimers = () => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }
  };

  const startHold = () => {
    if (holdState === "completed") return;
    clearHoldTimers();
    setHoldState("pressing");
    const start = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setHoldProgress(Math.min(1, elapsed / HOLD_DURATION_MS));
    }, 40);
    holdTimeoutRef.current = setTimeout(() => {
      setHoldState("completed");
      setHoldProgress(1);
      clearHoldTimers();
      setMicroExerciseCompleted(true);
    }, HOLD_DURATION_MS);
  };

  const cancelHold = () => {
    if (holdState !== "pressing") return;
    clearHoldTimers();
    setHoldState("idle");
    setHoldProgress(0);
  };

  const startFocusExercise = () => {
    if (focusCompleted || focusActive) return;
    clearFocusTimers();
    setFocusActive(true);
    const start = Date.now();
    focusIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setFocusProgress(Math.min(1, elapsed / FOCUS_DURATION_MS));
    }, 40);
    focusTimeoutRef.current = setTimeout(() => {
      setFocusProgress(1);
      setFocusActive(false);
      setFocusCompleted(true);
      clearFocusTimers();
      setMicroExerciseCompleted(true);
    }, FOCUS_DURATION_MS);
  };

  const renderMicroExercise = () => {
    if (!cluster) return null;
    if (cluster === "clarity_cluster") {
      return (
        <div className="flex flex-wrap gap-3">
          {CLARITY_FRAGMENTS.map((fragment) => (
            <button
              key={fragment}
              type="button"
              onClick={() => {
                setSelectedFragment(fragment);
                setMicroExerciseCompleted(true);
              }}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selectedFragment === fragment
                  ? "border-[var(--omni-energy)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]"
                  : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
              }`}
            >
              {fragment}
            </button>
          ))}
        </div>
      );
    }
    if (cluster === "emotional_flex_cluster") {
      return (
        <div className="flex flex-col items-center gap-4">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full border-2 ${
              holdState === "completed"
                ? "border-[var(--omni-energy)] bg-[var(--omni-energy-soft)]"
                : "border-[var(--omni-border-strong)] bg-[var(--omni-bg-paper)]"
            }`}
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={(event) => {
              event.preventDefault();
              startHold();
            }}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            role="button"
            tabIndex={0}
          >
            <div className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)]">
              {holdState === "completed" ? "Resetat" : "Ține apăsat"}
            </div>
          </div>
          <div className="h-2 w-48 rounded-full bg-[var(--omni-bg-main)]">
            <div
              className="h-full rounded-full bg-[var(--omni-energy)] transition-[width]"
              style={{ width: `${Math.round(holdProgress * 100)}%` }}
            />
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            {holdState === "completed"
              ? "Reset completat"
              : "Menține 2 secunde pentru a completa"}
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-sm">
          <div className="relative h-2 rounded-full bg-[var(--omni-bg-main)]">
            <div
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--omni-energy)] transition-[left]"
              style={{ left: `${focusProgress * 100}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[var(--omni-energy-soft)] transition-[width]"
              style={{ width: `${focusProgress * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OmniCtaButton onClick={startFocusExercise} disabled={focusActive || focusCompleted}>
            {focusCompleted ? "Exercițiu finalizat" : focusActive ? "Exercițiu în curs" : "Pornește exercițiul"}
          </OmniCtaButton>
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
          {focusCompleted ? "Gata – bună ancora!" : "Urmează punctul timp de 4 secunde"}
        </p>
      </div>
    );
  };

  const handlePrimaryAction = async () => {
    setLogError(null);
    if (step === 0) {
      resetMicroStates();
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!user?.uid || !primaryAxis || !cluster || !suggestion) {
        setStep(3);
        return;
      }
      if (sessionLogged) {
        setStep(3);
        return;
      }
      setLoggingSession(true);
      try {
        await logAdaptivePracticeSession({
          userId: user.uid,
          cluster,
          primaryAxis,
          microExerciseCompleted,
          behaviorSuggestionType: suggestion.key,
        });
        setSessionLogged(true);
      } catch (error) {
        console.error("logAdaptivePracticeSession failed", error);
        setLogError("Nu am putut salva această sesiune. Poți continua – vom încerca mai târziu.");
      } finally {
        setLoggingSession(false);
        setStep(3);
      }
      return;
    }
    router.push(HOME_ROUTE);
  };

  if (showLoader) {
    return (
      <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center text-sm text-[var(--omni-muted)] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
          Pregătim exercițiul tău adaptiv…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--omni-danger)] bg-[#FDEAEA] px-6 py-12 text-center text-sm text-[var(--omni-danger)] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
          Ai nevoie de un profil OmniMental pentru a continua.
        </div>
      </main>
    );
  }

  if (!profile || !primaryAxis || !cluster || !suggestion) {
    return (
      <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-12 text-center shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
          <p className="text-lg font-semibold">Finalizăm întâi profilul CAT</p>
          <p className="text-sm text-[var(--omni-ink)]/75">
            Reia evaluarea pentru a genera un profil adaptiv complet.
          </p>
          <div className="flex justify-center">
            <OmniCtaButton as="link" href="/onboarding/cat-baseline">
              Mergi la evaluare
            </OmniCtaButton>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Adaptive Practice Lite</p>
          <h1 className="text-3xl font-semibold">Primul tău antrenament în jurul axei {axisShort}</h1>
          <p className="text-base text-[var(--omni-ink)]/80">
            Omnimental îți propune exerciții scurte, aliniate cu zona ta cea mai vulnerabilă acum.
          </p>
        </header>

        <section className="rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            Pas {step + 1} din {STEP_TITLES.length}
          </p>
          <p className="text-sm text-[var(--omni-ink)]/70">{STEP_TITLES[step]}</p>
        </section>

        {step === 0 ? (
          <section className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Prima ta zonă de antrenament</p>
            <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">{axisLabel}</h2>
            <p className="text-base text-[var(--omni-ink)]/80">
              Din profilul tău, zona în care ai cel mai mult de câștigat este <strong>{axisLabel}</strong>. Îți propun un exercițiu rapid exact pe acest punct.
            </p>
          </section>
        ) : null}

        {step === 1 && microDescription ? (
          <section className="space-y-5 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{microDescription.title}</p>
              <p className="text-base text-[var(--omni-ink)]/80">{microDescription.detail}</p>
            </div>
            {renderMicroExercise()}
            {microExerciseCompleted ? (
              <p className="text-sm text-[var(--omni-energy)]">Exercițiul e pregătit. Continuăm.</p>
            ) : (
              <p className="text-sm text-[var(--omni-ink)]/70">Finalizează exercițiul pentru a continua.</p>
            )}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Sugestie minimalistă</p>
            <h2 className="text-xl font-semibold text-[var(--omni-ink)]">Pentru următoarele ore</h2>
            <p className="text-base text-[var(--omni-ink)]/85">{suggestion.text}</p>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-4 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-semibold text-[var(--omni-ink)]">Gata – acesta a fost primul tău antrenament adaptiv</h2>
            <p className="text-base text-[var(--omni-ink)]/80">
              De acum, îți propunem exerciții scurte, adaptate profilului tău, integrate în rutina zilnică OmniMental.
            </p>
          </section>
        ) : null}

        {logError ? (
          <div className="rounded-xl border border-[var(--omni-danger)] bg-[#FDEAEA] px-4 py-3 text-sm text-[var(--omni-danger)]">
            {logError}
          </div>
        ) : null}

        <div className="flex justify-between">
          <OmniCtaButton variant="neutral" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={step === 0}>
            Înapoi
          </OmniCtaButton>
          <OmniCtaButton
            onClick={handlePrimaryAction}
            disabled={step === 1 && !microExerciseCompleted}
          >
            {step === 0 && "Continuă"}
            {step === 1 && "Continuă"}
            {step === 2 && (loggingSession ? "Se salvează..." : "Am înțeles")}
            {step === 3 && "Intră în OmniMental"}
          </OmniCtaButton>
        </div>
      </div>
    </main>
  );
}
