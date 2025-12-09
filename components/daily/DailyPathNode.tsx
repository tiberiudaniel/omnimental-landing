"use client";

import { useState } from "react";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import type { DailyPathNodeConfig } from "@/types/dailyPath";

export type DailyNodeStatus = "locked" | "active" | "completed";

interface DailyPathNodeProps {
  node: DailyPathNodeConfig;
  status: DailyNodeStatus;
  onSelect?: () => void;
  isAutonomy?: boolean;
  showSoftLabel?: boolean;
}

const SHAPE_ICON: Record<DailyPathNodeConfig["shape"], string> = {
  circle: "●",
  star: "★",
  hollow: "○",
};

const BADGE_LABELS: Record<NonNullable<DailyPathNodeConfig["badge"]>, string> = {
  simulator: "Simulator",
  viata_reala: "Viața reală",
};

export default function DailyPathNode({
  node,
  status,
  onSelect,
  isAutonomy,
  showSoftLabel,
}: DailyPathNodeProps) {
  const icon = SHAPE_ICON[node.shape];
  const [quizChoice, setQuizChoice] = useState<string | null>(null);

  if (status === "locked") {
    return (
      <div className="flex justify-center py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-[var(--omni-border-soft)] text-xl text-[var(--omni-muted)]">
          {icon}
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex items-center gap-3 rounded-[14px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-main)] px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--omni-energy-soft)] text-[var(--omni-ink)] font-semibold">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--omni-ink)]">{node.title}</p>
          <p className="text-xs text-[var(--omni-muted)]">Finalizat · +{node.xp} XP</p>
        </div>
      </div>
    );
  }

  const badgeLabel = node.badge ? BADGE_LABELS[node.badge] : null;
  const buttonLabel = getButtonLabel(node.kind, isAutonomy);
  const requiresSelection = node.kind === "QUIZ_SINGLE";
  const disabled = requiresSelection ? !quizChoice : false;
  const hideXp = node.xp <= 0;

  return (
    <div className="flex gap-4 rounded-[18px] border border-[var(--omni-border-soft)] bg-[var(--omni-surface-card)] px-5 py-5 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--omni-energy)] text-xl font-semibold text-[var(--omni-bg-paper)]">
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-semibold text-[var(--omni-ink)]">{node.title}</p>
          {node.isBonus ? (
            <span className="rounded-full border border-[var(--omni-energy)] px-2 py-[1px] text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
              Bonus
            </span>
          ) : null}
          {showSoftLabel ? (
            <span className="rounded-full border border-[var(--omni-border-soft)] px-2 py-[1px] text-[10px] uppercase tracking-[0.3em] text-[var(--omni-muted)]">
              Soft path
            </span>
          ) : null}
          {badgeLabel ? (
            <span className="rounded-full border border-[var(--omni-energy)] bg-[var(--omni-energy-soft)] px-2 py-[1px] text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
              {badgeLabel}
            </span>
          ) : null}
        </div>
        <NodeBody node={node} quizChoice={quizChoice} setQuizChoice={setQuizChoice} />
        <div className="flex flex-wrap items-center gap-3">
          {hideXp ? null : (
            <span className="rounded-full bg-[var(--omni-bg-main)] px-2 py-[2px] text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)]">
              +{node.xp} XP
            </span>
          )}
          <div className="ml-auto">
            <OmniCtaButton size="sm" disabled={disabled} onClick={onSelect}>
              {buttonLabel}
            </OmniCtaButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeBody({
  node,
  quizChoice,
  setQuizChoice,
}: {
  node: DailyPathNodeConfig;
  quizChoice: string | null;
  setQuizChoice: (value: string | null) => void;
}) {
  switch (node.kind) {
    case "INTRO":
      return <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>;
    case "SUMMARY":
      return (
        <div className="space-y-2 text-sm text-[var(--omni-ink)]/80">
          {node.description.split("\n").map((line) => (
            <p key={line} className="text-left">
              • {line.trim()}
            </p>
          ))}
        </div>
      );
    case "ANCHOR":
      return (
        <div className="rounded-[14px] bg-[var(--omni-bg-main)] px-4 py-4 text-center text-base font-semibold text-[var(--omni-ink)]">
          {node.description}
        </div>
      );
    case "QUIZ_SINGLE": {
      const options = node.quizOptions ?? [];
      const hasCorrect = node.correctOptionIds?.length;
      const isCorrect = quizChoice ? node.correctOptionIds?.includes(quizChoice) : null;
      return (
        <div className="space-y-3">
          <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>
          <div className="space-y-2">
            {options.map((option) => {
              const selected = quizChoice === option.id;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition ${
                    selected
                      ? "border-[var(--omni-energy)] bg-[var(--omni-energy-soft)] text-[var(--omni-bg-paper)]"
                      : "border-[var(--omni-border-soft)] text-[var(--omni-ink)] hover:border-[var(--omni-energy)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={node.id}
                    value={option.id}
                    checked={selected}
                    onChange={() => setQuizChoice(option.id)}
                    className="sr-only"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          {hasCorrect && quizChoice ? (
            <p className={`text-xs ${isCorrect ? "text-[var(--omni-energy)]" : "text-[var(--omni-muted)]"}`}>
              {isCorrect ? "Corect." : "Mai bună ar fi cealaltă opțiune – păstrează energia și focusul."}
            </p>
          ) : null}
        </div>
      );
    }
    default:
      return <p className="text-sm text-[var(--omni-ink)]/80">{node.description}</p>;
  }
}

function getButtonLabel(kind: DailyPathNodeConfig["kind"], isAutonomy?: boolean) {
  if (isAutonomy) return "Alege direcția";
  switch (kind) {
    case "SIMULATOR":
      return "Am făcut exercițiul";
    case "REAL_WORLD":
      return "Îmi iau angajamentul";
    case "ANCHOR":
      return "Am înțeles";
    default:
      return "Continuă";
  }
}
