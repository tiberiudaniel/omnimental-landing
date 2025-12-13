"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

type IntroSlideVariant = "normal" | "split";

interface IntroSlideProps {
  title?: string;
  lines: string[];
  variant?: IntroSlideVariant;
  children?: ReactNode;
}

export function IntroSlide({ title, lines, variant = "normal", children }: IntroSlideProps) {
  return (
    <div
      className={clsx(
        "w-full rounded-[32px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:px-8 sm:py-10",
        variant === "split" ? "space-y-6" : "space-y-4",
      )}
    >
      {title ? (
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--omni-ink)] sm:text-3xl">{title}</h2>
      ) : null}
      <div className="space-y-2 text-base leading-relaxed text-[var(--omni-ink)]/90 sm:text-lg">
        {lines.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
      {children ? <div className="pt-2">{children}</div> : null}
    </div>
  );
}

