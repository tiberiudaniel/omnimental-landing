"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

interface TypewriterTextProps {
  text: string;
}

export default function TypewriterText({ text }: TypewriterTextProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey((prev) => prev + 1);
  }, [text]);

  const characters = useMemo(() => Math.max(Array.from(text ?? "").length, 1), [text]);
  const durationSeconds = useMemo(() => Math.min(Math.max(characters * 0.05, 1.2), 4), [characters]);

  const styleVars: CSSProperties = {
    "--typewriter-steps": characters,
    "--typewriter-duration": `${durationSeconds}s`,
  };

  return (
    <div className="mb-6 w-full bg-[#F6F2EE] px-6 py-5">
      <h2
        className="text-center text-2xl font-semibold leading-snug text-[#1F1F1F] md:text-[28px]"
        style={{
          letterSpacing: "0.04em",
          fontFamily: '"Courier Prime", monospace',
        }}
      >
        <span key={animationKey} className="inline-block">
          <span className="typewriter-text" style={styleVars}>
            {text}
          </span>
        </span>
      </h2>
      <style jsx>{`
        .typewriter-text {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 1px solid #1f1f1f;
          padding-right: 2px;
          animation:
            typing var(--typewriter-duration) steps(var(--typewriter-steps), end) forwards,
            cursor-blink 0.85s step-end infinite;
          width: var(--typewriter-steps)ch;
        }

        @keyframes typing {
          from {
            width: 0ch;
          }
          to {
            width: var(--typewriter-steps)ch;
          }
        }

        @keyframes cursor-blink {
          0%,
          100% {
            border-right-color: transparent;
          }
          50% {
            border-right-color: #1f1f1f;
          }
        }
      `}</style>
    </div>
  );
}
