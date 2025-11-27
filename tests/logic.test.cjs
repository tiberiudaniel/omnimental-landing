const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("./helpers/load-ts-module.cjs");

const { omniKnowledgeModules, computeOmniKnowledgeScore } = loadTsModule(
  path.resolve(__dirname, "../lib/omniKnowledge.ts"),
);
const { computeDimensionScores } = loadTsModule(
  path.resolve(__dirname, "../lib/scoring.ts"),
);
const { recommendSession } = loadTsModule(
  path.resolve(__dirname, "../lib/recommendation.ts"),
);
const { buildIndicatorSummary } = loadTsModule(
  path.resolve(__dirname, "../lib/indicators.ts"),
);
const { computeConsistencyIndexFromDates } = loadTsModule(
  path.resolve(__dirname, "../lib/omniIntel.ts"),
);

test("computeOmniKnowledgeScore returns perfect score when all answers correct", () => {
  const answers = {};
  omniKnowledgeModules.forEach((module) => {
    module.questions.forEach((question) => {
      answers[question.id] = question.correctIndex;
    });
  });
  const score = computeOmniKnowledgeScore(answers);
  assert.equal(score.percent, 100);
  assert.equal(score.raw, score.max);
  omniKnowledgeModules.forEach((module) => {
    assert.equal(score.breakdown[module.key].percent, 100);
  });
});

test("computeOmniKnowledgeScore tracks module-level gaps", () => {
  const answers = {};
  omniKnowledgeModules.forEach((module, moduleIndex) => {
    module.questions.forEach((question, questionIndex) => {
      answers[question.id] =
        moduleIndex === 0 && questionIndex % 2 === 0 ? question.correctIndex : 99;
    });
  });
  const score = computeOmniKnowledgeScore(answers);
  assert(score.percent < 50);
  assert.equal(score.breakdown.hrv.percent, 50);
  assert.equal(score.breakdown.sleep.percent, 0);
});

test("computeDimensionScores amplifies categories and urgency", () => {
  const scores = computeDimensionScores(
    [
      { category: "anxiety", count: 4 },
      { category: "relationships", count: 2 },
      { category: "focus", count: 1 },
    ],
    9,
  );
  // Urgency 9 => factor 0.5 + 0.9 = 1.4 → 4 * 1.4 ≈ 6
  assert.equal(scores.emotional_balance, 6);
  assert.equal(scores.relationships_communication, 3);
  assert.equal(scores.focus_clarity, 1);
});

test("recommendSession applies rule hierarchy", () => {
  const baseScores = {
    emotional_balance: 0,
    focus_clarity: 0,
    energy_body: 0,
    relationships_communication: 0,
    decision_discernment: 0,
    self_trust: 0,
    willpower_perseverance: 0,
  };

  const urgent = recommendSession({
    urgency: 9,
    primaryCategory: "focus",
    dimensionScores: baseScores,
    hasProfile: true,
  });
  assert.equal(urgent.recommendedPath, "individual");
  assert.equal(urgent.reasonKey, "reason_high_urgency");

  const relationship = recommendSession({
    urgency: 5,
    primaryCategory: "relationships",
    dimensionScores: baseScores,
    hasProfile: true,
  });
  assert.equal(relationship.recommendedPath, "individual");
  assert.equal(relationship.reasonKey, "reason_relationships");

  const performance = recommendSession({
    urgency: 5,
    primaryCategory: "focus",
    dimensionScores: { ...baseScores, decision_discernment: 4, emotional_balance: 1 },
    hasProfile: true,
  });
  assert.equal(performance.recommendedPath, "group");
  assert.equal(performance.reasonKey, "reason_performance_group");

  const lowUrgency = recommendSession({
    urgency: 3,
    primaryCategory: "focus",
    dimensionScores: baseScores,
    hasProfile: false,
  });
  assert.equal(lowUrgency.recommendedPath, "group");
  assert.equal(lowUrgency.reasonKey, "reason_low_urgency");
});

test("recommendSession defaults to group when no strong signals", () => {
  const baseScores = {
    emotional_balance: 0,
    focus_clarity: 0,
    energy_body: 0,
    relationships_communication: 0,
    decision_discernment: 0,
    self_trust: 0,
    willpower_perseverance: 0,
  };
  const rec = recommendSession({ urgency: 5, primaryCategory: undefined, dimensionScores: baseScores, hasProfile: false });
  assert.equal(rec.recommendedPath, "group");
});

test("buildIndicatorSummary maps categories to chart and normalized shares", () => {
  const categories = [
    { category: "clarity", count: 3 },
    { category: "relationships", count: 2 },
    { category: "stress", count: 1 },
    { category: "energy", count: 4 },
  ];
  const { chart, shares } = buildIndicatorSummary(categories);
  // Counts are mapped via module IDs
  assert.equal(chart.focus_clarity, 3);
  assert.equal(chart.relationships_communication, 2);
  assert.equal(chart.emotional_balance, 1);
  assert.equal(chart.energy_body, 4);
  // Shares normalized to ~1 (allow small float tolerance)
  const totalShare =
    shares.focus_clarity +
    shares.relationships_communication +
    shares.emotional_balance +
    shares.energy_body +
    shares.decision_discernment +
    shares.self_trust;
  assert.ok(totalShare > 0.99 && totalShare < 1.01);
});

test("computeDimensionScores handles empty input and low urgency", () => {
  const scores = computeDimensionScores([], 2);
  assert.equal(scores.emotional_balance, 0);
  assert.equal(scores.focus_clarity, 0);
});

test("computeConsistencyIndexFromDates computes distinct days ratio over 14 days", () => {
  const now = new Date();
  const days = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const dates = [days(0), days(1), days(1), days(2), days(10), days(20)];
  const score = computeConsistencyIndexFromDates(dates);
  // days within last 14: 0,1,2,10 => 4 distinct; 4/14 ~= 28.6% -> rounds near 29
  if (!(score >= 25 && score <= 35)) {
    throw new Error(`unexpected consistency score ${score}`);
  }
});
