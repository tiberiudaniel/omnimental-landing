"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useI18n } from "@/components/I18nProvider";
import { track } from "@/lib/telemetry/track";
import { useProfile } from "@/components/ProfileProvider";
import { useAuth } from "@/components/AuthProvider";
import type { Plan } from "@/lib/stripe/prices";
import { ensureAuth, getFirebaseAuth } from "@/lib/firebase";

const PLAN_OPTIONS: Plan[] = ["monthly", "annual"];

const COPY = {
  ro: {
    title: "Activează OmniMental",
    subtitle: "Antrenament ghidat. 5–7 minute pe zi.",
    bullets: [
      "Traseu ghidat zilnic (5–7 min)",
      "Istoric & progres",
      "Recomandări adaptative",
    ],
    plans: {
      monthly: { label: "Lunar", description: "Acces complet, fără contract." },
      annual: { label: "Anual", description: "Economisești și primești check-in trimestrial.", tag: "Recomandat" },
    },
    primaryCta: "Activează planul",
    backCta: "Înapoi",
    errors: {
      auth: "Ai nevoie de cont pentru a activa planul.",
      generic: "A apărut o eroare. Reîncearcă.",
      setup: "Payment setup indisponibil momentan. Încearcă mai târziu.",
      authNotReady: "Autentificarea nu e gata. Reîncarcă și încearcă din nou.",
      signInRequired: "Trebuie să fii autentificat pentru a activa planul.",
    },
  },
  en: {
    title: "Activate OmniMental",
    subtitle: "Guided training. 5–7 minutes a day.",
    bullets: [
      "Daily guided path (5–7 min)",
      "History & progress",
      "Adaptive recommendations",
    ],
    plans: {
      monthly: { label: "Monthly", description: "Full access, cancel anytime." },
      annual: { label: "Annual", description: "Save more + quarterly check-ins.", tag: "Recommended" },
    },
    primaryCta: "Activate plan",
    backCta: "Back",
    errors: {
      auth: "You need an account to activate a plan.",
      generic: "Something went wrong. Please try again.",
      setup: "Payment setup is unavailable. Try again later.",
      authNotReady: "Auth not ready. Refresh and try again.",
      signInRequired: "You must sign in before activating a plan.",
    },
  },
} as const;

export default function UpgradePage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const copy = COPY[locale];
  const router = useRouter();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    track("upgrade_viewed");
  }, []);

  const planList = useMemo(() => PLAN_OPTIONS, []);

  const handlePrimary = async () => {
    if (submitting) return;
    if (!profile?.id) {
      setErrorMessage(copy.errors.signInRequired);
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await ensureAuth();
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser ?? user ?? null;
      if (!currentUser) {
        setErrorMessage(copy.errors.authNotReady);
        return;
      }
      const idToken = await currentUser.getIdToken(true).catch((error) => {
        console.warn("failed to acquire id token", error);
        return null;
      });
      if (!idToken) {
        setErrorMessage(copy.errors.authNotReady);
        return;
      }
      track("upgrade_primary_clicked", { plan: selectedPlan });
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      if (!response.ok) {
        let detail = "";
        const textPayload = await response.text().catch(() => "");
        if (textPayload) {
          try {
            const parsed = JSON.parse(textPayload) as { error?: string; message?: string; hint?: string };
            detail = parsed.message ?? parsed.error ?? "";
            if (parsed.hint) {
              detail = detail ? `${detail} (${parsed.hint})` : parsed.hint;
            }
          } catch {
            detail = textPayload;
          }
        }
        if (!detail) {
          detail = response.status >= 500 ? copy.errors.setup : copy.errors.generic;
        }
        setErrorMessage(`Checkout failed (${response.status}): ${detail}`);
        return;
      }
      const payload = (await response.json().catch(() => null)) as { url?: string } | null;
      if (!payload?.url) {
        setErrorMessage(copy.errors.generic);
        return;
      }
      track("checkout_redirected", { plan: selectedPlan });
      window.location.href = payload.url;
    } catch (error) {
      console.error("upgrade checkout failed", error);
      const fallback =
        error instanceof Error && error.message ? `${copy.errors.generic} (${error.message})` : copy.errors.generic;
      setErrorMessage(fallback);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    track("upgrade_back_clicked");
    router.back();
  };

  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-[32px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.15)] sm:px-10">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">{copy.subtitle}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--omni-ink)]/80 sm:text-base text-left">
            {copy.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span className="mt-[6px] h-2 w-2 rounded-full bg-[var(--omni-ink)]/60" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {planList.map((planKey) => {
            const plan = copy.plans[planKey];
            const planTag = "tag" in plan ? plan.tag : undefined;
            const isRecommended = Boolean(planTag);
            const isSelected = selectedPlan === planKey;
            return (
              <button
                type="button"
                key={planKey}
                className={clsx(
                  "relative rounded-[24px] border px-5 py-6 text-left transition-all duration-200",
                  isSelected
                    ? "border-[var(--omni-energy)] bg-[var(--omni-energy)]/5 shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
                    : "border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] hover:-translate-y-[1px] hover:border-[var(--omni-border-strong)]",
                )}
                aria-pressed={isSelected}
                onClick={() => setSelectedPlan(planKey)}
              >
                {isRecommended ? (
                  <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-[var(--omni-energy)]/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
                    {planTag}
                  </span>
                ) : null}
                <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{plan.label}</p>
                <p className="mt-3 text-sm text-[var(--omni-ink)]/85">{plan.description}</p>
                {isSelected ? (
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
                    {locale === "ro" ? "Plan selectat" : "Selected plan"}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
        {errorMessage ? <p className="text-sm text-[var(--omni-energy)]">{errorMessage}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <OmniCtaButton
            className="justify-center sm:min-w-[220px]"
            onClick={handlePrimary}
            disabled={submitting}
          >
            {copy.primaryCta}
          </OmniCtaButton>
          <OmniCtaButton
            variant="neutral"
            className="justify-center sm:min-w-[220px]"
            onClick={handleBack}
          >
            {copy.backCta}
          </OmniCtaButton>
        </div>
      </div>
    </div>
  );
}
