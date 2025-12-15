"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [isFading, setIsFading] = useState(false);

  const handleStart = () => {
    if (isFading) return;
    setIsFading(true);
    onStart();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#0e1015] text-[#E6E7EB]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        pointerEvents: "auto",
        transition: "opacity 0.4s ease",
        opacity: isFading ? 0 : 1,
      }}
    >
      <div className="relative flex w-full max-w-[540px] flex-col items-center gap-10 px-6 text-center">
        <div className="text-sm font-medium uppercase tracking-[0.4em] text-[#E6E7EB]/70">
          OmniMental
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="group relative w-full max-w-[320px] rounded-full border border-[#E6E7EB]/30 bg-transparent px-10 py-4 text-lg font-semibold uppercase tracking-[0.5em] text-[#E6E7EB] transition-all duration-300 hover:border-[#E6E7EB] hover:bg-[#E6E7EB]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6E7EB]/60"
        >
          <span className="inline-flex w-full items-center justify-center gap-3">
            <span>Intră</span>
            <span className="h-[1px] w-6 bg-[#E6E7EB]/70 transition-all duration-300 group-hover:w-10" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}
