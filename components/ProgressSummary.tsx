"use client";

type Props = {
  urgency?: number | null;
  stage?: string | null;
  globalLoad?: string | null;
  updatedAt?: string | null;
  omniIntelScore?: number | null;
  omniLevel?: string | null;
};

export default function ProgressSummary({ urgency, stage, globalLoad, updatedAt, omniIntelScore, omniLevel }: Props) {
  return (
    <section className="rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/95 px-6 py-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-1 gap-3 text-sm text-[var(--omni-ink)] sm:grid-cols-6">
        <SummaryItem label="OmniIntel" value={typeof omniIntelScore === "number" ? `${omniIntelScore}/100` : "-"} />
        <SummaryItem label="Nivel" value={omniLevel ?? "-"} />
        <SummaryItem label="Urgență" value={typeof urgency === "number" ? `${urgency}/10` : "-"} />
        <SummaryItem label="Etapă" value={stage ?? "-"} />
        <SummaryItem label="Intensitate globală" value={globalLoad ?? "-"} />
        <SummaryItem label="Ultima actualizare" value={updatedAt ?? "-"} />
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-4 py-3">
      <span className="text-xs uppercase tracking-[0.3em] text-[var(--omni-muted)]">{label}</span>
      <span className="font-semibold text-[var(--omni-ink)]">{value}</span>
    </div>
  );
}
