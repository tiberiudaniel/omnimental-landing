// components/CardOption.tsx
"use client";

import { useMemo, useState } from "react";
import { useI18n } from "../components/I18nProvider";

interface CardOptionProps {
  type: "individual" | "group";
  title?: string;
  onClick: () => void;
  isSelected?: boolean;
  isRecommended?: boolean;
  recommendedLabel?: string;
}

export default function CardOption({
  type,
  title,
  onClick,
  isSelected = false,
  isRecommended = false,
  recommendedLabel,
}: CardOptionProps) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const descriptionKey =
    type === "individual" ? "individualDescription" : "groupDescription";
  const descriptionValue = t(descriptionKey);
  const description = useMemo(() => {
    if (typeof descriptionValue === "string") return descriptionValue;
    return type === "individual"
      ? "Personal one-on-one session"
      : "Collaborative group experience";
  }, [descriptionValue, type]);

  const fallbackTitle = t(type);
  const heading = title ?? (typeof fallbackTitle === "string" ? fallbackTitle : type);
  const activeState = hovered || isSelected;

  return (
    <div
      className={`relative w-full max-w-xs cursor-pointer rounded-[12px] border p-8 text-left transition ${
        activeState
          ? "border-[#E60012] bg-[#F6F2EE]/95 shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
          : "border-[#D8C6B6] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.35em] text-[#E60012]">
        {type === "individual" ? "Individual" : "Group"}
      </div>
      <h3 className="mt-3 text-xl font-semibold text-[#1F1F1F]">{heading}</h3>
      <div className="mt-3 h-px w-12 bg-[#D8C6B6]" />
      <p className="mt-4 text-sm leading-6 text-[#2C2C2C]">
        {description}
      </p>
      {isRecommended && (
        <div className="absolute right-4 top-4 rounded-full border border-[#E60012]/40 bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#E60012]">
          {recommendedLabel || "Recommended"}
        </div>
      )}
      {isSelected && (
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full border border-[#E60012]/40 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E60012]">
          ✓
        </div>
      )}
    </div>
  );
}
