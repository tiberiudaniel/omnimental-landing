const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const nextDayModule = loadTsModule(path.resolve(__dirname, "../../lib/nextDayEngine.ts"));
const { decideNextDailyPathFromHistory, __testables } = nextDayModule;
const { selectModuleKeyForClusterRaw } = __testables;

function makeEntry(overrides = {}) {
  return {
    userId: "test-user",
    date: "2024-01-01",
    configId: "focus_energy_v1_deep_ro",
    cluster: "focus_energy_cluster",
    mode: "deep",
    lang: "ro",
    completed: true,
    xpEarned: 0,
    startedAt: new Date("2024-01-01T08:00:00Z"),
    completedAt: new Date("2024-01-01T08:05:00Z"),
    timeAvailableMin: 10,
    ...overrides,
  };
}

function makeClarityEntry(overrides = {}) {
  return makeEntry({
    configId: "clarity_v1_deep_ro",
    cluster: "clarity_cluster",
    ...overrides,
  });
}

function makeFlexEntry(overrides = {}) {
  return makeEntry({
    configId: "emotional_flex_v1_deep_ro",
    cluster: "emotional_flex_cluster",
    ...overrides,
  });
}

const focusCatProfile = {
  axisScores: {
    energy: 1,
    clarity: 5,
    flex: 6,
  },
};

test("selectModuleKeyForCluster rotates only after completion", () => {
  const incomplete = [makeEntry({ completed: false })];
  const incompleteResult = selectModuleKeyForClusterRaw("focus_energy_cluster", incomplete);
  assert.equal(incompleteResult.moduleKey, "energy_recovery");

  const completed = [makeEntry({ completed: true })];
  const completedResult = selectModuleKeyForClusterRaw("focus_energy_cluster", completed);
  assert.equal(completedResult.moduleKey, "energy_congruence");
});

test("clarity modules rotate after completion", () => {
  const awaitingCompletion = [makeClarityEntry({ completed: false })];
  const awaitingResult = selectModuleKeyForClusterRaw("clarity_cluster", awaitingCompletion);
  assert.equal(awaitingResult.moduleKey, "clarity_single_intent");

  const completed = [makeClarityEntry({ completed: true })];
  const completedResult = selectModuleKeyForClusterRaw("clarity_cluster", completed);
  assert.equal(completedResult.moduleKey, "clarity_one_important_thing");
});

test("emotional flexibility modules rotate after completion", () => {
  const awaitingCompletion = [makeFlexEntry({ completed: false })];
  const awaitingResult = selectModuleKeyForClusterRaw("emotional_flex_cluster", awaitingCompletion);
  assert.equal(awaitingResult.moduleKey, "emotional_flex_pause");

  const completed = [makeFlexEntry({ completed: true })];
  const completedResult = selectModuleKeyForClusterRaw("emotional_flex_cluster", completed);
  assert.equal(completedResult.moduleKey, "emotional_flex_naming");
});

test("missing configId mapping surfaces warning and reason", () => {
  const warnMessages = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnMessages.push(args.join(" "));
  try {
    const decision = decideNextDailyPathFromHistory({
      catProfile: focusCatProfile,
      lang: "ro",
      history: [
        makeEntry({
          configId: "unknown_config_id",
          completed: true,
          date: "2024-01-02",
          startedAt: new Date("2024-01-02T08:00:00Z"),
          completedAt: new Date("2024-01-02T08:05:00Z"),
        }),
      ],
      todayKey: "2024-01-03",
    });
    assert.ok(decision.reason.includes("mapping=unknown_config_id->default"));
    assert.ok(warnMessages.some((msg) => msg.includes("unknown_config_id")));
  } finally {
    console.warn = originalWarn;
  }
});
