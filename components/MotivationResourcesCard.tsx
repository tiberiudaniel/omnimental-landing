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
    <div className="h-full rounded-[12px] border border-[#E4D8CE] bg-white px-4 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
      <header className="mb-1">
        <p className="text-sm font-semibold text-[#1F1F1F]">
          {lang === "ro" ? "Motivație & Resurse" : "Motivation & Resources"}
        </p>
      </header>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-[10px] border border-[#F0E6DA] bg-[#FFFBF7] px-2.5 py-1.5 text-[11px] text-[#2C2C2C]">
            <span className="text-[#7A6455]">{r.label}</span>
            <span className="font-semibold text-[#1F1F1F]">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-end border-t border-[#F0E6DA] pt-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-[10px] border border-[#2C2C2C] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white"
        >
          {lang === "ro" ? "Actualizează" : "Update"}
        </button>
      </div>
    </div>
  );
}
