"use client";

export type OmniAbilityLevels = {
  p1: {
    tempo: number;
    diaphragm: number;
    exhale: number;
    calm: number;
    coherence: number;
  };
  p2: {
    observe: number;
    orient: number;
    decide: number;
    act: number;
    timing: number;
  };
  p3: {
    case1: {
      thought: number;
      alternative: number;
      values: number;
      plan: number;
    };
    case2: {
      thought: number;
      alternative: number;
      values: number;
      plan: number;
    };
  };
  p4: {
    zeroSwitch: number;
    completion: number;
    calm: number;
  };
  p5: {
    breathingDays: number;
    sleepConsistencyDays: number;
    journalingDays: number;
    microPauseDays: number;
  };
};

export type OmniAbilityProbeScore = {
  raw: number;
  scaled: number;
  maxRaw: number;
};

export type OmniAbilityResult = {
  probes: {
    p1: OmniAbilityProbeScore;
    p2: OmniAbilityProbeScore;
    p3: OmniAbilityProbeScore;
    p4: OmniAbilityProbeScore;
    p5: OmniAbilityProbeScore;
  };
  total: number;
};

const clampLevel = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const sumProbe = (values: Array<{ level: number; weight: number }>) =>
  values.reduce((acc, entry) => acc + clampLevel(entry.level, 0, 3) * entry.weight, 0);

export function computeOmniAbilities(levels: OmniAbilityLevels): OmniAbilityResult {
  const p1Raw = sumProbe([
    { level: levels.p1.tempo, weight: 3 },
    { level: levels.p1.diaphragm, weight: 2 },
    { level: levels.p1.exhale, weight: 2 },
    { level: levels.p1.calm, weight: 1 },
    { level: levels.p1.coherence, weight: 2 },
  ]);
  const p1 = {
    raw: p1Raw,
    maxRaw: 27,
    scaled: Math.round((p1Raw / 27) * 20),
  };

  const p2Raw = sumProbe([
    { level: levels.p2.observe, weight: 2 },
    { level: levels.p2.orient, weight: 2 },
    { level: levels.p2.decide, weight: 2 },
    { level: levels.p2.act, weight: 2 },
    { level: levels.p2.timing, weight: 1 },
  ]);
  const p2 = {
    raw: p2Raw,
    maxRaw: 27,
    scaled: Math.round((p2Raw / 27) * 25),
  };

  const p3Case = (entry: OmniAbilityLevels["p3"]["case1"]) =>
    sumProbe([
      { level: entry.thought, weight: 2 },
      { level: entry.alternative, weight: 2 },
      { level: entry.values, weight: 1 },
      { level: entry.plan, weight: 1 },
    ]);
  const p3Case1 = p3Case(levels.p3.case1);
  const p3Case2 = p3Case(levels.p3.case2);
  const p3Raw = p3Case1 + p3Case2;
  const p3 = {
    raw: p3Raw,
    maxRaw: 36,
    scaled: Math.round((p3Raw / 36) * 20),
  };

  const p4Raw = sumProbe([
    { level: levels.p4.zeroSwitch, weight: 2 },
    { level: levels.p4.completion, weight: 2 },
    { level: levels.p4.calm, weight: 1 },
  ]);
  const p4 = {
    raw: p4Raw,
    maxRaw: 15,
    scaled: p4Raw,
  };

  const scoreFromDays = (days: number) => (days >= 5 ? 5 : days <= 0 ? 0 : Math.round((days / 5) * 5));
  const p5Raw =
    scoreFromDays(levels.p5.breathingDays) +
    scoreFromDays(levels.p5.sleepConsistencyDays) +
    scoreFromDays(levels.p5.journalingDays) +
    scoreFromDays(levels.p5.microPauseDays);
  const p5 = {
    raw: p5Raw,
    maxRaw: 20,
    scaled: p5Raw,
  };

  const total = Math.max(
    0,
    Math.min(100, p1.scaled + p2.scaled + p3.scaled + p4.scaled + p5.scaled),
  );

  return {
    probes: { p1, p2, p3, p4, p5 },
    total,
  };
}
