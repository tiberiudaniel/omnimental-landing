const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTsModule } = require("../helpers/load-ts-module.cjs");

const policyModule = loadTsModule(path.resolve(__dirname, "../../lib/decisionPolicyV2.ts"));
const { applyDecisionPolicyV2 } = policyModule;

const baseline = {
  cluster: "clarity_cluster",
  mode: "deep",
  lang: "ro",
  reason: "baseline reason",
  historyCount: 10,
  configId: "cfg",
};

test("downgrades to short when time available below threshold", () => {
  const decision = applyDecisionPolicyV2(baseline, { timeAvailableMin: 10 });
  assert.equal(decision.mode, "short");
  assert.equal(decision.policyApplied, true);
  assert.ok(decision.policyReason.includes("timeAvailable"));
});

test("downgrades to short when energy low", () => {
  const decision = applyDecisionPolicyV2(baseline, { energyLevel: "low" });
  assert.equal(decision.mode, "short");
  assert.ok(decision.policyReason.includes("energy=low"));
});

test("downgrades when deep abandon rate high", () => {
  const decision = applyDecisionPolicyV2(baseline, { deepAbandonRate: 0.7 });
  assert.equal(decision.mode, "short");
  assert.ok(decision.policyReason.includes("deepAbandonRate"));
});

test("no change when signals missing", () => {
  const decision = applyDecisionPolicyV2(baseline, {});
  assert.equal(decision.mode, "deep");
  assert.equal(decision.policyApplied, false);
  assert.equal(decision.policyReason, "no change");
});

test("baseline short remains short even when signals suggest downgrade", () => {
  const shortDecision = applyDecisionPolicyV2(
    { ...baseline, mode: "short" },
    { timeAvailableMin: 5, energyLevel: "low" },
  );
  assert.equal(shortDecision.mode, "short");
  assert.equal(shortDecision.policyApplied, false);
});

test("high overall abandon rate switches variant to soft", () => {
  const decision = applyDecisionPolicyV2(baseline, { overallAbandonRate: 0.8 });
  assert.equal(decision.variant, "soft");
  assert.equal(decision.policyApplied, true);
  assert.ok(decision.policyReason.includes("overallAbandonRate"));
});

test("missing overall abandon rate keeps variant challenge", () => {
  const decision = applyDecisionPolicyV2(baseline, {});
  assert.equal(decision.variant, undefined);
});

test("downgrade due to time and high abandon switches mode and variant", () => {
  const decision = applyDecisionPolicyV2(baseline, {
    timeAvailableMin: 5,
    overallAbandonRate: 0.75,
  });
  assert.equal(decision.mode, "short");
  assert.equal(decision.variant, "soft");
  assert.equal(decision.policyApplied, true);
  assert.ok(decision.policyReason.includes("timeAvailable"));
  assert.ok(decision.policyReason.includes("overallAbandonRate"));
});

test("missing signals keeps baseline unchanged", () => {
  const decision = applyDecisionPolicyV2(baseline, {});
  assert.equal(decision.mode, baseline.mode);
  assert.equal(decision.variant, undefined);
  assert.equal(decision.policyApplied, false);
  assert.equal(decision.policyReason, "no change");
});
