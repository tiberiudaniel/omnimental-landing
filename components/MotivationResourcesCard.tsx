"use client";

type Motivation = {
  urgency?: number;
  determination?: number;
  hoursPerWeek?: number;
  budgetLevel?: string;
  formatPreference?: string;
};

export default function MotivationResourcesCard({
  lang,
  motivation,
  onEdit,
}: {
  lang: "ro" | "en";
  motivation?: Motivation | null;
  onEdit: () => void;
}) {
  const m = motivation ?? {};
  const rows = [
    { label: lang === "ro" ? "Urgență" : "Urgency", value: m.urgency != null ? `${m.urgency}/10` : "-" },
    { label: lang === "ro" ? "Determinare" : "Determination", value: m.determination != null ? `${m.determination}/10` : "-" },
    { label: lang === "ro" ? "Ore / săptămână" : "Hours / week", value: m.hoursPerWeek != null ? `${m.hoursPerWeek}` : "-" },
    { label: lang === "ro" ? "Buget" : "Budget", value: m.budgetLevel ?? "-" },
    { label: lang === "ro" ? "Preferință format" : "Format preference", value: m.formatPreference ?? "-" },
  ];
  return (
    <div className="h-full rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-4 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
      <header className="mb-1">
        <p className="text-sm font-semibold text-[var(--omni-ink)]">
          {lang === "ro" ? "Motivație & Resurse" : "Motivation & Resources"}
        </p>
      </header>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2.5 py-1.5 text-[11px] text-[var(--omni-ink)]">
            <span className="text-[var(--omni-muted)]">{r.label}</span>
            <span className="font-semibold text-[var(--omni-ink)]">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end border-t border-[var(--omni-border-soft)] pt-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-[10px] border border-[var(--omni-border-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
        >
          {lang === "ro" ? "Actualizează" : "Update"}
        </button>
      </div>
    </div>
  );
}
