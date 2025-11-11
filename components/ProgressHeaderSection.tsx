"use client";

import StickyMiniSummary from "./StickyMiniSummary";
import NextBestStep from "./NextBestStep";
import ProgressSummary from "./ProgressSummary";
import type { ProgressFact } from "@/lib/progressFacts";

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
  };
};

export default function ProgressHeaderSection({ lang, progress, omniIntelScore, omniLevel, summary, actions }: Props) {
  return (
    <div className="sticky top-14 z-10">
      <StickyMiniSummary omniIntelScore={omniIntelScore ?? null} omniLevel={omniLevel ?? null} lang={lang} />
      <NextBestStep
        progress={progress ?? undefined}
        lang={lang}
        onGoToKuno={actions.goToKuno}
        onGoToSensei={actions.goToSensei}
        onGoToAbil={actions.goToAbil}
        onGoToIntel={actions.goToIntel}
      />
      <div className="mx-auto mb-6 max-w-5xl">
        <ProgressSummary
          urgency={summary.urgency}
          stage={summary.stage}
          globalLoad={summary.globalLoad}
          updatedAt={summary.updatedAt}
          omniIntelScore={omniIntelScore}
          omniLevel={omniLevel}
        />
      </div>
    </div>
  );
}

