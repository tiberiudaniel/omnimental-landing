import test from "node:test";
import assert from "node:assert/strict";
import { buildForcedDailyDecision } from "@/lib/today/forcedModuleDecision";

test("buildForcedDailyDecision uses forced module key and skips policy", () => {
  const decision = buildForcedDailyDecision(
    {
      moduleKey: "clarity_single_intent",
      cluster: "clarity_cluster",
    },
    { lang: "ro" },
  );
  assert.equal(decision.moduleKey, "clarity_single_intent");
  assert.equal(decision.cluster, "clarity_cluster");
  assert.equal(decision.skipPolicy, true);
});
