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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const chars = useMemo(() => Array.from(text), [text]);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
    handleChange();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);
  useEffect(() => {
    let frame: number | null = null;
    frame = window.requestAnimationFrame(() => {
      setShown(prefersReducedMotion ? chars.length : 0);
    });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [chars.length, prefersReducedMotion, text]);
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (shown >= chars.length) return;
    const s = Math.max(10, speed + Math.floor(Math.random() * 40) - 20);
    timerRef.current = window.setTimeout(() => setShown((n) => Math.min(chars.length, n + 1)), s);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [shown, chars.length, speed, prefersReducedMotion]);
  const baseClass = ["cursor-text whitespace-pre-wrap", className ?? "text-[var(--omni-ink)]"].join(" ");
  const placeholderClass = [
    "invisible whitespace-pre-wrap col-start-1 row-start-1",
    className ?? "text-[var(--omni-ink)]",
  ].join(" ");
  const content = chars.slice(0, shown).join("");
  const completed = shown >= chars.length;
  return (
    <div className="grid">
      <p className={placeholderClass} aria-hidden="true">
        {text}
      </p>
      <p
        onClick={() => setShown(chars.length)}
        className={`col-start-1 row-start-1 ${baseClass}`}
        aria-live="off"
        data-complete={completed ? "true" : undefined}
      >
        {content}
        {!completed ? (
          <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-[var(--omni-energy)] align-baseline" />
        ) : null}
      </p>
      {completed ? (
        <span className="sr-only" aria-live="polite">
          {text}
        </span>
      ) : null}
    </div>
  );
}
