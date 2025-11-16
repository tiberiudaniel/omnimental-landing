"use client";

import { motion } from "framer-motion";

type Props = {
  lang: "ro" | "en";
  sparkValues: number[];
};

export default function ProgressTrendsLeft({ lang, sparkValues }: Props) {
  return (
    <div className="h-full rounded-[12px] border border-[#E4D8CE] bg-white px-5 py-2 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
      <header className="mb-2 flex items-center justify-between">
        <p className="t-title-sm text-[#1F1F1F]">
          {lang === "ro" ? "Trend 7 zile: Echilibru emoțional (proxy)" : "7-day trend: Calm (proxy)"}
        </p>
        <span className="text-xs text-[#7A6455]">
          {lang === "ro" ? "Auto-raport" : "Self-report"}
        </span>
      </header>
      <div className="mt-2 h-[150px] w-full">
        <div className="flex h-full items-end gap-1.5">
          {sparkValues.length === 0 ? (
            <p className="text-xs text-[#7A6455]">
              {lang === "ro" ? "Nu există încă date." : "No data yet."}
            </p>
          ) : (
            sparkValues.map((v, i) => {
              const h = Math.max(18, Math.min(140, v * 13.5));
              return (
                <motion.div
                  key={`spark-left-${i}`}
                  className="w-5 rounded-sm bg-[#C07963]"
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
