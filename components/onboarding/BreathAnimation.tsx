"use client";

import { useEffect, useState } from "react";

export default function BreathAnimation({ seconds = 120 }: { seconds?: number }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const phase = Math.floor((t % 8) / 2); // 0..3
  const label = phase === 0 ? "Inspiră" : phase === 1 ? "Ține" : phase === 2 ? "Expiră" : "Ține";
  const progress = Math.min(1, t / seconds);
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4 h-40 w-40">
        <div
          className="absolute inset-0 rounded-full bg-[#EDE2D8]"
          style={{ transform: `scale(${0.7 + 0.3 * Math.sin((t % 8) * (Math.PI / 4))})`, transition: "transform 0.8s ease-in-out" }}
        />
      </div>
      <p className="text-sm text-[#4A3A30]">{label}</p>
      <div className="mt-3 h-2 w-64 rounded bg-[#F0E6DA]">
        <div className="h-full rounded bg-[#C07963]" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-1 text-xs text-[#7B6B60]">{t}s / {seconds}s</p>
    </div>
  );
}

