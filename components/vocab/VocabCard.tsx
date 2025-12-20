"use client";

import clsx from "clsx";
import { useVocab } from "./useVocab";

type VocabCardProps = {
  vocabId: string | null | undefined;
  locale?: "ro" | "en";
  variant?: "mini" | "full";
  showMeta?: boolean;
  className?: string;
  cta?: {
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
  };
};

const LABELS = {
  avoid: {
    ro: "Evită:",
    en: "Avoid:",
  },
  doNow: {
    ro: "Fă acum:",
    en: "Do now:",
  },
  axisLabel: {
    ro: "Axa",
    en: "Axis",
  },
};

export default function VocabCard({
  vocabId,
  locale = "ro",
  variant = "mini",
  showMeta = false,
  className,
  cta,
}: VocabCardProps) {
  const vocab = useVocab(vocabId);
  const isMini = variant === "mini";
  const stateLabel = vocab.stateLabel[locale] ?? vocab.stateLabel.ro;
  const command = vocab.command[locale] ?? vocab.command.ro;
  const antiPrefix = LABELS.avoid[locale] ?? LABELS.avoid.ro;
  const actionPrefix = LABELS.doNow[locale] ?? LABELS.doNow.ro;

  return (
    <div
      className={clsx(
        "w-full rounded-[24px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)] sm:px-6",
        className,
      )}
    >
      <div className="space-y-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">
            {showMeta ? `${LABELS.axisLabel[locale] ?? LABELS.axisLabel.ro}: ${vocab.axisId}` : " "}
          </p>
          <h3 className="truncate text-[22px] font-semibold text-[var(--omni-ink)] sm:text-[26px]">{stateLabel}</h3>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--omni-energy)]">{command}</p>
        </div>
        {!isMini ? (
          <div className="space-y-2 text-sm text-[var(--omni-ink)]/85">
            <p className="line-clamp-2">
              <span className="font-semibold text-[var(--omni-ink)]">{antiPrefix} </span>
              {vocab.antiPattern}
            </p>
            <p className="line-clamp-2">
              <span className="font-semibold text-[var(--omni-ink)]">{actionPrefix} </span>
              {vocab.microAction}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--omni-ink)]/70">{vocab.microAction}</p>
        )}
        {cta && !isMini ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
            <button
              type="button"
              onClick={cta.onPrimary}
              className="w-full rounded-full bg-[var(--omni-energy)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white sm:w-auto"
            >
              {cta.primaryLabel}
            </button>
            {cta.secondaryLabel && cta.onSecondary ? (
              <button
                type="button"
                onClick={cta.onSecondary}
                className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]"
              >
                {cta.secondaryLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
