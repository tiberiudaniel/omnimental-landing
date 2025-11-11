export const INDICATOR_CHART_KEYS = [
  "clarity",
  "relationships",
  "calm",
  "energy",
  "performance",
  "bodyHabits",
] as const;

export type IndicatorChartKey = (typeof INDICATOR_CHART_KEYS)[number];

export const INDICATOR_LABELS: Record<IndicatorChartKey, { ro: string; en: string }> = {
  clarity: { ro: "Claritate & focus", en: "Clarity & focus" },
  relationships: { ro: "Relații", en: "Relationships" },
  calm: { ro: "Calm", en: "Calm" },
  energy: { ro: "Energie", en: "Energy" },
  performance: { ro: "Performanță", en: "Performance" },
  bodyHabits: { ro: "Corp & obiceiuri", en: "Body & habits" },
};

export const INDICATOR_SOURCE_KEYS = [
  "calm",
  "focus",
  "energy",
  "relationships",
  "performance",
  "bodyHabits",
] as const;

export type IndicatorSourceKey = (typeof INDICATOR_SOURCE_KEYS)[number];

export type IndicatorSourceCounts = Record<IndicatorSourceKey, number>;
export type IndicatorChartValues = Record<IndicatorChartKey, number>;

export const intentCategoryToIndicator: Record<string, IndicatorSourceKey | undefined> = {
  anxiety: "calm",
  stress: "calm",
  panic: "calm",
  calm: "calm",
  calm_peace: "calm",
  calm_stress: "calm",
  calm_control: "calm",
  calm_energy: "calm",
  calm_more: "calm",
  calm_sleep: "calm",
  calm_balance: "calm",
  calm_overwhelmed: "calm",
  calm_relax: "calm",
  calm_anxiety: "calm",

  focus: "focus",
  productivity: "focus",
  clarity: "focus",
  clarity_focus: "focus",
  clarity_need: "focus",
  clarity_true_want: "focus",
  clarity_blocked: "focus",

  fatigue: "energy",
  sleep: "energy",
  burnout: "energy",
  energy: "energy",

  relationships: "relationships",
  boundaries: "relationships",
  family: "relationships",
  rel_understood: "relationships",
  rel_partner_conflict: "relationships",
  rel_express_feelings: "relationships",
  rel_be_heard: "relationships",
  rel_authentic: "relationships",
  self_patience: "relationships",
  self_fear_mistakes: "relationships",
  self_confidence: "relationships",
  self_lost: "relationships",
  self_compare: "relationships",

  career: "performance",
  money: "performance",
  performance: "performance",
  career_pressure: "performance",
  career_boss: "performance",

  health: "bodyHabits",
  habits: "bodyHabits",
  lifestyle: "bodyHabits",
};

const createEmptySourceCounts = (): IndicatorSourceCounts => ({
  calm: 0,
  focus: 0,
  energy: 0,
  relationships: 0,
  performance: 0,
  bodyHabits: 0,
});

export function computeIndicatorSourceCounts(
  categories: Array<{ category: string; count: number }>,
): IndicatorSourceCounts {
  const base = createEmptySourceCounts();
  categories.forEach(({ category, count }) => {
    const dimension = intentCategoryToIndicator[category];
    if (dimension) {
      base[dimension] += count;
    }
  });
  return base;
}

export function mapSourcesToChart(counts: IndicatorSourceCounts): IndicatorChartValues {
  return {
    clarity: counts.focus,
    relationships: counts.relationships,
    calm: counts.calm,
    energy: counts.energy,
    performance: counts.performance,
    bodyHabits: counts.bodyHabits,
  };
}

export function buildIndicatorSummary(categories: Array<{ category: string; count: number }>) {
  const sourceCounts = computeIndicatorSourceCounts(categories);
  const chart = mapSourcesToChart(sourceCounts);
  return { sourceCounts, chart };
}
