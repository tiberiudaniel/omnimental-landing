"use client";

import Link from "next/link";
import type { OmniKunoModuleId } from "@/config/omniKunoModules";
import { OMNI_KUNO_ARC_INTROS } from "@/config/omniKunoLessonContent";

type ModuleFinalTestContent = {
  testId: string;
  heading: string;
  title: string;
  description: string;
  buttonLabel: string;
  moduleName: string;
};

export function KunoFinalTestBanner({
  areaKey,
  finalTestConfig,
  showFinalTest,
  onToggleFinalTest,
  lang,
  finalTestResult,
}: {
  areaKey: OmniKunoModuleId;
  finalTestConfig: ModuleFinalTestContent | null;
  showFinalTest: boolean;
  onToggleFinalTest: (value: boolean) => void;
  lang: string;
  finalTestResult: { correct: number; total: number } | null;
}) {
  if (!finalTestConfig) return null;
  const arcSet = OMNI_KUNO_ARC_INTROS[areaKey];
  const arc = arcSet?.maestrie;
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--omni-border-soft)] bg-[var(--omni-bg-paper)] p-4">
      {arc ? (
        <div className="rounded-2xl border border-[#E7DED3] bg-[var(--omni-surface-card)]/80 px-4 py-3 text-sm text-[var(--omni-ink)] shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Zona 4 · {arc.title}</p>
          <p className="mt-1 text-sm text-[#4D3F36]">{arc.body}</p>
        </div>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">{finalTestConfig.heading}</p>
        <h3 className="text-lg font-semibold text-[var(--omni-ink)]">{finalTestConfig.title}</h3>
        <p className="text-sm text-[#4D3F36]">{finalTestConfig.description}</p>
      </div>
      {!showFinalTest ? (
        <button
          type="button"
          onClick={() => onToggleFinalTest(true)}
          className="inline-flex items-center rounded-full border border-[var(--omni-energy)] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)] hover:text-white"
        >
          {finalTestConfig.buttonLabel}
        </button>
      ) : null}
      {finalTestResult ? (
        <div className="space-y-3 rounded-xl border border-[var(--omni-success)] bg-[var(--omni-success-soft)] px-4 py-3 text-sm text-[var(--omni-ink-soft)]">
          <p>
            {lang === "ro"
              ? `Felicitări! Ai închis modulul ${finalTestConfig.moduleName} cu ${finalTestResult.correct} răspunsuri corecte din ${finalTestResult.total}. Continuă practica.`
              : `Congrats! You finished ${finalTestConfig.moduleName} with ${finalTestResult.correct}/${finalTestResult.total} correct answers. Keep applying the practice.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/progress"
              className="inline-flex items-center rounded-full border border-[var(--omni-ink-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-ink-soft)] transition hover:bg-[var(--omni-ink-soft)] hover:text-white"
            >
              {lang === "ro" ? "Vezi progresul" : "View progress"}
            </Link>
            <Link
              href={`/omni-kuno?area=${areaKey}&module=${areaKey}`}
              className="inline-flex items-center rounded-full border border-[var(--omni-energy)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--omni-energy)] transition hover:bg-[var(--omni-energy)] hover:text-white"
            >
              {lang === "ro" ? "Alege alt modul" : "Pick another module"}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
