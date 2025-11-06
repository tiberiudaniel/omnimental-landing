"use client";

import { useEffect, useMemo, useState } from "react";
import TypewriterText from "./TypewriterText";

interface ReflectionScreenProps {
  lines: string[];
  buttonLabel: string;
  onContinue: () => void;
  delay?: number;
  helperLine?: string;
}

export default function ReflectionScreen({
  lines,
  buttonLabel,
  onContinue,
  delay = 2200,
  helperLine,
}: ReflectionScreenProps) {
  const filteredLines = useMemo(
    () => lines.filter((line) => Boolean(line?.trim())),
    [lines],
  );
  const [revealedCount, setRevealedCount] = useState(
    filteredLines.length > 0 ? 1 : 0,
  );
  const [showButton, setShowButton] = useState(filteredLines.length === 0);

  useEffect(() => {
    setRevealedCount(filteredLines.length > 0 ? 1 : 0);
    setShowButton(filteredLines.length === 0);
    if (filteredLines.length <= 1) {
      if (filteredLines.length === 1) {
        const timer = setTimeout(() => setShowButton(true), delay + 800);
        return () => clearTimeout(timer);
      }
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    filteredLines.slice(1).forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setRevealedCount((prev) =>
            Math.min(prev + 1, filteredLines.length),
          );
        }, delay * (index + 1)),
      );
    });

    timers.push(
      setTimeout(
        () => setShowButton(true),
        delay * filteredLines.length + 600,
      ),
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [filteredLines, delay]);

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        {filteredLines.slice(0, revealedCount).map((line, index) => (
          <TypewriterText
            key={`${line}-${index}`}
            text={line}
            speed={90}
            enableSound
          />
        ))}

        {helperLine && (
          <p className="text-sm text-[#2C2C2C]/80">{helperLine}</p>
        )}

        {showButton ? (
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
          >
            {buttonLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
