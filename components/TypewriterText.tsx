"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  speed?: number; // milisecunde între caractere
  mistakeChance?: number; // șansa de a face o greșeală (0-1)
}

export default function TypewriterText({ text, speed = 50, mistakeChance = 0.05 }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState("");
  const timeoutsRef = useRef<number[]>([]);
  const resetFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const clearScheduled = () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };

    clearScheduled();

    if (resetFrameRef.current !== null) {
      window.cancelAnimationFrame(resetFrameRef.current);
      resetFrameRef.current = null;
    }

    resetFrameRef.current = window.requestAnimationFrame(() => {
      setDisplayText("");
    });

    let cancelled = false;

    const schedule = (fn: () => void, delay: number) => {
      const id = window.setTimeout(fn, delay);
      timeoutsRef.current.push(id);
    };

    const typeNext = (index: number) => {
      if (cancelled || index >= text.length) return;
      const nextChar = text[index];

      const commitCorrect = () => {
        setDisplayText((prev) => prev + nextChar);
        const pause =
          nextChar === "." || nextChar === "," ? speed * 5 : speed;
        schedule(() => typeNext(index + 1), pause);
      };

      if (Math.random() < mistakeChance) {
        const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        setDisplayText((prev) => prev + wrongChar);

        schedule(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, speed * 1.5);

        schedule(() => {
          commitCorrect();
        }, speed * 3);
      } else {
        commitCorrect();
      }
    };

    schedule(() => typeNext(0), speed);

    return () => {
      cancelled = true;
      clearScheduled();
      if (resetFrameRef.current !== null) {
        window.cancelAnimationFrame(resetFrameRef.current);
        resetFrameRef.current = null;
      }
    };
  }, [text, speed, mistakeChance]);

  return (
    <h2
      className="text-3xl md:text-4xl font-mono font-medium text-center leading-snug mb-6"
      style={{
        color: "#232020ff",
        letterSpacing: "0.05em",
        textShadow: "1px 1px 2px rgba(0,0,0,0.08)",
        fontFamily: '"Courier Prime", monospace',
      }}
    >
      {displayText}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        _
      </motion.span>
    </h2>
  );
}
