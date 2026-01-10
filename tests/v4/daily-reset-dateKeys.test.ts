import test from "node:test";
import assert from "node:assert/strict";
import { resolveDailyResetKeys } from "@/lib/dailyReset/dateKeys";

test("resolveDailyResetKeys returns same day before Canary midnight", () => {
  const { todayKey, yesterdayKey } = resolveDailyResetKeys(new Date("2024-01-10T23:59:00.000Z"));
  assert.equal(todayKey, "2024-01-10");
  assert.equal(yesterdayKey, "2024-01-09");
});

test("resolveDailyResetKeys advances at Canary midnight", () => {
  const { todayKey, yesterdayKey } = resolveDailyResetKeys(new Date("2024-01-11T00:01:00.000Z"));
  assert.equal(todayKey, "2024-01-11");
  assert.equal(yesterdayKey, "2024-01-10");
});

test("resolveDailyResetKeys respects DST transition (summer)", () => {
  const beforeMidnight = resolveDailyResetKeys(new Date("2024-07-10T22:59:00.000Z"));
  assert.equal(beforeMidnight.todayKey, "2024-07-10");
  assert.equal(beforeMidnight.yesterdayKey, "2024-07-09");

  const afterMidnight = resolveDailyResetKeys(new Date("2024-07-10T23:30:00.000Z"));
  assert.equal(afterMidnight.todayKey, "2024-07-11");
  assert.equal(afterMidnight.yesterdayKey, "2024-07-10");
});
