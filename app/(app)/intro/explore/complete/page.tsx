"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OmniCtaButton } from "@/components/ui/OmniCtaButton";
import { setAxisLessonChoice, setExploreCompletion } from "@/lib/intro/exploreState";
import { getTraitLabel, type CatAxisId } from "@/lib/profileEngine";

function ExploreCompletionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ctaLoading, setCtaLoading] = useState(false);
  const completionSource = (searchParams.get("source") ?? "unknown").toLowerCase();
  const axisParamRaw = searchParams.get("axis");
  const axisId = axisParamRaw ? (axisParamRaw.toLowerCase() as CatAxisId) : null;
  const hasAxisParam = Boolean(axisId);
  const preserveE2E = (searchParams.get("e2e") ?? "").toLowerCase() === "1";
  const todayTarget = useMemo(() => {
    const params = new URLSearchParams({ mode: "deep", source: "explore_cat_day1" });
    if (preserveE2E) {
      params.set("e2e", "1");
    }
    return `/today?${params.toString()}`;
  }, [preserveE2E]);

  useEffect(() => {
    setExploreCompletion(completionSource || "unknown");
    if (hasAxisParam && axisId) {
      setAxisLessonChoice(axisId);
    }
  }, [axisId, completionSource, hasAxisParam]);

  const axisLabel = hasAxisParam && axisId ? getTraitLabel(axisId) : null;
  const insightBullets =
    completionSource === "cat-lite"
      ? [
          "Profilul mental inițial este salvat pentru Ziua 1.",
          axisLabel ? `Axa cu tensiune mai mare: ${axisLabel}. O vei lucra adaptiv în Today.` : "Ai claritate pe axele de bază. Continuă în Today.",
        ]
      : [
          axisLabel ? `Ai aprofundat o lecție rapidă pe axa ${axisLabel}.` : "Ai închis lecția scurtă din Explore.",
          "Contextul este sincronizat cu Today pentru următorul pas.",
        ];

  const handleReturnToToday = () => {
    setCtaLoading(true);
    router.replace(todayTarget);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-center">
      <div className="w-full max-w-lg space-y-4 rounded-[28px] border border-[var(--omni-border-soft)] bg-white/85 px-6 py-8 text-[var(--omni-ink)] shadow-[0_25px_70px_rgba(0,0,0,0.08)] sm:px-10">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--omni-muted)]">Explore CAT · Ziua 1</p>
        <h1 className="text-3xl font-semibold">Ai setat profilul mental inițial</h1>
        <p className="text-sm text-[var(--omni-muted)]">Datele merg în Today pentru a continua cu recomandarea deep.</p>
        <ul className="mt-4 list-disc space-y-2 text-left text-sm text-[var(--omni-ink)]/85 sm:pl-6">
          {insightBullets.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
        <OmniCtaButton className="mt-6 w-full justify-center sm:w-auto" onClick={handleReturnToToday} disabled={ctaLoading}>
          Înapoi în Today
        </OmniCtaButton>
      </div>
    </main>
  );
}

export default function ExploreCompletionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--omni-bg-main)] px-4 py-10 text-center text-sm text-[var(--omni-muted)]">
          Închidem explorarea…
        </main>
      }
    >
      <ExploreCompletionInner />
    </Suspense>
  );
}
