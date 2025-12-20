"use client";

import clsx from "clsx";
import { useVocab } from "./useVocab";

type VocabChipProps = {
  vocabId: string | null | undefined;
  locale?: "ro" | "en";
  variant?: "default" | "new";
  onClick?: () => void;
  className?: string;
};

const NEW_LABEL: Record<"ro" | "en", string> = {
  ro: "NOU",
  en: "NEW",
};

export default function VocabChip({
  vocabId,
  locale = "ro",
  variant = "default",
  onClick,
  className,
}: VocabChipProps) {
  const vocab = useVocab(vocabId);
  const text = vocab.stateLabel[locale] ?? vocab.stateLabel.ro;
  const newLabel = NEW_LABEL[locale] ?? NEW_LABEL.ro;
  const clickable = typeof onClick === "function";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={clsx(
        "inline-flex h-[32px] max-w-full items-center gap-2 rounded-full border border-[var(--omni-border-soft)] px-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] shadow-[0_2px_6px_rgba(0,0,0,0.04)]",
        clickable ? "hover:border-[var(--omni-ink)]/70 focus-visible:outline focus-visible:outline-2" : "cursor-default",
        className,
      )}
      style={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}
    >
      <span className="truncate">{text}</span>
      {variant === "new" ? (
        <span className="rounded-full bg-[var(--omni-energy)] px-2 py-[2px] text-[10px] font-bold text-white">
          {newLabel}
        </span>
      ) : null}
    </button>
  );
}
