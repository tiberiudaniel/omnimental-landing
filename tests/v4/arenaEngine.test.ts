import test from "node:test";
import assert from "node:assert/strict";
import { ARENA_TASKS } from "@/config/arenas";
import { buildArenaKpiEvent } from "@/lib/arenaEngine";
import { recordSessionTelemetry } from "@/lib/telemetry";

const envDefaults: Record<string, string> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "test",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.local",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "demo",
  NEXT_PUBLIC_FIREBASE_APP_ID: "demo",
  NEXT_PUBLIC_DISABLE_PROGRESS_WRITES: "true",
};

Object.entries(envDefaults).forEach(([key, value]) => {
  if (!process.env[key]) process.env[key] = value;
});

test("buildArenaKpiEvent maps metadata correctly", async () => {
  const arena = ARENA_TASKS.exec_control_micro_stroop;
  const event = buildArenaKpiEvent(arena, "arena-user", 82.5, "arena");

  assert.equal(event.indicatorId, arena.indicatorId);
  assert.equal(event.canonDomain, arena.canonDomain);
  assert.deepEqual(event.catAxes, arena.catAxes);
  assert.equal(event.postValue, 82.5);

  await recordSessionTelemetry({
    sessionId: "arena-test",
    userId: "arena-user",
    sessionType: "arena",
    arcId: null,
    moduleId: arena.id,
    arenaId: arena.id,
    traitSignals: [
      {
        trait: arena.catAxes[0],
        canonDomain: arena.canonDomain,
        deltaSelfReport: null,
        confidence: "low",
      },
    ],
    kpiEvents: [event],
  });
});
