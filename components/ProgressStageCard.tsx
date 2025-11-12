"use client";

import { motion } from "framer-motion";
type Status = "complete" | "inProgress" | "stale";

type Props = {
  title: string;
  subtitle?: string;
  percent: number;
  status: Status;
  ctaLabel: string;
  onAction: () => void;
  locked?: boolean;
  lockHint?: string;
};

export default function ProgressStageCard({ title, subtitle, percent, ctaLabel, onAction, locked = false, lockHint }: Props) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative flex flex-col gap-1.5 rounded-[12px] border border-[#E4D8CE] bg-white px-3 py-3 shadow-[0_6px_14px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#C07963]">{title}</p>
          {subtitle ? <p className="text-[11px] text-[#4A3A30]">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={locked}
          className={`rounded-[10px] border px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.25em] transition ${locked ? "cursor-not-allowed border-[#D8C6B6] text-[#A08F82]" : "border-[#2C2C2C] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"}`}
        >
          {ctaLabel}
        </button>
      </div>
      <div className="h-1 w-full rounded-full bg-[#E9DED3]">
        <motion.div
          key={safePercent}
          className="h-full rounded-full bg-gradient-to-r from-[#1F1F1F] via-[#A2541A] to-[#E60012]"
          initial={{ width: 0 }}
          animate={{ width: `${safePercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="text-right text-[10px] text-[#5C4F45]">{safePercent}%</div>
      {locked ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute inset-0 rounded-[12px] bg-white/60 backdrop-blur-[1px]"
        >
          <div className="pointer-events-auto absolute inset-x-0 bottom-3 px-4">
            <div className="mx-auto max-w-sm rounded-[10px] border border-dashed border-[#E4D8CE] bg-white/90 px-3 py-2 text-center text-[10px] uppercase tracking-[0.25em] text-[#A08F82]">
              🔒 {lockHint ?? "Se deblochează mai târziu"}
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
