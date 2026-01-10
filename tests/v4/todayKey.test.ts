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

test("getTodayKey boundaries hold across winter midnight", () => {
  const before = getTodayKey(new Date("2024-01-10T23:59:00.000Z"));
  const after = getTodayKey(new Date("2024-01-11T00:01:00.000Z"));
  assert.equal(before, "2024-01-10");
  assert.equal(after, "2024-01-11");
});

test("getTodayKey boundaries hold across summer DST midnight", () => {
  const before = getTodayKey(new Date("2024-07-10T22:59:00.000Z"));
  const after = getTodayKey(new Date("2024-07-10T23:01:00.000Z"));
  assert.equal(before, "2024-07-10");
  assert.equal(after, "2024-07-11");
});
