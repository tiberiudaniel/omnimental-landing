const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const analytics = loadTsModule(
  path.resolve(__dirname, "../../lib/progressAnalytics.ts"),
);

test("computeTodayCounts with empty sessions returns 0 and local label", () => {
  const ref = Date.UTC(2025, 0, 15, 12, 0, 0);
  const out = analytics.computeTodayCounts([], ref);
  assert.equal(out.length, 1);
  assert.equal(out[0].totalMin, 0);
  // In Node (no navigator), code defaults to RO label "Azi"
  assert.equal(out[0].label, "Azi");
});

test("computeWeeklyBuckets aggregates minutes per day across 7 days", () => {
  const dayMs = 24 * 60 * 60 * 1000;
  const ref = Date.UTC(2025, 0, 15, 12, 0, 0);
  const start = new Date(ref);
  start.setUTCHours(0, 0, 0, 0);

  const sessions = [
    // today: 300 sec (5 min)
    { type: "breathing", startedAt: new Date(start.getTime() + 10_000), durationSec: 300 },
    // yesterday: 120 sec (2 min)
    { type: "reflection", startedAt: new Date(start.getTime() - dayMs + 20_000), durationSec: 120 },
  ];

  const out = analytics.computeWeeklyBuckets(sessions, ref);
  assert.equal(out.length, 7);
  const total = out.reduce((a, b) => a + b.totalMin, 0);
  assert.equal(total, 7); // 5 + 2 minutes
});

