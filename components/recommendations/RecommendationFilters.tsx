"use client";

import { useEffect, useState } from "react";

export type RecommendationFilterKey = "all" | "new" | "active" | "done" | "today";

const FILTERS: { key: RecommendationFilterKey; label: string }[] = [
  { key: "all", label: "Toate" },
  { key: "new", label: "Noi" },
  { key: "active", label: "În lucru" },
  { key: "done", label: "Finalizate" },
  { key: "today", label: "Azi" },
];

const PRIMARY_KEYS: RecommendationFilterKey[] = ["all", "active", "today"];

interface RecommendationFiltersProps {
  value: RecommendationFilterKey;
  onChange: (value: RecommendationFilterKey) => void;
  labels?: Partial<Record<RecommendationFilterKey, string>>;
  counts?: Partial<Record<RecommendationFilterKey, number>>;
}

export function RecommendationFilters({ value, onChange, labels, counts }: RecommendationFiltersProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {PRIMARY_KEYS.map((key) => {
          const base = FILTERS.find((f) => f.key === key)!;
          const label = labels?.[key] ?? base.label;
          const count = hydrated && typeof counts?.[key] === "number" ? ` (${counts![key]})` : "";
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition ${
                active
                  ? "border border-[var(--omni-border-soft)] text-[var(--omni-ink)]"
                  : "border border-transparent text-[var(--omni-ink-soft)] hover:text-[var(--omni-energy)]"
              }`}
            >
              {label}
              {count}
            </button>
          );
        })}
      </div>

      {/* Dropdown pentru filtre secundare */}
      <div className="relative">
        <details className="group">
          <summary className="list-none cursor-pointer inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] leading-none transition border border-transparent text-[var(--omni-ink-soft)] hover:text-[var(--omni-energy)]">⋯</summary>
          <div className="absolute right-0 z-10 mt-1 w-40 rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-2 shadow-lg">
            {(["new", "done"] as RecommendationFilterKey[]).map((key) => {
              const base = FILTERS.find((f) => f.key === key)!;
              const label = labels?.[key] ?? base.label;
              const count = hydrated && typeof counts?.[key] === "number" ? ` (${counts![key]})` : "";
              const active = value === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  className={`block w-full rounded-[8px] px-2 py-1 text-left text-xs ${
                    active ? "bg-[var(--omni-bg-paper)] text-[var(--omni-ink)]" : "text-[var(--omni-muted)] hover:bg-[var(--omni-bg-paper)]"
                  }`}
                >
                  {label}
                  {count}
                </button>
              );
            })}
          </div>
        </details>
      </div>
    </div>
  );
}
