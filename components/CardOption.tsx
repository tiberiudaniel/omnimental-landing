// components/CardOption.tsx
"use client";

import { useState } from "react";
import { useI18n } from "../components/I18nProvider";

interface CardOptionProps {
  type: "individual" | "group";
  title?: string;
  onClick: () => void;
}

export default function CardOption({ type, title, onClick }: CardOptionProps) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`m-4 p-8 border rounded-2xl w-64 text-center cursor-pointer transition-all duration-200 ${
        hovered ? "bg-[#F6F2EE] shadow-lg scale-105" : "bg-white"
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <h3 className="text-xl font-semibold">{title || t(type)}</h3>
      <p className="mt-2 text-gray-600">
        {type === "individual"
          ? t("individualDescription") || "Personal one-on-one session"
          : t("groupDescription") || "Collaborative group experience"}
      </p>
    </div>
  );
}

