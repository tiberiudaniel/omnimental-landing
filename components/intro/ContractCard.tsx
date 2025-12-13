"use client";

import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { UPGRADE_URL } from "@/lib/constants/routes";

interface ContractCardProps {
  onExploreMore: () => void;
}

export function ContractCard({ onExploreMore }: ContractCardProps) {
  return (
    <section className="rounded-[28px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] sm:px-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Card 3</p>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">
          Contract cognitiv
        </h2>
        <p className="text-sm leading-relaxed text-[var(--omni-ink)]/80 sm:text-base">
          Poți continua în două moduri:
        </p>
        <div className="rounded-[20px] border border-[var(--omni-border-soft)]/60 bg-[var(--omni-bg-main)] px-4 py-4 text-sm text-[var(--omni-ink)]/85">
          <p className="font-semibold">Explorare liberă</p>
          <p className="text-[var(--omni-ink)]/70">
            Continuă în ritmul tău, fără a salva nimic. Revino oricând în hub-ul gratuit.
          </p>
        </div>
        <div className="rounded-[20px] border border-[var(--omni-border-soft)]/60 bg-[var(--omni-bg-main)] px-4 py-4 text-sm text-[var(--omni-ink)]/85">
          <p className="font-semibold">Antrenament zilnic ghidat</p>
          <p className="text-[var(--omni-ink)]/70">Primești un Daily Path adaptat profilului tău și monitorizare minimă.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <OmniCtaButton as="link" href={UPGRADE_URL}>
            Vezi planurile
          </OmniCtaButton>
          <button
            type="button"
            onClick={onExploreMore}
            className="rounded-full border border-[var(--omni-border-soft)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-bg-main)]"
          >
            Mai explorez
          </button>
        </div>
      </div>
    </section>
  );
}
