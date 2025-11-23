"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useProfile } from "@/components/ProfileProvider";
import { useI18n } from "@/components/I18nProvider";
import StepIntro from "./steps/StepIntro";
import StepMiniTest from "./steps/StepMiniTest";
import StepMiniTestScore from "./steps/StepMiniTestScore";
import StepProgressRedirect from "./steps/StepProgressRedirect";
import StepJournal from "./steps/StepJournal";
import StepBreathPractice from "./steps/StepBreathPractice";
import StepProjection from "./steps/StepProjection";
import InitiationStepJournal from "./steps/InitiationStepJournal";
import InitiationStepKunoContext from "./steps/InitiationStepKunoContext";
import InitiationStepOmniScope from "./steps/InitiationStepOmniScope";
import InitiationStepDailyState from "./steps/InitiationStepDailyState";
import InitiationStepLesson from "./steps/InitiationStepLesson";
import InitiationStepLessonQuiz from "./steps/InitiationStepLessonQuiz";

export type StepId =
  | "intro"
  | "miniTest"
  | "score"
  | "progressRedirect"
  | "journal"
  | "breath"
  | "projection";

type InitiationStepId =
  | "intro"
  | "omnikuno-test"
  | "omnikuno-context"
  | "journal"
  | "omniscope"
  | "daily-state"
  | "omnikuno-lesson-quiz"
  | "omnikuno-lesson";

function ExperienceOnboardingContent() {
  const router = useRouter();
  const search = useSearchParams();
  const navLinks = useNavigationLinks();
  const { profile } = useProfile();
  const { lang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const requireLogin = process.env.NEXT_PUBLIC_REQUIRE_LOGIN_FOR_ONBOARDING === '1';
  const bypassAuth = Boolean(search?.get("demo") || search?.get("e2e") === "1");
  const [blocked, setBlocked] = useState(false);

  // Read/normalize navigation state and step hooks BEFORE any early return to keep hook order stable
  const start = search?.get("start") === "1";
  const flow = (search?.get("flow") || "default").toLowerCase();
  const stepParamRaw = search?.get("step") as string | null;
  const stepParam = (flow === 'initiation'
    ? (stepParamRaw as InitiationStepId | null)
    : (stepParamRaw as StepId | null)
  ) ?? null;
  const [step, setStep] = useState<string>(stepParam ?? (start ? "intro" : "intro"));
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<{ raw: number; max: number }>({ raw: 0, max: 0 });
  const [miniMeta, setMiniMeta] = useState<{ topicKey?: string; questions?: Array<{ id: string; correctIndex: number; style?: string }> } | undefined>();

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
      params.set("step", "intro");
      router.replace(`?${params.toString()}`, { scroll: false });
      setStep("intro");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

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
    // Initiation: replace without creating per-step history
    router.replace(`?${params.toString()}`, { scroll: false });
    setStep(next);
  };

  if (requireLogin && !profile?.id && blocked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader compact />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        {/* Breadcrumb for Initiation flow */}
        {flow === 'initiation' ? (
          (() => {
            const order: InitiationStepId[] = ['intro','omnikuno-test','omnikuno-context','journal','omniscope','daily-state','omnikuno-lesson','omnikuno-lesson-quiz'];
            const idx = Math.max(0, order.indexOf((step as InitiationStepId))) + 1;
            const total = order.length;
            return (
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A08F82]">
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
            {step === 'intro' && (
              <StepIntro onStart={() => go('omnikuno-test')} />
            )}
            {step === 'omnikuno-test' && (
              <>
                {(() => {
                  // render mini test then score
                  if (answers.length && score.max > 0) {
                    return (
                      <StepMiniTestScore
                        answers={answers}
                        score={score}
                        userId={profile?.id ?? null}
                        topicKey={miniMeta?.topicKey}
                        questionsMeta={miniMeta?.questions}
                        onContinue={() => go('omnikuno-context')}
                      />
                    );
                  }
                  return (
                    <StepMiniTest
                      autoSubmitAfterMin
                      onSubmit={(a, s, meta) => {
                        setAnswers(a);
                        setScore(s);
                        setMiniMeta(meta);
                      }}
                    />
                  );
                })()}
              </>
            )}
            {step === 'omnikuno-context' && (
              <InitiationStepKunoContext userId={profile?.id ?? null} onContinue={() => router.push('/progress?from=initiation&step=omnikuno-test-done')} />
            )}
            {step === 'journal' && (
              <InitiationStepJournal />
            )}
            {step === 'omniscope' && (
              <InitiationStepOmniScope userId={profile?.id ?? null} />
            )}
            {step === 'daily-state' && (
              <InitiationStepDailyState />
            )}
            {step === 'omnikuno-lesson' && (
              <InitiationStepLesson userId={profile?.id ?? null} onNext={() => go('omnikuno-lesson-quiz')} />
            )}
            {step === 'omnikuno-lesson-quiz' && (
              <InitiationStepLessonQuiz onDone={() => router.push('/progress?from=initiation&completed=1')} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function ExperienceOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ExperienceOnboardingContent />
    </Suspense>
  );
}
