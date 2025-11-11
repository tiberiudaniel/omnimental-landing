"use client";

import { useMemo } from "react";

type ProgressFactLite = {
  intent?: { tags: string[]; urgency: number } | null;
  motivation?: Record<string, unknown> | null;
  evaluation?: { scores?: Record<string, number> | null } | null;
  omni?: {
    kuno?: { completedTests: number };
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
};

export default function NextBestStep({ progress, lang, onGoToKuno, onGoToSensei, onGoToAbil, onGoToIntel }: Props) {
  const { label, action } = useMemo(() => {
    const kunoCompleted = Number(progress?.omni?.kuno?.completedTests ?? 0) >= 1;
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
      label: lang === "ro" ? "Continuă în Omni Abil" : "Continue in Omni Abil",
      action: onGoToAbil,
    } as const;
  }, [lang, onGoToAbil, onGoToIntel, onGoToKuno, onGoToSensei, progress]);

  return (
    <div className="mx-auto mb-4 max-w-5xl rounded-[12px] border border-[#E4D8CE] bg-[#FFFBF7] px-4 py-3 text-sm text-[#2C2C2C] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#C07963]">
          {lang === "ro" ? "Pasul următor" : "Next step"}
        </p>
        <button
          type="button"
          onClick={action}
          className="inline-flex items-center justify-center rounded-[10px] border border-[#2C2C2C] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] hover:border-[#E60012] hover:text-[#E60012]"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
