"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ARENA_MODULES_V1 } from "@/config/arenaModules/v1";
import type { ArenaId, ArenaLang } from "@/config/arenaModules/v1/types";
import { DrillSelector } from "./DrillSelector";

interface Props {
  arenaId: ArenaId;
  moduleId: string;
  lang?: ArenaLang;
}

export function ArenaModuleDetail({ arenaId, moduleId, lang = "ro" }: Props) {
  const arenaModule = ARENA_MODULES_V1.find((mod) => mod.id === moduleId && mod.arena === arenaId);
  const [selectedDuration, setSelectedDuration] = useState<"30s" | "90s" | "3m" | null>("30s");

  const drills = useMemo(() => arenaModule?.drills?.[lang] ?? [], [arenaModule, lang]);
  const explainLines = arenaModule?.explain?.[lang]?.split("\n").filter(Boolean) ?? [];
  const realWorld = arenaModule?.realWorldChallenge?.[lang];

  if (!arenaModule) {
    return (
      <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
        Modulul nu a fost găsit.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-wide text-white/60">Arena</p>
        <h1 className="text-2xl font-semibold text-white">{arenaModule.title[lang]}</h1>
        <p className="text-sm text-white/70">{arenaModule.title.en}</p>
        <div className="mt-4 space-y-2 text-sm text-white/80">
          {explainLines.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      </div>

      <DrillSelector drills={drills} selectedDuration={selectedDuration} onSelect={setSelectedDuration} />

      {realWorld ? (
        <details className="rounded-2xl border border-white/10 bg-white/5 p-4" open>
          <summary className="text-white font-semibold cursor-pointer">{realWorld.title}</summary>
          <ul className="mt-3 list-disc list-inside text-sm text-white/80 space-y-1">
            {realWorld.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-white/60">{realWorld.successMetric}</p>
        </details>
      ) : null}

      <div className="flex justify-end">
        <Link
          href={`/arenas/${arenaId}/${moduleId}/run?duration=${selectedDuration ?? "30s"}`}
          className="rounded-full bg-white/90 text-black text-sm font-semibold px-5 py-2 hover:bg-white"
        >
          Start run
        </Link>
      </div>
    </div>
  );
}
