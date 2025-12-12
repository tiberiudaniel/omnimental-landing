const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const factsModule = loadTsModule(
  path.resolve(__dirname, "../../lib/progressFacts/backfill.ts"),
);
const { OMNIKUNO_MODULE_IDS } = loadTsModule(
  path.resolve(__dirname, "../../config/omniKunoModules.ts"),
);

test("sanitizeDimensionScores strips unknown keys and enforces numeric values", () => {
  const input = {
    calm: "9",
    focus: 4,
    relationships: null,
    custom: 100,
  };
  const result = factsModule.sanitizeDimensionScores(input);
  assert.equal(result?.emotional_balance, 9);
  assert.equal(result?.focus_clarity, 4);
  assert.equal(result?.relationships_communication, 0);
  assert.equal(result?.energy_body, 0);
  assert.equal(result?.decision_discernment, 0);
  assert.equal(result?.self_trust, 0);
  assert.equal(result?.willpower_perseverance, 0);
  assert.equal(result?.optimal_weight_management, 0);
});

test("sanitizeDimensionScores only emits known OmniKuno modules", () => {
  const result = factsModule.sanitizeDimensionScores({ calm: 5, energy: 3, misc: 9 });
  const moduleSet = new Set(OMNIKUNO_MODULE_IDS);
  assert.ok(result);
  Object.keys(result ?? {}).forEach((moduleId) => {
    assert.ok(moduleSet.has(moduleId), `Unknown module ${moduleId}`);
  });
});

test("sanitizeDimensionScores returns null when no valid numbers exist", () => {
  assert.equal(factsModule.sanitizeDimensionScores({ something: "else" }), null);
  assert.equal(factsModule.sanitizeDimensionScores(null), null);
});
