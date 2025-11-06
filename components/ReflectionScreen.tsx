"use client";

import { useEffect, useState } from "react";
import TypewriterText from "./TypewriterText";

interface ReflectionScreenProps {
  lines: string[];
  buttonLabel: string;
  onContinue: () => void;
  delay?: number;
}

export default function ReflectionScreen({
  lines,
  buttonLabel,
  onContinue,
  delay = 2500,
}: ReflectionScreenProps) {
  const [showButton, setShowButton] = useState(lines.length === 0);

  useEffect(() => {
    if (lines.length === 0) return;
    const timeout = setTimeout(() => {
      setShowButton(true);
    }, delay * lines.length);
    return () => clearTimeout(timeout);
  }, [lines, delay]);

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl space-y-6 rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        {lines
          .filter((line) => Boolean(line?.trim()))
          .slice(0, 1)
          .map((line, index) => (
            <TypewriterText key={`${line}-${index}`} text={line} speed={90} enableSound />
          ))}

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
