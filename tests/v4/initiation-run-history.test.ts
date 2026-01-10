import test from "node:test";
import assert from "node:assert/strict";
import {
  hasInitiationRunCompleted,
  markInitiationRunCompleted,
  clearInitiationRunHistory,
} from "@/lib/content/initiationRunHistory";

const USER_ID = "test-user";
const RUN_ID = "run-123";

test("initiation run history is idempotent per runId", () => {
  clearInitiationRunHistory(USER_ID);
  assert.equal(hasInitiationRunCompleted(USER_ID, RUN_ID), false);
  markInitiationRunCompleted(USER_ID, RUN_ID);
  assert.equal(hasInitiationRunCompleted(USER_ID, RUN_ID), true);
  // Second mark should be ignored.
  markInitiationRunCompleted(USER_ID, RUN_ID);
  assert.equal(hasInitiationRunCompleted(USER_ID, RUN_ID), true);
});
