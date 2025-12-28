const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const { deriveAccessTier } = loadTsModule(path.resolve(__dirname, "../../lib/accessTier.ts"));

test("deriveAccessTier returns tier 0 for new users", () => {
  const result = deriveAccessTier({ progress: null });
  assert.equal(result.tier, 0);
  assert.equal(result.flags.showMenu, false);
  assert.equal(result.flags.canProgress, false);
});

test("deriveAccessTier reaches tier 1 after first session", () => {
  const result = deriveAccessTier({ progress: { stats: { dailySessionsCompleted: 1 } } });
  assert.equal(result.tier, 1);
  assert.equal(result.flags.showMinimalMenu, true);
  assert.equal(result.flags.canProgress, false);
});

test("tier 2 unlocks progress after three sessions", () => {
  const result = deriveAccessTier({ progress: { stats: { dailySessionsCompleted: 3 } } });
  assert.equal(result.tier, 2);
  assert.equal(result.flags.canProgress, true);
});

test("foundation completion enables arenas", () => {
  const progress = { stats: { dailySessionsCompleted: 18, foundationDone: true } };
  const result = deriveAccessTier({ progress });
  assert.equal(result.tier, 4);
  assert.equal(result.flags.canProgress, true);
  assert.equal(result.flags.canArenas, true);
});

test("tier 4 unlocks library but not wizard", () => {
  const progress = { stats: { dailySessionsCompleted: 20, foundationDone: true } };
  const result = deriveAccessTier({ progress });
  assert.equal(result.tier, 4);
  assert.equal(result.flags.canLibrary, true);
  assert.equal(result.flags.canWizard, false);
});

test("tier 5 provides full access once wizard threshold is met", () => {
  const progress = { stats: { dailySessionsCompleted: 40, foundationDone: true } };
  const result = deriveAccessTier({ progress });
  assert.equal(result.tier, 5);
  assert.equal(result.flags.showMenu, true);
  assert.equal(result.flags.canWizard, true);
});
