"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TypewriterText from "./TypewriterText";

type Props = {
  lines: string[];
  speed?: number;
  gapMs?: number; // pause between lines
  wrapperClassName?: string;
  headingClassName?: string;
  onDone?: () => void;
};

export default function MultiTypewriter({ lines, speed = 60, gapMs = 450, wrapperClassName = "mb-5 w-full bg-transparent px-0 py-0", headingClassName, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const sig = useMemo(() => lines.join("|"), [lines]);
  const prevSigRef = useRef<string>(sig);
  // Reset index asynchronously when lines change to avoid cascading-render lint
  useEffect(() => {
    if (prevSigRef.current !== sig) {
      prevSigRef.current = sig;
      const id = requestAnimationFrame(() => setIdx(0));
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [sig]);
  const line = lines[idx] ?? "";
  return (
    <TypewriterText
      key={`${idx}-${line}`}
      text={line}
      speed={speed}
      enableSound
      wrapperClassName={wrapperClassName}
      headingClassName={headingClassName}
      onComplete={() => {
        if (idx < lines.length - 1) {
          // slightly quicker progression with smaller variance: ~0.38–0.62s around gapMs
          const variance = 160; // ±80ms
          const min = 350;
          const max = 650;
          const pause = Math.max(min, Math.min(max, Math.round(gapMs + (Math.random() * variance - variance / 2))));
          setTimeout(() => setIdx((i) => i + 1), pause);
        } else if (onDone) {
          onDone();
        }
      }}
    />
  );
}
