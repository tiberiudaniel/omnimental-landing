"use client";

export type OmniIntentAnswers = {
  knowledge: number[]; // 4 items
  belief: number[]; // 4 items
  commitment: number[]; // 4 items
  planning: number[]; // 4 items
  progress: number; // 0-100
};

export type OmniIntentScores = {
  k: number;
  b: number;
  c: number;
  p: number;
  g: number;
  total: number;
};

const weights = {
  k: 0.2,
  b: 0.25,
  c: 0.25,
  p: 0.2,
  g: 0.1,
};

const normalize = (value: number, max = 10) =>
  Math.max(0, Math.min(100, Math.round((value / max) * 100)));

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export function computeOmniIntentScore(answers: OmniIntentAnswers): OmniIntentScores {
  const k = normalize(answers.knowledge.reduce((sum, v) => sum + v, 0) / answers.knowledge.length);
  const b = normalize(answers.belief.reduce((sum, v) => sum + v, 0) / answers.belief.length);
  const c = normalize(
    answers.commitment.reduce((sum, v) => sum + v, 0) / answers.commitment.length,
  );
  const p = normalize(answers.planning.reduce((sum, v) => sum + v, 0) / answers.planning.length);
  const g = clampPercent(answers.progress);

  const total = Math.round(
    weights.k * k + weights.b * b + weights.c * c + weights.p * p + weights.g * g,
  );

  return {
    k,
    b,
    c,
    p,
    g,
    total,
  };
}
