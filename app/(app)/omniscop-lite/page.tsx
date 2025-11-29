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
  const shares: IndicatorChartValues = (() => {
    const dims = demo.recommendation?.dimensionScores ?? {};
    const read = (key: string, legacy?: string) => {
      const value = Number((dims as Record<string, unknown>)[key]);
      if (Number.isFinite(value)) return value;
      if (legacy) {
        const legacyVal = Number((dims as Record<string, unknown>)[legacy]);
        if (Number.isFinite(legacyVal)) return legacyVal;
      }
      return 0;
    };
    if (demo.recommendation?.dimensionScores) {
      return {
        focus_clarity: read("focus_clarity", "focus") / 5,
        relationships_communication: read("relationships_communication", "relationships") / 5,
        emotional_balance: read("emotional_balance", "calm") / 5,
        energy_body: read("energy_body", "energy") / 5,
        decision_discernment: read("decision_discernment", "performance") / 5,
        self_trust: read("self_trust", "health") / 5,
        willpower_perseverance: read("willpower_perseverance", "willpower") / 5,
        optimal_weight_management: read("optimal_weight_management", "weight") / 5,
      } satisfies IndicatorChartValues;
    }
    return {
      focus_clarity: 0.2,
      relationships_communication: 0.25,
      emotional_balance: 0.2,
      energy_body: 0.15,
      decision_discernment: 0.15,
      self_trust: 0.05,
      willpower_perseverance: 0.05,
      optimal_weight_management: 0.05,
    } satisfies IndicatorChartValues;
  })();
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
