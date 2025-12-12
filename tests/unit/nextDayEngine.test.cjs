const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const historyHelpers = loadTsModule(path.resolve(__dirname, "../../lib/dailyPathHistory.ts"));
const { countConsecutiveDaysOnCluster } = historyHelpers;
const nextDayEngine = loadTsModule(path.resolve(__dirname, "../../lib/nextDayEngine.ts"));
const { decideNextDailyPathFromHistory } = nextDayEngine;

function mockTimestamp(date) {
  return {
    toDate: () => new Date(date),
  };
}

function makeEntry({
  date,
  completed,
  cluster = "clarity_cluster",
  startedAt,
  completedAt,
}) {
  return {
    userId: "u1",
    configId: "cfg",
    cluster,
    mode: "short",
    lang: "ro",
    completed,
    xpEarned: completed ? 10 : 0,
    nodesCompletedCount: completed ? 3 : 0,
    pathVariant: completed ? "challenge" : null,
    durationSeconds: completed ? 120 : null,
    date,
    startedAt: startedAt ?? mockTimestamp(`${date}T08:00:00Z`),
    completedAt,
  };
}

function makeProfile(overrides = {}) {
  const axisDefaults = {
    clarity: 40,
    flex: 65,
    emo_stab: 60,
    recalib: 55,
    focus: 70,
    energy: 75,
    adapt_conf: 68,
  };
  return {
    userId: "u1",
    version: "cat-v2",
    axisScores: { ...axisDefaults, ...overrides },
    subScores: {},
    answers: {},
    completedAt: new Date(),
    updatedAt: new Date(),
    pillarsIntroCompleted: true,
  };
}

test("countConsecutiveDaysOnCluster respects dedupe and skips", () => {
  const entries = [
    makeEntry({ date: "2025-01-10", completed: false }),
    makeEntry({ date: "2025-01-10", completed: true, completedAt: mockTimestamp("2025-01-10T10:00:00Z") }),
    makeEntry({ date: "2025-01-09", completed: true }),
    makeEntry({ date: "2025-01-07", completed: true }),
  ];
  assert.equal(countConsecutiveDaysOnCluster(entries), 2);
});

test("decideNextDailyPathFromHistory switches to deep after three completions", () => {
  const history = ["2025-01-10", "2025-01-09", "2025-01-08"].map((date) =>
    makeEntry({ date, completed: true }),
  );
  const decision = decideNextDailyPathFromHistory({
    catProfile: makeProfile({ clarity: 30 }),
    lang: "ro",
    history,
    todayKey: "2025-01-11",
  });
  assert.equal(decision.mode, "deep");
});

test("decideNextDailyPathFromHistory stays short when streak is interrupted by incomplete day", () => {
  const history = [
    makeEntry({ date: "2025-01-10", completed: true }),
    makeEntry({ date: "2025-01-09", completed: false }),
    makeEntry({ date: "2025-01-08", completed: true }),
  ];
  const decision = decideNextDailyPathFromHistory({
    catProfile: makeProfile({ clarity: 35 }),
    lang: "ro",
    history,
    todayKey: "2025-01-11",
  });
  assert.equal(decision.mode, "short");
});

test("decideNextDailyPathFromHistory prioritizes CAT-derived cluster over last history cluster", () => {
  const history = [
    makeEntry({ date: "2025-01-10", completed: true, cluster: "emotional_flex_cluster" }),
    makeEntry({ date: "2025-01-09", completed: true, cluster: "emotional_flex_cluster" }),
  ];
  const decision = decideNextDailyPathFromHistory({
    catProfile: makeProfile({ clarity: 25, flex: 60 }),
    lang: "ro",
    history,
    todayKey: "2025-01-11",
  });
  assert.equal(decision.cluster, "clarity_cluster");
});

test("duplicate entries on the same day prefer completed runs for decision making", () => {
  const history = [
    makeEntry({
      date: "2025-01-10",
      completed: false,
      startedAt: mockTimestamp("2025-01-10T07:00:00Z"),
    }),
    makeEntry({
      date: "2025-01-10",
      completed: true,
      completedAt: mockTimestamp("2025-01-10T12:00:00Z"),
    }),
    makeEntry({ date: "2025-01-09", completed: true }),
    makeEntry({ date: "2025-01-08", completed: true }),
    makeEntry({
      date: "2025-01-07",
      completed: true,
      completedAt: mockTimestamp("2025-01-07T12:00:00Z"),
    }),
  ];
  const decision = decideNextDailyPathFromHistory({
    catProfile: makeProfile({ clarity: 20 }),
    lang: "ro",
    history,
    todayKey: "2025-01-11",
  });
  assert.equal(decision.mode, "deep");
});

test("late start after completion on the same day does not downgrade streak", () => {
  const history = [
    makeEntry({
      date: "2025-01-10",
      completed: true,
      completedAt: mockTimestamp("2025-01-10T09:00:00Z"),
    }),
    makeEntry({
      date: "2025-01-10",
      completed: false,
      startedAt: mockTimestamp("2025-01-10T15:00:00Z"),
    }),
    makeEntry({ date: "2025-01-09", completed: true }),
    makeEntry({ date: "2025-01-08", completed: true }),
  ];
  const decision = decideNextDailyPathFromHistory({
    catProfile: makeProfile({ clarity: 18 }),
    lang: "ro",
    history,
    todayKey: "2025-01-11",
  });
  assert.equal(decision.mode, "deep");
});
