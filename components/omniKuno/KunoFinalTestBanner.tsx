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
    <div className="space-y-3 rounded-2xl border border-[#E4DAD1] bg-[#FFFBF7] p-4">
      {arc ? (
        <div className="rounded-2xl border border-[#E7DED3] bg-white/80 px-4 py-3 text-sm text-[#2C2C2C] shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">Zona 4 · {arc.title}</p>
          <p className="mt-1 text-sm text-[#4D3F36]">{arc.body}</p>
        </div>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-[#B08A78]">{finalTestConfig.heading}</p>
        <h3 className="text-lg font-semibold text-[#2C2C2C]">{finalTestConfig.title}</h3>
        <p className="text-sm text-[#4D3F36]">{finalTestConfig.description}</p>
      </div>
      {!showFinalTest ? (
        <button
          type="button"
          onClick={() => onToggleFinalTest(true)}
          className="inline-flex items-center rounded-full border border-[#C07963] px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white"
        >
          {finalTestConfig.buttonLabel}
        </button>
      ) : null}
      {finalTestResult ? (
        <div className="space-y-3 rounded-xl border border-[#CBE8D7] bg-[#F3FFF8] px-4 py-3 text-sm text-[#1F3C2F]">
          <p>
            {lang === "ro"
              ? `Felicitări! Ai închis modulul ${finalTestConfig.moduleName} cu ${finalTestResult.correct} răspunsuri corecte din ${finalTestResult.total}. Continuă practica.`
              : `Congrats! You finished ${finalTestConfig.moduleName} with ${finalTestResult.correct}/${finalTestResult.total} correct answers. Keep applying the practice.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/progress"
              className="inline-flex items-center rounded-full border border-[#1F3C2F] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#1F3C2F] transition hover:bg-[#1F3C2F] hover:text-white"
            >
              {lang === "ro" ? "Vezi progresul" : "View progress"}
            </Link>
            <Link
              href={`/omni-kuno?area=${areaKey}&module=${areaKey}`}
              className="inline-flex items-center rounded-full border border-[#C07963] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#C07963] transition hover:bg-[#C07963] hover:text-white"
            >
              {lang === "ro" ? "Alege alt modul" : "Pick another module"}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
