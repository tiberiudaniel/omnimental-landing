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
    <div className="mx-auto mb-2 max-w-5xl rounded-[10px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)]/85 px-3 py-2 text-xs text-[var(--omni-ink)] shadow-[0_8px_18px_rgba(0,0,0,0.05)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2.5 py-1 font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
          OmniIntel: <span className="ml-1 text-[var(--omni-ink)]">{scoreText}</span>
        </span>
        <span className="rounded-full border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-2.5 py-1 font-semibold uppercase tracking-[0.25em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Nivel" : "Level"}: <span className="ml-1 text-[var(--omni-ink)]">{levelText}</span>
        </span>
      </div>
    </div>
  );
}

