"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TypewriterText from "./TypewriterText";

type Props = {
  lines: string[];
  speed?: number;
  gapMs?: number; // pause between lines
  wrapperClassName?: string;
  onDone?: () => void;
};

export default function MultiTypewriter({ lines, speed = 60, gapMs = 500, wrapperClassName = "mb-5 w-full bg-transparent px-0 py-0", onDone }: Props) {
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
      onComplete={() => {
        if (idx < lines.length - 1) {
          // small variance for a natural feel: 0.4–0.6s
          const pause = Math.max(400, Math.min(600, Math.round(gapMs + (Math.random() * 200 - 100))));
          setTimeout(() => setIdx((i) => i + 1), pause);
        } else if (onDone) {
          onDone();
        }
      }}
    />
  );
}
