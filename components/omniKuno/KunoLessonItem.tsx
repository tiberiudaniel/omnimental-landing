"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { OmniKunoLessonType, OmniKunoLessonStatus } from "@/config/omniKunoLessons";

export type KunoLessonAccordionItem = {
  id: string;
  order: number;
  title: string;
  type: OmniKunoLessonType;
  status: OmniKunoLessonStatus;
  difficulty?: "easy" | "medium" | "hard";
};

type Props = {
  lesson: KunoLessonAccordionItem;
  isActive: boolean;
  disabled?: boolean;
  onSelect: () => void;
  header: ReactNode;
  children?: ReactNode;
};

export default function KunoLessonItem({ lesson, isActive, disabled, onSelect, header, children }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isActive]);

  const locked = disabled || lesson.status === "locked";

  return (
    <div ref={ref} className="rounded-2xl border border-[#E4DAD1] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => {
          if (locked) return;
          onSelect();
        }}
        className={`flex w-full items-center justify-between px-3 py-3 text-left transition ${
          locked ? "cursor-not-allowed" : "hover:bg-[#FFFBF7]"
        }`}
      >
        {header}
      </button>
      {isActive ? <div className="border-t border-[#F0E8E0] px-4 py-4">{children}</div> : null}
    </div>
  );
}
