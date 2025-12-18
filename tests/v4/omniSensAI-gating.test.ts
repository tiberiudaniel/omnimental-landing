import test, { mock } from "node:test";
import assert from "node:assert/strict";
import * as profileEngine from "@/lib/profileEngine";
import * as usageStats from "@/lib/usageStats";
import { getSensAiTodayPlan, hasFreeDailyLimit } from "@/lib/omniSensAI";
import type { UserProfileSnapshot } from "@/lib/profileEngine";

const envDefaults: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.local",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "demo",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo",
};

Object.entries(envDefaults).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

function buildSnapshot(overrides: Partial<UserProfileSnapshot> = {}): UserProfileSnapshot {
  return {
    userId: "sim-user",
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
    ...overrides,
  };
}

test("free user below limit receives plan", async () => {
  const snapshot = buildSnapshot();
  const profileMock = mock.method(profileEngine, "getUserProfileSnapshot", async () => snapshot);
  const sessionsMock = mock.method(usageStats, "getSessionsToday", async () => 0);
  const arenasMock = mock.method(usageStats, "getArenaRunsById", async () => ({}));

  const { ctx, plan } = await getSensAiTodayPlan("free-user");
  assert(plan, "plan should exist");
  assert(ctx, "context should exist");
  assert.equal(ctx.sessionsToday, 0);
  assert.equal(hasFreeDailyLimit(ctx), false);

  profileMock.mock.restore();
  sessionsMock.mock.restore();
  arenasMock.mock.restore();
});

test("free user after completing a session hits the limit", async () => {
  const snapshot = buildSnapshot();
  const profileMock = mock.method(profileEngine, "getUserProfileSnapshot", async () => snapshot);
  const sessionsMock = mock.method(usageStats, "getSessionsToday", async () => 1);
  const arenasMock = mock.method(usageStats, "getArenaRunsById", async () => ({}));

  const { ctx } = await getSensAiTodayPlan("free-user-limit");
  assert(ctx, "context should exist");
  assert.equal(ctx.sessionsToday, 1);
  assert.equal(hasFreeDailyLimit(ctx), true);

  profileMock.mock.restore();
  sessionsMock.mock.restore();
  arenasMock.mock.restore();
});

test("premium user bypasses daily gating", async () => {
  const snapshot = buildSnapshot({
    subscription: { status: "premium", provider: "manual", currentPeriodEnd: null },
  });
  const profileMock = mock.method(profileEngine, "getUserProfileSnapshot", async () => snapshot);
  const sessionsMock = mock.method(usageStats, "getSessionsToday", async () => 5);
  const arenasMock = mock.method(usageStats, "getArenaRunsById", async () => ({}));

  const { ctx, plan } = await getSensAiTodayPlan("premium-user");
  assert(plan, "plan should exist even after limit");
  assert(ctx, "context should exist");
  assert.equal(ctx.sessionsToday, 5);
  assert.equal(hasFreeDailyLimit(ctx), false);

  profileMock.mock.restore();
  sessionsMock.mock.restore();
  arenasMock.mock.restore();
});
