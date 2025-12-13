"use client";

import Link from "next/link";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-[var(--omni-bg-main)] px-4 py-16 text-[var(--omni-ink)]">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--omni-muted)]">Upgrade</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Planurile OmniMental</h1>
        <p className="text-base text-[var(--omni-ink)]/85 sm:text-lg">
          Conținutul complet de pricing și upgrade este în pregătire. Între timp, scrie-ne la{" "}
          <Link href="mailto:hello@omnimental.ro" className="underline">
            hello@omnimental.ro
          </Link>{" "}
          și îți trimitem detaliile.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <OmniCtaButton as="link" href="mailto:hello@omnimental.ro">
            Contactează-ne
          </OmniCtaButton>
          <OmniCtaButton as="link" variant="neutral" href="/intro">
            Înapoi la intro
          </OmniCtaButton>
        </div>
        <p className="text-xs text-[var(--omni-muted)]">
          TODO: înlocuiește cu pagina reală de pricing când este gata.
        </p>
      </div>
    </div>
  );
}

