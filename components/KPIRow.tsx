"use client";

import KPICard from "./KPICard";

type KPIItem = {
  title: string;
  value: number | string;
  trend?: number[];
};

export default function KPIRow({ items }: { items: KPIItem[] }) {
  const hints: Record<string, string> = {
    "Clarity Index": "Claritate & focus (teme legate de focalizare)",
    "Calm Index": "Calm & reglare (stres/anxietate)",
    "Vitality Index": "Energie & reziliență",
  };
  return (
    <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {items.map((it, idx) => {
        const hint = hints[it.title] ?? it.title;
        return (
          <KPICard key={`${it.title}-${idx}`} title={it.title} value={it.value} trend={it.trend} tooltip={hint} />
        );
      })}
    </div>
  );
}
