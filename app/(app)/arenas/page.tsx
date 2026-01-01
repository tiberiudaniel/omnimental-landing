"use client";

import { ArenaOverview } from "@/components/arenas/ArenaOverview";
import { useCopy } from "@/lib/useCopy";
import { getScreenIdForRoute } from "@/lib/routeIds";

const ARENAS_SCREEN_ID = getScreenIdForRoute("/arenas");

export default function ArenasPage() {
  const defaultTitle = "Arene OmniMental";
  const defaultSubtitle =
    "Nivelul 2 de antrenament cognitiv. Aici lucrezi sub timp, conflict și presiune — cu metrici obiective.";
  const heroCopy = useCopy(ARENAS_SCREEN_ID, "ro", {
    h1: defaultTitle,
    subtitle: defaultSubtitle,
  });
  const heroTitle = heroCopy.h1 ?? defaultTitle;
  const heroSubtitle = heroCopy.subtitle ?? defaultSubtitle;

  return (
    <main className="min-h-screen bg-[#05060a] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Training</p>
          <h1 className="text-3xl font-semibold">{heroTitle}</h1>
          <p className="text-sm text-white/80 mt-2">{heroSubtitle}</p>
          <div className="mt-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs text-white/80">
            <p className="font-semibold">⚠️ Arene ≠ Nivelul 1</p>
            <p>Aici nu reglezi starea. Aici îți testezi și antrenezi performanța.</p>
          </div>
        </div>
        <ArenaOverview />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Aici nu consumi conținut nou, ci testezi și calibrezi procese cognitive sub presiune. Intră doar
          dacă ești pregătit pentru timp limitat, interferență și evaluare clară.
        </div>
      </div>
    </main>
  );
}
