"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import MenuOverlay from "@/components/MenuOverlay";
import { AppShell } from "@/components/AppShell";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useNavigationLinks } from "@/components/useNavigationLinks";
import { useAuth } from "@/components/AuthProvider";
import { useProgressFacts } from "@/components/useProgressFacts";
import { useEarnedRoundsController } from "@/components/today/useEarnedRounds";
import { useUserAccessTier } from "@/components/useUserAccessTier";
import { track } from "@/lib/telemetry/track";

const FEEDBACK_OPTIONS = [
  { id: "not-useful", label: "Nu prea utilă" },
  { id: "ok", label: "OK" },
  { id: "useful", label: "Utilă" },
  { id: "very-useful", label: "Foarte utilă" },
] as const;

const MICRO_COMMIT_OPTIONS = [
  { id: "breathing", label: "Respir 60s" },
  { id: "note", label: "Scriu 1 notiță" },
  { id: "walk", label: "Fac 10 pași conștienți" },
  { id: "reality-check", label: "Reality check 30s" },
] as const;

type ChoiceGroupProps = {
  title: string;
  description: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  value: string | null;
  onChange: (value: string) => void;
  testIdPrefix?: string;
};

function ChoiceGroup({ title, description, options, value, onChange, testIdPrefix }: ChoiceGroupProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--omni-ink)]/80">{description}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              data-testid={testIdPrefix ? `${testIdPrefix}-${option.id}` : undefined}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                selected
                  ? "border-[var(--omni-energy)] bg-[var(--omni-energy)]/10 text-[var(--omni-energy)]"
                  : "border-[var(--omni-border-soft)] bg-white text-[var(--omni-ink)]"
              }`}
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TodayEarnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const navLinks = useNavigationLinks();
  const { user } = useAuth();
  const { data: progressFacts } = useProgressFacts(user?.uid ?? null);
  const { accessTier, membershipTier } = useUserAccessTier();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackChoice, setFeedbackChoice] = useState<string | null>(null);
  const [commitChoice, setCommitChoice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const earnedRounds = useEarnedRoundsController(progressFacts ?? null);
  const creditsRemaining = Math.max(0, 3 - earnedRounds.state.usedToday - earnedRounds.state.credits);
  const roundParam = searchParams.get("round");

  useEffect(() => {
    track("today_earn_viewed");
  }, []);

  const handleBackToToday = () => {
    track("today_earn_back");
    router.push("/today");
  };

  const handleUpgrade = () => {
    track("today_earn_upgrade");
    router.push("/upgrade");
  };

  const limitReached = !earnedRounds.canEarnMore;

  const handleSubmit = async () => {
    if (!feedbackChoice || !commitChoice || submitting || limitReached) {
      return;
    }
    setSubmitting(true);
    try {
      await earnedRounds.earn();
      track("today_earn_completed", { feedback: feedbackChoice, commitment: commitChoice });
      const params = new URLSearchParams({ source: "earn_gate" });
      if (roundParam) {
        params.set("round", roundParam);
      }
      router.push(`/today/next?${params.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(feedbackChoice && commitChoice && !submitting && !limitReached);

  const header = (
    <SiteHeader
      showMenu={accessTier.flags.showMenu}
      onMenuToggle={() => setMenuOpen(true)}
      onAuthRequest={() => router.push("/auth?returnTo=%2Ftoday%2Fearn")}
    />
  );


  return (
    <>
      <AppShell header={header}>
        <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-10 text-[var(--omni-ink)] sm:px-6 lg:px-8" data-testid="earn-root">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-white/95 px-6 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Earn gate</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Deblochează încă o rundă</h1>
              <p className="mt-2 text-sm text-[var(--omni-ink)]/75">
                Feedback scurt + micro-angajament. Îți ia sub 20 de secunde și îți acordă 1 credit (maxim 3 runde extra/zi).
              </p>
              <div className="mt-4 rounded-2xl border border-[var(--omni-border-soft)] bg-white px-4 py-3 text-sm">
                <p className="font-semibold">Runde folosite azi: {earnedRounds.state.usedToday}/3</p>
                <p className="text-[var(--omni-muted)]">
                  Credite disponibile: {earnedRounds.state.credits} · Credite rămase de câștigat azi: {creditsRemaining}
                </p>
              </div>
              <div className="mt-6 space-y-6">
                {limitReached ? (
                  <div className="space-y-4" data-testid="earn-limit">
                    <p className="text-sm text-[var(--omni-ink)]/80" data-testid="earn-limit-reached">
                      Ai atins limita de 3 runde extra pentru azi. Revino mâine sau activează Premium pentru acces nelimitat.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <OmniCtaButton className="justify-center sm:flex-1" onClick={handleBackToToday}>
                        Înapoi la Today
                      </OmniCtaButton>
                      {membershipTier === "free" ? (
                        <OmniCtaButton variant="neutral" className="justify-center sm:flex-1" onClick={handleUpgrade}>
                          Activează Premium
                        </OmniCtaButton>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <>
                    <ChoiceGroup
                      title="Feedback rapid"
                      description="Cât de utilă a fost sesiunea de azi?"
                      options={FEEDBACK_OPTIONS}
                      value={feedbackChoice}
                      onChange={setFeedbackChoice}
                      testIdPrefix="earn-feedback"
                    />
                    <ChoiceGroup
                      title="Micro-angajament"
                      description="Alege o acțiune scurtă pentru azi"
                      options={MICRO_COMMIT_OPTIONS}
                      value={commitChoice}
                      onChange={setCommitChoice}
                      testIdPrefix="earn-commit"
                    />
                  </>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <OmniCtaButton
                    className="justify-center sm:flex-1"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    data-testid="earn-submit"
                  >
                    Deblochează încă o rundă
                  </OmniCtaButton>
                  <button
                    type="button"
                    className="rounded-[14px] border border-[var(--omni-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--omni-ink)] sm:flex-1"
                    onClick={handleBackToToday}
                  >
                    Renunță (înapoi la Today)
                  </button>
                </div>
                {membershipTier === "free" ? (
                  <p className="text-xs text-[var(--omni-muted)]">
                    Vrei acces liber la Another Round?{" "}
                    <button type="button" className="underline" onClick={handleUpgrade}>
                      Activează OmniMental Premium
                    </button>
                    .
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </AppShell>
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} links={navLinks} />
    </>
  );
}
export default function TodayEarnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--omni-bg-main)]" />}>
      <TodayEarnPageInner />
    </Suspense>
  );
}
