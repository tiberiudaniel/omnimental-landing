"use client";

import { useMemo, useState } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import type { RecallBlock as RecallPromptBlock } from "@/lib/initiations/buildRecallBlock";
import type { RecallResponse } from "@/lib/today/initiationRunState";

type InitiationRecallBlockProps = {
  prompt: RecallPromptBlock;
  onComplete: (payload: RecallResponse) => void;
};

export function InitiationRecallBlock({ prompt, onComplete }: InitiationRecallBlockProps) {
  const [textAnswer, setTextAnswer] = useState("");
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
  const [microActionDone, setMicroActionDone] = useState(false);
  const hasChoices = Boolean(prompt.choices?.length);

  const canSubmit = useMemo(() => {
    if (hasChoices) {
      return typeof choiceIndex === "number" && choiceIndex >= 0;
    }
    return textAnswer.trim().length > 0;
  }, [choiceIndex, hasChoices, textAnswer]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const answer = hasChoices
      ? prompt.choices?.[choiceIndex ?? 0]
      : textAnswer.trim();
    onComplete({
      promptId: prompt.promptId,
      answer: answer ?? "",
      choiceIndex: hasChoices ? choiceIndex : undefined,
      microActionDone,
    });
  };

  return (
    <section
      className="mx-auto w-full max-w-2xl rounded-3xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] px-5 py-8 text-[var(--omni-ink)] shadow-[0_25px_80px_rgba(0,0,0,0.1)] sm:px-8"
      data-testid="initiation-recall-block"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--omni-muted)]">Recapitulare</p>
      <h2 className="mt-4 text-2xl font-semibold">{prompt.question}</h2>
      {hasChoices ? (
        <div className="mt-6 space-y-2">
          {prompt.choices?.map((choice, idx) => (
            <label
              key={choice}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--omni-border-soft)] bg-white/80 px-4 py-3 text-sm hover:border-[var(--omni-ink)]/40"
            >
              <input
                type="radio"
                name="recall-choice"
                checked={choiceIndex === idx}
                onChange={() => setChoiceIndex(idx)}
                className="h-4 w-4 accent-[var(--omni-ink)]"
                data-testid={`recall-choice-${idx}`}
              />
              <span>{choice}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="mt-5 w-full rounded-2xl border border-[var(--omni-border-soft)] bg-white/80 p-4 text-sm outline-none focus:border-[var(--omni-ink)]"
          rows={4}
          placeholder="Notează răspunsul tău aici..."
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          data-testid="recall-answer-input"
        />
      )}
      {prompt.microAction ? (
        <label className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--omni-bg-soft)] px-4 py-3 text-sm text-[var(--omni-ink)]/80">
          <input
            type="checkbox"
            checked={microActionDone}
            onChange={(event) => setMicroActionDone(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--omni-ink)]"
            data-testid="recall-micro-checkbox"
          />
          <span>
            <strong className="font-semibold text-[var(--omni-ink)]">Micro-acțiune:</strong> {prompt.microAction}
          </span>
        </label>
      ) : null}
      <OmniCtaButton
        className="mt-6 w-full justify-center sm:w-auto"
        disabled={!canSubmit}
        onClick={handleSubmit}
        data-testid="recall-complete"
      >
        Salvează checkpoint
      </OmniCtaButton>
    </section>
  );
}

export default InitiationRecallBlock;
