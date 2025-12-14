"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { FREE_CONTINUE_URL } from "@/lib/constants/routes";
import { track } from "@/lib/telemetry/track";

const COPY = {
  ro: {
    title: "Plan activat",
    body: "Contul tău are acum acces complet la OmniMental. Hai să continuăm.",
    cta: "Continuă în OmniMental",
  },
  en: {
    title: "Plan activated",
    body: "Your account now has full access to OmniMental. Let's keep going.",
    cta: "Continue in OmniMental",
  },
} as const;

export default function UpgradeSuccessPage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const copy = COPY[locale];

  useEffect(() => {
    track("upgrade_success_viewed");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-12 text-[var(--omni-ink)] sm:px-6">
      <div className="w-full max-w-xl rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.12)] sm:px-10">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">OmniMental</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--omni-ink)]/80 sm:text-base">{copy.body}</p>
        <div className="mt-8 flex justify-center">
          <OmniCtaButton
            as="link"
            href={`${FREE_CONTINUE_URL}?source=upgrade_success`}
            className="min-w-[220px] justify-center"
          >
            {copy.cta}
          </OmniCtaButton>
        </div>
      </div>
    </div>
  );
}
