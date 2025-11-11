"use client";

import { motion } from "framer-motion";

type DistEntry = { label: string; value: number };

type Props = {
  lang: "ro" | "en";
  sparkValues: number[];
  distribution: DistEntry[];
};

export default function ProgressTrends({ lang, sparkValues, distribution }: Props) {
  return (
    <section className="mx-auto mb-6 max-w-5xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)] md:col-span-2">
          <header className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1F1F1F]">
              {lang === "ro" ? "Trend 7 zile: Calm (proxy)" : "7-day trend: Calm (proxy)"}
            </p>
            <span className="text-xs text-[#7A6455]">
              {lang === "ro" ? "Auto-raport" : "Self-report"}
            </span>
          </header>
          <div className="h-24 w-full">
            <div className="flex h-full items-end gap-1">
              {sparkValues.length === 0 ? (
                <p className="text-xs text-[#7A6455]">
                  {lang === "ro" ? "Nu există încă date." : "No data yet."}
                </p>
              ) : (
                sparkValues.map((v, i) => {
                  const h = Math.max(6, Math.min(100, v * 8));
                  return (
                    <motion.div
                      key={`spark-${i}`}
                      className="w-3 rounded-sm bg-[#C07963]"
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
        <div className="rounded-[16px] border border-[#E4D8CE] bg-white px-6 py-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
          <header className="mb-2">
            <p className="text-sm font-semibold text-[#1F1F1F]">
              {lang === "ro" ? "Distribuția temelor" : "Theme distribution"}
            </p>
          </header>
          <ul className="space-y-2">
            {distribution.length === 0 ? (
              <li className="text-xs text-[#7A6455]">
                {lang === "ro" ? "Încă nu ai selectat teme." : "No selections yet."}
              </li>
            ) : (
              distribution.map((d) => (
                <li key={d.label} className="flex items-center justify-between text-sm text-[#2C2C2C]">
                  <span>{d.label}</span>
                  <span className="font-semibold">{d.value}%</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
