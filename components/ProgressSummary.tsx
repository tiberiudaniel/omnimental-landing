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
    <section className="rounded-[16px] border border-[#E4D8CE] bg-white/95 px-6 py-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-1 gap-3 text-sm text-[#2C2C2C] sm:grid-cols-6">
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
    <div className="flex items-center justify-between rounded-[12px] border border-[#F0E6DA] bg-[#FFFBF7] px-4 py-3">
      <span className="text-xs uppercase tracking-[0.3em] text-[#A08F82]">{label}</span>
      <span className="font-semibold text-[#1F1F1F]">{value}</span>
    </div>
  );
}
