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
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  className?: string;
}

export default function CardOption({
  type,
  title,
  onClick,
  isSelected = false,
  isRecommended = false,
  recommendedLabel,
  disabled = false,
  isLoading = false,
  loadingLabel,
  className,
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
  const activeState = (hovered && !disabled) || isSelected;

  const handleActivate = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <div
      data-testid={`card-${type}`}
      className={`relative mx-auto w-full basis-[320px] max-w-[380px] rounded-[12px] border p-7 text-left transition ${
        activeState
          ? "border-[#E60012] bg-[#F6F2EE]/95 shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
          : "border-[#D8C6B6] bg-white shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
      } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${className ?? ""}`}
      onClick={handleActivate}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => !disabled && setHovered(false)}
      onFocus={() => !disabled && setHovered(true)}
      onBlur={() => !disabled && setHovered(false)}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isSelected}
      aria-disabled={disabled}
    >
      <h3 className="mt-1.5 text-lg sm:text-xl font-semibold text-[#1F1F1F]">{heading}</h3>
      <div className="mt-2.5 h-px w-12 bg-[#D8C6B6]" />
      <p className="mt-3 text-[13px] leading-6 text-[#2C2C2C]">
        {description}
      </p>
      {isRecommended && (
        <div className="badge-accent absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]">
          {recommendedLabel || (t("recommended") as string) || "Recommended"}
        </div>
      )}
      {isSelected && (
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full border border-[#E60012]/40 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E60012]">
          ✓
        </div>
      )}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-[12px] bg-white/80 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C]">
          {loadingLabel ?? "Se salvează..."}
        </div>
      ) : null}
    </div>
  );
}
