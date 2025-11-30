"use client";

import { motion } from "framer-motion";

type Props = {
  lang: "ro" | "en";
  sparkValues: number[];
};

export default function ProgressTrendsLeft({ lang, sparkValues }: Props) {
  return (
    <div className="h-full rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
      <header className="mb-2 flex items-center justify-between">
            <p className="t-title-sm text-[var(--omni-ink)]">
              {lang === "ro" ? "Trend 7 zile: Echilibru emoțional (proxy)" : "7-day trend: Emotional balance (proxy)"}
            </p>
        <span className="text-xs text-[var(--omni-muted)]">
          {lang === "ro" ? "Auto-raport" : "Self-report"}
        </span>
      </header>
      <div className="mt-2 h-[150px] w-full">
        <div className="flex h-full items-end gap-1.5">
          {sparkValues.length === 0 ? (
            <p className="text-xs text-[var(--omni-muted)]">
              {lang === "ro" ? "Nu există încă date." : "No data yet."}
            </p>
          ) : (
            sparkValues.map((v, i) => {
              const h = Math.max(18, Math.min(140, v * 13.5));
              return (
                <motion.div
                  key={`spark-left-${i}`}
                  className="w-5 rounded-sm bg-[var(--omni-energy)]"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: h, opacity: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.03, ease: "easeOut" }}
                  aria-label={`t${i}: ${v}`}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
