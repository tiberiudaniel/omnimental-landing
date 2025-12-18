import test from "node:test";
import assert from "node:assert/strict";
import { getTodayPlan } from "@/lib/sessionRecommenderEngine";
import type { UserProfileSnapshot } from "@/lib/profileEngine";

const baseSnapshot: UserProfileSnapshot = {
  userId: "test-user",
  catProfile: null,
  domains: [],
  intentSnapshot: null,
  xpByTrait: {},
  subscription: { status: "free", provider: "manual", currentPeriodEnd: null },
  sessionsCompleted: 0,
  daysActive: 0,
  preferredSessionLength: "short",
  activeArcId: "clarity_01",
  activeArcDayIndex: 0,
  activeArcCompleted: false,
};

test("getTodayPlan returns first clarity module when starting arc", () => {
  const plan = getTodayPlan(baseSnapshot);
  assert.equal(plan.moduleId, "clarity_01_illusion_of_clarity");
  assert.equal(plan.arcId, "clarity_01");
  assert.equal(plan.arcDayIndex, 0);
});

test("getTodayPlan advances to next module as day index increases", () => {
  const plan = getTodayPlan({
    ...baseSnapshot,
    activeArcDayIndex: 1,
  });
  assert.equal(plan.moduleId, "clarity_02_one_real_thing");
  assert.equal(plan.arcDayIndex, 1);
});

test("getTodayPlan falls back to clarity arc when active arc completed", () => {
  const plan = getTodayPlan({
    ...baseSnapshot,
    activeArcCompleted: true,
    activeArcDayIndex: 99,
  });
  assert(plan);
  assert.equal(plan.moduleId, "clarity_01_illusion_of_clarity");
});
