// components/CardOption.tsx
"use client";

import { useMemo, useState } from "react";
import { useI18n } from "../components/I18nProvider";

interface CardOptionProps {
  type: "individual" | "group";
  title?: string;
  onClick: () => void;
}

export default function CardOption({ type, title, onClick }: CardOptionProps) {
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
  return (
    <div
      className={`relative w-full max-w-xs cursor-pointer rounded-[12px] border border-[#D8C6B6] p-8 text-left transition ${
        hovered
          ? "border-[#E60012] bg-[#F6F2EE]/95 shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
          : "bg-white shadow-[0_12px_32px_rgba(0,0,0,0.05)]"
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
    >
      <div
        className={`text-xs font-semibold uppercase tracking-[0.35em] ${
          hovered ? "text-[#E60012]" : "text-[#A08F82]"
        }`}
      >
        {type === "individual" ? "Individual" : "Group"}
      </div>
      <h3 className="mt-3 text-xl font-semibold text-[#1F1F1F]">{heading}</h3>
      <div className="mt-3 h-px w-12 bg-[#D8C6B6]" />
      <p className="mt-4 text-sm leading-6 text-[#2C2C2C]">
        {description}
      </p>
    </div>
  );
}
