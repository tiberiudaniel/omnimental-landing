import test from "node:test";
import assert from "node:assert/strict";
import { getTodayKey } from "@/lib/time/todayKey";

test("getTodayKey returns YYYY-MM-DD format", () => {
  const key = getTodayKey(new Date("2024-05-01T12:00:00.000Z"));
  assert.match(key, /^\d{4}-\d{2}-\d{2}$/);
});

test("getTodayKey reflects Canary midnight boundaries", () => {
  const beforeMidnight = getTodayKey(new Date("2024-06-01T22:30:00.000Z"));
  const afterMidnight = getTodayKey(new Date("2024-06-01T23:30:00.000Z"));
  assert.notEqual(beforeMidnight, afterMidnight);
});
