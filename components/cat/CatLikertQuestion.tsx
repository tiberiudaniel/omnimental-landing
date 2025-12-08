"use client";

import type { CatItemConfig } from "@/config/catEngine";

const SCALE_LABELS = [
  "Deloc adevărat",
  "Rareori",
  "Uneori",
  "Moderat",
  "Deseori",
  "Foarte des",
  "Întotdeauna",
];

type CatLikertQuestionProps = {
  item: CatItemConfig;
  value?: number;
  onChange: (value: number) => void;
};

export default function CatLikertQuestion({ item, value, onChange }: CatLikertQuestionProps) {
  return (
    <fieldset className="space-y-3 rounded-[16px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] p-4 shadow-[0_6px_18px_rgba(0,0,0,0.05)]">
      <legend className="text-base font-medium text-[var(--omni-ink)]">{item.text}</legend>
      <div className="flex flex-wrap gap-2">
        {SCALE_LABELS.map((label, index) => {
          const optionValue = index + 1;
          const isSelected = value === optionValue;
          return (
            <label
              key={`${item.id}-${optionValue}`}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-[10px] border px-3 py-2 text-xs uppercase tracking-[0.25em] transition ${
                isSelected
                  ? "border-[var(--omni-energy)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]"
                  : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
              }`}
            >
              <input
                type="radio"
                value={optionValue}
                checked={isSelected}
                onChange={() => onChange(optionValue)}
                name={item.id}
                className="hidden"
              />
              <span className="text-base font-semibold leading-none">{optionValue}</span>
              <span className="text-[10px] font-medium tracking-[0.2em]">{label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
