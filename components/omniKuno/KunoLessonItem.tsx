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
  onLockedAttempt?: () => void;
};

export default function KunoLessonItem({ lesson, isActive, disabled, onSelect, header, children, onLockedAttempt }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isActive]);

  const locked = disabled || lesson.status === "locked";

  return (
    <div
      ref={ref}
      className={`rounded-card border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] transition shadow-sm ${
        locked
          ? "opacity-60"
          : isActive
            ? "shadow-[0_25px_50px_rgba(192,121,99,0.25)]"
            : "shadow-sm"
      }`}
      data-state={isActive ? "open" : "closed"}
      data-status={lesson.status}
      data-completed={lesson.status === "done" ? "true" : "false"}
      data-active={isActive ? "true" : "false"}
    >
      <button
        type="button"
        onClick={() => {
          if (locked) {
            onLockedAttempt?.();
            return;
          }
          onSelect();
        }}
        data-testid="kuno-lesson-trigger"
        className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${
          locked ? "cursor-not-allowed" : "hover:bg-[var(--omni-bg-paper)]"
        }`}
      >
        {header}
      </button>
      {isActive ? <div className="border-t border-[#F0E8E0] px-4 py-4">{children}</div> : null}
    </div>
  );
}
