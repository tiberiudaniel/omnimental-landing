"use client";

import { useMemo } from "react";
import { normalizeKunoFacts } from "@/lib/kunoFacts";

type ProgressFactLite = {
  intent?: { tags: string[]; urgency: number } | null;
  motivation?: Record<string, unknown> | null;
  evaluation?: { scores?: Record<string, number> | null } | null;
  omni?: {
    kuno?: unknown;
    sensei?: { unlocked: boolean; completedQuestsCount?: number };
    abil?: { unlocked: boolean };
  } | null;
};

type Props = {
  progress?: ProgressFactLite | null;
  lang: "ro" | "en";
  onGoToKuno: () => void;
  onGoToSensei: () => void;
  onGoToAbil: () => void;
  onGoToIntel: () => void;
  className?: string;
  children?: React.ReactNode;
};

export default function NextBestStep({ progress, lang, onGoToKuno, onGoToSensei, onGoToAbil, onGoToIntel, className, children }: Props) {
  const { label, action } = useMemo(() => {
    const kunoFacts = normalizeKunoFacts(progress?.omni?.kuno);
    const kunoCompleted =
      (kunoFacts.completedLessonsCount ?? 0) > 0 ||
      Number(kunoFacts.legacyScores.completedTests ?? 0) >= 1;
    const senseiUnlocked = Boolean(progress?.omni?.sensei?.unlocked) || kunoCompleted;
    const abilUnlocked = Boolean(progress?.omni?.abil?.unlocked) || Number(progress?.omni?.sensei?.completedQuestsCount ?? 0) >= 1;
    const hasEval = Boolean(progress?.evaluation?.scores && Object.keys(progress?.evaluation?.scores ?? {}).length);

    if (!kunoCompleted) {
      return {
        label: lang === "ro" ? "Finalizează Omni Kuno (1 test)" : "Finish Omni Kuno (1 test)",
        action: onGoToKuno,
      } as const;
    }
    if (!senseiUnlocked) {
      return {
        label: lang === "ro" ? "Deblochează Sensei (după Kuno)" : "Unlock Sensei (after Kuno)",
        action: onGoToKuno,
      } as const;
    }
    if (!abilUnlocked) {
      return {
        label: lang === "ro" ? "Pornește prima provocare Sensei" : "Start your first Sensei challenge",
        action: onGoToSensei,
      } as const;
    }
    if (!hasEval) {
      return {
        label: lang === "ro" ? "Fă o evaluare Omni‑Intel" : "Do an Omni‑Intel evaluation",
        action: onGoToIntel,
      } as const;
    }
    return {
      label: lang === "ro" ? "Mergi la Omni Abil" : "Go to Omni Abil",
      action: onGoToAbil,
    } as const;
  }, [lang, onGoToAbil, onGoToIntel, onGoToKuno, onGoToSensei, progress]);

  const hasChildren = Boolean(children);
  return (
    <div className={`mb-2 w-full rounded-[12px] border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] ${hasChildren ? "px-4 py-3" : "px-3"} text-sm text-[var(--omni-ink)] shadow-[0_6px_14px_rgba(0,0,0,0.05)] ${className ?? ""}`}>
      <div className={`flex items-center justify-between gap-2 ${hasChildren ? "mb-2" : "h-12"}`}>
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--omni-energy)]">
          {lang === "ro" ? "Pasul următor" : "Next step"}
        </p>
        <button
          type="button"
          onClick={action}
          className="inline-flex items-center justify-center rounded-[10px] border border-[var(--omni-border-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--omni-ink)] hover:bg-[var(--omni-energy)] hover:text-[var(--omni-bg-paper)]"
        >
          {label}
        </button>
      </div>
      {hasChildren ? (
        <div className="mt-1">{children}</div>
      ) : null}
    </div>
  );
}
