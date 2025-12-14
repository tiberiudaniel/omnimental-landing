"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { useI18n } from "@/components/I18nProvider";
import { INTRO_COPY } from "./introCopy";
import { FREE_CONTINUE_URL, UPGRADE_URL } from "@/lib/constants/routes";
import { track } from "@/lib/telemetry/track";

interface ContractCardProps {
  onExploreMore: () => void;
  onAction?: () => void;
}

export function ContractCard({ onExploreMore, onAction }: ContractCardProps) {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "ro";
  const copy = INTRO_COPY.contract[locale];
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    track("contract_shown");
  }, []);

  const handleClick = (action: "guided" | "free_continue" | "plans") => {
    track("contract_clicked", { action });
    onAction?.();
  };

  return (
    <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] sm:px-8">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Card 3</p>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">{copy.heading}</h2>
        <div className="rounded-[20px] border border-[var(--omni-border-soft)]/60 bg-[var(--omni-bg-main)] px-4 py-4 text-sm text-[var(--omni-ink)]/85">
          <p className="font-semibold">{copy.options.guided.label}</p>
          <p className="text-[var(--omni-ink)]/70">{copy.options.guided.subLabel}</p>
          <OmniCtaButton
            as="link"
            href={copy.options.guided.href}
            className="mt-3 w-full justify-center sm:w-auto"
            onClick={() => handleClick("guided")}
          >
            {locale === "ro" ? "Încep ghidat" : "Start guided"}
          </OmniCtaButton>
        </div>
        <div className="rounded-[20px] border border-[var(--omni-border-soft)]/60 bg-[var(--omni-bg-main)] px-4 py-4 text-sm text-[var(--omni-ink)]/85">
          <p className="font-semibold">{copy.options.free.label}</p>
          <p className="text-[var(--omni-ink)]/70">{copy.options.free.subLabel}</p>
          <OmniCtaButton
            as="link"
            variant="neutral"
            href={FREE_CONTINUE_URL}
            className="mt-3 w-full justify-center sm:w-auto"
            onClick={() => handleClick("free_continue")}
          >
            {copy.options.free.label}
          </OmniCtaButton>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
          <Link
            href={UPGRADE_URL}
            className="text-[var(--omni-energy)] underline-offset-4 hover:underline"
            onClick={() => handleClick("plans")}
          >
            {copy.options.plans}
          </Link>
          <button
            type="button"
            onClick={() => {
              onExploreMore();
              onAction?.();
            }}
            className="text-[var(--omni-muted)] hover:text-[var(--omni-ink)]"
          >
            {copy.moreLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

