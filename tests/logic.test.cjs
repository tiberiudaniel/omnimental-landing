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
  assert.equal(scores.calm, 6);
  assert.equal(scores.relationships, 3);
  assert.equal(scores.focus, 1);
});

test("recommendSession applies rule hierarchy", () => {
  const baseScores = {
    calm: 0,
    focus: 0,
    energy: 0,
    relationships: 0,
    performance: 0,
    health: 0,
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
    dimensionScores: { ...baseScores, performance: 4, calm: 1 },
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
  const baseScores = { calm: 0, focus: 0, energy: 0, relationships: 0, performance: 0, health: 0 };
  const rec = recommendSession({ urgency: 5, primaryCategory: undefined, dimensionScores: baseScores, hasProfile: false });
  assert.equal(rec.recommendedPath, "group");
});

test("computeDimensionScores handles empty input and low urgency", () => {
  const scores = computeDimensionScores([], 2);
  assert.equal(scores.calm, 0);
  assert.equal(scores.focus, 0);
});
