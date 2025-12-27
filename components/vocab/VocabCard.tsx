"use client";

import { useState } from "react";
import clsx from "clsx";
import { track } from "@/lib/telemetry/track";
import { useVocab } from "./useVocab";

type VocabCardProps = {
  vocabId: string | null | undefined;
  locale?: "ro" | "en";
  size?: "mini" | "full";
  variant?: "full" | "public";
  showMeta?: boolean;
  className?: string;
  showFitCheck?: boolean;
  onFitCheck?: (result: "yes" | "no") => void;
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
  size = "mini",
  variant = "full",
  showMeta = false,
  className,
  showFitCheck = false,
  onFitCheck,
  cta,
}: VocabCardProps) {
  const vocab = useVocab(vocabId);
  const isMini = size === "mini";
  const isPublic = variant === "public";
  const [detailsOpen, setDetailsOpen] = useState(false);
  const stateLabel = vocab.stateLabel[locale] ?? vocab.stateLabel.ro;
  const command = vocab.command[locale] ?? vocab.command.ro;
  const definition = vocab.definition?.[locale] ?? vocab.definition?.ro ?? "";
  const scienceLabel = vocab.scienceLabel;
  const bridge = vocab.bridge;
  const promise = vocab.promise;
  const antiPrefix = LABELS.avoid[locale] ?? LABELS.avoid.ro;
  const actionPrefix = LABELS.doNow[locale] ?? LABELS.doNow.ro;
  const detailLabel = locale === "ro" ? "Detalii practice" : "Practical details";
  const fitQuestionLabel = locale === "ro" ? "Are sens?" : "Does it make sense?";
  const fitYesLabel = locale === "ro" ? "Da" : "Yes";
  const fitNoLabel = locale === "ro" ? "Nu chiar" : "Not quite";

  const handleFitCheck = (result: "yes" | "no") => {
    const primaryTag = vocab.tagsPrimary?.[0];
    const payload: Record<string, unknown> = {
      vocabId: vocab.id,
      result,
      size,
      variant,
    };
    if (result === "no") {
      payload.vocab_mismatch = true;
      if (primaryTag) {
        payload.primaryTag = primaryTag;
      }
    }
    void track("mindpacing_vocab_fit", payload);
    onFitCheck?.(result);
  };

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
          {scienceLabel ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--omni-muted)]">{scienceLabel}</p> : null}
          {definition ? <p className="mt-3 text-sm text-[var(--omni-ink)]/85">{definition}</p> : null}
          {bridge ? <p className="mt-3 text-sm text-[var(--omni-muted)]">{bridge}</p> : null}
          {promise ? <p className="mt-2 text-sm font-semibold text-[var(--omni-ink)]/90">{promise}</p> : null}
        </div>
        {!isMini && !isPublic ? (
          <div className="rounded-2xl border border-dashed border-[var(--omni-border-soft)] bg-white/60 p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-[var(--omni-ink)]"
              onClick={() => setDetailsOpen((open) => !open)}
              aria-expanded={detailsOpen}
            >
              <span>{detailLabel}</span>
              <span className="text-base">{detailsOpen ? "−" : "+"}</span>
            </button>
            {detailsOpen ? (
              <div className="mt-3 space-y-2 text-sm text-[var(--omni-ink)]/85">
                <p className="font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)]">{command}</p>
                <p>
                  <span className="font-semibold text-[var(--omni-ink)]">{antiPrefix} </span>
                  {vocab.antiPattern}
                </p>
                <p>
                  <span className="font-semibold text-[var(--omni-ink)]">{actionPrefix} </span>
                  {vocab.microAction}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
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
        {showFitCheck ? (
          <div className="mt-4 text-xs text-[var(--omni-muted)]">
            <span className="mr-3 font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink)]">{fitQuestionLabel}</span>
            <div className="inline-flex gap-2 align-middle">
              <button
                type="button"
                onClick={() => handleFitCheck("yes")}
                className="rounded-full border border-[var(--omni-energy)] px-3 py-1 text-[11px] font-semibold text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)]/10"
              >
                {fitYesLabel}
              </button>
              <button
                type="button"
                onClick={() => handleFitCheck("no")}
                className="rounded-full border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--omni-muted)] transition hover:border-[var(--omni-ink)]/30 hover:text-[var(--omni-ink)]"
              >
                {fitNoLabel}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
