"use client";
// Removed ProgressSummary from header to avoid redundancy
import KPIRow from "./KPIRow";
import { computeDimensionScores } from "@/lib/scoring";
import type { ProgressFact } from "@/lib/progressFacts";
import MicroMetricCard from "./MicroMetricCard";

type Props = {
  lang: "ro" | "en";
  progress?: ProgressFact | null;
  omniIntelScore: number | null;
  omniLevel: string | null;
  summary: {
    urgency: number | null;
    stage: string | null;
    globalLoad: string | null;
    updatedAt: string | null;
  };
  actions: {
    goToKuno: () => void;
    goToSensei: () => void;
    goToAbil: () => void;
    goToIntel: () => void;
    onAuthRequest: () => void;
  };
};

export default function ProgressHeaderSection({ lang, progress, omniIntelScore, omniLevel }: Props) {
  const kpis = (() => {
    const categories = progress?.intent?.categories ?? [];
    const urgency = progress?.intent?.urgency ?? 0;
    const scores = computeDimensionScores(categories, urgency);
    return [
      { title: lang === "ro" ? "Clarity Index" : "Clarity Index", value: scores.focus },
      { title: lang === "ro" ? "Calm Index" : "Calm Index", value: scores.calm },
      { title: lang === "ro" ? "Vitality Index" : "Vitality Index", value: scores.energy },
    ];
  })();
  return (
    <div className="">
      <div className="mx-auto mb-2 grid max-w-5xl grid-cols-1 gap-2 md:grid-cols-12">
        <div className="md:col-span-9">
          <KPIRow items={kpis} />
        </div>
        <div className="md:col-span-3 grid grid-cols-2 gap-2">
          <MicroMetricCard variant="micro" label={lang === "ro" ? "Nivel" : "Level"} value={omniLevel ?? "-"} />
          <MicroMetricCard variant="micro" label="OmniIntel" value={typeof omniIntelScore === "number" ? `${omniIntelScore}/100` : "-"} />
        </div>
      </div>
      {/* Next step moved into main content (left column) to match Trends width */}
      {/* ProgressSummary removed to avoid repeating OmniIntel/Level */}
    </div>
  );
}
