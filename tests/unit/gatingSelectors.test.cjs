const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const {
  getTotalDailySessionsCompleted,
  getTotalActionsCompleted,
  canAccessWizard,
  canAccessOmniKuno,
  canInviteBuddy,
  needsStyleProfile,
  needsCatLitePart2,
} = loadTsModule(path.resolve(__dirname, "../../lib/gatingSelectors.ts"));

const { GATING } = loadTsModule(path.resolve(__dirname, "../../lib/gatingConfig.ts"));
const { CAT_LITE_EXTENDED_AXES } = loadTsModule(path.resolve(__dirname, "../../lib/catLite.ts"));

test("getTotalDailySessionsCompleted and actions handle missing stats", () => {
  assert.equal(getTotalDailySessionsCompleted(null), 0);
  assert.equal(getTotalActionsCompleted(undefined), 0);
  assert.equal(getTotalDailySessionsCompleted({ stats: { dailySessionsCompleted: 7 } }), 7);
  assert.equal(getTotalActionsCompleted({ stats: { actionsCompleted: 4 } }), 4);
});

test("canAccessWizard and canAccessOmniKuno respect thresholds", () => {
  const beforeWizard = { stats: { dailySessionsCompleted: GATING.wizardMinDailySessions - 1 } };
  const atWizard = { stats: { dailySessionsCompleted: GATING.wizardMinDailySessions } };
  assert.equal(canAccessWizard(beforeWizard), false);
  assert.equal(canAccessWizard(atWizard), true);

  const beforeOmni = { stats: { dailySessionsCompleted: GATING.omniKunoMinDailySessions - 1 } };
  const atOmni = { stats: { dailySessionsCompleted: GATING.omniKunoMinDailySessions } };
  assert.equal(canAccessOmniKuno(beforeOmni), false);
  assert.equal(canAccessOmniKuno(atOmni), true);
});

test("canInviteBuddy requires sessions and action count", () => {
  const insufficient = { stats: { dailySessionsCompleted: GATING.buddyMinDailySessions, actionsCompleted: 0 } };
  assert.equal(canInviteBuddy(insufficient), false);
  const eligible = {
    stats: {
      dailySessionsCompleted: GATING.buddyMinDailySessions,
      actionsCompleted: GATING.buddyMinActionSuccesses,
    },
  };
  assert.equal(canInviteBuddy(eligible), true);
});

test("needsStyleProfile triggers after 3 sessions without style", () => {
  const profile = { style: { focus: "calm" } };
  assert.equal(needsStyleProfile(profile, { stats: { dailySessionsCompleted: 10 } }), false);
  assert.equal(needsStyleProfile(null, { stats: { dailySessionsCompleted: 2 } }), false);
  assert.equal(needsStyleProfile(null, { stats: { dailySessionsCompleted: 3 } }), true);
});

test("needsCatLitePart2 checks extended axes after threshold", () => {
  const completeAxes = CAT_LITE_EXTENDED_AXES.reduce((acc, axis) => {
    acc[axis] = { score: 5 };
    return acc;
  }, {});
  const profileComplete = { catProfile: { axes: completeAxes } };
  const profileMissing = { catProfile: { axes: { ...completeAxes, [CAT_LITE_EXTENDED_AXES[0]]: { score: null } } } };
  const qualifiedFacts = { stats: { dailySessionsCompleted: 3 } };
  assert.equal(needsCatLitePart2(profileComplete, qualifiedFacts), false);
  assert.equal(needsCatLitePart2(profileMissing, qualifiedFacts), true);
  assert.equal(needsCatLitePart2(profileMissing, { stats: { dailySessionsCompleted: 2 } }), false);
});
