"use client";

import { useEffect, useMemo, useState } from "react";
import TypewriterText from "./TypewriterText";

interface ReflectionScreenProps {
  lines: string[];
  onContinue: () => void;
}

export default function ReflectionScreen({ lines, onContinue }: ReflectionScreenProps) {
  const primaryLine = useMemo(() => {
    const cleaned = lines.find((line) => line && line.trim().length > 0);
    return cleaned ?? "";
  }, [lines]);

  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setFinished(false);
  }, [primaryLine]);

  useEffect(() => {
    if (!finished) return;
    const timer = setTimeout(() => {
      onContinue();
    }, 600);
    return () => clearTimeout(timer);
  }, [finished, onContinue]);

  return (
    <section className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center bg-[#FDFCF9] px-6 py-16">
      <div className="w-full max-w-3xl rounded-[16px] border border-[#E4D8CE] bg-white/92 px-8 py-12 text-center shadow-[0_20px_45px_rgba(0,0,0,0.08)] backdrop-blur-[2px]">
        <TypewriterText text={primaryLine} speed={90} enableSound onComplete={() => setFinished(true)} />
      </div>
    </section>
  );
}
