const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const history = loadTsModule(path.resolve(__dirname, "../../lib/dailyPathHistory.ts"));
const {
  toUtcDayKey,
  normalizeDailyEntries,
  countConsecutiveDaysOnCluster,
} = history;

function mockEntry({
  date,
  completed,
  completedAt,
  startedAt,
  cluster = "clarity_cluster",
}) {
  return {
    userId: "u1",
    configId: "cfg",
    cluster,
    mode: "short",
    lang: "ro",
    completed,
    xpEarned: completed ? 5 : 0,
    nodesCompletedCount: completed ? 3 : 0,
    pathVariant: completed ? "challenge" : null,
    durationSeconds: completed ? 60 : null,
    date,
    startedAt: startedAt ?? new Date(`${date}T08:00:00Z`),
    completedAt,
  };
}

test("toUtcDayKey normalizes strings, dates, and timestamps at boundaries", () => {
  assert.equal(toUtcDayKey("2025-02-10"), "2025-02-10");
  const lateLocal = new Date("2025-02-10T23:59:00-05:00"); // still 2025-02-11 UTC
  assert.equal(toUtcDayKey(lateLocal), "2025-02-11");
  const earlyLocal = new Date("2025-02-11T00:01:00+05:00"); // 2025-02-10 UTC
  assert.equal(toUtcDayKey(earlyLocal), "2025-02-10");
  const sameInstant = new Date(Date.UTC(2025, 0, 1, 2, 0, 0));
  assert.equal(toUtcDayKey(sameInstant.toISOString()), "2025-01-01");
});

test("normalizeDailyEntries applies deterministic tie-breakers", () => {
  const entries = [
    mockEntry({
      date: "2025-01-10",
      completed: false,
      startedAt: new Date("2025-01-10T07:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-10",
      completed: true,
      completedAt: new Date("2025-01-10T09:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-10",
      completed: true,
      completedAt: new Date("2025-01-10T10:00:00Z"),
    }),
  ];
  const normalized = normalizeDailyEntries(entries);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].entry.completed, true);
  assert.equal(
    normalized[0].entry.completedAt?.toISOString() ?? "",
    new Date("2025-01-10T10:00:00Z").toISOString(),
  );
});

test("countConsecutiveDaysOnCluster handles duplicate days and skips", () => {
  const entries = [
    mockEntry({
      date: "2025-01-10",
      completed: false,
      startedAt: new Date("2025-01-10T08:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-10",
      completed: true,
      completedAt: new Date("2025-01-10T11:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-09",
      completed: true,
      completedAt: new Date("2025-01-09T11:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-07",
      completed: true,
      completedAt: new Date("2025-01-07T11:00:00Z"),
    }),
  ];
  assert.equal(countConsecutiveDaysOnCluster(entries), 2);
});

test("multiple runs in the same day count once and prefer completions", () => {
  const entries = [
    mockEntry({
      date: "2025-01-05",
      completed: true,
      completedAt: new Date("2025-01-05T10:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-04",
      completed: true,
      completedAt: new Date("2025-01-04T10:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-04",
      completed: false,
      startedAt: new Date("2025-01-04T12:00:00Z"),
    }),
    mockEntry({
      date: "2025-01-03",
      completed: true,
      completedAt: new Date("2025-01-03T10:00:00Z"),
    }),
  ];
  assert.equal(countConsecutiveDaysOnCluster(entries), 3);
});
