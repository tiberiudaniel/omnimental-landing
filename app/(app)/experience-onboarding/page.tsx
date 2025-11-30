"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import StepIntro from "./steps/StepIntro";
import StepMiniTest from "./steps/StepMiniTest";
import StepMiniTestScore from "./steps/StepMiniTestScore";
import StepProgressRedirect from "./steps/StepProgressRedirect";
import StepJournal from "./steps/StepJournal";
import StepBreathPractice from "./steps/StepBreathPractice";
import StepProjection from "./steps/StepProjection";
import InitiationStepKunoContext from "./steps/InitiationStepKunoContext";
import InitiationStepOmniScope from "./steps/InitiationStepOmniScope";
import InitiationStepDailyState from "./steps/InitiationStepDailyState";
import InitiationStepLesson from "./steps/InitiationStepLesson";
import InitiationStepLessonQuiz from "./steps/InitiationStepLessonQuiz";
import { FirstAction } from "@/components/onboarding/FirstAction";
import InitiationStepWelcome from "./steps/InitiationStepWelcome";

export type StepId =
  | "intro"
  | "miniTest"
  | "score"
  | "progressRedirect"
  | "journal"
  | "breath"
  | "projection";

type InitiationStepId =
  | "welcome"
  | "intro"
  | "first-action"
  | "omnikuno-context"
  | "journal"
  | "omniscope"
  | "daily-state"
  | "omnikuno-lesson-quiz"
  | "omnikuno-lesson";

const INITIATION_ORDER: InitiationStepId[] = [
  "welcome",
  "intro",
  "daily-state",
  "omnikuno-context",
  "omnikuno-lesson",
  "first-action",
  "omniscope",
  "journal",
  "omnikuno-lesson-quiz",
];

const isInitiationStep = (value: string | null): value is InitiationStepId =>
  Boolean(value) && INITIATION_ORDER.includes(value as InitiationStepId);

