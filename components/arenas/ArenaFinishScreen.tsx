"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ArenaModuleV1, ArenaDrillDuration, ArenaLang } from "@/config/arenaModules/v1/types";
import { resolveBridgeHref } from "@/lib/bridgeResolver";

interface ArenaFinishScreenProps {
  module: ArenaModuleV1;
  lang: ArenaLang;
  duration: ArenaDrillDuration;
  availableDurations: ArenaDrillDuration[];
  successMetric?: string;
  extraContent?: React.ReactNode;
  onReplay: () => void;
  onSelectDuration?: (duration: ArenaDrillDuration) => void;
  onBackToArena?: () => void;
  onSubmit?: (selfReport: number | null) => void;
}

const LANG_COPY: Record<
  ArenaLang,
  {
    title: string;
    replay: string;
    tryOther: string;
    back: string;
    complete: string;
    ratingLabel: string;
    bridgesTitle: string;
  }
> = {
  ro: {
    title: "Ai terminat modulul",
    replay: "Repetă durata",
    tryOther: "Încearcă durata",
    back: "Înapoi la arenă",
    complete: "Marchează completarea",
    ratingLabel: "Cum ți-a ieșit?",
    bridgesTitle: "Poduri cognitive recomandate",
  },
  en: {
    title: "Module complete",
    replay: "Replay same duration",
    tryOther: "Try duration",
    back: "Back to arena",
    complete: "Mark as completed",
    ratingLabel: "How did it go?",
    bridgesTitle: "Recommended cognitive bridges",
  },
};

export function ArenaFinishScreen({
  module,
  lang,
  duration,
  availableDurations,
  successMetric,
  extraContent,
  onReplay,
  onSelectDuration,
  onBackToArena,
  onSubmit,
}: ArenaFinishScreenProps) {
  const copy = LANG_COPY[lang];
  const [selfReport, setSelfReport] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const otherDurations = useMemo(
    () => availableDurations.filter((value) => value !== duration),
    [availableDurations, duration],
  );

  const handleComplete = () => {
    if (submitted) return;
    onSubmit?.(selfReport ?? null);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">{copy.title}</p>
            <h1 className="text-3xl font-semibold text-white">{module.title[lang]}</h1>
            <p className="text-sm text-white/70">
              {module.title.en} · {duration}
            </p>
          </div>
          {successMetric ? (
            <div className="text-sm text-white/80">
              <p className="font-semibold">Success metric</p>
              <p>{successMetric}</p>
            </div>
          ) : null}
          {extraContent ? <div className="rounded-xl bg-white/10 p-4">{extraContent}</div> : null}
          <div className="space-y-2">
            <p className="text-sm text-white/70">{copy.ratingLabel}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelfReport(value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    selfReport === value
                      ? "border-white bg-white text-black"
                      : "border-white/30 bg-transparent text-white/70 hover:border-white/60"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleComplete}
              disabled={submitted}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                submitted
                  ? "bg-white/20 text-white/70 cursor-default"
                  : "bg-white text-black hover:bg-white/80"
              }`}
            >
              {submitted ? "Completat" : copy.complete}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onReplay}
              className="rounded-full border border-white/30 px-5 py-2 text-sm hover:bg-white/10"
            >
              {copy.replay}
            </button>
            {otherDurations.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSelectDuration?.(value)}
                className="rounded-full border border-white/30 px-5 py-2 text-sm hover:bg-white/10"
              >
                {copy.tryOther} {value}
              </button>
            ))}
            <button
              type="button"
              onClick={onBackToArena}
              className="rounded-full bg-white text-black px-5 py-2 text-sm font-semibold hover:bg-white/80"
            >
              {copy.back}
            </button>
          </div>
        </div>

        {module.bridges.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{copy.bridgesTitle}</p>
            {module.bridges.map((bridge) => {
              const href = resolveBridgeHref(bridge.toL1);
              return (
                <div
                  key={`${module.id}-${bridge.toL1}`}
                  className="rounded-xl border border-white/15 bg-white/5 p-4 flex flex-col gap-2"
                >
                  <p className="text-sm text-white/80">{bridge.because[lang]}</p>
                  <Link
                    href={href}
                    className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/80 transition"
                  >
                    {bridge.cta?.[lang] ?? (lang === "ro" ? "Mergi la Level 1" : "Go to Level 1")}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
