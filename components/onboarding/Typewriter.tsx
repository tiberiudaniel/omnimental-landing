"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Typewriter({
  text,
  speed = 60,
  className,
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(0);
  const chars = useMemo(() => Array.from(text), [text]);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (shown >= chars.length) return;
    const s = Math.max(10, speed + Math.floor(Math.random() * 40) - 20);
    timerRef.current = window.setTimeout(() => setShown((n) => Math.min(chars.length, n + 1)), s);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [shown, chars.length, speed]);
  const paragraphClass = ["cursor-text whitespace-pre-wrap", className ?? "text-[#2C2C2C]"].join(" ");
  return (
    <p onClick={() => setShown(chars.length)} className={paragraphClass} aria-live="polite">
      {chars.slice(0, shown).join("")}
      {shown < chars.length ? <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-[#C07963] align-baseline" /> : null}
    </p>
  );
}
