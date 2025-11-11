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
  icon?: React.ReactNode;
};

export default function ProgressStageCard({ title, subtitle, percent, status, ctaLabel, onAction, locked = false, lockHint, icon }: Props) {
  const badge = status === "complete" ? "✅" : status === "inProgress" ? "🕓" : "🔄";
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative flex flex-col gap-3 rounded-[16px] border border-[#E4D8CE] bg-white px-5 py-5 shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#C07963]">{badge} {icon ? <span aria-hidden>{icon}</span> : null} {title}</p>
          {subtitle ? <p className="text-sm text-[#4A3A30]">{subtitle}</p> : null}
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={locked}
          className={`rounded-[10px] border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] transition ${locked ? "cursor-not-allowed border-[#D8C6B6] text-[#A08F82]" : "border-[#2C2C2C] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"}`}
        >
          {ctaLabel}
        </button>
      </div>
      <div className="h-2 w-full rounded-full bg-[#E9DED3]">
        <motion.div
          key={safePercent}
          className="h-full rounded-full bg-gradient-to-r from-[#1F1F1F] via-[#A2541A] to-[#E60012]"
          initial={{ width: 0 }}
          animate={{ width: `${safePercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <div className="text-right text-xs text-[#5C4F45]">{safePercent}%</div>
      {locked ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute inset-0 rounded-[16px] bg-white/60 backdrop-blur-[1px]"
        >
          <div className="pointer-events-auto absolute inset-x-0 bottom-3 px-4">
            <div className="mx-auto max-w-sm rounded-[10px] border border-dashed border-[#E4D8CE] bg-white/90 px-3 py-2 text-center text-[11px] uppercase tracking-[0.25em] text-[#A08F82]">
              🔒 {lockHint ?? "Se deblochează mai târziu"}
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
