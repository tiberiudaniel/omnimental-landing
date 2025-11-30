"use client";

import React from "react";

type Item<T extends string | number> = { value: T; label?: string };

export default function SegmentedControl<T extends string | number>({
  items,
  value,
  onChange,
  getTestId,
  className,
  suppressActive,
}: {
  items: Array<Item<T>>;
  value: T;
  onChange: (v: T) => void;
  getTestId?: (v: T) => string | undefined;
  className?: string;
  suppressActive?: boolean;
}) {
  return (
    <div className={`inline-flex flex-wrap gap-2 ${className ?? ""}`} role="tablist" aria-orientation="horizontal">
      {items.map((it) => {
        const active = !suppressActive && it.value === value;
        const testId = getTestId ? getTestId(it.value) : undefined;
        return (
          <button
            key={`${String(it.value)}`}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={testId}
            onClick={() => onChange(it.value)}
            className={`rounded-[10px] border px-3 py-1.5 text-sm transition ${
              active
                ? "border-[var(--omni-border-soft)] bg-[#F2EAE0] text-[var(--omni-ink)]"
                : "border-[#E8DCCE] bg-[var(--omni-surface-card)] text-[var(--omni-ink)] hover:border-[var(--omni-border-soft)]"
            }`}
          >
            {it.label ?? String(it.value)}
          </button>
        );
      })}
    </div>
  );
}
