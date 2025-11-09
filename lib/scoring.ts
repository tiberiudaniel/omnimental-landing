export type IntentCategorySummary = {
  category: string;
  count: number;
};

export type DimensionScores = {
  calm: number;
  focus: number;
  energy: number;
  relationships: number;
  performance: number;
  health: number;
};

const categoryToDimension: Record<string, keyof DimensionScores | undefined> = {
  anxiety: "calm",
  stress: "calm",
  panic: "calm",

  focus: "focus",
  productivity: "focus",
  clarity: "focus",

  fatigue: "energy",
  sleep: "energy",
  burnout: "energy",

  relationships: "relationships",
  boundaries: "relationships",
  family: "relationships",

  career: "performance",
  money: "performance",
  performance: "performance",

  health: "health",
  habits: "health",
  lifestyle: "health",
};

export function computeDimensionScores(
  categories: IntentCategorySummary[],
  urgency: number,
): DimensionScores {
  const base: DimensionScores = {
    calm: 0,
    focus: 0,
    energy: 0,
    relationships: 0,
    performance: 0,
    health: 0,
  };

  for (const { category, count } of categories) {
    const dim = categoryToDimension[category];
    if (!dim) continue;
    base[dim] += count;
  }

  const factor = 0.5 + urgency / 10;

  (Object.keys(base) as (keyof DimensionScores)[]).forEach((key) => {
    base[key] = Math.round(base[key] * factor);
  });

  return base;
}
