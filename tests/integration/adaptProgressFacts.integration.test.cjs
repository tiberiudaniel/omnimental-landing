const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const { adaptProgressFacts } = loadTsModule(
  path.resolve(__dirname, "../../lib/progressAdapter.ts"),
);

test("adaptProgressFacts maps dimension scores to 0..100 indices", () => {
  const facts = {
    recommendation: { dimensionScores: { focus_clarity: 4, emotional_balance: 2, energy_body: 3 } },
    practiceSessions: [
      { type: "reflection" },
      { type: "breathing" },
      { type: "breathing" },
      { type: "drill" },
    ],
  };
  const out = adaptProgressFacts(facts);
  assert.equal(out.indices.clarity, 80); // focus -> clarity
  assert.equal(out.indices.calm, 40);
  assert.equal(out.indices.energy, 60);
  assert.equal(out.reflectionCount, 1);
  assert.equal(out.breathingCount, 2);
  assert.equal(out.drillsCount, 1);
});
