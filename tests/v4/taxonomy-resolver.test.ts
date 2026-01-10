import test from "node:test";
import assert from "node:assert/strict";
import { resolveZoneFromPath } from "@/lib/taxonomy/resolveZoneFromPath";
import type { ZoneId } from "@/lib/taxonomy/types";

const scenarios: Array<{ path: string; zone: ZoneId | null }> = [
  { path: "/today", zone: "SESSIONS" },
  { path: "/today/", zone: "SESSIONS" },
  { path: "/today?x=1", zone: "SESSIONS" },
  { path: "/session/complete", zone: "SESSIONS" },
  { path: "/intro", zone: "INTRO" },
  { path: "/intro/mindpacing", zone: "INTRO" },
  { path: "/admin/flow-studio", zone: "ADMIN" },
  { path: "/progress", zone: "PROGRESS" },
  { path: "/library", zone: "LIBRARY" },
  { path: "/account/settings", zone: "ACCOUNT" },
];

scenarios.forEach(({ path, zone }) => {
  test(`resolveZoneFromPath matches ${path}`, () => {
    assert.equal(resolveZoneFromPath(path), zone);
  });
});
