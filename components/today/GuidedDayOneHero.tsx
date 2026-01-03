"use client";

import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export function GuidedDayOneHero({
  lang,
  onStart,
}: {
  lang: string;
  onStart: () => void;
}) {
  const bullets =
    lang === "ro"
      ? [
          "Îți numești starea mentală reală (nu „sunt leneș”).",
          "Identifici o sursă concretă de zgomot.",
          "Ieși cu o decizie aplicabilă azi.",
        ]
      : [
          "Name your real mental state (not “I’m lazy”).",
          "Identify one concrete source of noise.",
          "Leave with a decision you can act on today.",
        ];
  return (
    <section
      className="rounded-[32px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-6 py-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] lg:px-10"
      data-testid="guided-day1-hero"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Claritate operațională</p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)] lg:text-3xl">
        {lang === "ro" ? "În 1–3 minute reduci zgomotul și alegi 1 decizie reală azi." : "In 1–3 minutes you cut the noise and choose one real decision today."}
      </h1>
      <p className="mt-4 text-sm text-[var(--omni-ink-soft)]">
        {lang === "ro" ? "Nu e motivație. E zgomot cognitiv. Azi îl reducem." : "This isn’t about motivation. It’s cognitive noise. Today we reduce it."}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <OmniCtaButton
          size="lg"
          className="w-full max-w-sm justify-center"
          onClick={onStart}
          data-testid="guided-day1-start"
        >
          {lang === "ro" ? "Pornește sesiunea (3 min)" : "Start session (3 min)"}
        </OmniCtaButton>
      </div>
      <div className="mt-8 rounded-[24px] border border-dashed border-[var(--omni-border-soft)] bg-white/80 px-5 py-4 text-left text-sm text-[var(--omni-ink)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Ce primești azi" : "What you get today"}
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--omni-ink)]">
          {bullets.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
