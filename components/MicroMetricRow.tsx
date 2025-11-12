"use client";

import MicroMetricCard from "./MicroMetricCard";

type Item = { label: string; value: string | number; hint?: string };

export default function MicroMetricRow({ items }: { items: Item[] }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it, idx) => (
        <MicroMetricCard key={`${it.label}-${idx}`} label={it.label} value={it.value} hint={it.hint} />
      ))}
    </div>
  );
}

