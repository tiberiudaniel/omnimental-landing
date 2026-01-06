"use client";

import { OmniCtaButton } from "@/components/ui/OmniCtaButton";

export function GuidedDayOneHero({
  lang,
  onStart,
  title,
  reason,
  lessonSummary,
  ctaLabel,
  disabled,
  disabledLabel,
}: {
  lang: string;
  onStart: () => void;
  title?: string | null;
  reason?: string | null;
  lessonSummary?: string | null;
  ctaLabel?: string | null;
  disabled?: boolean;
  disabledLabel?: string | null;
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
        {title || (lang === "ro" ? "Claritate operațională" : "Operational clarity")}
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--omni-ink)] lg:text-3xl">
        {lang === "ro"
          ? "În 10–12 minute reduci zgomotul și alegi 1 decizie reală azi."
          : "In roughly 10 minutes you cut the noise and choose one real decision today."}
      </h1>
      <p className="mt-4 text-sm text-[var(--omni-ink-soft)]">
        {reason ||
          (lang === "ro"
            ? "Nu e motivație. E zgomot cognitiv. Azi îl reducem."
            : "This isn’t about motivation. It’s cognitive noise. Today we reduce it.")}
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <OmniCtaButton
          size="lg"
          className="w-full max-w-sm justify-center"
          onClick={onStart}
          data-testid="guided-day1-start"
          disabled={disabled}
        >
          {disabled
            ? disabledLabel ?? (lang === "ro" ? "Se pregătește planul…" : "Preparing session…")
            : ctaLabel ?? (lang === "ro" ? "Pornește sesiunea (10 min)" : "Start session (10 min)")}
        </OmniCtaButton>
      </div>
      <div className="mt-8 rounded-[24px] border border-dashed border-[var(--omni-border-soft)] bg-white/80 px-5 py-4 text-left text-sm text-[var(--omni-ink)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">
          {lang === "ro" ? "Ce primești azi" : "What you get today"}
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--omni-ink)]">
          {(lessonSummary ? [lessonSummary] : bullets).map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
        {disabled ? (
          <p className="mt-4 text-xs text-[var(--omni-muted)]">
            {disabledLabel ?? (lang === "ro" ? "Planul de azi se pregătește…" : "Preparing today’s plan…")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
