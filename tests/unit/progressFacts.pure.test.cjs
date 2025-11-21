const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const factsModule = loadTsModule(
  path.resolve(__dirname, "../../lib/progressFacts/backfill.ts"),
);

test("sanitizeDimensionScores strips unknown keys and enforces numeric values", () => {
  const input = {
    calm: "9",
    focus: 4,
    relationships: null,
    custom: 100,
  };
  const result = factsModule.sanitizeDimensionScores(input);
  assert.deepEqual(result, {
    calm: 9,
    focus: 4,
    energy: 0,
    relationships: 0,
    performance: 0,
    health: 0,
  });
});

test("sanitizeDimensionScores returns null when no valid numbers exist", () => {
  assert.equal(factsModule.sanitizeDimensionScores({ something: "else" }), null);
  assert.equal(factsModule.sanitizeDimensionScores(null), null);
});
