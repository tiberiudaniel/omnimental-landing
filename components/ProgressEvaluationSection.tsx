"use client";

import ProgressTrends from "./ProgressTrends";
import LatestEntries from "./LatestEntries";

type Props = {
  lang: "ro" | "en";
  sparkValues: number[];
  distribution: Array<{ label: string; value: number }>;
  latest: {
    quests: Array<{ title?: string }>;
    evaluationsCount: number;
  };
};

export default function ProgressEvaluationSection({ lang, sparkValues, distribution, latest }: Props) {
  return (
    <>
      <ProgressTrends lang={lang} sparkValues={sparkValues} distribution={distribution} />
      <LatestEntries lang={lang} quests={latest.quests} evaluationsCount={latest.evaluationsCount} />
    </>
  );
}