function ExperienceOnboardingContent() {
  const router = useRouter();
  const search = useSearchParams();
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const { lang } = useI18n();
  const { data: progress } = useProgressFacts(profile?.id);
  const focusThemeLabel =
    (progress as { omni?: { scope?: { theme?: string | null } } } | null)?.omni?.scope?.theme ?? null;
  const [menuOpen, setMenuOpen] = useState(false);
  const requireLogin = process.env.NEXT_PUBLIC_REQUIRE_LOGIN_FOR_ONBOARDING === '1';
  const bypassAuth = Boolean(search?.get("demo") || search?.get("e2e") === "1");
  const [blocked, setBlocked] = useState(false);
  const rawQuery = search?.toString() ?? "";
  const hasQueryParams = rawQuery.length > 0;

  // Read/normalize navigation state and step hooks BEFORE any early return to keep hook order stable
  const start = search?.get("start") === "1";
  const stepParamRaw = search?.get("step") as string | null;
  const flowParamRaw = search?.get("flow");
  const desiredFlow = (flowParamRaw || "default").toLowerCase();
  const shouldForceInitiation = !flowParamRaw && isInitiationStep(stepParamRaw);
  const flow = shouldForceInitiation ? "initiation" : desiredFlow;
  const stepParam =
    flow === "initiation"
      ? (isInitiationStep(stepParamRaw) ? stepParamRaw : null)
      : ((stepParamRaw as StepId | null) ?? null);
  const fallbackStep = flow === "initiation" ? "welcome" : "intro";
  const [step, setStep] = useState<string>(stepParam ?? fallbackStep);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<{ raw: number; max: number }>({ raw: 0, max: 0 });
  const [miniMeta, setMiniMeta] = useState<{ topicKey?: string; questions?: Array<{ id: string; correctIndex: number; style?: string }> } | undefined>();

  useEffect(() => {
    if (!shouldForceInitiation) return;
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("flow", "initiation");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [shouldForceInitiation, router, search]);

  useEffect(() => {
    if (hasQueryParams) return;
    const params = new URLSearchParams();
    params.set("flow", "initiation");
    params.set("step", "welcome");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [hasQueryParams, router]);

  // Optional gate: require login before onboarding/initiation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!requireLogin || bypassAuth) return;
    if (profile?.id) return;
    try {
      const returnTo = window.location.href;
      setBlocked(true);
      const target = `/progress?from=onboarding-auth&returnTo=${encodeURIComponent(returnTo)}`;
      router.replace(target);
    } catch {
      // Best-effort fallback
      router.replace('/progress?from=onboarding-auth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireLogin, profile?.id, bypassAuth]);

  // Normalize entry: if start=1 and no explicit step, set intro once
  useEffect(() => {
    if (start && !stepParam) {
      const params = new URLSearchParams(search?.toString() ?? "");
      params.set("step", fallbackStep);
      router.replace(`?${params.toString()}`, { scroll: false });
      setStep(fallbackStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, fallbackStep]);

  // NAV-02: keep local step in sync with URL at mount/refresh
  useEffect(() => {
    if (!stepParam) return;
    if (stepParam !== step) setStep(stepParam);
  }, [stepParam, step]);

  const go = (next: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("step", next);
    if (flow) params.set("flow", flow);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, String(v));
    }
    const navigate = flow === 'initiation' ? router.push : router.replace;
    navigate(`?${params.toString()}`, { scroll: false });
    setStep(next);
  };

  if (requireLogin && !profile?.id && blocked) {
    return null;
  }

  const header = <SiteHeader />;

  return (
    <>
      <AppShell header={header}>
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        {/* Breadcrumb for Initiation flow */}
        {flow === 'initiation' ? (
          (() => {
            const total = INITIATION_ORDER.length;
            const foundIndex = INITIATION_ORDER.indexOf(step as InitiationStepId);
            const idx = foundIndex >= 0 ? foundIndex + 1 : 1;
            return (
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">
                {lang === 'ro' ? `Pas ${idx}/${total}` : `Step ${idx}/${total}`}
              </div>
            );
          })()
        ) : null}
        {flow !== 'initiation' ? (
          <>
            {step === "intro" && (
              <StepIntro onStart={() => go("miniTest")} />
            )}
            {step === "miniTest" && (
              <StepMiniTest
                onSubmit={(a, s, meta) => {
                  setAnswers(a);
                  setScore(s);
                  setMiniMeta(meta);
                  go("score");
                }}
              />
            )}
            {step === "score" && (
              <StepMiniTestScore
                answers={answers}
                score={score}
                userId={profile?.id ?? null}
                topicKey={miniMeta?.topicKey}
                questionsMeta={miniMeta?.questions}
                onContinue={() => go("progressRedirect")}
              />
            )}
            {step === "progressRedirect" && (
              <StepProgressRedirect onRedirect={() => router.push("/progress?from=experience-onboarding")}/>
            )}
            {step === "journal" && (
              <StepJournal
                userId={profile?.id ?? null}
                onSaved={() => router.push("/progress?after=os")}
                onSkip={() => go("breath")}
              />
            )}
            {step === "breath" && (
              <StepBreathPractice userId={profile?.id} onDone={() => router.push("/progress?after=abil")} onSkip={() => go("projection")} />
            )}
            {step === "projection" && (
              <StepProjection onGoTraining={() => router.push("/antrenament")} />
            )}
          </>
        ) : (
          <>
            {/* Initiation flow */}
            {step === 'welcome' && (
              <InitiationStepWelcome onBegin={() => go('intro')} />
            )}
            {step === 'intro' && (
              <StepIntro onStart={() => go('daily-state')} />
            )}
            {step === 'daily-state' && (
              <InitiationStepDailyState onComplete={() => go('omnikuno-context')} />
            )}
            {step === 'omnikuno-context' && (
              <InitiationStepKunoContext userId={profile?.id ?? null} onContinue={() => go('omnikuno-lesson')} />
            )}
            {step === 'omnikuno-lesson' && (
              <InitiationStepLesson userId={profile?.id ?? null} onNext={() => go('first-action')} />
            )}
            {step === 'first-action' && (
              <FirstAction
                userId={profile?.id ?? null}
                themeLabel={focusThemeLabel}
                onComplete={() => go('omniscope')}
              />
            )}
            {step === 'omniscope' && (
              <InitiationStepOmniScope userId={profile?.id ?? null} onComplete={() => go('journal')} />
            )}
            {step === 'journal' && (
              <StepJournal
                userId={profile?.id ?? null}
                onSaved={() => go('omnikuno-lesson-quiz')}
                onSkip={() => go('omnikuno-lesson-quiz')}
              />
            )}
            {step === 'omnikuno-lesson-quiz' && (
              <InitiationStepLessonQuiz onDone={() => router.push('/progress?from=initiation&completed=1')} />
            )}
          </>
        )}
      </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}

export default function ExperienceOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ExperienceOnboardingContent />
    </Suspense>
  );
}
