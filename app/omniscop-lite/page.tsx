"use client";

import SiteHeader from "@/components/SiteHeader";
import { useI18n } from "@/components/I18nProvider";
import { getDemoProgressFacts } from "@/lib/demoData";
import { RecommendationSummary } from "@/components/RecommendationSummary";
import { type IndicatorChartValues } from "@/lib/indicators";

export default function OmniScopLitePage() {
  const { lang } = useI18n();
  const isRO = lang !== "en";
  const demo = getDemoProgressFacts(isRO ? "ro" : "en", 1);
  const shares: IndicatorChartValues = (demo.recommendation?.dimensionScores
    ? {
        clarity: (demo.recommendation.dimensionScores.focus ?? 0) / 5,
        relationships: (demo.recommendation.dimensionScores.relationships ?? 0) / 5,
        calm: (demo.recommendation.dimensionScores.calm ?? 0) / 5,
        energy: (demo.recommendation.dimensionScores.energy ?? 0) / 5,
        performance: (demo.recommendation.dimensionScores.performance ?? 0) / 5,
      }
    : { clarity: 0.2, relationships: 0.3, calm: 0.2, energy: 0.1, performance: 0.2 }) as IndicatorChartValues;
  const indicators = shares;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <SiteHeader wizardMode compact />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#7A6455] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
            Demo
          </span>
          <span className="text-sm text-[#5C4F45]">{isRO ? "OmniScop Lite" : "OmniScop Lite"}</span>
        </div>
        <RecommendationSummary
          loadLevel={"moderate"}
          mainArea={isRO ? "Claritate mentală" : "Clarity"}
          indicators={indicators}
          language={isRO ? "ro" : "en"}
          onBookCall={() => {}}
          summaryMessage={
            isRO
              ? `Aceasta este o previzualizare demo bazată pe câteva răspunsuri gen.
Poți salva și debloca recomandarea completă după ce alegi modul de lucru.`
              : `This is a demo preview based on sample answers.
You can save and unlock the full recommendation after choosing your format.`
          }
        />
      </main>
    </div>
  );
}
