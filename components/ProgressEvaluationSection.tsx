"use client";

import ProgressTrends from "./ProgressTrends";
import type { IndicatorChartValues } from "@/lib/indicators";

type Props = {
  lang: "ro" | "en";
  sparkValues: number[];
  radarChart: IndicatorChartValues;
  categoryChips: string[];
  onRefineThemes: () => void;
};

export default function ProgressEvaluationSection({ lang, sparkValues, radarChart, categoryChips, onRefineThemes }: Props) {
  return (
    <ProgressTrends
      lang={lang}
      sparkValues={sparkValues}
      radarChart={radarChart}
      categoryChips={categoryChips}
      onRefineThemes={onRefineThemes}
    />
  );
}
