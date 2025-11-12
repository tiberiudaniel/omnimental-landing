"use client";

type Props = {
  omniIntelScore?: number | null;
  omniLevel?: string | null;
  lang: "ro" | "en";
};

export default function StickyMiniSummary({ omniIntelScore, omniLevel, lang }: Props) {
  const scoreText = typeof omniIntelScore === "number" ? `${omniIntelScore}/100` : "-";
  const levelText = omniLevel ?? "-";
  return (
    <div className="mx-auto mb-2 max-w-5xl rounded-[10px] border border-[#E4D8CE] bg-white/85 px-3 py-2 text-xs text-[#2C2C2C] shadow-[0_8px_18px_rgba(0,0,0,0.05)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-full border border-[#F0E6DA] bg-[#FFFBF7] px-2.5 py-1 font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
          OmniIntel: <span className="ml-1 text-[#1F1F1F]">{scoreText}</span>
        </span>
        <span className="rounded-full border border-[#F0E6DA] bg-[#FFFBF7] px-2.5 py-1 font-semibold uppercase tracking-[0.25em] text-[#A08F82]">
          {lang === "ro" ? "Nivel" : "Level"}: <span className="ml-1 text-[#1F1F1F]">{levelText}</span>
        </span>
      </div>
    </div>
  );
}

